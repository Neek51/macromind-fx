"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageShell } from "../components";
import { newsItems as fallbackNews } from "../data";

type AnalysisResult = {
  summary?: string;
  usdSentiment?: string;
  riskLevel?: string;
  confidence?: number;
  timeframe?: string;
  affectedAssets?: Array<{
    asset: string;
    direction: string;
    impactStrength: string;
    reason: string;
  }>;
  traderWarning?: string;
  error?: string;
};

type NewsItem = {
  title: string;
  summary: string;
  source: string;
  link: string;
  pubDate: string;
};

type CachedData = {
  news: NewsItem[];
  analysis: AnalysisResult | null;
  analyzedTitle: string;
  timestamp: number;
};

const CACHE_KEY = "macromind-news-cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const directionColors: Record<string, string> = {
  bullish: "text-emerald-600 bg-emerald-50 dark:bg-emerald-50/10",
  bearish: "text-red-600 bg-red-50 dark:bg-red-50/10",
  neutral: "text-slate-600 bg-slate-100 dark:bg-white/5",
};

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const dateObj = new Date(pubDate);
  const timeMs = dateObj.getTime();
  if (isNaN(timeMs)) return "";
  const diff = Date.now() - timeMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsPage() {
  const [text, setText] = useState("Fed signals interest rates may stay higher for longer as inflation remains sticky.");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsItem[]>(
    fallbackNews.map(n => ({ title: n.title, summary: n.summary, source: n.source, link: "", pubDate: "" }))
  );
  const [newsLoading, setNewsLoading] = useState(true);
  const [analyzingHeadline, setAnalyzingHeadline] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const autoAnalyze = useCallback(async (item: NewsItem) => {
    if (!item) return;
    const headline = item.title + (item.summary ? `. ${item.summary}` : "");
    setText(headline);
    setAnalyzingHeadline(item.title);
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: headline }),
      });
      const data = await response.json();
      setAnalysis(data);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setAnalysis({ error: "Could not connect to the AI analyzer." });
    } finally {
      setLoading(false);
      setAnalyzingHeadline(null);
    }
  }, []);

  // Fetch news on load — uses cache if fresh (< 5 min)
  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      if (cancelled) return;

      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const data: CachedData = JSON.parse(cached);
          if (data && Array.isArray(data.news) && data.news.length > 0) {
            const timestamp = data.timestamp ? Number(data.timestamp) : Date.now();
            const isFresh = Date.now() - timestamp < CACHE_TTL;
            if (isFresh) {
              const dateObj = new Date(timestamp);
              const timeStr = isNaN(dateObj.getTime())
                ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

              setTimeout(() => {
                setNews(data.news);
                setAnalysis(data.analysis || null);
                setText(data.analyzedTitle || "");
                setLastUpdated(timeStr);
                setNewsLoading(false);
              }, 0);
              return;
            }
          }
        }
      } catch { /* corrupted cache — ignore */ }

      try {
        const res = await fetch("/api/news");
        if (cancelled) return;
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setTimeout(() => {
            setNews(json.data);
            autoAnalyze(json.data[0]);
          }, 0);
        }
      } catch { /* keep fallback */ } finally {
        if (!cancelled) {
          setTimeout(() => {
            setNewsLoading(false);
          }, 0);
        }
      }
    }

    loadNews();

    return () => { cancelled = true; };
  }, [autoAnalyze]);

  // Cache news + analysis to sessionStorage
  useEffect(() => {
    if (!newsLoading && Array.isArray(news) && news.length > 0) {
      try {
        const existing = sessionStorage.getItem(CACHE_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        const timestamp = parsed && parsed.timestamp ? parsed.timestamp : Date.now();
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          news,
          analysis,
          analyzedTitle: text,
          timestamp,
        }));
      } catch {}
    }
  }, [news, analysis, newsLoading, text]);

  // Manual analyze button
  async function analyzeText() {
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch {
      setAnalysis({ error: "Could not connect to the AI analyzer." });
    } finally {
      setLoading(false);
    }
  }

  // Click a news headline to load + auto-analyze it
  function loadNewsIntoAnalyzer(item: NewsItem) {
    if (!item) return;
    const headline = item.title + (item.summary ? `. ${item.summary}` : "");
    setText(headline);
    setAnalyzingHeadline(item.title);
    setLoading(true);
    setAnalysis(null);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: headline }),
    })
      .then(r => r.json())
      .then(data => {
        setAnalysis(data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            news,
            analysis: data,
            analyzedTitle: headline,
            timestamp: Date.now(),
          }));
        } catch {}
      })
      .catch(() => setAnalysis({ error: "Could not connect to the AI analyzer." }))
      .finally(() => {
        setLoading(false);
        setAnalyzingHeadline(null);
      });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const affectedAssets = (analysis && Array.isArray(analysis.affectedAssets))
    ? analysis.affectedAssets
    : [
        { asset: "USD", direction: "bullish", impactStrength: "high", reason: "Higher rates can support USD demand." },
        { asset: "XAU/USD", direction: "bearish", impactStrength: "high", reason: "Gold can weaken when USD and yields rise." },
        { asset: "EUR/USD", direction: "bearish", impactStrength: "medium", reason: "USD strength can pressure EUR/USD." },
      ];

  return (
    <PageShell title="AI News Impact Analyzer" label="News AI" action="Run Analysis" onActionClick={analyzeText}>
      {/* Analyzer */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        {/* Input */}
        <Card className="animate-fade-up">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manual analyzer</p>
          </div>
          <h2 className="mt-3 text-xl font-bold">Paste news or tweet text</h2>
          <textarea
            className="mt-5 h-52 max-h-52 w-full resize-none rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 text-sm outline-none transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--card)] dark:bg-white/[0.02] dark:focus:bg-white/[0.04]"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button
            onClick={analyzeText}
            disabled={loading || !text.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
                </svg>
                Analyze Market Impact
              </>
            )}
          </button>
        </Card>

        {/* Output */}
        <Card className="animate-fade-up-delay-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI output</p>
              <h2 className="mt-1 text-xl font-bold">Market interpretation</h2>
            </div>
            {lastUpdated ? (
              <span className="text-xs text-slate-400">Updated {lastUpdated}</span>
            ) : null}
          </div>

          {analysis?.error ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-50/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {analysis.error}
            </div>
          ) : null}

          {/* Affected assets */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {affectedAssets.slice(0, 3).map((item, idx) => (
              <div key={item.asset || idx} className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.02]">
                <p className="text-xs text-slate-500">{item.asset || "Unknown"}</p>
                <p className={`mt-2 inline-block rounded-md px-2 py-0.5 text-sm font-bold capitalize ${directionColors[item.direction] ?? directionColors.neutral}`}>
                  {item.direction || "neutral"}
                </p>
                <p className="mt-2 text-xs capitalize text-slate-500">{item.impactStrength || "medium"} impact</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-5 rounded-xl bg-[var(--foreground)] p-5 text-[var(--background)] dark:bg-white/[0.04] dark:text-[var(--foreground)]">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Summary</p>
            <p className="mt-2 text-sm leading-7">
              {loading && !analysis ? (
                <span className="inline-block h-5 w-full animate-pulse rounded bg-white/20" />
              ) : analysis?.summary ??
                "Higher interest-rate expectations usually support USD strength and can pressure gold because non-yielding assets become less attractive."}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold opacity-60">USD:</span>
                <span className="font-bold capitalize">{analysis?.usdSentiment ?? "bullish"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold opacity-60">Risk:</span>
                <span className="font-bold capitalize">{analysis?.riskLevel ?? "high"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold opacity-60">Confidence:</span>
                <span className="font-bold">{analysis?.confidence ?? 82}%</span>
              </span>
              {analysis?.timeframe ? (
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold opacity-60">Timeframe:</span>
                  <span className="font-bold capitalize">{analysis.timeframe}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Trader warning */}
          {analysis?.traderWarning ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-50/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-600">
                <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
              </svg>
              {analysis.traderWarning}
            </div>
          ) : null}
        </Card>
      </section>

      {/* Live News Feed */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${newsLoading ? "animate-pulse" : ""}`} />
              {newsLoading ? "Fetching..." : lastUpdated ? `Cached (updated ${lastUpdated})` : "Live feed"}
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Latest Forex News</h2>
          </div>
          <span className="text-xs text-slate-400">Click any headline to analyze</span>
        </div>

        {/* Loading skeleton */}
        {newsLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="h-5 w-20 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <span className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="mt-4 space-y-2">
                  <span className="block h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <span className="block h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="mt-4 h-8 w-full animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {news.map((item, i) => (
              <Card
                key={`${item.title}-${i}`}
                className="flex cursor-pointer flex-col transition-all duration-200 hover:-translate-y-0.5 hover:ring-1 hover:ring-[var(--accent)]/30"
                style={{ animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 3) * 0.05}s both` }}
              >
                <button onClick={() => loadNewsIntoAnalyzer(item)} className="flex flex-1 flex-col text-left">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-400">
                      {item.source}
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo(item.pubDate)}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold leading-6">{item.title}</h3>
                  {item.summary ? (
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 line-clamp-3">{item.summary}</p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
                    </svg>
                    {analyzingHeadline === item.title ? "Analyzing..." : "Analyze this headline"}
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
