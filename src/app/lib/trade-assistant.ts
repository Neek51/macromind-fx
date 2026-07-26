import type { CalendarEvent, LiveAsset } from "../types";
import { calcATR, calcEMA, type Candle } from "./backtest";

export type SafetyVerdict = "NO TRADE" | "WAIT" | "TRADEABLE" | "REDUCE RISK";

export type MarketContext = {
  trend: "bullish" | "bearish" | "neutral" | "unavailable";
  atr: number | null;
  previousDayHigh: number | null;
  previousDayLow: number | null;
  previousWeekHigh: number | null;
  previousWeekLow: number | null;
  dailyOpen: number | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
};

const USD_SENSITIVE = new Set(["XAU/USD", "BTC/USD", "EUR/USD"]);

export function evaluateTradeSafety({
  symbol,
  asset,
  events,
  now,
}: {
  symbol: string;
  asset?: LiveAsset;
  events: CalendarEvent[];
  now: number;
}): { verdict: SafetyVerdict; reason: string; event?: CalendarEvent; minutes?: number } {
  if (!asset) return { verdict: "NO TRADE", reason: "Verified price data is unavailable." };
  if (asset.isFallback) return { verdict: "NO TRADE", reason: "Only delayed fallback pricing is available." };

  if (symbol !== "BTC/USD") {
    const time = new Date(now);
    const day = time.getUTCDay();
    const hour = time.getUTCHours();
    const marketClosed = day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 22);
    if (marketClosed) return { verdict: "NO TRADE", reason: "The Gold/forex market is closed for the weekend." };
  }

  const age = asset.updatedAt ? now - new Date(asset.updatedAt).getTime() : Number.POSITIVE_INFINITY;
  if (age > 15 * 60 * 1000) return { verdict: "NO TRADE", reason: "Price data is stale (older than 15 minutes)." };

  const relevant = events
    .filter((event) => event.impact === "High" && (event.country === "USD" ? USD_SENSITIVE.has(symbol) : symbol.startsWith(event.country)))
    .map((event) => ({ event, diff: new Date(event.date).getTime() - now }))
    .filter(({ diff }) => diff >= -15 * 60 * 1000 && diff <= 30 * 60 * 1000)
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];

  if (relevant) {
    const minutes = Math.round(relevant.diff / 60000);
    return {
      verdict: "NO TRADE",
      reason: minutes >= 0
        ? `${relevant.event.title} is in ${minutes} minutes. Wait until 15 minutes after release.`
        : `${relevant.event.title} was released ${Math.abs(minutes)} minutes ago. Let volatility settle.`,
      event: relevant.event,
      minutes,
    };
  }

  return { verdict: "TRADEABLE", reason: "Verified data is fresh and no high-impact event is inside the safety window." };
}

export function calculateMarketContext(candles: Candle[], currentPrice: number): MarketContext {
  if (candles.length < 30) {
    return {
      trend: "unavailable", atr: null, previousDayHigh: null, previousDayLow: null,
      previousWeekHigh: null, previousWeekLow: null, dailyOpen: null,
      nearestSupport: null, nearestResistance: null,
    };
  }

  const completed = candles.slice(0, -1);
  const previousDay = completed.at(-1);
  const previousWeek = completed.slice(-5);
  const closes = candles.map((c) => c.close);
  const ema20 = calcEMA(closes, 20).at(-1) ?? currentPrice;
  const ema50 = calcEMA(closes, 50).at(-1) ?? currentPrice;
  const atr = calcATR(candles, 14).at(-1) ?? null;

  const swingHighs = completed.slice(-30).map((c) => c.high).filter((price) => price > currentPrice).sort((a, b) => a - b);
  const swingLows = completed.slice(-30).map((c) => c.low).filter((price) => price < currentPrice).sort((a, b) => b - a);

  return {
    trend: currentPrice > ema20 && ema20 > ema50 ? "bullish" : currentPrice < ema20 && ema20 < ema50 ? "bearish" : "neutral",
    atr,
    previousDayHigh: previousDay?.high ?? null,
    previousDayLow: previousDay?.low ?? null,
    previousWeekHigh: previousWeek.length ? Math.max(...previousWeek.map((c) => c.high)) : null,
    previousWeekLow: previousWeek.length ? Math.min(...previousWeek.map((c) => c.low)) : null,
    dailyOpen: candles.at(-1)?.open ?? null,
    nearestSupport: swingLows[0] ?? null,
    nearestResistance: swingHighs[0] ?? null,
  };
}

export function calculateRiskPlan({
  accountSize,
  riskPercent,
  entry,
  stop,
  target,
}: {
  accountSize: number;
  riskPercent: number;
  entry: number;
  stop: number;
  target: number;
}) {
  if (![accountSize, riskPercent, entry, stop, target].every((value) => Number.isFinite(value) && value > 0) || entry === stop) return null;
  const riskAmount = accountSize * riskPercent / 100;
  const stopDistance = Math.abs(entry - stop);
  const targetDistance = Math.abs(target - entry);
  const riskReward = targetDistance / stopDistance;
  return {
    riskAmount,
    stopDistance,
    targetDistance,
    riskReward,
    riskWarning: riskPercent > 1 ? "Risk above 1% is not recommended for a beginner." : null,
    rewardWarning: riskReward < 2 ? "Target is below the minimum 1:2 risk/reward guideline." : null,
  };
}
