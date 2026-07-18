import { NextResponse } from "next/server";

const DISPLAY_NAMES: Record<string, string> = {
  "XAU/USD": "Gold",
  "XAG/USD": "Silver",
  "EUR/USD": "Euro / Dollar",
  "GBP/USD": "Pound / Dollar",
  "USD/JPY": "Dollar / Yen",
  "USD/CHF": "Dollar / Franc",
  "AUD/USD": "Aussie / Dollar",
  "USD/CAD": "Dollar / Loonie",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
};

const YAHOO_FOREX_SYMBOLS: Record<string, string> = {
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X",
  "USD/CAD": "USDCAD=X",
};

type PriceResponse = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
};

type YahooMeta = {
  regularMarketPrice: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
};

async function fetchYahooChart(yahooSymbol: string): Promise<YahooMeta | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const json = await res.json();
    const meta: YahooMeta | undefined = json?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    return meta;
  } catch {
    return null;
  }
}

function buildFromYahooMeta(symbol: string, meta: YahooMeta): PriceResponse {
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  const change = meta.regularMarketPrice - prevClose;
  const percentChange = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  return {
    symbol,
    name: DISPLAY_NAMES[symbol] ?? symbol,
    price: meta.regularMarketPrice,
    change,
    percent_change: percentChange,
    high: meta.regularMarketDayHigh || meta.regularMarketPrice,
    low: meta.regularMarketDayLow || meta.regularMarketPrice,
  };
}

// Metals: get spot price from gold-api.com + change/high/low from Yahoo futures
async function fetchMetalWithChange(symbol: string): Promise<PriceResponse | null> {
  const metalCode = symbol === "XAU/USD" ? "XAU" : "XAG";
  const futuresSymbol = symbol === "XAU/USD" ? "GC=F" : "SI=F";

  // Fetch both in parallel: spot price from gold-api.com, change data from Yahoo futures
  const [goldApiRes, yahooMeta] = await Promise.all([
    fetch(`https://api.gold-api.com/price/${metalCode}`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null),
    fetchYahooChart(futuresSymbol),
  ]);

  // If we have spot price from gold-api.com
  if (goldApiRes?.price) {
    const spotPrice = goldApiRes.price;

    // If Yahoo futures also returned data, use its change/high/low
    if (yahooMeta) {
      const prevClose = yahooMeta.chartPreviousClose ?? yahooMeta.previousClose ?? spotPrice;
      const change = spotPrice - prevClose;
      const percentChange = prevClose !== 0 ? (change / prevClose) * 100 : 0;
      return {
        symbol,
        name: DISPLAY_NAMES[symbol] ?? symbol,
        price: spotPrice,
        change,
        percent_change: percentChange,
        high: yahooMeta.regularMarketDayHigh || spotPrice,
        low: yahooMeta.regularMarketDayLow || spotPrice,
      };
    }

    // Only spot price available, no change data
    return {
      symbol,
      name: DISPLAY_NAMES[symbol] ?? symbol,
      price: spotPrice,
      change: 0,
      percent_change: 0,
      high: spotPrice,
      low: spotPrice,
    };
  }

  // gold-api.com failed — try Yahoo spot first, then Yahoo futures
  const yahooSpot = await fetchYahooChart(symbol === "XAU/USD" ? "XAUUSD=X" : "XAGUSD=X");
  if (yahooSpot) return buildFromYahooMeta(symbol, yahooSpot);

  if (yahooMeta) return buildFromYahooMeta(symbol, yahooMeta);

  return null;
}

// Forex: Yahoo Finance
async function fetchForex(symbol: string): Promise<PriceResponse | null> {
  const yahooSymbol = YAHOO_FOREX_SYMBOLS[symbol];
  if (!yahooSymbol) return null;
  const meta = await fetchYahooChart(yahooSymbol);
  if (!meta) return null;
  return buildFromYahooMeta(symbol, meta);
}

// Fallback: fawazahmed0 currency-api for forex (daily EOD)
async function fetchForexFallback(symbol: string): Promise<PriceResponse | null> {
  try {
    const [base, quote] = symbol.split("/");
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${quote.toLowerCase()}.json`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.[quote.toLowerCase()]?.[base.toLowerCase()];
    if (!rate || rate === 0) return null;
    return {
      symbol,
      name: DISPLAY_NAMES[symbol] ?? symbol,
      price: rate,
      change: 0,
      percent_change: 0,
      high: rate,
      low: rate,
    };
  } catch {
    return null;
  }
}

// Crypto: Yahoo Finance (BTC-USD, ETH-USD)
async function fetchCrypto(symbol: string): Promise<PriceResponse | null> {
  const yahooSymbol = symbol === "BTC/USD" ? "BTC-USD" : "ETH-USD";
  const meta = await fetchYahooChart(yahooSymbol);
  if (!meta) return null;
  return buildFromYahooMeta(symbol, meta);
}

export async function GET() {
  const symbols = ["XAU/USD", "XAG/USD", "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "BTC/USD", "ETH/USD"];

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        if (symbol === "XAU/USD" || symbol === "XAG/USD") {
          return await fetchMetalWithChange(symbol);
        }
        if (symbol === "BTC/USD" || symbol === "ETH/USD") {
          return await fetchCrypto(symbol);
        }
        return (await fetchForex(symbol)) ?? (await fetchForexFallback(symbol));
      }),
    );

    const validResults = results.filter((r): r is PriceResponse => r !== null);

    if (validResults.length === 0) {
      return NextResponse.json({ error: "All market data sources failed." }, { status: 502 });
    }

    return NextResponse.json({ data: validResults });
  } catch {
    return NextResponse.json({ error: "Failed to fetch market data." }, { status: 502 });
  }
}
