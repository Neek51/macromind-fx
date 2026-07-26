"use client";

import { useEffect, useState } from "react";
import { Card, PageShell } from "../components";

type CalendarEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
  source?: string;
  sourceUrl?: string;
  group?: string;
  status?: "scheduled" | "released";
};

const flagMap: Record<string, string> = {
  USD: "https://s3-symbol-logo.tradingview.com/country/US.svg",
  EUR: "https://s3-symbol-logo.tradingview.com/country/EU.svg",
  GBP: "https://s3-symbol-logo.tradingview.com/country/GB.svg",
  JPY: "https://s3-symbol-logo.tradingview.com/country/JP.svg",
  CAD: "https://s3-symbol-logo.tradingview.com/country/CA.svg",
  AUD: "https://s3-symbol-logo.tradingview.com/country/AU.svg",
  CHF: "https://s3-symbol-logo.tradingview.com/country/CH.svg",
  NZD: "https://s3-symbol-logo.tradingview.com/country/NZ.svg",
  CNY: "https://s3-symbol-logo.tradingview.com/country/CN.svg",
};

function renderImpactBadge(impact: string) {
  if (impact === "High") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50/80 px-3 py-0.5 text-sm font-bold text-rose-600 border border-rose-100/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 relative flex">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
        </span>
        {impact}
      </span>
    );
  }
  if (impact === "Medium") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 px-3 py-0.5 text-sm font-bold text-amber-700 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
        {impact}
      </span>
    );
  }
  if (impact === "Low") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/80 px-3 py-0.5 text-sm font-semibold text-slate-600 border border-slate-100/50 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
        {impact}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/80 px-3 py-0.5 text-sm font-semibold text-sky-600 border border-sky-100/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
      {impact}
    </span>
  );
}

type PlaybookScenario = {
  triggerCondition: string;
  bias: string;
  marketReaction: string;
  tradePlan: {
    action: string;
    trigger: string;
    stopLoss: string;
    takeProfit: string;
  };
};

type Playbook = {
  importance: string;
  primaryAsset: string;
  currentPrice: string;
  scenarios: PlaybookScenario[];
  provider?: string;
};

