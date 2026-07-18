"use client";

import { useState, useEffect } from "react";
import type { LiveAsset } from "./types";
import { nameMap } from "./asset-icon";

const PAIR_PIP_SIZES: Record<string, number> = {
  "EUR/USD": 0.0001, "GBP/USD": 0.0001, "AUD/USD": 0.0001,
  "USD/JPY": 0.01, "USD/CHF": 0.0001, "USD/CAD": 0.0001,
  "XAU/USD": 0.01, "XAG/USD": 0.01,
  "BTC/USD": 1, "ETH/USD": 1,
};

const PAIR_CONTRACT_SIZES: Record<string, number> = {
  "EUR/USD": 100000, "GBP/USD": 100000, "AUD/USD": 100000,
  "USD/JPY": 100000, "USD/CHF": 100000, "USD/CAD": 100000,
  "XAU/USD": 100, "XAG/USD": 5000,
  "BTC/USD": 1, "ETH/USD": 1,
};

export function PositionSizeCalculator({ liveData }: { liveData: LiveAsset[] | null }) {
  const [calcPair, setCalcPair] = useState("XAU/USD");
  const [calcAccount, setCalcAccount] = useState("10000");
  const [calcRisk, setCalcRisk] = useState("1");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [calcMode, setCalcMode] = useState<"price" | "pips">("price");
  const [calcEntry, setCalcEntry] = useState("");
  const [calcStop, setCalcStop] = useState("");
  const [calcStopPips, setCalcStopPips] = useState("50");
  const [targetRR, setTargetRR] = useState("2");

  const livePriceForPair = liveData?.find((a) => a.symbol === calcPair)?.price;

  // Handle auto-load when pair changes
  const [prevPair, setPrevPair] = useState("XAU/USD");
  if (calcPair !== prevPair) {
    setPrevPair(calcPair);
    if (livePriceForPair) {
      setCalcEntry(livePriceForPair.toString());
      const pipSize = PAIR_PIP_SIZES[calcPair] || 0.0001;
      const defaultStopPips = calcPair.startsWith("BTC") || calcPair.startsWith("ETH") ? 500 : 50;
      const defaultStopDistance = defaultStopPips * pipSize;
      const initialStop = direction === "buy" ? livePriceForPair - defaultStopDistance : livePriceForPair + defaultStopDistance;
      setCalcStop(initialStop.toFixed(calcPair === "USD/JPY" || calcPair.startsWith("XAU") || calcPair.startsWith("XAG") ? 2 : 5));
    } else {
      setCalcEntry("");
      setCalcStop("");
    }
  }

  // Handle initial data load when it arrives
  useEffect(() => {
    if (livePriceForPair && !calcEntry) {
      setTimeout(() => {
        setCalcEntry(livePriceForPair.toString());
        const pipSize = PAIR_PIP_SIZES[calcPair] || 0.0001;
        const defaultStopPips = calcPair.startsWith("BTC") || calcPair.startsWith("ETH") ? 500 : 50;
        const defaultStopDistance = defaultStopPips * pipSize;
        const initialStop = direction === "buy" ? livePriceForPair - defaultStopDistance : livePriceForPair + defaultStopDistance;
        setCalcStop(initialStop.toFixed(calcPair === "USD/JPY" || calcPair.startsWith("XAU") || calcPair.startsWith("XAG") ? 2 : 5));
      }, 0);
    }
  }, [livePriceForPair, calcEntry, calcPair, direction]);

  const formatPriceVal = (val: number) => {
    if (calcPair.startsWith("BTC") || calcPair.startsWith("ETH")) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (calcPair === "USD/JPY" || calcPair === "XAU/USD" || calcPair === "XAG/USD") {
      return val.toFixed(2);
    }
    return val.toFixed(5);
  };

  const calcResult = (() => {
    const account = parseFloat(calcAccount);
    const risk = parseFloat(calcRisk);
    const entry = parseFloat(calcEntry);
    const rr = parseFloat(targetRR);
    if (!account || !risk || !entry || isNaN(entry)) return null;

    const pipSize = PAIR_PIP_SIZES[calcPair] || 0.0001;
    const contractSize = PAIR_CONTRACT_SIZES[calcPair] || 100000;
    const riskAmount = account * (risk / 100);

    let stopDistance = 0;
    let pipDistance = 0;
    let stopPriceValue = 0;

    if (calcMode === "price") {
      const stop = parseFloat(calcStop);
      if (!stop || entry === stop || isNaN(stop)) return null;
      stopDistance = Math.abs(entry - stop);
      pipDistance = stopDistance / pipSize;
      stopPriceValue = stop;
    } else {
      const pips = parseFloat(calcStopPips);
      if (!pips || pips <= 0 || isNaN(pips)) return null;
      pipDistance = pips;
      stopDistance = pips * pipSize;
      stopPriceValue = direction === "buy" ? entry - stopDistance : entry + stopDistance;
    }

    let pipValuePerLot: number;
    // Standard pip value calculations
    if (calcPair.endsWith("/USD") && !calcPair.startsWith("USD/")) {
      // Counter currency is USD
      pipValuePerLot = contractSize * pipSize;
    } else if (calcPair.startsWith("USD/")) {
      // Base currency is USD
      pipValuePerLot = (contractSize * pipSize) / entry;
    } else {
      pipValuePerLot = contractSize * pipSize;
    }

    const lots = riskAmount / (pipDistance * pipValuePerLot);
    const units = lots * contractSize;

    // Take Profit calculations
    const targetDistance = stopDistance * rr;
    const targetPrice = direction === "buy" ? entry + targetDistance : entry - targetDistance;
    const targetProfit = riskAmount * rr;

    return {
      riskAmount,
      stopDistance,
      pipDistance,
      pipValuePerLot,
      lots,
      units,
      stopPrice: stopPriceValue,
      targetPrice,
      targetProfit,
    };
  })();

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Management</p>
        <h2 className="text-xl font-bold">Position Size Calculator</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {/* Pair selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Trading Pair</label>
            <select
              value={calcPair}
              onChange={(e) => setCalcPair(e.target.value)}
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
            >
              {Object.keys(nameMap).map((sym) => (
                <option key={sym} value={sym}>{sym} — {nameMap[sym]}</option>
              ))}
            </select>
          </div>

          {/* Account & Risk */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Account Size ($)</label>
              <input
                type="number"
                value={calcAccount}
                onChange={(e) => setCalcAccount(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Risk (%)</label>
              <input
                type="number"
                value={calcRisk}
                onChange={(e) => setCalcRisk(e.target.value)}
                placeholder="1"
                step="0.1"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Direction & Calculation Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Direction</label>
              <div className="flex rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-1 dark:bg-white/[0.02]">
                <button
                  onClick={() => setDirection("buy")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    direction === "buy"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 animate-none"
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  onClick={() => setDirection("sell")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    direction === "sell"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 animate-none"
                  }`}
                >
                  Sell / Short
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Calculation Mode</label>
              <div className="flex rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-1 dark:bg-white/[0.02]">
                <button
                  onClick={() => setCalcMode("price")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    calcMode === "price"
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 animate-none"
                  }`}
                >
                  Price
                </button>
                <button
                  onClick={() => setCalcMode("pips")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    calcMode === "pips"
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 animate-none"
                  }`}
                >
                  Pips
                </button>
              </div>
            </div>
          </div>

          {/* Entry & Stop Loss inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Entry Price
                {livePriceForPair && (
                  <button
                    onClick={() => setCalcEntry(livePriceForPair.toString())}
                    className="ml-1.5 text-[var(--accent)] hover:underline"
                  >
                    use live
                  </button>
                )}
              </label>
              <input
                type="number"
                value={calcEntry}
                onChange={(e) => setCalcEntry(e.target.value)}
                placeholder={livePriceForPair ? livePriceForPair.toString() : "0.00"}
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
            <div>
              {calcMode === "price" ? (
                <>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Stop Loss Price</label>
                  <input
                    type="number"
                    value={calcStop}
                    onChange={(e) => setCalcStop(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </>
              ) : (
                <>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Stop Loss (Pips)</label>
                  <input
                    type="number"
                    value={calcStopPips}
                    onChange={(e) => setCalcStopPips(e.target.value)}
                    placeholder="50"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </>
              )}
            </div>
          </div>

          {/* Target Risk Reward */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Target Risk-to-Reward Ratio (R:R)</label>
            <div className="grid grid-cols-4 gap-2">
              {["1", "2", "3", "4"].map((rr) => (
                <button
                  key={rr}
                  onClick={() => setTargetRR(rr)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    targetRR === rr
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--card-border)] bg-[var(--card)] text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
                  }`}
                >
                  1:{rr}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Or custom:</span>
              <input
                type="number"
                value={targetRR}
                onChange={(e) => setTargetRR(e.target.value)}
                placeholder="2.0"
                step="0.1"
                className="w-20 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2.5 py-1 text-xs font-medium outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Results display */}
        <div className="space-y-3">
          {calcResult ? (
            <>
              {/* Position Size Card */}
              <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-4 dark:bg-white/[0.02]">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Position Size</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--foreground)]">
                  {calcResult.lots.toFixed(2)} <span className="text-lg text-slate-500 font-medium">lots</span>
                </p>
                <p className="mt-1 text-sm text-slate-500 tabular-nums">
                  {calcResult.units.toLocaleString("en-US", { maximumFractionDigits: 0 })} units
                </p>
              </div>

              {/* Sub-details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Amount</p>
                  <p className="mt-0.5 text-lg font-bold text-red-500 tabular-nums">${calcResult.riskAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Profit</p>
                  <p className="mt-0.5 text-lg font-bold text-emerald-600 tabular-nums">+${calcResult.targetProfit.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stop Price</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-slate-600 dark:text-slate-300">{formatPriceVal(calcResult.stopPrice)}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Price</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-slate-600 dark:text-slate-300">{formatPriceVal(calcResult.targetPrice)}</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stop Distance</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{calcResult.pipDistance.toFixed(1)} pips</p>
                </div>
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 p-3.5 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pip Value</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">${calcResult.pipValuePerLot.toFixed(2)}<span className="text-xs text-slate-500 font-medium">/lot</span></p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--card-border)] p-5 text-center">
              <p className="text-sm text-slate-400 leading-6">Enter account details, select long/short direction, and provide entry price with stop loss settings to calculate your optimal position sizing.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
