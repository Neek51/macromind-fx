"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageShell } from "./components";
import { assets as fallbackAssets, events as fallbackEvents } from "./data";
import { AssetIcon, formatPrice, nameMap, timeAgo } from "./asset-icon";
import { CurrencyStrengthMeter } from "./currency-strength-meter";
import { PositionSizeCalculator } from "./position-size-calculator";
import { MarketSessionsClock } from "./market-sessions-clock";
import { CorrelationMatrix } from "./correlation-matrix";
import { TradingViewChart } from "./tradingview-chart";
import { useTheme } from "./theme-provider";
import type { LiveAsset, NewsItem, CalendarEvent, CorrelationData } from "./types";

export default function Home() {
  const { darkMode } = useTheme();
  const [liveData, setLiveData] = useState<LiveAsset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(fallbackEvents.map(e => ({
    title: e.event, country: e.country, date: "", impact: e.impact, forecast: e.forecast, previous: e.previous,
  })));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [correlationLoading, setCorrelationLoading] = useState(true);
  const [chartSymbol, setChartSymbol] = useState("XAU/USD");

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (json.data) {
        setLiveData(json.data);
        setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch {
      // silently fall back to static data
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setNews(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setCalendarEvents(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const fetchCorrelation = useCallback(async () => {
    try {
      const res = await fetch("/api/correlation");
      const json = await res.json();
      if (json.data) {
        setCorrelationData(json.data);
      }
    } catch {
      // keep preset fallback
    } finally {
      setCorrelationLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchPrices, 0);
    const interval = setInterval(fetchPrices, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchPrices]);

  useEffect(() => {
    const timer = setTimeout(fetchNews, 0);
    const interval = setInterval(fetchNews, 120000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNews]);

  useEffect(() => {
    const timer = setTimeout(fetchCalendar, 0);
    const interval = setInterval(fetchCalendar, 300000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchCalendar]);

  useEffect(() => {
    const timer = setTimeout(fetchCorrelation, 0);
    const interval = setInterval(fetchCorrelation, 900000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchCorrelation]);

  const displayAssets = liveData && liveData.length > 0 ? liveData : null;

  const highImpactEvents = calendarEvents.filter(e => e.impact === "High").length;
  const volatileAssets = liveData ? liveData.filter(a => Math.abs(a.percent_change) > 0.5).length : 0;
  const riskScore = Math.min(100, 30 + highImpactEvents * 10 + volatileAssets * 15);

  const riskNews = news.slice(0, 3);

  const upcomingEvents = calendarEvents
    .filter(e => e.impact === "High" || e.impact === "Medium")
    .slice(0, 4);

  const marketAssets = displayAssets ?? fallbackAssets.map((a) => ({
    symbol: a.symbol,
    name: a.name,
    price: parseFloat(a.price.replace(/,/g, "")),
    change: parseFloat(a.change),
    percent_change: parseFloat(a.change),
    high: 0,
    low: 0,
  }));

  const featuredSymbols = ["XAU/USD", "EUR/USD", "USD/JPY", "BTC/USD"];
  const featuredAssets = featuredSymbols
    .map((symbol) => marketAssets.find((asset) => asset.symbol === symbol))
    .filter((asset): asset is LiveAsset => Boolean(asset));

  return (
    <PageShell title="Market Intelligence Overview" label="Dashboard" action="Analyze News">
      {/* Live Market Prices */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {loading ? "Connecting..." : "Live"}
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Market Prices</h2>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400">Updated {lastUpdated}</span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {featuredAssets.map((asset, i) => {
            const isLoading = loading && !displayAssets;
            const isUp = asset.percent_change >= 0;
            return (
              <Card key={asset.symbol} className="p-5" style={{ animationDelay: `${(i + 1) * 0.05}s` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AssetIcon symbol={asset.symbol} size={38} />
                    <div>
                      <h3 className="text-sm font-bold leading-none">{asset.symbol}</h3>
                      <p className="mt-1 text-xs text-slate-500">{nameMap[asset.symbol] ?? asset.name}</p>
                    </div>
                  </div>
                  {isLoading ? (
                    <span className="inline-block h-6 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
                  ) : (
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" : "bg-red-50 text-red-500 dark:bg-red-50/10"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(asset.percent_change).toFixed(2)}%
                    </span>
                  )}
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight">
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  ) : (
                    formatPrice(asset.symbol, asset.price)
                  )}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-3 text-xs">
                  <span className="font-medium text-slate-500">{isUp ? "Bullish" : "Bearish"}</span>
                  <span className="text-slate-400">Featured</span>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 p-0" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Watchlist</p>
              <h3 className="text-base font-bold">All tracked assets</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5">
              {marketAssets.length} pairs
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr className="border-b border-[var(--card-border)]">
                  <th className="px-5 py-3 font-semibold">Asset</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Change</th>
                  <th className="px-5 py-3 font-semibold">High</th>
                  <th className="px-5 py-3 font-semibold">Low</th>
                  <th className="px-5 py-3 font-semibold">Bias</th>
                </tr>
              </thead>
              <tbody>
                {marketAssets.map((asset) => {
                  const isLoading = loading && !displayAssets;
                  const isUp = asset.percent_change >= 0;
                  return (
                    <tr key={asset.symbol} className="border-b border-[var(--card-border)] last:border-0 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <AssetIcon symbol={asset.symbol} size={28} />
                          <div>
                            <p className="font-bold leading-none">{asset.symbol}</p>
                            <p className="mt-1 text-xs text-slate-500">{nameMap[asset.symbol] ?? asset.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold tabular-nums">
                        {isLoading ? "—" : formatPrice(asset.symbol, asset.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" : "bg-red-50 text-red-500 dark:bg-red-50/10"}`}>
                          {isUp ? "▲" : "▼"} {Math.abs(asset.percent_change).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-500">{asset.high ? formatPrice(asset.symbol, asset.high) : "—"}</td>
                      <td className="px-5 py-3 tabular-nums text-slate-500">{asset.low ? formatPrice(asset.symbol, asset.low) : "—"}</td>
                      <td className={`px-5 py-3 font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>{isUp ? "Bullish" : "Bearish"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Currency Strength Meter */}
      <section>
        <Card className="animate-fade-up-delay-4">
          <CurrencyStrengthMeter assets={marketAssets} loading={loading} />
        </Card>
      </section>

      {/* Correlation Matrix */}
      <section>
        <Card className="p-0" style={{ animationDelay: "0.25s" }}>
          <CorrelationMatrix
            marketAssets={marketAssets}
            correlationData={correlationData}
            correlationLoading={correlationLoading}
          />
        </Card>
      </section>

      {/* Market Sessions Clock */}
      <section>
        <Card style={{ animationDelay: "0.25s" }}>
          <MarketSessionsClock />
        </Card>
      </section>

      {/* Position Size Calculator */}
      <section>
        <Card className="animate-fade-up-delay-4">
          <PositionSizeCalculator liveData={liveData} />
        </Card>
      </section>

      {/* Chart + AI Risk Score */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="animate-fade-up-delay-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{chartSymbol}</p>
              <h2 className="text-xl font-bold">Live Chart</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={chartSymbol}
                onChange={(e) => setChartSymbol(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
              >
                {Object.keys(nameMap).map((sym) => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <TradingViewChart symbol={chartSymbol} darkMode={darkMode} />
          </div>
        </Card>

        <Card className="animate-fade-up-delay-2 flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Risk Score</p>
              <h2 className="mt-1 text-xl font-bold">
                {riskScore >= 70 ? "High volatility" : riskScore >= 40 ? "Moderate risk" : "Low risk"}
              </h2>
            </div>
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold ${
              riskScore >= 70 ? "bg-red-50 text-red-600 dark:bg-red-50/10" :
              riskScore >= 40 ? "bg-amber-50 text-amber-600 dark:bg-amber-50/10" :
              "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10"
            }`}>
              {riskScore}
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-500" style={{ width: `${riskScore}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          <div className="mt-5 flex-1 space-y-3">
            {newsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
              ))
            ) : riskNews.length > 0 ? (
              riskNews.map((item) => (
                <div key={item.title} className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 transition-colors duration-200 hover:bg-slate-100/50 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]">
                  <p className="text-sm font-semibold leading-6">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{timeAgo(item.pubDate)}</span>
                    <span className="font-semibold text-[var(--accent)]">{item.source}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No live news available</p>
            )}
          </div>
        </Card>
      </section>

      {/* Economic Calendar preview */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="animate-fade-up-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This week</p>
              <h2 className="text-xl font-bold">Economic Calendar</h2>
            </div>
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-50/10">
              {highImpactEvents} high impact
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {calendarLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, i) => (
                <div key={`${event.title}-${i}`} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 transition-colors duration-200 hover:bg-slate-100/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {event.date ? new Date(event.date).toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      {" • Forecast: "}{event.forecast || "—"}{" • Previous: "}{event.previous || "—"}
                    </p>
                  </div>
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    event.impact === "High" ? "bg-red-50 text-red-600 dark:bg-red-50/10" : "bg-amber-50 text-amber-700 dark:bg-amber-50/10"
                  }`}>
                    {event.impact}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No upcoming events</p>
            )}
          </div>
        </Card>

        <Card className="animate-fade-up-delay-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick stats</p>
              <h2 className="text-xl font-bold">Market pulse</h2>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Volatility", value: `${volatileAssets} assets >0.5%` },
              { label: "Risk events", value: `${highImpactEvents} this week` },
              { label: "News items", value: `${news.length} recent` },
              { label: "Data freshness", value: lastUpdated || "Loading..." },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="mt-1 text-sm font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
