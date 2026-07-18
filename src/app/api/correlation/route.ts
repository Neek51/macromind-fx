import { NextResponse } from "next/server";

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "XAUUSD=X",
  "XAG/USD": "XAGUSD=X",
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X",
  "USD/CAD": "USDCAD=X",
  "BTC/USD": "BTC-USD",
  "ETH/USD": "ETH-USD",
};

type CorrelationCell = {
  symbol: string;
  values: Record<string, number>;
};

type CorrelationPair = {
  a: string;
  b: string;
  value: number;
};

function toReturns(closes: number[]) {
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const current = closes[i];
    if (prev > 0 && current > 0) {
      returns.push((current - prev) / prev);
    }
  }
  return returns;
}

function pearsonCorrelation(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (length < 10) return 0;

  const x = a.slice(-length);
  const y = b.slice(-length);
  const meanX = x.reduce((sum, value) => sum + value, 0) / length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < length; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return Math.max(-1, Math.min(1, numerator / denominator));
}

async function fetchReturns(yahooSymbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=3mo`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 900 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    if (!Array.isArray(closes)) return null;

    const cleanCloses = closes.filter((close): close is number => typeof close === "number" && Number.isFinite(close));
    if (cleanCloses.length < 12) return null;

    return toReturns(cleanCloses);
  } catch {
    return null;
  }
}

export async function GET() {
  const symbols = Object.keys(YAHOO_SYMBOLS);

  try {
    const entries = await Promise.all(
      symbols.map(async (symbol) => [symbol, await fetchReturns(YAHOO_SYMBOLS[symbol])] as const),
    );

    const returnsBySymbol = Object.fromEntries(
      entries.filter((entry): entry is readonly [string, number[]] => Array.isArray(entry[1]) && entry[1].length >= 10),
    );

    const availableSymbols = symbols.filter((symbol) => returnsBySymbol[symbol]);

    if (availableSymbols.length < 2) {
      return NextResponse.json({ error: "Not enough historical data for correlation." }, { status: 502 });
    }

    const matrix: CorrelationCell[] = symbols.map((row) => {
      const values: Record<string, number> = {};
      for (const col of symbols) {
        if (row === col) {
          values[col] = 1;
        } else if (returnsBySymbol[row] && returnsBySymbol[col]) {
          values[col] = Number(pearsonCorrelation(returnsBySymbol[row], returnsBySymbol[col]).toFixed(2));
        } else {
          values[col] = 0;
        }
      }
      return { symbol: row, values };
    });

    const pairs: CorrelationPair[] = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const a = symbols[i];
        const b = symbols[j];
        pairs.push({ a, b, value: matrix[i].values[b] });
      }
    }

    const strongestPositive = [...pairs].sort((x, y) => y.value - x.value)[0];
    const strongestNegative = [...pairs].sort((x, y) => x.value - y.value)[0];

    return NextResponse.json({
      data: {
        symbols,
        matrix,
        strongestPositive,
        strongestNegative,
        timeframe: "3 months",
        interval: "1 day",
        updatedAt: new Date().toISOString(),
        source: "Yahoo Finance historical daily closes",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to calculate correlation." }, { status: 502 });
  }
}
