"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageShell } from "../components";
import { AssetIcon, nameMap } from "../asset-icon";
import type { MarketOutlook } from "../types";

const biasColors: Record<string, string> = {
  bullish: "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10 dark:text-emerald-400",
  bearish: "bg-red-50 text-red-600 dark:bg-red-50/10 dark:text-red-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400",
};

const directionArrows: Record<string, string> = { bullish: "▲", bearish: "▼", neutral: "◆" };

export default function OutlookPage() {
  const [outlook, setOutlook] = useState<MarketOutlook | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchOutlook = useCallback(async () => {
    try {
      const res = await fetch("/api/outlook");
      const json = await res.json();
      if (json.data) setOutlook(json.data);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setOutlook({ date: "", overallBias: "neutral", biasStrength: "low", summary: "", keyLevels: [], eventsToWatch: [], opportunities: [], risks: [], topMovers: [], generatedAt: "", source: "", error: "Could not connect to the AI outlook service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchOutlook, 0);
    return () => clearTimeout(timer);
  }, [fetchOutlook]);

  return (
    <PageShell title="AI Daily Market Outlook" label="Outlook" action="Refresh">
      {outlook?.error ? (
        <Card className="flex items-center gap-3 bg-red-50 dark:bg-red-50/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm font-medium text-red-600">{outlook.error}</p>
        </Card>
      ) : null}

      {/* Date + Refresh */}
      <section>
        <Card className="animate-fade-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {outlook?.date ?? "Loading..."}
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {loading ? "Generating your daily outlook..." : "Today's Market Outlook"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-slate-400">Updated {lastUpdated}</span>
              )}
              <button
                onClick={fetchOutlook}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : null}
                Regenerate
              </button>
            </div>
          </div>

          {/* Bias badge */}
          {!loading && outlook && !outlook.error ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold ${biasColors[outlook.overallBias] ?? biasColors.neutral}`}>
                {directionArrows[outlook.overallBias] ?? "◆"} {outlook.overallBias?.toUpperCase()} BIAS
              </span>
              <span className="text-sm font-medium text-slate-500">
                Strength: <span className="font-bold capitalize">{outlook.biasStrength}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5">
                {outlook.source}
              </span>
            </div>
          ) : null}

          {/* Summary */}
          {loading ? (
            <div className="mt-5 h-24 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
          ) : outlook && !outlook.error ? (
            <div className="mt-5 rounded-xl bg-[var(--foreground)] p-5 text-[var(--background)] dark:bg-white/[0.04] dark:text-[var(--foreground)]">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Market Summary</p>
              <p className="mt-2 text-sm leading-7">{outlook.summary}</p>
            </div>
          ) : null}
        </Card>
      </section>

      {/* Top movers */}
      {!loading && outlook?.topMovers && outlook.topMovers.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Top Movers</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {outlook.topMovers.map((mover, i) => {
              const isUp = mover.change.startsWith("+");
              return (
                <Card key={`${mover.asset}-${i}`} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AssetIcon symbol={mover.asset} size={32} />
                      <div>
                        <p className="text-sm font-bold">{mover.asset}</p>
                        <p className="text-xs text-slate-500">{nameMap[mover.asset] ?? mover.asset}</p>
                      </div>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" : "bg-red-50 text-red-500 dark:bg-red-50/10"}`}>
                      {isUp ? "▲" : "▼"} {mover.change}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">{mover.note}</p>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Key levels + Events */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Key levels */}
        <Card className="animate-fade-up-delay-2">
          <h2 className="text-xl font-bold">Key Levels to Watch</h2>
          <p className="mt-1 text-xs text-slate-400">AI-identified support and resistance zones</p>
          <div className="mt-5 space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />)
            ) : outlook && (outlook.keyLevels?.length ?? 0) > 0 ? (
              outlook.keyLevels.map((level, i) => (
                <div key={`${level.asset}-${i}`} className="flex items-start gap-3 rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                  <AssetIcon symbol={level.asset} size={32} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{level.asset}</p>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${biasColors[level.direction] ?? biasColors.neutral}`}>
                        {directionArrows[level.direction] ?? "◆"} {level.direction}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{level.levels}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{level.note}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No key levels available.</p>
            )}
          </div>
        </Card>

        {/* Events to watch */}
        <Card className="animate-fade-up-delay-3">
          <h2 className="text-xl font-bold">Events to Watch</h2>
          <p className="mt-1 text-xs text-slate-400">High-impact macro events</p>
          <div className="mt-5 space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />)
            ) : outlook && (outlook.eventsToWatch?.length ?? 0) > 0 ? (
              outlook.eventsToWatch.map((event, i) => (
                <div key={`${event.event}-${i}`} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{event.event}</p>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${event.impact === "High" ? "bg-red-50 text-red-600 dark:bg-red-50/10" : "bg-amber-50 text-amber-700 dark:bg-amber-50/10"}`}>
                      {event.impact}
                    </span>
                  </div>
                  {event.time ? <p className="mt-1 text-xs text-slate-400">{event.time}</p> : null}
                  <p className="mt-2 text-xs leading-5 text-slate-500">{event.why}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No events to watch.</p>
            )}
          </div>
        </Card>
      </section>

      {/* Opportunities + Risks */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="animate-fade-up-delay-2">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
            </svg>
            <h2 className="text-xl font-bold">Opportunities</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {loading ? (
              [1, 2].map(i => <li key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />)
            ) : outlook && (outlook.opportunities?.length ?? 0) > 0 ? (
              outlook.opportunities.map((opp, i) => (
                <li key={i} className="rounded-xl bg-emerald-50/50 p-4 text-sm leading-6 dark:bg-emerald-50/10">
                  {opp}
                </li>
              ))
            ) : <li className="text-sm text-slate-400">No opportunities identified.</li>}
          </ul>
        </Card>

        <Card className="animate-fade-up-delay-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
            <h2 className="text-xl font-bold">Risk Factors</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {loading ? (
              [1, 2].map(i => <li key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />)
            ) : outlook && (outlook.risks?.length ?? 0) > 0 ? (
              outlook.risks.map((risk, i) => (
                <li key={i} className="rounded-xl bg-amber-50/50 p-4 text-sm leading-6 dark:bg-amber-50/10">
                  {risk}
                </li>
              ))
            ) : <li className="text-sm text-slate-400">No risks identified.</li>}
          </ul>
        </Card>
      </section>

      {/* Risk reminder */}
      <p className="text-center text-xs text-slate-400">
        Educational market analysis only — not financial advice. Generated by AI from live market data.
      </p>
    </PageShell>
  );
}
