import { NextResponse } from "next/server";

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

  return NextResponse.json({ data, fetchedAt: new Date().toISOString() });
}
