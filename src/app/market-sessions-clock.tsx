"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatPrice } from "./asset-icon";

const SESSIONS = [
  { name: "Tokyo", flag: "https://s3-symbol-logo.tradingview.com/country/JP.svg", start: 0, end: 9, color: "bg-rose-400/40 dark:bg-rose-500/20" },
  { name: "London", flag: "https://s3-symbol-logo.tradingview.com/country/GB.svg", start: 8, end: 17, color: "bg-blue-400/40 dark:bg-blue-500/20" },
  { name: "New York", flag: "https://s3-symbol-logo.tradingview.com/country/US.svg", start: 13, end: 22, color: "bg-emerald-400/40 dark:bg-emerald-500/20" },
];

type HourlyCandle = { time: number; open: number; high: number; low: number; close: number };
type SessionMetric = { name: string; high: number; low: number; range: number; state: "Active" | "Complete" | "Upcoming"; sweep: string };

function isForexWeekend(date: Date) {
  const day = date.getUTCDay();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  return day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 22);
}

function sessionStatus(start: number, end: number, currentHour: number, marketClosed: boolean, isBitcoin: boolean) {
  const active = currentHour >= start && currentHour < end;
  if (isBitcoin) return { active, label: active ? "Active liquidity window" : "24/7 market · window inactive" };
  if (marketClosed) return { active: false, label: "Closed for weekend" };
  if (active) return { active, label: `Closes in ${Math.floor(end - currentHour)}h ${Math.floor(((end - currentHour) % 1) * 60)}m` };
  let until = start - currentHour;
  if (until < 0) until += 24;
  return { active: false, label: `Opens in ${Math.floor(until)}h ${Math.floor((until % 1) * 60)}m` };
}

function latestTradingDay(candles: HourlyCandle[]) {
  return candles.reduce((latest, candle) => Math.max(latest, Math.floor(candle.time / 86400)), 0);
}

function calculateSessionMetrics(candles: HourlyCandle[], now: Date): SessionMetric[] {
  if (!candles.length) return [];
  const day = latestTradingDay(candles);
  const currentDay = Math.floor(now.getTime() / 1000 / 86400);
  const currentHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  let priorHigh: number | null = null;
  let priorLow: number | null = null;

  return SESSIONS.map((session) => {
    const values = candles.filter((candle) => {
      const date = new Date(candle.time * 1000);
      return Math.floor(candle.time / 86400) === day && date.getUTCHours() >= session.start && date.getUTCHours() < session.end;
    });
    const high = values.length ? Math.max(...values.map((candle) => candle.high)) : 0;
    const low = values.length ? Math.min(...values.map((candle) => candle.low)) : 0;
    const state = day < currentDay || currentHour >= session.end ? "Complete" : currentHour >= session.start ? "Active" : "Upcoming";
    const sweep = priorHigh !== null && values.length
      ? high > priorHigh && low < priorLow! ? "Swept both prior-session boundaries"
        : high > priorHigh ? "Swept prior-session high"
          : low < priorLow! ? "Swept prior-session low"
            : "Inside prior-session range"
      : "No prior-session comparison";
    if (values.length) { priorHigh = high; priorLow = low; }
    return { name: session.name, high, low, range: high && low ? high - low : 0, state, sweep };
  });
}

export function MarketSessionsClock({ symbol }: { symbol: string }) {
  const [sessionTime, setSessionTime] = useState<Date | null>(null);
  const [candles, setCandles] = useState<HourlyCandle[]>([]);
  const [dataAvailable, setDataAvailable] = useState(true);

  useEffect(() => {
    const initialize = setTimeout(() => setSessionTime(new Date()), 0);
    const interval = setInterval(() => setSessionTime(new Date()), 60000);
    return () => { clearTimeout(initialize); clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=1mo&interval=1h`)
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return;
        setCandles(json.data ?? []);
        setDataAvailable(Boolean(json.data?.length));
      })
      .catch(() => { if (!cancelled) { setCandles([]); setDataAvailable(false); } });
    return () => { cancelled = true; };
  }, [symbol]);

  const now = sessionTime ?? new Date(0);
  const isBitcoin = symbol === "BTC/USD";
  const marketClosed = !isBitcoin && isForexWeekend(now);
  const currentHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const metrics = calculateSessionMetrics(candles, now);
  const marker = currentHour / 24 * 100;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trading Hours</p><h2 className="text-xl font-bold">Market Sessions</h2><p className="mt-1 text-xs text-slate-500">{isBitcoin ? "Bitcoin trades 24/7; sessions show global liquidity windows." : marketClosed ? "Gold/forex market is closed for the weekend." : "Gold/forex session schedule in UTC."}</p></div>
        <div className="text-right"><p className="text-sm font-bold tabular-nums">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} <span className="text-xs font-medium text-slate-400">UTC</span></p><p className="text-xs text-slate-500">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} local</p></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SESSIONS.map((session) => {
          const status = sessionStatus(session.start, session.end, currentHour, marketClosed, isBitcoin);
          return <div key={session.name} className={`flex items-center gap-3 rounded-xl border p-3.5 ${status.active ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5" : "border-[var(--card-border)] bg-slate-50/40 dark:bg-white/[0.02]"}`}><Image src={session.flag} alt={session.name} width={28} height={28} unoptimized className="rounded-full" /><div><div className="flex items-center gap-1.5"><p className="text-sm font-bold">{session.name}</p>{status.active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}</div><p className={`text-xs ${status.active ? "text-emerald-600" : "text-slate-400"}`}>{status.label}</p></div></div>;
        })}
      </div>

      <div className="mt-5"><div className="relative h-8 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">{SESSIONS.map((session) => <div key={session.name} className={`absolute inset-y-0 ${session.color}`} style={{ left: `${session.start / 24 * 100}%`, width: `${(session.end - session.start) / 24 * 100}%` }} />)}<div className="absolute inset-y-0 w-0.5 bg-[var(--accent)]" style={{ left: `${marker}%` }} /></div><div className="mt-1.5 flex justify-between text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>

      <div className="mt-5 border-t border-[var(--card-border)] pt-4">
        <div className="flex items-center justify-between gap-3"><div><h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Session Analysis</h4><p className="mt-1 text-xs text-slate-400">Hourly candle high, low, range, and prior-session sweep for the latest available trading day.</p></div><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold dark:bg-white/5">{symbol === "XAU/USD" ? "Gold futures structure proxy" : "Spot market candles"}</span></div>
        {dataAvailable ? <div className="mt-3 grid gap-3 sm:grid-cols-3">{metrics.map((metric) => <div key={metric.name} className="rounded-xl border border-[var(--card-border)] p-3.5"><div className="flex items-center justify-between"><p className="font-bold">{metric.name}</p><span className="text-[10px] font-bold uppercase text-slate-400">{metric.state}</span></div>{metric.high ? <><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><p className="text-slate-400">High</p><p className="font-bold">{formatPrice(symbol, metric.high)}</p></div><div><p className="text-slate-400">Low</p><p className="font-bold">{formatPrice(symbol, metric.low)}</p></div></div><p className="mt-2 text-xs"><span className="text-slate-400">Range:</span> <span className="font-bold">{formatPrice(symbol, metric.range)}</span></p><p className="mt-2 text-xs text-slate-500">{metric.sweep}</p></> : <p className="mt-3 text-xs text-slate-400">No candles available for this window.</p>}</div>)}</div> : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Session candle data is unavailable. No live range claim is being shown.</p>}
      </div>
    </>
  );
}