function formatTime(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getFriendlyDayName(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

const countryAssetMap: Record<string, string> = {
  USD: "XAU/USD",
  EUR: "EUR/USD",
  GBP: "GBP/USD",
  JPY: "USD/JPY",
  CAD: "USD/CAD",
  AUD: "AUD/USD",
  CHF: "USD/CHF",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "high" | "medium" | "released">("upcoming");
  const [calendarAvailable, setCalendarAvailable] = useState(true);

  // Playbook states
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/calendar");
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setEvents(json.data);
          setCalendarAvailable(true);
        } else {
          setCalendarAvailable(false);
        }
      } catch {
        setCalendarAvailable(false);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  // Fetch prices once on load to feed playbook calculations
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        if (json.data) {
          const mapping: Record<string, number> = {};
          json.data.forEach((item: { symbol: string; price: number }) => {
            mapping[item.symbol] = item.price;
          });
          setLivePrices(mapping);
        }
      } catch {}
    }
    fetchPrices();
  }, []);

  async function loadPlaybook(event: CalendarEvent) {
    setSelectedEvent(event);
    setPlaybook(null);
    setPlaybookLoading(true);
    setPlaybookError(null);

    const asset = countryAssetMap[event.country] ?? "XAU/USD";
    const currentPrice = livePrices[asset] ?? null;

    try {
      const res = await fetch("/api/calendar/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: event.title,
          country: event.country,
          forecast: event.forecast,
          previous: event.previous,
          symbol: asset,
          currentPrice: currentPrice,
        }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const json = await res.json();
      if (json.data) {
        setPlaybook(json.data);
      } else {
        setPlaybookError(json.error ?? "Failed to generate playbook.");
      }
    } catch {
      setPlaybookError("Failed to fetch. Check API credentials or connection.");
    } finally {
      setPlaybookLoading(false);
    }
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const threshold = currentTime ? currentTime - 30 * 60 * 1000 : 0;

  const filtered = sortedEvents.filter(e => {
    const isPast = currentTime ? new Date(e.date).getTime() < currentTime - 30 * 60 * 1000 : false;
    if (filter === "released") {
      return isPast;
    }
    if (isPast) return false;
    if (filter === "high") return e.impact === "High";
    if (filter === "medium") return e.impact === "High" || e.impact === "Medium";
    return true; // filter === "upcoming"
  });

  const totalUpcoming = sortedEvents.filter(e => new Date(e.date).getTime() >= threshold).length;

  const highUpcomingCount = sortedEvents.filter(e => {
    const isPast = new Date(e.date).getTime() < threshold;
    return !isPast && e.impact === "High";
  }).length;

  const mediumUpcomingCount = sortedEvents.filter(e => {
    const isPast = new Date(e.date).getTime() < threshold;
    return !isPast && (e.impact === "High" || e.impact === "Medium");
  }).length;

  const releasedCount = sortedEvents.filter(e => new Date(e.date).getTime() < threshold).length;

  return (
    <PageShell title="Economic Calendar" label="Calendar" action="Create Alert" actionHref="/alerts">
      <section className="space-y-6">
        {!calendarAvailable && !loading ? (
          <Card className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="text-sm font-semibold">Verified calendar data is temporarily unavailable. Do not use this calendar for live trading decisions.</p>
          </Card>
        ) : null}
        {/* Events table */}
        <Card className="animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {filter === "released"
                  ? "Released events"
                  : "Verified scheduled events"}
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {filter === "released" ? "Weekly releases history" : "Macro releases to watch"}
              </h2>
            </div>
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-50/10">
              {highUpcomingCount} high impact upcoming
            </span>
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {([
              ["upcoming", `Upcoming (${totalUpcoming})`],
              ["high", `High (${highUpcomingCount})`],
              ["medium", `High+Med (${mediumUpcomingCount})`],
              ["released", `Released (${releasedCount})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  filter === key
                    ? "bg-[var(--accent)] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200/60 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="mt-6 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-6 hidden overflow-hidden rounded-xl border border-[var(--card-border)] md:block">
                <div className="grid grid-cols-[1.1fr_0.9fr_2.1fr_0.9fr_0.9fr_1fr_0.9fr] gap-4 border-b border-[var(--card-border)] bg-slate-50/50 px-5 py-4 text-sm font-bold uppercase tracking-wider text-slate-400 dark:bg-white/[0.02]">
                  <span>Time</span>
                  <span>Currency</span>
                  <span>Event</span>
                  <span>Forecast</span>
                  <span>Previous</span>
                  <span>Impact</span>
                  <span className="text-right">Playbook</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                      <p className="text-sm font-semibold">
                        {filter === "released" 
                          ? "No released events yet this week." 
                          : filter === "high"
                          ? "No upcoming High impact events scheduled."
                          : filter === "medium"
                          ? "No upcoming High or Medium impact events scheduled."
                          : "No upcoming events scheduled for this week."}
                      </p>
                      <p className="text-xs mt-1 max-w-[280px] mx-auto leading-relaxed">
                        {filter === "released" 
                          ? "Check back later as scheduled events occur." 
                          : "Try adjusting your filters or check the Released tab."}
                      </p>
                    </div>
                  ) : (
                    (() => {
                      let lastDateStr = "";
                      return filtered.map((event, i) => {
                        const isPast = currentTime ? new Date(event.date).getTime() < currentTime - 30 * 60 * 1000 : false;
                        const dateStr = formatDate(event.date);
                        const showDayHeader = dateStr !== lastDateStr;
                        if (showDayHeader) {
                          lastDateStr = dateStr;
                        }

                        return (
                          <div key={`${event.title}-${i}`}>
                            {showDayHeader && (
                              <div className="sticky top-0 z-5 bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md px-5 py-3 border-b border-[var(--card-border)] text-sm font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent)] shrink-0">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {getFriendlyDayName(event.date)}
                              </div>
                            )}
                            <div
                              className={`grid grid-cols-[1.1fr_0.9fr_2.1fr_0.9fr_0.9fr_1fr_0.9fr] items-center gap-4 border-b border-[var(--card-border)] px-5 py-4.5 transition-all duration-200 last:border-b-0 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] hover:translate-x-0.5 cursor-pointer ${
                                i % 2 === 1 ? "bg-slate-50/20 dark:bg-white/[0.01]" : ""
                              } ${isPast ? "opacity-60" : ""}`}
                            >
                              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatTime(event.date)}</span>
                              <div className="flex items-center gap-2">
                                {flagMap[event.country] ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={flagMap[event.country]}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="rounded-full shadow-sm object-cover shrink-0"
                                    style={{ width: 20, height: 20 }}
                                  />
                                ) : (
                                  <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400 shrink-0">
                                    {event.country.substring(0, 2)}
                                  </span>
                                )}
                                <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-200">{event.country}</span>
                              </div>
                              <span className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug">{event.title}</span>
                              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{event.forecast || "—"}</span>
                              <span className="text-base font-semibold text-slate-500 dark:text-slate-400 tabular-nums">{event.previous || "—"}</span>
                              <span className="flex items-center">
                                {renderImpactBadge(event.impact)}
                              </span>
                              <span className="flex justify-end">
                                {isPast ? (
                                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-400 dark:bg-white/5 dark:text-slate-500">
                                    Released
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      loadPlaybook(event);
                                    }}
                                    className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer"
                                  >
                                    Analyze
                                  </button>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="mt-6 space-y-3 md:hidden">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-8 text-center text-slate-400 dark:bg-white/[0.02]">
                    <p className="text-sm font-semibold">No events scheduled</p>
                  </div>
                ) : (
                  (() => {
                    let lastDateStr = "";
                    return filtered.slice(0, 20).map((event, i) => {
                      const isPast = currentTime ? new Date(event.date).getTime() < currentTime - 30 * 60 * 1000 : false;
                      const dateStr = formatDate(event.date);
                      const showDayHeader = dateStr !== lastDateStr;
                      if (showDayHeader) {
                        lastDateStr = dateStr;
                      }

                      return (
                        <div key={`${event.title}-${i}`} className="space-y-2">
                          {showDayHeader && (
                            <div className="bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-sm font-extrabold uppercase tracking-wide text-slate-650 dark:text-slate-350 flex items-center gap-2 mt-4 first:mt-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent)] shrink-0">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              {getFriendlyDayName(event.date)}
                            </div>
                          )}
                          <div className={`rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-5 transition-all duration-200 dark:bg-white/[0.02] ${isPast ? "opacity-65" : "hover:bg-slate-50 dark:hover:bg-white/[0.01]"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">{event.title}</span>
                              {renderImpactBadge(event.impact)}
                            </div>
                            <div className="mt-3.5 grid grid-cols-2 gap-4 text-sm border-t border-slate-100 dark:border-slate-800/40 pt-3.5">
                              <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Time</p>
                                <p className="font-bold text-slate-800 dark:text-slate-100 mt-1 text-base">{formatTime(event.date)}</p>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Currency</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {flagMap[event.country] && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={flagMap[event.country]}
                                      alt=""
                                      width={16}
                                      height={16}
                                      className="rounded-full object-cover shadow-sm shrink-0"
                                    />
                                  )}
                                  <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{event.country}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Forecast</p>
                                <p className="font-bold text-slate-800 dark:text-slate-150 mt-1 text-base">{event.forecast || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Actual</p>
                                <p className="font-bold text-slate-800 dark:text-slate-150 mt-1 text-base">{event.actual || "Not released"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Source</p>
                                <p className="font-bold text-slate-600 dark:text-slate-450 mt-1 text-xs">{event.source || "Unknown"}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end border-t border-[var(--card-border)] pt-3.5">
                              {isPast ? (
                                <span className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-400 dark:bg-white/5 dark:text-slate-500">
                                  Released
                                </span>
                              ) : (
                                <button
                                  onClick={() => loadPlaybook(event)}
                                  className="rounded-lg bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all cursor-pointer"
                                >
                                  Generate AI Playbook
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Playbook slide-over drawer overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => { setSelectedEvent(null); setPlaybook(null); }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />

          {/* Sliding panel container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl bg-[var(--card)] border-l border-[var(--card-border)] p-6 shadow-2xl flex flex-col h-full animate-slide-in-right">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
                <div className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-Release Scenario Analysis</p>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedEvent.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {playbook?.provider && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/5 mr-2">
                      {playbook.provider}
                    </span>
                  )}
                  <button
                    onClick={() => { setSelectedEvent(null); setPlaybook(null); }}
                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-350 dark:hover:border-slate-700 cursor-pointer transition-all"
                    aria-label="Close panel"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Body content */}
              <div className="flex-1 overflow-y-auto mt-6 pr-1 scrollbar-thin space-y-6">
                {playbookLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <svg className="h-10 w-10 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    <p className="mt-5 text-base font-bold text-slate-700 dark:text-slate-200">Formulating scenario playbooks...</p>
                    <p className="mt-1 text-sm text-slate-400 max-w-[280px]">Running statistical bounds on {selectedEvent.country} {selectedEvent.title} values</p>
                  </div>
                ) : playbookError ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                      </svg>
                    </div>
                    <p className="mt-4 text-base font-bold text-red-600">{playbookError}</p>
                    <button
                      onClick={() => loadPlaybook(selectedEvent)}
                      className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white cursor-pointer hover:opacity-90 transition-all shadow-sm"
                    >
                      Retry Analysis
                    </button>
                  </div>
                ) : playbook ? (
                  <div className="space-y-6">
                    {/* Target Asset Detail */}
                    <div className="rounded-2xl bg-slate-50/50 p-5 border border-[var(--card-border)] dark:bg-white/[0.01]">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Instrument</p>
                          <span className="text-lg font-extrabold text-[var(--accent)] mt-1 block">{playbook.primaryAsset}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Market Price</p>
                          <span className="text-lg font-extrabold tabular-nums text-slate-800 dark:text-slate-100 mt-1 block">{playbook.currentPrice}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-650 dark:text-slate-350">{playbook.importance}</p>
                    </div>

                    {/* Scenarios Header */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Trade Execution Scenarios</p>
                      
                      {playbook.scenarios.map((sc: PlaybookScenario, idx: number) => {
                        const isBuy = sc.tradePlan.action === "BUY";
                        const isSell = sc.tradePlan.action === "SELL";
                        
                        let borderClass = "border-l-4 border-l-slate-400 border-[var(--card-border)] bg-slate-50/20 dark:bg-white/[0.01]";
                        let badgeClass = "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400";
                        
                        if (isBuy) {
                          borderClass = "border-l-4 border-l-emerald-500 border-slate-100 dark:border-slate-800/40 bg-emerald-500/[0.01] hover:bg-emerald-500/[0.02]";
                          badgeClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30";
                        } else if (isSell) {
                          borderClass = "border-l-4 border-l-rose-500 border-slate-100 dark:border-slate-800/40 bg-rose-500/[0.01] hover:bg-rose-500/[0.02]";
                          badgeClass = "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30";
                        }

                        return (
                          <div key={idx} className={`rounded-xl border p-5 transition-all ${borderClass}`}>
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">{sc.triggerCondition}</p>
                              <span className={`rounded-md px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider shrink-0 ${badgeClass}`}>
                                {sc.tradePlan.action}
                              </span>
                            </div>
                            <p className="mt-3 text-base font-extrabold text-[var(--accent)]">{sc.bias}</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-650 dark:text-slate-350">{sc.marketReaction}</p>
                            
                            {sc.tradePlan.action !== "STAND ASIDE" && (
                              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50/50 p-4 text-xs border border-[var(--card-border)] dark:bg-white/[0.02]">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trigger Zone</span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-1.5 flex items-start gap-1.5 text-base">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 shrink-0 mt-1">
                                      <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                    <span className="break-words leading-tight">{sc.tradePlan.trigger}</span>
                                  </span>
                                </div>
                                <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-4">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stop Loss</span>
                                  <span className="font-extrabold text-rose-500 mt-1.5 flex items-start gap-1.5 text-base">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-rose-550 shrink-0 mt-1">
                                      <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                    <span className="break-words leading-tight">{sc.tradePlan.stopLoss}</span>
                                  </span>
                                </div>
                                <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/40 pl-4">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Take Profit</span>
                                  <span className="font-extrabold text-emerald-500 mt-1.5 flex items-start gap-1.5 text-base">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-550 shrink-0 mt-1">
                                      <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                    <span className="break-words leading-tight">{sc.tradePlan.takeProfit}</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
