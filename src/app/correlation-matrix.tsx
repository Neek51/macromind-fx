"use client";

import type { LiveAsset, CorrelationData } from "./types";
import { AssetIcon } from "./asset-icon";

const CORRELATION_PRESETS: Record<string, number> = {
  "XAU/USD|XAG/USD": 0.82,
  "XAU/USD|EUR/USD": 0.32,
  "XAU/USD|GBP/USD": 0.28,
  "XAU/USD|USD/JPY": -0.22,
  "XAU/USD|USD/CHF": -0.34,
  "XAU/USD|AUD/USD": 0.42,
  "XAU/USD|USD/CAD": -0.18,
  "XAU/USD|BTC/USD": 0.18,
  "XAU/USD|ETH/USD": 0.16,
  "XAG/USD|EUR/USD": 0.24,
  "XAG/USD|GBP/USD": 0.22,
  "XAG/USD|USD/JPY": -0.18,
  "XAG/USD|USD/CHF": -0.28,
  "XAG/USD|AUD/USD": 0.36,
  "XAG/USD|USD/CAD": -0.15,
  "XAG/USD|BTC/USD": 0.16,
  "XAG/USD|ETH/USD": 0.14,
  "EUR/USD|GBP/USD": 0.76,
  "EUR/USD|USD/JPY": -0.58,
  "EUR/USD|USD/CHF": -0.72,
  "EUR/USD|AUD/USD": 0.64,
  "EUR/USD|USD/CAD": -0.61,
  "EUR/USD|BTC/USD": 0.12,
  "EUR/USD|ETH/USD": 0.12,
  "GBP/USD|USD/JPY": -0.52,
  "GBP/USD|USD/CHF": -0.66,
  "GBP/USD|AUD/USD": 0.58,
  "GBP/USD|USD/CAD": -0.55,
  "GBP/USD|BTC/USD": 0.10,
  "GBP/USD|ETH/USD": 0.10,
  "USD/JPY|USD/CHF": 0.48,
  "USD/JPY|AUD/USD": -0.44,
  "USD/JPY|USD/CAD": 0.42,
  "USD/JPY|BTC/USD": -0.08,
  "USD/JPY|ETH/USD": -0.08,
  "USD/CHF|AUD/USD": -0.52,
  "USD/CHF|USD/CAD": 0.57,
  "USD/CHF|BTC/USD": -0.10,
  "USD/CHF|ETH/USD": -0.10,
  "AUD/USD|USD/CAD": -0.68,
  "AUD/USD|BTC/USD": 0.18,
  "AUD/USD|ETH/USD": 0.18,
  "USD/CAD|BTC/USD": -0.10,
  "USD/CAD|ETH/USD": -0.10,
  "BTC/USD|ETH/USD": 0.88,
};

function getCorrelationStyle(value: number) {
  const strength = Math.min(Math.abs(value), 1);
  if (value > 0.2) {
    return {
      backgroundColor: `rgba(4, 120, 87, ${0.18 + strength * 0.55})`,
      color: strength > 0.55 ? "#ffffff" : "#047857",
    };
  }
  if (value < -0.2) {
    return {
      backgroundColor: `rgba(185, 28, 28, ${0.18 + strength * 0.55})`,
      color: strength > 0.55 ? "#ffffff" : "#b91c1c",
    };
  }
  return { backgroundColor: "rgba(100, 116, 139, 0.14)", color: "#64748b" };
}

function getCorrelationLabel(value: number) {
  if (value >= 0.7) return "Strong +";
  if (value >= 0.35) return "Medium +";
  if (value <= -0.7) return "Strong -";
  if (value <= -0.35) return "Medium -";
  return "Low";
}

