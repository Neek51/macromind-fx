import { NextResponse } from "next/server";
import { callAI } from "../ai-provider";

const PATTERN_SYMBOLS = new Set(["XAU/USD", "BTC/USD", "EUR/USD"]);

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "GC=F",
  "BTC/USD": "BTC-USD",
  "EUR/USD": "EURUSD=X",
};

type Candle = { open: number; high: number; low: number; close: number; volume: number };

async function fetchGoldSpotPrice(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.price === "number" ? data.price : null;
  } catch {
    return null;
  }
}

function normalizeCandlesToSpot(candles: Candle[], spotPrice: number) {
  const futuresPrice = candles.at(-1)?.close;
  if (!futuresPrice) return candles;
  const ratio = spotPrice / futuresPrice;
  return candles.map((candle) => ({
    ...candle,
    open: candle.open * ratio,
    high: candle.high * ratio,
    low: candle.low * ratio,
    close: candle.close * ratio,
  }));
}

async function fetchHistory(yahooSymbol: string): Promise<{ candles: Candle[]; currentPrice: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=6mo`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!q || !q.open || !q.close) return null;

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (q.open[i] == null || q.close[i] == null || q.high[i] == null || q.low[i] == null) continue;
      candles.push({ open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] ?? 0 });
    }

    if (candles.length < 30) return null;
    return { candles, currentPrice: candles[candles.length - 1].close };
  } catch { return null; }
}

function findSwingHighs(candles: Candle[], lookback = 5): Array<{ index: number; price: number }> {
  const highs: Array<{ index: number; price: number }> = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) { isHigh = false; break; }
    }
    if (isHigh) highs.push({ index: i, price: candles[i].high });
  }
  return highs;
}

function findSwingLows(candles: Candle[], lookback = 5): Array<{ index: number; price: number }> {
  const lows: Array<{ index: number; price: number }> = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) { isLow = false; break; }
    }
    if (isLow) lows.push({ index: i, price: candles[i].low });
  }
  return lows;
}

function detectDoubleTop(highs: Array<{ index: number; price: number }>, currentPrice: number) {
  if (highs.length < 2) return null;
  const recent = highs.slice(-4);
  for (let i = 0; i < recent.length - 1; i++) {
    for (let j = i + 1; j < recent.length; j++) {
      const diff = Math.abs(recent[i].price - recent[j].price) / recent[i].price;
      if (diff < 0.015 && recent[j].index - recent[i].index > 10) {
        const neckline = Math.min(...recent.slice(i, j + 1).map(h => h.price)) * 0.99;
        if (currentPrice < neckline) {
          return { name: "Double Top", type: "bearish reversal", confidence: Math.round(70 + (1 - diff / 0.015) * 20), direction: "bearish", description: `Two peaks near ${recent[i].price.toFixed(2)} and ${recent[j].price.toFixed(2)} with neckline at ${neckline.toFixed(2)}.`, entryZone: `Sell below ${neckline.toFixed(2)}`, invalidation: `Above ${Math.max(recent[i].price, recent[j].price).toFixed(2)}` };
        }
      }
    }
  }
  return null;
}

function detectDoubleBottom(lows: Array<{ index: number; price: number }>, currentPrice: number) {
  if (lows.length < 2) return null;
  const recent = lows.slice(-4);
  for (let i = 0; i < recent.length - 1; i++) {
    for (let j = i + 1; j < recent.length; j++) {
      const diff = Math.abs(recent[i].price - recent[j].price) / recent[i].price;
      if (diff < 0.015 && recent[j].index - recent[i].index > 10) {
        const neckline = Math.max(...recent.slice(i, j + 1).map(l => l.price)) * 1.01;
        if (currentPrice > neckline) {
          return { name: "Double Bottom", type: "bullish reversal", confidence: Math.round(70 + (1 - diff / 0.015) * 20), direction: "bullish", description: `Two troughs near ${recent[i].price.toFixed(2)} and ${recent[j].price.toFixed(2)} with neckline at ${neckline.toFixed(2)}.`, entryZone: `Buy above ${neckline.toFixed(2)}`, invalidation: `Below ${Math.min(recent[i].price, recent[j].price).toFixed(2)}` };
        }
      }
    }
  }
  return null;
}

function detectHeadAndShoulders(highs: Array<{ index: number; price: number }>, currentPrice: number) {
  if (highs.length < 3) return null;
  const recent = highs.slice(-5);
  for (let i = 0; i < recent.length - 2; i++) {
    const left = recent[i], head = recent[i + 1], right = recent[i + 2];
    if (head.price > left.price && head.price > right.price) {
      const shoulderDiff = Math.abs(left.price - right.price) / left.price;
      if (shoulderDiff < 0.03) {
        const neckline = (left.price + right.price) / 2 * 0.99;
        if (currentPrice < neckline) {
          return { name: "Head and Shoulders", type: "bearish reversal", confidence: Math.round(65 + (1 - shoulderDiff / 0.03) * 25), direction: "bearish", description: `Left shoulder ${left.price.toFixed(2)}, head ${head.price.toFixed(2)}, right shoulder ${right.price.toFixed(2)}. Neckline at ${neckline.toFixed(2)}.`, entryZone: `Sell below ${neckline.toFixed(2)}`, invalidation: `Above ${head.price.toFixed(2)}` };
        }
      }
    }
  }
  return null;
}

function detectSupportResistance(candles: Candle[], currentPrice: number) {
  const highs = findSwingHighs(candles);
  const lows = findSwingLows(candles);

  const resistanceLevels = highs
    .filter(h => h.price > currentPrice)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3)
    .map(h => Number(h.price.toFixed(2)));

  const supportLevels = lows
    .filter(l => l.price < currentPrice)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)
    .map(l => Number(l.price.toFixed(2)));

  return { supportLevels, resistanceLevels };
}

function detectTrend(candles: Candle[]) {
  const recent = candles.slice(-50);
  if (recent.length < 20) return { trend: "insufficient data", trendStrength: "low" };

  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  const avgFirst = firstHalf.reduce((s, c) => s + c.close, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, c) => s + c.close, 0) / secondHalf.length;
  const change = (avgSecond - avgFirst) / avgFirst;

  // RSI-like strength
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].close - recent[i - 1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = losses > 0 ? gains / losses : 100;
  const rsi = 100 - 100 / (1 + rs);

  let trend = "sideways";
  if (change > 0.02) trend = "uptrend";
  else if (change < -0.02) trend = "downtrend";

  let strength = "low";
  if (Math.abs(change) > 0.05) strength = "high";
  else if (Math.abs(change) > 0.02) strength = "medium";

  return { trend, trendStrength: strength, rsi: Number(rsi.toFixed(1)) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedSymbol = searchParams.get("symbol") ?? "XAU/USD";
  if (!PATTERN_SYMBOLS.has(requestedSymbol)) {
    return NextResponse.json({ data: { error: "Pattern analysis is currently limited to Gold, Bitcoin, and EUR/USD." } }, { status: 400 });
  }
  const symbol = requestedSymbol;
  const yahooSymbol = YAHOO_SYMBOLS[symbol];

  try {
    const history = await fetchHistory(yahooSymbol);
    if (!history) {
      return NextResponse.json({ data: { error: "Could not fetch historical data for pattern analysis." } }, { status: 502 });
    }

    let { candles, currentPrice } = history;
    let marketSource = "Yahoo Finance spot history";
    if (symbol === "XAU/USD") {
      const spotPrice = await fetchGoldSpotPrice();
      if (!spotPrice) {
        return NextResponse.json({ data: { error: "Gold spot price is unavailable, so futures-derived levels are not being shown as spot analysis." } }, { status: 502 });
      }
      candles = normalizeCandlesToSpot(candles, spotPrice);
      currentPrice = spotPrice;
      marketSource = "Gold API spot price + GC futures structure normalized to spot";
    }
    const highs = findSwingHighs(candles);
    const lows = findSwingLows(candles);
    const { supportLevels, resistanceLevels } = detectSupportResistance(candles, currentPrice);
    const trendInfo = detectTrend(candles) as { trend: string; trendStrength: string; rsi?: number };

    const patterns: Array<Record<string, unknown>> = [];
    const dt = detectDoubleTop(highs, currentPrice);
    if (dt) patterns.push(dt);
    const db = detectDoubleBottom(lows, currentPrice);
    if (db) patterns.push(db);
    const hs = detectHeadAndShoulders(highs, currentPrice);
    if (hs) patterns.push(hs);

    // Always add trend info as a "pattern"
    patterns.push({
      name: `${trendInfo.trend.charAt(0).toUpperCase() + trendInfo.trend.slice(1)}`,
      type: "trend",
      confidence: trendInfo.trendStrength === "high" ? 85 : trendInfo.trendStrength === "medium" ? 65 : 40,
      direction: trendInfo.trend === "uptrend" ? "bullish" : trendInfo.trend === "downtrend" ? "bearish" : "neutral",
      description: `50-day ${trendInfo.trend} with ${trendInfo.trendStrength} strength${trendInfo.rsi ? `, RSI: ${trendInfo.rsi}` : ""}.`,
      entryZone: trendInfo.trend === "uptrend" ? "Buy on pullbacks to support" : trendInfo.trend === "downtrend" ? "Sell on rallies to resistance" : "Wait for breakout direction",
      invalidation: "Trend reversal on volume",
    });

    let aiNotes: Record<string, string> = {};
    let aiProviderName = "";
    if (patterns.length > 0) {
      try {
        const patternsContext = patterns.map((p, i) =>
          `Pattern ${i + 1}: ${p.name} (${p.type}, ${p.direction}, confidence ${p.confidence}%)\nDescription: ${p.description}\nEntry: ${p.entryZone}\nInvalidation: ${p.invalidation}`)
          .join("\n\n");

        const prompt = `You are a forex trading educator. For each detected chart pattern below, provide a brief (1-2 sentence) educational note explaining what a trader should know about this pattern. Return ONLY valid JSON mapping pattern index to note.

Asset: ${symbol}
Current price: ${currentPrice}
Support: ${supportLevels.join(", ")}
Resistance: ${resistanceLevels.join(", ")}
Trend: ${trendInfo.trend} (${trendInfo.trendStrength})

Patterns:
${patternsContext}

Return JSON: {"0":"note for pattern 0","1":"note for pattern 1",...}`;

        const result = await callAI(prompt, "You are a forex trading educator. Return only valid JSON. Educational only, not financial advice.");
        if (result) {
          aiNotes = JSON.parse(result.content);
          aiProviderName = result.provider;
        }
      } catch { /* AI notes are optional */ }
    }

    const enrichedPatterns = patterns.map((p, i) => ({
      name: p.name as string,
      type: p.type as string,
      confidence: p.confidence as number,
      direction: p.direction as string,
      description: p.description as string,
      entryZone: p.entryZone as string,
      invalidation: p.invalidation as string,
      aiNote: aiNotes[String(i)] ?? undefined,
    }));

    return NextResponse.json({
      data: {
        symbol,
        timeframe: "6 months daily",
        patterns: enrichedPatterns,
        supportLevels,
        resistanceLevels,
        trend: trendInfo.trend,
        trendStrength: trendInfo.trendStrength,
        currentPrice: Number(currentPrice.toFixed(2)),
        computedAt: new Date().toISOString(),
        source: aiProviderName
          ? `${marketSource} + algorithmic detection + AI (${aiProviderName})`
          : `${marketSource} + algorithmic detection`,
      },
    });
  } catch {
    return NextResponse.json({ data: { error: "Failed to analyze patterns." } }, { status: 502 });
  }
}
