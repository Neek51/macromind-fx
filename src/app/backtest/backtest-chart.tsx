"use client";

import { useEffect, useRef } from "react";
import type { Candle } from "../lib/backtest";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";

type Props = {
  candles: Candle[];
  signals?: Array<{ time: number; type: "buy" | "sell"; price: number }>;
  emaFastPeriod?: number;
  emaSlowPeriod?: number;
  height?: number;
};

export function BacktestChart({
  candles,
  signals = [],
  emaFastPeriod = 9,
  emaSlowPeriod = 50,
  height = 420,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;

    async function init() {
      if (!containerRef.current || candles.length === 0) return;

      try {
        const LC = await import("lightweight-charts");

        // Create chart
        chart = LC.createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height,
          layout: {
            background: { color: "transparent" },
            textColor: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "#1a1a17",
            fontFamily: "var(--font-geist-mono), monospace",
          },
          grid: {
            vertLines: { color: getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "#e8e6e0" },
            horzLines: { color: getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "#e8e6e0" },
          },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "#e8e6e0" },
          timeScale: { borderColor: getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "#e8e6e0", timeVisible: true },
        });

        chartRef.current = chart;

        // Candlestick series
        series = chart.addSeries(LC.CandlestickSeries, {
          upColor: "#10b981",
          downColor: "#ef4444",
          borderUpColor: "#10b981",
          borderDownColor: "#ef4444",
          wickUpColor: "#10b981",
          wickDownColor: "#ef4444",
        });

        const candleData = candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        series.setData(candleData);

        // Add EMA overlay (fast + slow)
        const emaFastData = calcEmaOverlay(candles, emaFastPeriod);
        const emaSlowData = calcEmaOverlay(candles, emaSlowPeriod);

        const emaFastSeries = chart.addSeries(LC.LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        emaFastSeries.setData(emaFastData);

        const emaSlowSeries = chart.addSeries(LC.LineSeries, {
          color: "#d97757",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        emaSlowSeries.setData(emaSlowData);

        // Buy/sell markers
        const markers = signals.map((s) => ({
          time: s.time as Time,
          position: (s.type === "buy" ? "belowBar" : "aboveBar") as "belowBar" | "aboveBar",
          color: s.type === "buy" ? "#10b981" : "#ef4444",
          shape: (s.type === "buy" ? "arrowUp" : "arrowDown") as "arrowUp" | "arrowDown",
          text: s.type === "buy" ? "BUY" : "SELL",
        }));

        if (markers.length > 0) {
          LC.createSeriesMarkers(series, markers);
        }

        chart.timeScale().fitContent();
      } catch (err) {
        console.error("Chart init error:", err);
      }
    }

    init();

    // Resize handler
    const handleResize = () => {
      if (chart && containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart) {
        try { chart.remove(); } catch {}
      }
    };
  }, [candles, signals, height, emaFastPeriod, emaSlowPeriod]);

  return <div ref={containerRef} className="w-full overflow-hidden" style={{ height, position: "relative" }} />;
}

function calcEmaOverlay(candles: Candle[], period: number): Array<{ time: Time; value: number }> {
  const k = 2 / (period + 1);
  let prev = candles[0]?.close ?? 0;
  const result: Array<{ time: Time; value: number }> = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      prev = candles[i].close;
    } else {
      prev = candles[i].close * k + prev * (1 - k);
    }
    result.push({ time: candles[i].time as Time, value: prev });
  }
  return result;
}
