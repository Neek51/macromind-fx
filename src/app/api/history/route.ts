import { NextResponse } from "next/server";

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "GC=F", "XAG/USD": "SI=F", "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X", "USD/JPY": "USDJPY=X", "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X", "USD/CAD": "USDCAD=X", "BTC/USD": "BTC-USD", "ETH/USD": "ETH-USD",
};

export async function getHistoricalCandles(symbol: string, interval: string, range?: string) {
  const yahooSymbol = YAHOO_SYMBOLS[symbol] ?? "GC=F";

  // 1. Map intervals and determine default safe ranges to prevent Yahoo 400 errors
  let yahooInterval = "1d";
  let defaultRange = "6mo";
  let resampleFactor = 1;

  switch (interval) {
    case "1m":
      yahooInterval = "1m";
      defaultRange = "5d";
      break;
    case "3m":
      yahooInterval = "1m";
      defaultRange = "5d";
      resampleFactor = 3;
      break;
    case "5m":
      yahooInterval = "5m";
      defaultRange = "1mo";
      break;
    case "15m":
      yahooInterval = "15m";
      defaultRange = "1mo";
      break;
    case "30m":
      yahooInterval = "30m";
      defaultRange = "1mo";
      break;
    case "1h":
      yahooInterval = "60m";
      defaultRange = "3mo";
      break;
    case "4h":
      yahooInterval = "60m";
      defaultRange = "3mo";
      resampleFactor = 4;
      break;
    case "1d":
    default:
      yahooInterval = "1d";
      defaultRange = "6mo";
      interval = "1d";
      break;
  }

  const yahooRange = range ?? defaultRange;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${yahooInterval}&range=${yahooRange}`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 }, // Revalidate historical data faster (every minute)
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.statusText}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0];

  if (!q || !q.open || !q.close) {
    throw new Error("No candle data available from Yahoo");
  }

  let candles = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (q.open[i] == null || q.close[i] == null || q.high[i] == null || q.low[i] == null) continue;
    candles.push({
      time: timestamps[i],
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      volume: q.volume[i] ?? 0,
    });
  }

  // 2. Perform resampling if requested (e.g. 1m -> 3m, or 1h -> 4h)
  if (resampleFactor > 1 && candles.length > 0) {
    const resampled = [];
    for (let i = 0; i < candles.length; i += resampleFactor) {
      const chunk = candles.slice(i, i + resampleFactor);
      const first = chunk[0];
      const last = chunk[chunk.length - 1];

      const highs = chunk.map((c) => c.high);
      const lows = chunk.map((c) => c.low);
      const totalVolume = chunk.reduce((sum, c) => sum + (c.volume ?? 0), 0);

      resampled.push({
        time: first.time,
        open: first.open,
        high: Math.max(...highs),
        low: Math.min(...lows),
        close: last.close,
        volume: totalVolume,
      });
    }
    candles = resampled;
  }

  return {
    candles,
    yahooRange,
    interval,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") ?? "XAU/USD";
    const range = searchParams.get("range") ?? undefined;
    const interval = searchParams.get("interval") ?? "1d";

    const { candles, yahooRange, interval: finalInterval } = await getHistoricalCandles(symbol, interval, range);

    return NextResponse.json({
      data: candles,
      symbol,
      range: yahooRange,
      interval: finalInterval,
      count: candles.length,
      source: "Yahoo Finance",
    });
  } catch (error: unknown) {
    console.error("Historical fetch error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch historical data";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
