import { NextResponse } from "next/server";

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "GC=F", "XAG/USD": "SI=F", "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X", "USD/JPY": "USDJPY=X", "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X", "USD/CAD": "USDCAD=X", "BTC/USD": "BTC-USD", "ETH/USD": "ETH-USD",
};

const RANGES: Record<string, string> = {
  "1mo": "1mo",
  "3mo": "3mo",
  "6mo": "6mo",
  "1y": "1y",
  "2y": "2y",
};

const INTERVALS: Record<string, string> = {
  "1h": "60m",
  "4h": "60m", // resampled in frontend
  "1d": "1d",
  "1wk": "1wk",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "XAU/USD";
  const range = searchParams.get("range") ?? "6mo";
  const interval = searchParams.get("interval") ?? "1d";

  const yahooSymbol = YAHOO_SYMBOLS[symbol] ?? "GC=F";
  const yahooRange = RANGES[range] ?? "6mo";
  const yahooInterval = INTERVALS[interval] ?? "1d";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${yahooInterval}&range=${yahooRange}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Yahoo Finance request failed" }, { status: 502 });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];

    if (!q || !q.open || !q.close) {
      return NextResponse.json({ error: "No candle data available" }, { status: 502 });
    }

    const candles = [];
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

    return NextResponse.json({
      data: candles,
      symbol,
      range,
      interval,
      count: candles.length,
      source: "Yahoo Finance",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 502 });
  }
}