export function CorrelationMatrix({
  marketAssets,
  correlationData,
  correlationLoading,
}: {
  marketAssets: LiveAsset[];
  correlationData: CorrelationData | null;
  correlationLoading: boolean;
}) {
  function getCorrelation(a: string, b: string) {
    if (a === b) return 1;
    const liveValue = correlationData?.matrix
      .find((row) => row.symbol === a)
      ?.values?.[b];
    if (typeof liveValue === "number") return liveValue;
    return CORRELATION_PRESETS[`${a}|${b}`] ?? CORRELATION_PRESETS[`${b}|${a}`] ?? 0;
  }

  const pairCombos = marketAssets.flatMap((a, index) =>
    marketAssets.slice(index + 1).map((b) => ({ a, b, value: getCorrelation(a.symbol, b.symbol) })),
  );
  const strongestPositiveFallback = [...pairCombos].sort((x, y) => y.value - x.value)[0];
  const strongestNegativeFallback = [...pairCombos].sort((x, y) => x.value - y.value)[0];
  const strongestPositive = correlationData?.strongestPositive
    ? {
        a: marketAssets.find((asset) => asset.symbol === correlationData.strongestPositive.a) ?? strongestPositiveFallback.a,
        b: marketAssets.find((asset) => asset.symbol === correlationData.strongestPositive.b) ?? strongestPositiveFallback.b,
        value: correlationData.strongestPositive.value,
      }
    : strongestPositiveFallback;
  const strongestNegative = correlationData?.strongestNegative
    ? {
        a: marketAssets.find((asset) => asset.symbol === correlationData.strongestNegative.a) ?? strongestNegativeFallback.a,
        b: marketAssets.find((asset) => asset.symbol === correlationData.strongestNegative.b) ?? strongestNegativeFallback.b,
        value: correlationData.strongestNegative.value,
      }
    : strongestNegativeFallback;
  const correlationUpdatedAt = correlationData?.updatedAt
    ? new Date(correlationData.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-[var(--card-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk overlay</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">Correlation Matrix</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${correlationData ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>
              {correlationLoading ? "Calculating live..." : correlationData ? "Live 3M / 1D" : "Preset fallback"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {correlationData
              ? `Calculated from ${correlationData.source}. Updated ${correlationUpdatedAt ?? "now"}.`
              : "Using preset estimates until Yahoo historical data loads."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Positive = same direction</span>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600 dark:bg-red-500/10 dark:text-red-400">Negative = opposite</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500 dark:bg-white/5">Numbers = relationship strength</span>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_260px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] bg-[var(--card)] p-2 text-left font-semibold text-slate-400">Pair</th>
                {marketAssets.map((asset) => (
                  <th key={asset.symbol} className="min-w-[62px] p-1 font-semibold text-slate-400">
                    <span className="inline-block -rotate-45 whitespace-nowrap text-[10px]">{asset.symbol}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketAssets.map((row) => (
                <tr key={row.symbol}>
                  <th className="sticky left-0 z-[1] bg-[var(--card)] p-1.5 text-left font-bold">
                    <div className="flex items-center gap-2">
                      <AssetIcon symbol={row.symbol} size={22} />
                      <span>{row.symbol}</span>
                    </div>
                  </th>
                  {marketAssets.map((col) => {
                    const value = getCorrelation(row.symbol, col.symbol);
                    const isSelf = row.symbol === col.symbol;
                    return (
                      <td key={`${row.symbol}-${col.symbol}`} className="p-0.5">
                        <div
                          className={`rounded-lg px-1.5 py-2 font-bold tabular-nums ${isSelf ? "ring-1 ring-[var(--accent)]/30" : ""}`}
                          style={getCorrelationStyle(value)}
                          title={`${row.symbol} vs ${col.symbol}: ${getCorrelationLabel(value)}`}
                        >
                          {value.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 dark:bg-white/[0.02]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Highest same-direction risk</p>
            <p className="mt-1 text-lg font-bold">{strongestPositive.a.symbol} + {strongestPositive.b.symbol}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-600">{strongestPositive.value.toFixed(2)} correlation</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Taking both in the same direction can double your exposure.</p>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 dark:bg-white/[0.02]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Strongest hedge relationship</p>
            <p className="mt-1 text-lg font-bold">{strongestNegative.a.symbol} vs {strongestNegative.b.symbol}</p>
            <p className="mt-1 text-sm font-semibold text-red-500">{strongestNegative.value.toFixed(2)} correlation</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">These often move opposite, useful for spotting conflicting positions.</p>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            {correlationData
              ? `Live Pearson correlation from ${correlationData.timeframe} of ${correlationData.interval} closes. Use it as a risk guide, not financial advice.`
              : "Preset fallback shown until live historical data is available. Use it as a risk guide, not financial advice."}
          </p>
        </div>
      </div>
    </>
  );
}
