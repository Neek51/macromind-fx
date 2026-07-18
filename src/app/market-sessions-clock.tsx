"use client";

import { useEffect, useState } from "react";

const SESSIONS = [
  { name: "Tokyo", flag: "https://s3-symbol-logo.tradingview.com/country/JP.svg", start: 0, end: 9 },
  { name: "London", flag: "https://s3-symbol-logo.tradingview.com/country/GB.svg", start: 8, end: 17 },
  { name: "New York", flag: "https://s3-symbol-logo.tradingview.com/country/US.svg", start: 13, end: 22 },
];

function getSessionStatus(start: number, end: number, current: number) {
  const isOpen = current >= start && current < end;
  if (isOpen) {
    const hoursLeft = end - current;
    const h = Math.floor(hoursLeft);
    const m = Math.floor((hoursLeft - h) * 60);
    return { isOpen, label: `Closes in ${h}h ${m}m` };
  }
  let hoursUntil = start - current;
  if (hoursUntil < 0) hoursUntil += 24;
  const h = Math.floor(hoursUntil);
  const m = Math.floor((hoursUntil - h) * 60);
  return { isOpen, label: `Opens in ${h}h ${m}m` };
}

export function MarketSessionsClock() {
  const [sessionTime, setSessionTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setSessionTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentUTCHour = sessionTime.getUTCHours() + sessionTime.getUTCMinutes() / 60;
  const timeMarkerLeft = (currentUTCHour / 24) * 100;
  const utcTimeStr = sessionTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const localTimeStr = sessionTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const openCount = SESSIONS.filter((s) => currentUTCHour >= s.start && currentUTCHour < s.end).length;

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trading Hours</p>
          <h2 className="text-xl font-bold">Market Sessions</h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums">{utcTimeStr} <span className="text-xs font-medium text-slate-400">UTC</span></p>
          <p className="text-xs text-slate-500 tabular-nums">{localTimeStr} local</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SESSIONS.map((s) => {
          const status = getSessionStatus(s.start, s.end, currentUTCHour);
          return (
            <div
              key={s.name}
              className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                status.isOpen
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                  : "border-[var(--card-border)] bg-slate-50/40 dark:bg-white/[0.02]"
              }`}
            >
              <img src={s.flag} alt={s.name} width={28} height={28} className="shrink-0 rounded-full" style={{ width: 28, height: 28 }} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold">{s.name}</p>
                  {status.isOpen && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                </div>
                <p className={`text-xs ${status.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                  {status.isOpen ? "Open" : "Closed"} • {status.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="relative h-8 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
          <div className="absolute inset-y-0 bg-rose-400/40 dark:bg-rose-500/20" style={{ left: "0%", width: `${(9 / 24) * 100}%` }} />
          <div className="absolute inset-y-0 bg-blue-400/40 dark:bg-blue-500/20" style={{ left: `${(8 / 24) * 100}%`, width: `${(9 / 24) * 100}%` }} />
          <div className="absolute inset-y-0 bg-emerald-400/40 dark:bg-emerald-500/20" style={{ left: `${(13 / 24) * 100}%`, width: `${(9 / 24) * 100}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-[var(--accent)]" style={{ left: `${timeMarkerLeft}%` }}>
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {openCount > 0
          ? `${openCount} session${openCount > 1 ? "s" : ""} currently open. Overlap periods have highest volatility.`
          : "All sessions closed. Markets are quiet."}
      </p>
    </>
  );
}
