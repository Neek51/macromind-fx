"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, Time } from "lightweight-charts";

type Props = {
  data: Array<{ time: number; equity: number }>;
  height?: number;
};

export function EquityCurveChart({ data, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: IChartApi | null = null;

    async function init() {
      if (!containerRef.current || data.length === 0) return;

      try {
        const LC = await import("lightweight-charts");

        chart = LC.createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height,
          layout: {
            background: { color: "transparent" },
            textColor: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#8a8880",
            fontFamily: "var(--font-geist-mono), monospace",
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { color: getComputedStyle(document.documentElement).getPropertyValue("--card-border").trim() || "#e8e6e0" },
          },
          crosshair: { mode: 0 },
          rightPriceScale: { borderColor: "transparent" },
          timeScale: { visible: false },
        });

        const series = chart.addSeries(LC.AreaSeries, {
          lineColor: "#d97757",
          topColor: "rgba(217, 119, 87, 0.2)",
          bottomColor: "rgba(217, 119, 87, 0.01)",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        series.setData(
          data.map((d) => ({
            time: d.time as Time,
            value: d.equity,
          })),
        );

        chart.timeScale().fitContent();
      } catch (err) {
        console.error("Equity chart init error:", err);
      }
    }

    init();

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
  }, [data, height]);

  return <div ref={containerRef} className="w-full overflow-hidden" style={{ height, position: "relative" }} />;
}
