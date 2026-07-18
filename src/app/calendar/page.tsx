"use client";

import { useEffect, useState } from "react";
import { Card, PageShell } from "../components";
import { events as fallbackEvents } from "../data";

type CalendarEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
};

const impactColors: Record<string, string> = {
  High: "bg-red-50 text-red-600 dark:bg-red-50/10",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-50/10",
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10",
  Holiday: "bg-slate-100 text-slate-500 dark:bg-white/5",
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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(fallbackEvents.map(e => ({
    title: e.event,
    country: e.country,
    date: e.date,
    impact: e.impact,
    forecast: e.forecast,
    previous: e.previous,
  })));
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/calendar");
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setEvents(json.data);
        }
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  const filtered = events.filter(e => {
    if (filter === "high") return e.impact === "High";
    if (filter === "medium") return e.impact === "High" || e.impact === "Medium";
    return true;
  });

  const highCount = events.filter(e => e.impact === "High").length;
  const mediumCount = events.filter(e => e.impact === "Medium").length;

  return (
    <PageShell title="Economic Calendar" label="Calendar" action="Create Alert">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Events table */}
        <Card className="animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming events</p>
              <h2 className="mt-1 text-xl font-bold">Macro releases to watch</h2>
            </div>
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-50/10">
              {highCount} high impact
            </span>
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex gap-2">
            {([
              ["all", `All (${events.length})`],
              ["high", `High (${highCount})`],
              ["medium", `High+Med (${highCount + mediumCount})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
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
                <div className="grid grid-cols-[1fr_0.7fr_2.5fr_1fr_1fr_0.8fr] gap-4 border-b border-[var(--card-border)] bg-slate-50/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:bg-white/[0.02]">
                  <span>Time</span>
                  <span>Currency</span>
                  <span>Event</span>
                  <span>Forecast</span>
                  <span>Previous</span>
                  <span className="text-right">Impact</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {filtered.map((event, i) => (
                    <div
                      key={`${event.title}-${i}`}
                      className={`grid grid-cols-[1fr_0.7fr_2.5fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-[var(--card-border)] px-5 py-3.5 transition-colors duration-200 last:border-b-0 hover:bg-slate-50/40 dark:hover:bg-white/[0.02] ${
                        i % 2 === 1 ? "bg-slate-50/20 dark:bg-white/[0.01]" : ""
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold">{formatTime(event.date)}</span>
                        <span className="block text-xs text-slate-400">{formatDate(event.date)}</span>
                      </div>
                      <span className="text-sm font-bold">{event.country}</span>
                      <span className="text-sm font-semibold">{event.title}</span>
                      <span className="text-sm text-slate-600">{event.forecast || "—"}</span>
                      <span className="text-sm text-slate-600">{event.previous || "—"}</span>
                      <span className="flex justify-end">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${impactColors[event.impact] ?? impactColors.Low}`}>
                          {event.impact}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="mt-6 space-y-3 md:hidden">
                {filtered.slice(0, 20).map((event, i) => (
                  <div key={`${event.title}-${i}`} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{event.title}</span>
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${impactColors[event.impact] ?? impactColors.Low}`}>
                        {event.impact}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Time</p>
                        <p className="font-bold">{formatTime(event.date)}</p>
                        <p className="text-slate-400">{formatDate(event.date)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Currency</p>
                        <p className="font-bold">{event.country}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Forecast</p>
                        <p className="font-bold">{event.forecast || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Previous</p>
                        <p className="font-bold">{event.previous || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* AI guide */}
        <Card className="animate-fade-up-delay-2">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI event guide</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">Before the news</h2>
          <div className="mt-5 space-y-3">
            {[
              { title: "Avoid overleveraged trades", desc: "Before CPI and FOMC events, reduce position size." },
              { title: "Expect two-way spikes", desc: "Gold and USD pairs can spike both directions during first reaction." },
              { title: "Wait for normalization", desc: "Let spread and volatility settle before judging direction." },
            ].map((tip) => (
              <div key={tip.title} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold">{tip.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
