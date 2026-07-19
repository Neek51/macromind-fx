"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, PageShell } from "./components";
import { assets as fallbackAssets, events as fallbackEvents } from "./data";
import { AssetIcon, formatPrice, nameMap, timeAgo } from "./asset-icon";
import { CurrencyStrengthMeter } from "./currency-strength-meter";
import { PositionSizeCalculator } from "./position-size-calculator";
import { MarketSessionsClock } from "./market-sessions-clock";
import { CorrelationMatrix } from "./correlation-matrix";
import { ConfluenceSynthesizer } from "./confluence-synthesizer";
import type { LiveAsset, NewsItem, CalendarEvent, CorrelationData } from "./types";

export default function Home() {
  const [liveData, setLiveData] = useState<LiveAsset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(fallbackEvents.map(e => ({
    title: e.event, country: e.country, date: e.date, impact: e.impact, forecast: e.forecast, previous: e.previous,
  })));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [isCalendarFallback, setIsCalendarFallback] = useState(true);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [correlationLoading, setCorrelationLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  // Price flash effect — tracks direction of each price tick
  const prevPricesRef = useRef<Record<string, number>>({});
  const [priceFlash, setPriceFlash] = useState<Record<string, "up" | "down" | null>>({});

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (json.data) {
        // Compute flash direction by comparing new prices to previous
        const newData: LiveAsset[] = json.data;
        const prev = prevPricesRef.current;
        const flashes: Record<string, "up" | "down" | null> = {};
        newData.forEach((asset: LiveAsset) => {
          const oldPrice = prev[asset.symbol];
          if (oldPrice !== undefined && asset.price !== oldPrice) {
            flashes[asset.symbol] = asset.price > oldPrice ? "up" : "down";
          }
        });
        // Store new prices for next tick comparison
        const nextPrev: Record<string, number> = {};
        newData.forEach((asset: LiveAsset) => { nextPrev[asset.symbol] = asset.price; });
        prevPricesRef.current = nextPrev;

        setLiveData(newData);
        setPriceFlash(flashes);
        setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

        // Clear flash after 1s so it only highlights the tick
        setTimeout(() => setPriceFlash({}), 1000);
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
        setIsCalendarFallback(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const displayAssets = liveData && liveData.length > 0 ? liveData : null;

  const getUpcomingEvents = () => {
    if (isCalendarFallback) {
      const upcoming = calendarEvents.filter(e => {
        if (!currentTime) return true;
        const eventTime = new Date(e.date).getTime();
        const threshold = currentTime - 30 * 60 * 1000; // 30 mins ago
        return eventTime >= threshold;
      });

      if (upcoming.length < 5) {
        const fallbackUpcoming = fallbackEvents
          .map(e => ({
            title: e.event,
            country: e.country,
            date: e.date,
            impact: e.impact,
            forecast: e.forecast,
            previous: e.previous,
          }))
          .filter(e => {
            if (!currentTime) return true;
            const eventTime = new Date(e.date).getTime();
            const threshold = currentTime - 30 * 60 * 1000;
            return eventTime >= threshold;
          });

        fallbackUpcoming.forEach(fb => {
          const isDuplicate = upcoming.some(
            u => u.title === fb.title && Math.abs(new Date(u.date).getTime() - new Date(fb.date).getTime()) < 3600000
          );
          if (!isDuplicate) {
            upcoming.push(fb);
          }
        });
      }

      const filteredUpcoming = upcoming.filter(e => e.impact === "High" || e.impact === "Medium");
      filteredUpcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return filteredUpcoming.slice(0, 6);
    }

    // In live mode (not fallback):
    // 1. Try to find upcoming events (High/Medium impact)
    const upcoming = calendarEvents.filter(e => {
      if (!currentTime) return true;
      const eventTime = new Date(e.date).getTime();
      const threshold = currentTime - 30 * 60 * 1000;
      return eventTime >= threshold && (e.impact === "High" || e.impact === "Medium");
    });

    if (upcoming.length > 0) {
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return upcoming.slice(0, 6);
    }

    // 2. If no upcoming events (e.g. weekend), show the most recent High/Medium impact events of the week!
    const pastEvents = calendarEvents.filter(e => {
      if (!currentTime) return true;
      const eventTime = new Date(e.date).getTime();
      const threshold = currentTime - 30 * 60 * 1000;
      return eventTime < threshold && (e.impact === "High" || e.impact === "Medium");
    });

    // Sort past events descending (most recent first) to get the latest ones, then sort them ascending for display
    pastEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPast = pastEvents.slice(0, 6);
    latestPast.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return latestPast;
  };

  const upcomingEvents = getUpcomingEvents();
  const highImpactEvents = upcomingEvents.filter(e => e.impact === "High").length;
  const volatileAssets = liveData ? liveData.filter(a => Math.abs(a.percent_change) > 0.5).length : 0;
  const riskScore = Math.min(100, 30 + highImpactEvents * 10 + volatileAssets * 15);

  const riskNews = news.slice(0, 3);

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

  const checkEventWarning = () => {
    if (!currentTime || !calendarEvents || calendarEvents.length === 0) return null;
    const now = currentTime;
    const alertWindowStart = now - 15 * 60 * 1000; // 15 minutes ago
    const alertWindowEnd = now + 60 * 60 * 1000;   // 60 minutes from now

    const activeEvent = calendarEvents.find(e => {
      if (e.impact !== "High") return false;
      const eventTime = new Date(e.date).getTime();
      return eventTime >= alertWindowStart && eventTime <= alertWindowEnd;
    });

    if (activeEvent) {
      const eventTime = new Date(activeEvent.date).getTime();
      const diffMins = Math.round((eventTime - now) / 60000);
      return {
        event: activeEvent,
        mins: diffMins,
      };
    }
    return null;
  };

  const eventWarning = checkEventWarning();

  const calculateMacroBiases = () => {
    const biases: Record<string, { score: number; bias: "bullish" | "bearish" | "neutral"; details: string }> = {
      USD: { score: 0, bias: "neutral", details: "Fed policies and inflation rates hold steady." },
      EUR: { score: 0, bias: "neutral", details: "ECB stance remains steady with slow growth." },
      GBP: { score: 0, bias: "neutral", details: "BOE rate expectations hold steady." },
      XAU: { score: 0, bias: "neutral", details: "Safe-haven flows remain balanced." },
    };

    if (!news || news.length === 0) return biases;

    news.forEach(item => {
      const text = ((item.title || "") + " " + (item.summary || "")).toLowerCase();
      
      // USD sentiment
      if (text.includes("fed") || text.includes("powell") || text.includes("inflation") || text.includes("yields")) {
        if (text.includes("higher for longer") || text.includes("hawkish") || text.includes("rate hike") || text.includes("sticky") || text.includes("strong") || text.includes("rise")) {
          biases.USD.score += 1;
        }
        if (text.includes("rate cut") || text.includes("dovish") || text.includes("cooling") || text.includes("weak") || text.includes("fall")) {
          biases.USD.score -= 1;
        }
      }

      // XAU Gold sentiment
      if (text.includes("gold") || text.includes("xau") || text.includes("geopolitical") || text.includes("conflict") || text.includes("tension") || text.includes("safe haven")) {
        if (text.includes("geopolitical") || text.includes("conflict") || text.includes("tension") || text.includes("safe haven") || text.includes("rally") || text.includes("soar") || text.includes("demand")) {
          biases.XAU.score += 1;
        }
        if (text.includes("fed hike") || text.includes("rate hike") || text.includes("yields rise") || text.includes("selloff") || text.includes("plunge")) {
          biases.XAU.score -= 1;
        }
      }

      // EUR sentiment
      if (text.includes("ecb") || text.includes("eurozone") || text.includes("lagarde")) {
        if (text.includes("hawkish") || text.includes("rate hike") || text.includes("recovery") || text.includes("tightening")) {
          biases.EUR.score += 1;
        }
        if (text.includes("dovish") || text.includes("rate cut") || text.includes("recession") || text.includes("easing")) {
          biases.EUR.score -= 1;
        }
      }

      // GBP sentiment
      if (text.includes("boe") || text.includes("uk economy") || text.includes("bailey")) {
        if (text.includes("hawkish") || text.includes("rate hike") || text.includes("inflation surge") || text.includes("stronger")) {
          biases.GBP.score += 1;
        }
        if (text.includes("dovish") || text.includes("rate cut") || text.includes("easing") || text.includes("slowing")) {
          biases.GBP.score -= 1;
        }
      }
    });

    Object.keys(biases).forEach(k => {
      const b = biases[k];
      if (b.score > 0) {
        b.bias = "bullish";
        b.details = k === "USD" ? "Hawkish Fed rhetoric or strong economic indicators are supporting the USD." : 
                    k === "XAU" ? "Active safe-haven flows and geopolitical hedge buying are driving gold." : 
                    k === "EUR" ? "ECB tightening signals are supporting euro strength." : 
                    k === "GBP" ? "BOE hawkish policy bias is supporting sterling." : "Bullish momentum is building.";
      } else if (b.score < 0) {
        b.bias = "bearish";
        b.details = k === "USD" ? "Fed rate cut expectations or slowing inflation are softening yields." : 
                    k === "XAU" ? "Rising yields and dollar strength are pressuring non-yielding metal prices." : 
                    k === "EUR" ? "Dovish ECB outlook and economic slowdown are weighing on the euro." : 
                    k === "GBP" ? "Dovish BOE comments or cooling UK inflation are softening sterling." : "Bearish momentum is building.";
      } else {
        b.bias = "neutral";
      }
    });

    return biases;
  };

  const macroBiases = calculateMacroBiases();

  return (
    <PageShell title="Market Intelligence Overview" label="Dashboard" action="Analyze News" actionHref="/news">
      {/* Event Warning Banner */}
      {eventWarning ? (
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 animate-fade-up">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          <div>
            <h4 className="font-bold text-sm">⚠️ High-Impact Economic Event Alert</h4>
            <p className="mt-1 text-xs leading-5">
              {eventWarning.mins > 0 ? (
                <>
                  <strong>{eventWarning.event.country} {eventWarning.event.title}</strong> is scheduled in <strong>{eventWarning.mins} minutes</strong>. 
                  High volatility, rapid price fluctuations, and spread expansions are highly likely. Consider closing open scalps or disabling new entries.
                </>
              ) : (
                <>
                  <strong>{eventWarning.event.country} {eventWarning.event.title}</strong> was released <strong>{Math.abs(eventWarning.mins)} minutes ago</strong>. 
                  Heavy market volatility is currently in progress. Avoid immediate entries until spreads and price action stabilize.
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}

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
                <p className={`mt-4 text-2xl font-bold tracking-tight tabular-nums rounded-lg px-1 -mx-1 ${
                  !isLoading && priceFlash[asset.symbol] === "up" ? "flash-up" :
                  !isLoading && priceFlash[asset.symbol] === "down" ? "flash-down" : ""
                }`}>
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
                      <td className={`px-5 py-3 font-bold tabular-nums rounded-lg ${
                        !isLoading && priceFlash[asset.symbol] === "up" ? "flash-up" :
                        !isLoading && priceFlash[asset.symbol] === "down" ? "flash-down" : ""
                      }`}>
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

      {/* AI Verdict — Confluence Synthesizer (promoted to top) */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Confluence Verdict</h2>
        </div>
        <ConfluenceSynthesizer
          liveData={liveData}
          news={news}
          calendarEvents={calendarEvents}
          macroBiases={macroBiases}
        />
      </section>

      {/* Macro Bias Matrix */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] animate-pulse">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Institutional Macro Bias Matrix</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {Object.entries(macroBiases).map(([currency, data], idx) => {
            const isBull = data.bias === "bullish";
            const isBear = data.bias === "bearish";
            return (
              <Card key={currency} className="p-5 flex flex-col" style={{ animationDelay: `${(idx + 1) * 0.05}s` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-tight">{currency === "XAU" ? "XAU (Gold)" : `${currency} Index`}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isBull ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" :
                    isBear ? "bg-red-50 text-red-500 dark:bg-red-50/10" :
                    "bg-slate-100 text-slate-500 dark:bg-white/5"
                  }`}>
                    {data.bias}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 flex-1">{data.details}</p>
                <div className="mt-3 border-t border-[var(--card-border)] pt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Sentiment Strength:</span>
                  <span className={`font-bold ${data.score > 0 ? "text-emerald-600 dark:text-emerald-400" : data.score < 0 ? "text-red-500" : "text-slate-500"}`}>
                    {data.score > 0 ? `+${data.score}` : data.score}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Currency Strength Meter */}
      <section>
        <Card className="animate-fade-up-delay-4">
          <CurrencyStrengthMeter assets={marketAssets} loading={loading} />
        </Card>
      </section>

      {/* Correlation Matrix */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Deep Tools</h2>
        </div>
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

      {/* Economic Calendar preview + AI Risk Score */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="animate-fade-up-delay-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {upcomingEvents.some(e => new Date(e.date).getTime() >= (currentTime ?? 0) - 30 * 60 * 1000) ? "Upcoming events" : "Recent releases"}
              </p>
              <h2 className="text-xl font-bold">Economic Calendar</h2>
            </div>
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-50/10">
              {highImpactEvents} high impact
            </span>
          </div>
          <div className="mt-5 space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            {calendarLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/40 dark:bg-white/5" />
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, i) => {
                const isPast = currentTime ? new Date(event.date).getTime() < currentTime - 30 * 60 * 1000 : false;
                return (
                  <div key={`${event.title}-${i}`} className={`flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 transition-colors duration-200 hover:bg-slate-100/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] ${isPast ? "opacity-65" : ""}`}>
                    <div>
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {event.date ? new Date(event.date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        {" • Forecast: "}{event.forecast || "—"}{" • Previous: "}{event.previous || "—"}
                        {isPast && " • Released"}
                      </p>
                    </div>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      event.impact === "High" ? "bg-red-50 text-red-600 dark:bg-red-50/10" : "bg-amber-50 text-amber-700 dark:bg-amber-50/10"
                    }`}>
                      {event.impact}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No events scheduled</p>
            )}
          </div>
        </Card>

        <Card className="animate-fade-up-delay-4 flex flex-col">
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
    </PageShell>
  );
}
