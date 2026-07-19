"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageShell } from "../components";
import { AssetIcon, nameMap, formatPrice } from "../asset-icon";
import type { PatternResult } from "../types";

const directionColors: Record<string, string> = {
  bullish: "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10 dark:text-emerald-400",
  bearish: "bg-red-50 text-red-600 dark:bg-red-50/10 dark:text-red-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400",
};

export default function PatternsPage() {
  const [symbol, setSymbol] = useState("XAU/USD");
  const [result, setResult] = useState<PatternResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const analyze = useCallback(async (sym: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/patterns?symbol=${encodeURIComponent(sym)}`);
      const json = await res.json();
      if (json.data) setResult(json.data);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setResult({ symbol: sym, timeframe: "", patterns: [], supportLevels: [], resistanceLevels: [], trend: "", trendStrength: "", currentPrice: 0, computedAt: "", source: "", error: "Could not connect to the pattern analysis service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      analyze(symbol);
    }, 0);
    return () => clearTimeout(timer);
  }, [analyze, symbol]);

  return (
    <PageShell title="AI Pattern Detection" label="Patterns" action="Re-scan" onActionClick={() => analyze(symbol)}>
      {/* Symbol selector */}
      <section>
        <Card className="animate-fade-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AssetIcon symbol={symbol} size={40} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analyzing</p>
                <h2 className="text-xl font-bold">{symbol} — {nameMap[symbol] ?? symbol}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && <span className="text-xs text-slate-400">Updated {lastUpdated}</span>}
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
              >
                {Object.keys(nameMap).map((sym) => (
                  <option key={sym} value={sym}>{sym} — {nameMap[sym]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Current price + trend */}
          {result && !result.error ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Price</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatPrice(result.symbol, result.currentPrice)}</p>
              </div>
              <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trend</p>
                <p className={`mt-1 text-lg font-bold capitalize ${result.trend === "uptrend" ? "text-emerald-600" : result.trend === "downtrend" ? "text-red-500" : "text-slate-500"}`}>
                  {result.trend}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trend Strength</p>
                <p className="mt-1 text-lg font-bold capitalize">{result.trendStrength}</p>
              </div>
            </div>
          ) : null}

          {/* Source badge */}
          {result && !result.error ? (
            <p className="mt-4 text-xs text-slate-400">
              {result.source} • {result.timeframe} • Computed at {new Date(result.computedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : null}
        </Card>
      </section>

      {result?.error ? (
        <Card className="flex items-center gap-3 bg-red-50 dark:bg-red-50/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm font-medium text-red-600">{result.error}</p>
        </Card>
      ) : null}

      {/* Detected patterns */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Detected Patterns</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm dark:bg-white/[0.02]" />)
          ) : result && (result.patterns?.length ?? 0) > 0 ? (
            result.patterns.map((pattern, i) => (
              <Card key={`${pattern.name}-${i}`} className="animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 0.05}s` }}>
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{pattern.name}</h3>
                      <p className="text-sm font-semibold capitalize text-slate-500 mt-0.5">{pattern.type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide ${directionColors[pattern.direction] ?? directionColors.neutral}`}>
                        {pattern.direction}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{pattern.confidence}% confidence</span>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pattern.direction === "bullish" ? "bg-emerald-500" : pattern.direction === "bearish" ? "bg-rose-500" : "bg-slate-400"}`}
                      style={{ width: `${pattern.confidence}%` }}
                    />
                  </div>

                  <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-350">{pattern.description}</p>

                  <div className="mt-5 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm dark:border-slate-800/40 dark:bg-white/[0.01]">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 font-bold text-emerald-600 w-24">Entry Zone:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{pattern.entryZone}</span>
                    </div>
                    <div className="flex items-start gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/40">
                      <span className="shrink-0 font-bold text-rose-500 w-24">Invalidation:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{pattern.invalidation}</span>
                    </div>
                  </div>
                </div>

                {pattern.aiNote ? (
                  <div className="mt-5 rounded-xl border border-[var(--accent)]/10 bg-[var(--accent-soft)] p-4 text-sm leading-relaxed">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent)]">
                        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" fill="currentColor" />
                      </svg>
                      <span className="font-bold text-[var(--accent)]">AI Educational Insights</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{pattern.aiNote}</p>
                  </div>
                ) : null}
              </Card>
            ))
          ) : !loading ? (
            <Card className="md:col-span-2 py-12 text-center">
              <p className="text-base font-semibold text-slate-400">No significant patterns detected in the current price action.</p>
            </Card>
          ) : null}
        </div>
      </section>

      {/* Support / Resistance */}
      {!loading && result && !result.error && (result.supportLevels.length > 0 || result.resistanceLevels.length > 0) ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="animate-fade-up-delay-2 p-6">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Support Levels</h2>
                <p className="text-xs text-slate-400">Buying pressure zones</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {result.supportLevels.length > 0 ? result.supportLevels.map((level, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-emerald-50/20 p-4 dark:bg-emerald-950/[0.04]">
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">S{i + 1}</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{formatPrice(result.symbol, level)}</span>
                  <span className="text-sm font-semibold text-slate-500 tabular-nums">{(((level - result.currentPrice) / result.currentPrice) * 100).toFixed(1)}% below</span>
                </div>
              )) : <p className="text-sm text-slate-400">No support levels detected.</p>}
            </div>
          </Card>

          <Card className="animate-fade-up-delay-3 p-6">
            <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Resistance Levels</h2>
                <p className="text-xs text-slate-400">Selling pressure zones</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {result.resistanceLevels.length > 0 ? result.resistanceLevels.map((level, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-rose-500/10 bg-rose-50/20 p-4 dark:bg-rose-950/[0.04]">
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">R{i + 1}</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{formatPrice(result.symbol, level)}</span>
                  <span className="text-sm font-semibold text-slate-500 tabular-nums">{(((level - result.currentPrice) / result.currentPrice) * 100).toFixed(1)}% above</span>
                </div>
              )) : <p className="text-sm text-slate-400">No resistance levels detected.</p>}
            </div>
          </Card>
        </section>
      ) : null}

      <p className="text-center text-xs text-slate-400">
        Pattern detection is algorithmic (swing highs/lows, trend analysis) with AI educational notes. Not financial advice.
      </p>
    </PageShell>
  );
}
