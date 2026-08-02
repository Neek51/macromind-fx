"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Candle } from "./lib/backtest";
import type { AIPrediction, VirtualTrade } from "./types";
import type { IChartApi, ISeriesApi, Time, IPriceLine, LineWidth } from "lightweight-charts";

type Props = {
  candles: Candle[];
  activePrice: number;
  prediction: AIPrediction | null;
  activeTrade: VirtualTrade | null;
  isPredictionExecuted?: boolean;
  height?: number;
};

export function PredictionChart({
  candles,
  activePrice,
  prediction,
  activeTrade,
  isPredictionExecuted = false,
  height = 420,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Core drawing logic for SMC overlays & Trade zones (defined at the top to satisfy declarations rules)
  const renderPriceOverlays = useCallback(() => {
    const series = mainSeriesRef.current;
    if (!series) return;

    // 1. Remove all old lines
    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    // Helper to draw horizontal lines with labels
    const drawLine = (price: number, label: string, color: string, style = 2, width = 1) => {
      try {
        const line = series.createPriceLine({
          price,
          color,
          lineWidth: width as LineWidth,
          lineStyle: style, // 0 = Solid, 1 = Dotted, 2 = Dashed
          axisLabelVisible: true,
          title: label,
        });
        priceLinesRef.current.push(line);
      } catch (e) {
        console.error("Error drawing price line:", e);
      }
    };

    // 2. Identify active levels (Priority: Active Trade > Suggested Trade)
    let tradeData = null;
    let labelPrefix = "";

    if (activeTrade) {
      tradeData = {
        entry: activeTrade.entry,
        stopLoss: activeTrade.stopLoss,
        takeProfit: activeTrade.takeProfit,
      };
      labelPrefix = activeTrade.status === "open" ? "Live Trade" : "Historical Trade";
    } else if (prediction?.suggestedTrade && !isPredictionExecuted) {
      tradeData = prediction.suggestedTrade;
      labelPrefix = "AI Proposing";
    }

    // 3. Draw Trade Zones (Entry, SL, TP)
    if (tradeData) {
      const greenColor = "#10b981"; // Emerald
      const redColor = "#ef4444"; // Rose
      const entryColor = "#3b82f6"; // Blue

      drawLine(tradeData.entry, `${labelPrefix} Entry`, entryColor, 0, 2); // Solid entry
      drawLine(tradeData.takeProfit, `TP (Target)`, greenColor, 2, 2); // Dashed TP
      drawLine(tradeData.stopLoss, `SL (Risk)`, redColor, 2, 2); // Dashed SL
    }

    // 4. Draw SMC Structures from Prediction (OB, FVG, Inducement)
    if (prediction) {
      const { smcFeatures } = prediction;

      if (smcFeatures) {
        // Order Block (OB) Line
        if (smcFeatures.nearestOB) {
          const obColor = smcFeatures.nearestOB.type === "bullish" ? "#10b981" : "#ef4444";
          drawLine(
            smcFeatures.nearestOB.price,
            `SMC OB (${smcFeatures.nearestOB.type})`,
            obColor,
            1, // Dotted
            1
          );
        }

        // Fair Value Gap (FVG) Zone (Top & Bottom Boundaries)
        if (smcFeatures.activeFVG) {
          const fvgColor = "#d97757"; // Coral gap color
          drawLine(smcFeatures.activeFVG.top, "FVG Top", fvgColor, 1, 1);
          drawLine(smcFeatures.activeFVG.bottom, "FVG Bottom", fvgColor, 1, 1);
        }

        // Inducement (IDM) Line
        if (smcFeatures.inducementLevel) {
          drawLine(
            smcFeatures.inducementLevel,
            "SMC Inducement (Trap)",
            "#f59e0b", // Amber warning color
            1, // Dotted
            1
          );
        }
      }
    }
  }, [prediction, activeTrade, isPredictionExecuted]);

  // Effect to initialize chart canvas
  useEffect(() => {
    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;

    async function initChart() {
      if (!containerRef.current || candles.length === 0) return;

      try {
        const LC = await import("lightweight-charts");

        // Clear existing chart container
        containerRef.current.innerHTML = "";

        const isDark = document.documentElement.classList.contains("dark");
        const textColor = isDark ? "#e8e6e0" : "#1a1a17";
        const gridColor = isDark ? "#3a3833" : "#e8e6e0";
        const axisBorderColor = isDark ? "#3a3833" : "#e8e6e0";

        // Create Chart
        chart = LC.createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height,
          layout: {
            background: { color: "transparent" },
            textColor,
            fontFamily: "var(--font-geist-mono), monospace",
          },
          grid: {
            vertLines: { color: gridColor },
            horzLines: { color: gridColor },
          },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: axisBorderColor },
          timeScale: { 
            borderColor: axisBorderColor, 
            timeVisible: true,
            tickMarkFormatter: (time: unknown) => {
              try {
                const timestamp = typeof time === "number" ? time * 1000 : new Date(time as string).getTime();
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              } catch {
                return String(time);
              }
            }
          },
          localization: {
            timeFormatter: (time: unknown) => {
              try {
                const timestamp = typeof time === "number" ? time * 1000 : new Date(time as string).getTime();
                const date = new Date(timestamp);
                return date.toLocaleString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
              } catch {
                return String(time);
              }
            }
          }
        });

        chartInstanceRef.current = chart;

        // Add Candlestick Series
        series = chart.addSeries(LC.CandlestickSeries, {
          upColor: "#10b981",
          downColor: "#ef4444",
          borderUpColor: "#10b981",
          borderDownColor: "#ef4444",
          wickUpColor: "#10b981",
          wickDownColor: "#ef4444",
        });

        mainSeriesRef.current = series;

        // Map and load initial candle data
        const candleData = candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        series.setData(candleData);
        chart.timeScale().fitContent();

        // Trigger first rendering of price overlays
        renderPriceOverlays();

      } catch (err) {
        console.error("Failed to initialize Prediction Chart:", err);
      }
    }

    void initChart();

    const handleResize = () => {
      if (chart && containerRef.current) {
        try {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        } catch (e) {
          console.warn("Chart resize failed:", e);
        }
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chart) {
        try {
          chart.remove();
        } catch (e) {
          console.error("Chart cleanup error:", e);
        }
      }
      chartInstanceRef.current = null;
      mainSeriesRef.current = null;
    };
  }, [candles, height, renderPriceOverlays]);

  // Effect to update live price tick in the last candle
  useEffect(() => {
    const series = mainSeriesRef.current;
    if (!series || candles.length === 0 || !activePrice) return;

    const lastCandle = candles[candles.length - 1];
    const updatedCandle = {
      time: lastCandle.time as Time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, activePrice),
      low: Math.min(lastCandle.low, activePrice),
      close: activePrice,
    };

    try {
      series.update(updatedCandle);
    } catch (e) {
      console.warn("Failed to tick live price to chart:", e);
    }
  }, [activePrice, candles]);

  // Effect to re-render overlay lines (Entry, SL, TP, FVG, OB) when overlays change
  useEffect(() => {
    if (chartInstanceRef.current && mainSeriesRef.current) {
      renderPriceOverlays();
    }
  }, [renderPriceOverlays]);

  return (
    <div className="relative w-full rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-2 dark:bg-[#1f1e1b] overflow-hidden">
      <div ref={containerRef} className="w-full" style={{ height }} />
      {/* Visual Indicator Legends */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" /> Entry
        </span>
        <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" /> Target
        </span>
        <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Stop Loss
        </span>
        {prediction?.smcFeatures?.activeFVG && (
          <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d97757]" /> FVG Imbalance
          </span>
        )}
        {prediction?.smcFeatures?.inducementLevel && (
          <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" /> IDM Trap
          </span>
        )}
      </div>
    </div>
  );
}
