import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../lib/db";

const DISPLAY_NAMES: Record<string, string> = {
  "XAU/USD": "Gold Spot",
  "BTC/USD": "Bitcoin Spot",
  "EUR/USD": "Euro / Dollar Spot",
};

type PriceResponse = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  source: string;
  instrumentType: "spot" | "fallback";
  updatedAt: string;
  isFallback: boolean;
};

type YahooMeta = {
  regularMarketPrice: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketTime?: number;
};

async function fetchYahoo(symbol: string): Promise<YahooMeta | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta as YahooMeta | undefined;
    return meta?.regularMarketPrice ? meta : null;
  } catch {
    return null;
  }
}

function fromYahoo(symbol: string, meta: YahooMeta): PriceResponse {
  const previous = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  const change = meta.regularMarketPrice - previous;
  return {
    symbol,
    name: DISPLAY_NAMES[symbol],
    price: meta.regularMarketPrice,
    change,
    percent_change: previous ? change / previous * 100 : 0,
    high: meta.regularMarketDayHigh ?? 0,
    low: meta.regularMarketDayLow ?? 0,
    source: "Yahoo Finance",
    instrumentType: "spot",
    updatedAt: new Date((meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    isFallback: false,
  };
}

async function fetchGoldSpot(): Promise<PriceResponse | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.price) return null;
    return {
      symbol: "XAU/USD",
      name: DISPLAY_NAMES["XAU/USD"],
      price: data.price,
      change: 0,
      percent_change: 0,
      high: 0,
      low: 0,
      source: "Gold API",
      instrumentType: "spot",
      updatedAt: new Date().toISOString(),
      isFallback: false,
    };
  } catch {
    return null;
  }
}

async function fetchEurUsdFallback(): Promise<PriceResponse | null> {
  try {
    const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.eur?.usd;
    if (!rate) return null;
    return {
      symbol: "EUR/USD",
      name: DISPLAY_NAMES["EUR/USD"],
      price: rate,
      change: 0,
      percent_change: 0,
      high: 0,
      low: 0,
      source: "Currency API daily reference",
      instrumentType: "fallback",
      updatedAt: new Date().toISOString(),
      isFallback: true,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const [gold, bitcoinMeta, eurMeta] = await Promise.all([
    fetchGoldSpot(),
    fetchYahoo("BTC-USD"),
    fetchYahoo("EURUSD=X"),
  ]);

  const results: Array<PriceResponse | null> = [
    gold,
    bitcoinMeta ? fromYahoo("BTC/USD", bitcoinMeta) : null,
    eurMeta ? fromYahoo("EUR/USD", eurMeta) : await fetchEurUsdFallback(),
  ];
  const data = results.filter((item): item is PriceResponse => Boolean(item));

  if (data.length === 0) {
    return NextResponse.json({ error: "All verified market data sources failed." }, { status: 502 });
  }

  // Autonomous server-side trade monitoring (checks TP/SL exits even if user is offline)
  try {
    const db = readDb();
    const openTrades = db.trades.filter(t => t.status === "open");
    let dbUpdated = false;

    if (openTrades.length > 0) {
      for (const trade of openTrades) {
        const livePriceObj = data.find(p => p.symbol === trade.symbol);
        if (!livePriceObj) continue;

        const currentPrice = livePriceObj.price;
        const isBuy = trade.direction === "buy";
        let shouldClose = false;
        let hitType: "TP" | "SL" = "TP";

        if (isBuy) {
          if (currentPrice >= trade.takeProfit) {
            shouldClose = true;
            hitType = "TP";
          } else if (currentPrice <= trade.stopLoss) {
            shouldClose = true;
            hitType = "SL";
          }
        } else {
          if (currentPrice <= trade.takeProfit) {
            shouldClose = true;
            hitType = "TP";
          } else if (currentPrice >= trade.stopLoss) {
            shouldClose = true;
            hitType = "SL";
          }
        }

        if (shouldClose) {
          const exitPrice = hitType === "TP" ? trade.takeProfit : trade.stopLoss;
          const tickDiff = isBuy ? (exitPrice - trade.entry) : (trade.entry - exitPrice);
          const riskDistance = Math.abs(trade.entry - trade.stopLoss);
          const pnlR = riskDistance > 0 ? tickDiff / riskDistance : 0;

          const tradeRiskPercent = 0.5; // standard fallback
          const pnlPercentage = pnlR * tradeRiskPercent;
          const pnlAmount = pnlR * (db.balance * tradeRiskPercent / 100);

          trade.status = "closed";
          trade.exitPrice = exitPrice;
          trade.closedAt = new Date().toISOString();
          trade.pnlPercentage = Number(pnlPercentage.toFixed(2));
          trade.pnlAmount = Number(pnlAmount.toFixed(2));

          db.balance = Number((db.balance + pnlAmount).toFixed(2));
          dbUpdated = true;

          // Asynchronously trigger postmortem reviews via server
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          void fetch(`${appUrl}/api/trade-audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trade }),
          })
            .then(res => res.json())
            .then(json => {
              if (json?.data) {
                const freshDb = readDb();
                const idx = freshDb.trades.findIndex(t => t.id === trade.id);
                if (idx !== -1) {
                  freshDb.trades[idx].postmortem = json.data.review;
                  freshDb.trades[idx].lesson = json.data.lesson;
                  writeDb(freshDb);
                }
              }
            })
            .catch(() => null);
        }
      }

      if (dbUpdated) {
        writeDb(db);
      }
    }
  } catch (dbErr) {
    console.error("Autopilot server-side position monitor failed:", dbErr);
  }

  return NextResponse.json({ data, fetchedAt: new Date().toISOString() });
}
