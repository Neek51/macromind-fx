"use client";

import { useEffect, useRef, useState } from "react";

const TRADINGVIEW_SYMBOLS: Record<string, string> = {
  "XAU/USD": "OANDA:XAUUSD",
  "XAG/USD": "OANDA:XAGUSD",
  "EUR/USD": "FX:EURUSD",
  "GBP/USD": "FX:GBPUSD",
  "USD/JPY": "FX:USDJPY",
  "USD/CHF": "FX:USDCHF",
  "AUD/USD": "FX:AUDUSD",
  "USD/CAD": "FX:USDCAD",
  "BTC/USD": "BINANCE:BTCUSDT",
  "ETH/USD": "BINANCE:ETHUSDT",
};

interface TradingViewWidget {
  remove: () => void;
  onChartReady?: (cb: () => void) => void;
  chart?: () => { changeTheme?: (theme: string) => void };
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => TradingViewWidget;
    };
  }
}

const SCRIPT_SRC = "https://s3.tradingview.com/tv.js";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.TradingView) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function TradingViewChart({
  symbol,
  darkMode,
}: {
  symbol: string;
  darkMode: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<TradingViewWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tvSymbol = TRADINGVIEW_SYMBOLS[symbol] || "OANDA:XAUUSD";

  // Create/destroy widget when symbol changes
  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.TradingView) return;

        if (widgetRef.current) {
          widgetRef.current.remove();
          widgetRef.current = null;
        }

        const widgetId = `tv_widget_${Date.now()}`;
        containerRef.current.innerHTML = `<div id="${widgetId}" style="width:100%;height:100%"></div>`;

        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: darkMode ? "dark" : "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          container_id: widgetId,
          custom_css_url: undefined,
        });

        setLoading(false);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch {
          // TradingView's remove() can throw if the container DOM node
          // was already removed during navigation — safe to ignore.
        }
        widgetRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvSymbol]);

  // Update theme without destroying the widget
  useEffect(() => {
    const w = widgetRef.current;
    if (!w) return;

    const tryChangeTheme = () => {
      try {
        const chart = w.chart?.();
        if (chart?.changeTheme) {
          chart.changeTheme(darkMode ? "dark" : "light");
          return true;
        }
      } catch { /* fall through */ }
      return false;
    };

    if (tryChangeTheme()) return;

    // onChartReady may not have fired yet; wait for it
    if (w.onChartReady) {
      w.onChartReady(() => { tryChangeTheme(); });
    } else {
      // Widget doesn't support theme change API; recreate
      try {
        w.remove();
      } catch {
        // Container may already be removed — safe to ignore.
      }
      widgetRef.current = null;
      setLoading(true);
      if (containerRef.current && window.TradingView) {
        const widgetId = `tv_widget_${Date.now()}`;
        containerRef.current.innerHTML = `<div id="${widgetId}" style="width:100%;height:100%"></div>`;
        const widget = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: darkMode ? "dark" : "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          container_id: widgetId,
        });
        widgetRef.current = widget;
        setLoading(false);
      }
    }
  }, [darkMode, tvSymbol]);

  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="text-sm text-slate-400">Loading TradingView chart…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-400">
            Failed to load TradingView chart. Check your internet connection and try refreshing.
          </p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
