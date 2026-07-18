"use client";

import { useState, useEffect } from "react";
import { Card, PageShell } from "../components";
import { trades as fallbackTrades } from "../data";
import type { SavedTrade, JournalReview } from "../types";

const gradeColors: Record<string, string> = {
  "A": "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10",
  "A-": "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10",
  "B+": "bg-amber-50 text-amber-700 dark:bg-amber-50/10",
  "B": "bg-amber-50 text-amber-700 dark:bg-amber-50/10",
  "B-": "bg-amber-50 text-amber-700 dark:bg-amber-50/10",
  "C+": "bg-red-50 text-red-600 dark:bg-red-50/10",
  "C": "bg-red-50 text-red-600 dark:bg-red-50/10",
};

const qualityColors: Record<string, string> = {
  Good: "text-emerald-600",
  Fair: "text-amber-600",
  Poor: "text-red-500",
  Low: "text-emerald-600",
  Medium: "text-amber-600",
  High: "text-red-500",
};

const CORRELATIONS: Record<string, Record<string, number>> = {
  "EUR/USD": { "GBP/USD": 0.88, "USD/CHF": -0.92, "USD/JPY": 0.15, "AUD/USD": 0.75, "USD/CAD": -0.65, "XAU/USD": 0.60 },
  "GBP/USD": { "EUR/USD": 0.88, "USD/CHF": -0.82, "USD/JPY": 0.05, "AUD/USD": 0.68, "USD/CAD": -0.58, "XAU/USD": 0.52 },
  "USD/CHF": { "EUR/USD": -0.92, "GBP/USD": -0.82, "USD/JPY": 0.28, "AUD/USD": -0.72, "USD/CAD": 0.62, "XAU/USD": -0.55 },
  "USD/JPY": { "EUR/USD": 0.15, "GBP/USD": 0.05, "USD/CHF": 0.28, "AUD/USD": -0.08, "USD/CAD": 0.18, "XAU/USD": -0.32 },
  "AUD/USD": { "EUR/USD": 0.75, "GBP/USD": 0.68, "USD/CHF": -0.72, "USD/JPY": -0.08, "USD/CAD": -0.78, "XAU/USD": 0.58 },
  "USD/CAD": { "EUR/USD": -0.65, "GBP/USD": -0.58, "USD/CHF": 0.62, "USD/JPY": 0.18, "AUD/USD": -0.78, "XAU/USD": -0.45 },
  "XAU/USD": { "EUR/USD": 0.60, "GBP/USD": 0.52, "USD/CHF": -0.55, "USD/JPY": -0.32, "AUD/USD": 0.58, "USD/CAD": -0.45 },
};

