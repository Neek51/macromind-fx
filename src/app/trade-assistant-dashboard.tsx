"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssetIcon, formatPrice } from "./asset-icon";
import { Card, PageShell } from "./components";
import { MarketSessionsClock } from "./market-sessions-clock";
import { calculateMarketContext, calculateRiskPlan, evaluateTradeSafety, type MarketContext } from "./lib/trade-assistant";
import type { CalendarEvent, LiveAsset } from "./types";
import type { Candle } from "./lib/backtest";

const INSTRUMENTS = [
  { symbol: "XAU/USD", label: "Gold Spot", historyNote: "Levels use COMEX Gold futures as a clearly labelled market-structure proxy." },
  { symbol: "BTC/USD", label: "Bitcoin Spot", historyNote: "Spot reference from Yahoo Finance." },
  { symbol: "EUR/USD", label: "EUR/USD Spot", historyNote: "Spot forex reference from Yahoo Finance." },
];

const emptyContext: MarketContext = {
  trend: "unavailable", atr: null, previousDayHigh: null, previousDayLow: null,
  previousWeekHigh: null, previousWeekLow: null, dailyOpen: null,
  nearestSupport: null, nearestResistance: null,
};

export function TradeAssistantDashboard() {
  const [symbol, setSymbol] = useState("XAU/USD");
  const [assets, setAssets] = useState<LiveAsset[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [context, setContext] = useState<MarketContext>(emptyContext);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [accountSize, setAccountSize] = useState("1000");
  const [riskPercent, setRiskPercent] = useState("0.5");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [entryCopied, setEntryCopied] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const entryRef = useRef<HTMLInputElement>(null);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [priceRes, calendarRes] = await Promise.all([fetch("/api/prices"), fetch("/api/calendar")]);
      const [priceJson, calendarJson] = await Promise.all([priceRes.json(), calendarRes.json()]);
      setAssets(priceJson.data ?? []);
      setEvents(calendarJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
      void loadCoreData();
    }, 0);
    const refresh = setInterval(loadCoreData, 60000);
    const clock = setInterval(() => setNow(Date.now()), 60000);
    return () => { clearTimeout(timer); clearInterval(refresh); clearInterval(clock); };
  }, [loadCoreData]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => setAnalysisLoading(true), 0);
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=3mo&interval=1d`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const candles = (json.data ?? []) as Candle[];
        const asset = assets.find((item) => item.symbol === symbol);
        setContext(asset ? calculateMarketContext(candles, asset.price) : emptyContext);
      })
      .catch(() => { if (!cancelled) setContext(emptyContext); })
      .finally(() => { if (!cancelled) setAnalysisLoading(false); });
    return () => { cancelled = true; clearTimeout(timer); };
  }, [symbol, assets]);

  const asset = assets.find((item) => item.symbol === symbol);
  const instrument = INSTRUMENTS.find((item) => item.symbol === symbol) ?? INSTRUMENTS[0];
  const effectiveNow = now ?? 0;
  const safety = evaluateTradeSafety({ symbol, asset, events, now: effectiveNow });
  const nextEvent = events
    .filter((event) => event.impact === "High" && event.country === "USD" && new Date(event.date).getTime() > effectiveNow)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const riskPlan = useMemo(() => calculateRiskPlan({
    accountSize: Number(accountSize), riskPercent: Number(riskPercent), entry: Number(entry), stop: Number(stop), target: Number(target),
  }), [accountSize, riskPercent, entry, stop, target]);

  const setupChecks = [
    { label: "Verified price feed is available", pass: Boolean(asset && !asset.isFallback) },
    { label: "No high-impact event inside the safety window", pass: safety.verdict !== "NO TRADE" },
    { label: "Daily trend is not neutral/unavailable", pass: context.trend === "bullish" || context.trend === "bearish" },
    { label: "Entry confirmation observed on your chart", pass: confirmation },
    { label: "Risk plan has at least 1:2 reward", pass: Boolean(riskPlan && riskPlan.riskReward >= 2) },
  ];
  const setupReady = setupChecks.every((check) => check.pass);

  const useCurrentPrice = () => {
    if (!asset) return;
    setEntry(String(asset.price));
    setEntryCopied(true);
    requestAnimationFrame(() => {
      entryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      entryRef.current?.focus();
      entryRef.current?.select();
    });
    window.setTimeout(() => setEntryCopied(false), 2500);
  };

  return (
    <PageShell title="Trade Safety & Setup Assistant" label="Focused trading workflow">
      <section className="grid gap-3 sm:grid-cols-3">
        {INSTRUMENTS.map((item) => (
          <button key={item.symbol} onClick={() => setSymbol(item.symbol)} className={`rounded-2xl border p-4 text-left transition-colors ${symbol === item.symbol ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--card-border)] bg-[var(--card)]"}`}>
            <div className="flex items-center gap-3"><AssetIcon symbol={item.symbol} size={34} /><div><p className="font-bold">{item.label}</p><p className="text-xs text-slate-500">{item.symbol}</p></div></div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className={safety.verdict === "NO TRADE" ? "border-red-200 dark:border-red-500/30" : "border-emerald-200 dark:border-emerald-500/30"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trade Safety Gate</p><h2 className={`mt-1 text-3xl font-black ${safety.verdict === "NO TRADE" ? "text-red-500" : "text-emerald-600"}`}>{loading ? "CHECKING" : safety.verdict}</h2></div>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-white/5">30m before / 15m after news</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{safety.reason}</p>
          {nextEvent ? <div className="mt-4 rounded-xl border border-[var(--card-border)] p-4"><p className="text-xs font-bold uppercase text-slate-400">Next verified USD event</p><p className="mt-1 font-bold">{nextEvent.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(nextEvent.date).toLocaleString()} · {nextEvent.source}</p></div> : null}
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified instrument</p>
          <div className="mt-3 flex items-center gap-3"><AssetIcon symbol={symbol} size={42} /><div><h2 className="text-xl font-bold">{instrument.label}</h2><p className="text-xs text-slate-500">Spot reference · not a broker execution quote</p></div></div>
          <p className="mt-3 text-3xl font-black tabular-nums">{asset ? formatPrice(symbol, asset.price) : "Unavailable"}</p>
          <button type="button" disabled={!asset} className="mt-4 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={useCurrentPrice}>{entryCopied ? "Entry filled — review below" : "Use current price as entry"}</button>
        </Card>
      </section>

      <section>
        <Card>
          <MarketSessionsClock symbol={symbol} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Objective market structure</p><h2 className="mt-1 text-xl font-bold">Daily Levels & Trend</h2><p className="mt-1 text-xs text-slate-500">{instrument.historyNote}</p></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Trend", analysisLoading ? "Loading" : context.trend], ["Daily open", context.dailyOpen], ["ATR (14)", context.atr],
              ["Prev day high", context.previousDayHigh], ["Prev day low", context.previousDayLow], ["Nearest support", context.nearestSupport],
              ["Nearest resistance", context.nearestResistance], ["Prev week high", context.previousWeekHigh], ["Prev week low", context.previousWeekLow],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[var(--card-border)] p-3"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-bold capitalize">{typeof value === "number" ? formatPrice(symbol, value) : value ?? "—"}</p></div>)}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Beginner setup checklist</p><h2 className="mt-1 text-xl font-bold">Wait for confirmation</h2>
          <div className="mt-5 space-y-2.5">
            {setupChecks.map((check) => (
              <div key={check.label} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-slate-50/40 px-3 py-2.5 dark:bg-white/[0.02]">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${check.pass ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300" : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-300/50 dark:text-amber-200"}`} aria-hidden="true">{check.pass ? "✓" : "!"}</span>
                <span className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-200">{check.label}</span>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${check.pass ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>{check.pass ? "Pass" : "Wait"}</span>
              </div>
            ))}
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--card-border)] p-3 text-sm"><input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} />I saw a valid confirmation candle on my broker chart</label>
          <div className={`mt-5 rounded-xl border p-4 ${setupReady ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/[0.06] text-amber-800 dark:text-amber-200"}`}><p className="font-bold">{setupReady ? "SETUP CHECKS PASSED" : "WAIT"}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{setupReady ? "Checks passed; verify broker spread and execution price before acting." : "One or more safety or confirmation conditions are missing."}</p></div>
        </Card>
      </section>

      <section>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Broker-safe risk plan</p><h2 className="mt-1 text-xl font-bold">Know the maximum loss before entry</h2>
          <p className="mt-1 text-xs text-slate-500">No lot-size estimate is shown without your broker contract specifications.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="text-xs font-bold text-slate-500">Account ($)<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm" type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Risk %<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm" type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Direction<select className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value as "buy" | "sell")}><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
            <label className="text-xs font-bold text-slate-500">Entry<input ref={entryRef} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm" type="number" value={entry} onChange={(e) => setEntry(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Stop loss<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm" type="number" value={stop} onChange={(e) => setStop(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Target<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          </div>
          {riskPlan ? <div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-500">Maximum loss</p><p className="text-xl font-black">${riskPlan.riskAmount.toFixed(2)}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-500">Stop distance</p><p className="text-xl font-black">{riskPlan.stopDistance.toFixed(4)}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-500">Risk / Reward</p><p className="text-xl font-black">1:{riskPlan.riskReward.toFixed(2)}</p></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-500">Risk status</p><p className="text-sm font-bold">{riskPlan.riskWarning ?? riskPlan.rewardWarning ?? "Within beginner guidelines"}</p></div></div> : <p className="mt-5 text-sm text-slate-500">Enter a valid stop and target to calculate risk.</p>}
        </Card>
      </section>

      <p className="text-center text-xs text-slate-400">Safety and education tool only. Always verify prices, spreads, and contract specifications on your broker platform.</p>
    </PageShell>
  );
}
