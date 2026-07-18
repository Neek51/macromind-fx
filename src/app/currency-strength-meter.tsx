"use client";

import type { LiveAsset } from "./types";
import Image from "next/image";

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "https://s3-symbol-logo.tradingview.com/country/US.svg",
  EUR: "https://s3-symbol-logo.tradingview.com/country/EU.svg",
  GBP: "https://s3-symbol-logo.tradingview.com/country/GB.svg",
  JPY: "https://s3-symbol-logo.tradingview.com/country/JP.svg",
  CHF: "https://s3-symbol-logo.tradingview.com/country/CH.svg",
  AUD: "https://s3-symbol-logo.tradingview.com/country/AU.svg",
  CAD: "https://s3-symbol-logo.tradingview.com/country/CA.svg",
};

const FOREX_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD"];

function calculateCurrencyStrength(assets: LiveAsset[]) {
  const strengths: Record<string, number> = { USD: 0, EUR: 0, GBP: 0, JPY: 0, CHF: 0, AUD: 0, CAD: 0 };

  for (const asset of assets) {
    if (!FOREX_PAIRS.includes(asset.symbol)) continue;
    const [base, quote] = asset.symbol.split("/");
    const change = asset.percent_change;
    strengths[base] = (strengths[base] || 0) + change;
    strengths[quote] = (strengths[quote] || 0) - change;
  }

  const maxAbs = Math.max(...Object.values(strengths).map((v) => Math.abs(v)), 0.01);

  return Object.entries(strengths)
    .map(([currency, strength]) => ({
      currency,
      strength,
      normalized: strength / maxAbs,
      flag: CURRENCY_FLAGS[currency],
    }))
    .sort((a, b) => b.strength - a.strength);
}

export function CurrencyStrengthMeter({ assets, loading }: { assets: LiveAsset[]; loading: boolean }) {
  const currencyStrength = calculateCurrencyStrength(assets);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Real-time</p>
          <h2 className="text-xl font-bold">Currency Strength Meter</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {loading ? "Calculating..." : "Live"}
        </span>
      </div>

      <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {currencyStrength.map((c) => {
          const isPositive = c.strength >= 0;
          const barWidth = Math.abs(c.normalized) * 100;
          return (
            <div key={c.currency} className="flex items-center gap-3">
              <Image
                src={c.flag}
                alt={c.currency}
                width={24}
                height={24}
                unoptimized
                className="shrink-0 rounded-full"
                style={{ width: 24, height: 24, minWidth: 24 }}
              />
              <span className="w-8 shrink-0 text-sm font-bold">{c.currency}</span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                    isPositive
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                  style={{ width: `${Math.max(barWidth, 3)}%` }}
                />
              </div>
              <span className={`w-12 shrink-0 text-right text-sm font-bold tabular-nums ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              }`}>
                {isPositive ? "+" : ""}{c.strength.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Strength is calculated by aggregating % changes across all forex pairs. Positive = strong, negative = weak.
      </p>
    </>
  );
}