export default function JournalPage() {
  const [form, setForm] = useState({
    pair: "XAU/USD",
    entry: "",
    stopLoss: "",
    takeProfit: "",
    reason: "",
  });
  const [review, setReview] = useState<JournalReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedTrades, setSavedTrades] = useState<SavedTrade[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  const checkCorrelationWarnings = () => {
    const selected = form.pair;
    const openTrades = savedTrades.filter(t => t.status === "Open");
    if (openTrades.length === 0) return null;

    const warnings: Array<{ pair: string; correlation: number }> = [];

    openTrades.forEach(t => {
      if (t.pair === selected) {
        warnings.push({ pair: t.pair, correlation: 1.0 });
        return;
      }
      const cor = CORRELATIONS[selected]?.[t.pair] ?? CORRELATIONS[t.pair]?.[selected] ?? 0;
      if (Math.abs(cor) >= 0.75) {
        warnings.push({ pair: t.pair, correlation: cor });
      }
    });

    return warnings.length > 0 ? warnings : null;
  };

  const correlationWarnings = checkCorrelationWarnings();

  useEffect(() => {
    const saved = localStorage.getItem("macromind_journal");
    if (saved) {
      setTimeout(() => {
        setSavedTrades(JSON.parse(saved));
      }, 0);
    } else {
      const initial: SavedTrade[] = fallbackTrades.map((t, idx) => ({
        id: `initial-${idx}-${Date.now()}`,
        pair: t.pair,
        entry: t.entry,
        stop: t.stop,
        target: t.target,
        reason: t.setup,
        grade: t.grade,
        riskReward: "2.1",
        status: "Open",
        createdAt: new Date(Date.now() - (idx * 24 * 60 * 60 * 1000)).toISOString(),
      }));
      setTimeout(() => {
        setSavedTrades(initial);
      }, 0);
      localStorage.setItem("macromind_journal", JSON.stringify(initial));
    }
    setTimeout(() => {
      setHasMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem("macromind_journal", JSON.stringify(savedTrades));
    }
  }, [savedTrades, hasMounted]);

  function deleteTrade(id: string) {
    if (confirm("Are you sure you want to delete this trade from your journal?")) {
      setSavedTrades(prev => prev.filter(t => t.id !== id));
    }
  }

  function toggleTradeStatus(id: string) {
    setSavedTrades(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === "Open" ? "Closed" : "Open",
        };
      }
      return t;
    }));
  }

  async function submitTrade() {
    setLoading(true);
    setReview(null);

    try {
      const res = await fetch("/api/journal-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: form.pair,
          entry: form.entry,
          stopLoss: form.stopLoss,
          takeProfit: form.takeProfit,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      setReview(data);

      // Add to saved trades if AI review succeeded
      if (data.grade && !data.error) {
        const newTrade: SavedTrade = {
          id: `trade-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
          pair: form.pair,
          entry: form.entry || "—",
          stop: form.stopLoss || "—",
          target: form.takeProfit || "—",
          reason: form.reason || "—",
          grade: data.grade,
          riskReward: data.riskReward ?? "—",
          status: "Open",
          createdAt: new Date().toISOString(),
        };
        setSavedTrades(prev => [newTrade, ...prev]);
      }
    } catch {
      setReview({ error: "Could not connect to the AI reviewer." });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ pair: "XAU/USD", entry: "", stopLoss: "", takeProfit: "", reason: "" });
    setReview(null);
  }

  return (
    <PageShell title="AI Trade Journal" label="Journal" action="Add Trade">
      {/* Entry + AI review */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        {/* Form */}
        <Card className="animate-fade-up">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New journal entry</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">Review your trade logic</h2>

          {/* Pair selector */}
          <label className="mt-5 block">
            <span className="text-xs font-semibold text-slate-400">Pair</span>
            <select
              className="mt-1.5 w-full rounded-xl border border-[var(--card-border)] bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--card)] dark:bg-white/[0.02] dark:focus:bg-white/[0.04]"
              value={form.pair}
              onChange={(e) => setForm(f => ({ ...f, pair: e.target.value }))}
            >
              <option>XAU/USD</option>
              <option>XAG/USD</option>
              <option>EUR/USD</option>
              <option>GBP/USD</option>
              <option>USD/JPY</option>
              <option>USD/CHF</option>
              <option>AUD/USD</option>
              <option>USD/CAD</option>
              <option>BTC/USD</option>
              <option>ETH/USD</option>
            </select>
          </label>

          {/* Entry / Stop / Target */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {([
              ["entry", "Entry"],
              ["stopLoss", "Stop loss"],
              ["takeProfit", "Take profit"],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold text-slate-400">{label}</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[var(--card-border)] bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--card)] dark:bg-white/[0.02] dark:focus:bg-white/[0.04]"
                  placeholder="0.00"
                  value={form[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>

          {/* Reason */}
          <label className="mt-4 block">
            <span className="text-xs font-semibold text-slate-400">Trade reason</span>
            <textarea
              className="mt-1.5 h-24 w-full resize-none rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 text-sm outline-none transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--card)] dark:bg-white/[0.02] dark:focus:bg-white/[0.04]"
              placeholder="Why did you take this trade? What's your logic?"
              value={form.reason}
              onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </label>

          {/* Correlation Warnings */}
          {correlationWarnings ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-600 dark:text-amber-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                </svg>
                <span>Correlation Risk Warning</span>
              </div>
              <p className="mt-1 leading-5">
                You are about to trade <strong>{form.pair}</strong>. You have open positions in the following correlated currency pairs:
              </p>
              <ul className="mt-1 list-disc pl-4 space-y-1">
                {correlationWarnings.map((w, idx) => (
                  <li key={`${w.pair}-${idx}`}>
                    <strong>{w.pair}</strong> (Correlation: <span className="font-semibold">{w.correlation >= 0 ? "+" : ""}{w.correlation.toFixed(2)}</span>)
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-semibold text-amber-700 dark:text-amber-400">
                ⚠️ Double exposure risk! Consider halving your lot size or skipping this setup to manage risk.
              </p>
            </div>
          ) : null}

          {/* Buttons */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={submitTrade}
              disabled={loading || !form.entry || !form.stopLoss || !form.takeProfit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  AI reviewing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
                  </svg>
                  Get AI Review
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              className="rounded-xl border border-[var(--card-border)] px-5 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-white/5"
            >
              Clear
            </button>
          </div>
        </Card>

        {/* AI Review */}
        <Card className="animate-fade-up-delay-2">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI review</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">Trade quality score</h2>

          {review?.error ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-50/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {review.error}
            </div>
          ) : null}

          {/* Loading state */}
          {loading && !review ? (
            <div className="mt-5 space-y-4">
              <div className="h-32 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
                ))}
              </div>
            </div>
          ) : null}

          {/* AI Result */}
          {review && !review.error && review.grade ? (
            <>
              {/* Score panel */}
              <div className="mt-5 rounded-xl bg-[var(--foreground)] p-6 text-[var(--background)] dark:bg-white/[0.04] dark:text-[var(--foreground)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Overall grade</p>
                    <p className="mt-1 text-4xl font-bold">{review.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Risk reward</p>
                    <p className="mt-1 text-2xl font-bold">{review.riskReward ?? "—"}R</p>
                  </div>
                </div>
                {review.summary ? (
                  <p className="mt-4 text-sm leading-6 opacity-70">{review.summary}</p>
                ) : null}
              </div>

              {/* Sub-scores */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Plan", value: review.planQuality },
                  { label: "News risk", value: review.newsRisk },
                  { label: "Emotion", value: review.emotionRisk },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className={`mt-1 text-sm font-bold ${qualityColors[item.value ?? ""] ?? "text-slate-600"}`}>
                      {item.value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {review.strengths ? (
                <div className="mt-4 rounded-xl bg-emerald-50/50 p-4 dark:bg-emerald-50/10">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✓ Strengths</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{review.strengths}</p>
                </div>
              ) : null}

              {/* Suggestions */}
              {review.suggestions ? (
                <div className="mt-3 rounded-xl bg-amber-50/50 p-4 dark:bg-amber-50/10">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">⚡ Suggestions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{review.suggestions}</p>
                </div>
              ) : null}
            </>
          ) : null}

          {/* Empty state */}
          {!loading && !review ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--card-border)] p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-400">Fill in your trade details and get an AI review</p>
            </div>
          ) : null}
        </Card>
      </section>

      {/* Saved trades */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Recent trades ({savedTrades.length})</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {savedTrades.map((trade, i) => (
            <Card key={trade.id} className={`animate-fade-up-delay-${Math.min(i + 1, 4)} relative`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-slate-400">
                      {trade.pair}
                    </span>
                    <button
                      onClick={() => toggleTradeStatus(trade.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-200 ${
                        trade.status === "Open"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10 dark:text-emerald-400 hover:bg-emerald-100/50"
                          : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200/50"
                      }`}
                      title="Click to toggle status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${trade.status === "Open" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {trade.status === "Open" ? "Active" : "Closed"}
                    </button>
                    {trade.createdAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(trade.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-6">{trade.reason}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${gradeColors[trade.grade] ?? gradeColors["C"]}`}>
                    {trade.grade}
                  </span>
                  <button
                    onClick={() => deleteTrade(trade.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete trade"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  ["Entry", trade.entry],
                  ["Stop", trade.stop],
                  ["Target", trade.target],
                  ["R:R", `${trade.riskReward}R`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50/50 p-3 dark:bg-white/[0.02]">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
