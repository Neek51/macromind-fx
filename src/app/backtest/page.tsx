"use client";

import { useState, useCallback } from "react";
import { Card, PageShell } from "../components";
import { formatPrice, nameMap } from "../asset-icon";
import { BacktestChart } from "./backtest-chart";
import { EquityCurveChart } from "./equity-chart";
import { runBacktest, DEFAULT_STRATEGY, type Candle, type BacktestResult, type StrategyConfig, type RuleCondition } from "../lib/backtest";

const ASSETS = [
  "XAU/USD", "XAG/USD", "EUR/USD", "GBP/USD", "USD/JPY",
  "USD/CHF", "AUD/USD", "USD/CAD", "BTC/USD", "ETH/USD",
];

const TIMEFRAMES = [
  { label: "1 Hour", value: "1h" },
  { label: "4 Hour", value: "4h" },
  { label: "1 Day", value: "1d" },
  { label: "1 Week", value: "1wk" },
];

const RANGES = [
  { label: "1 Month", value: "1mo" },
  { label: "3 Months", value: "3mo" },
  { label: "6 Months", value: "6mo" },
  { label: "1 Year", value: "1y" },
  { label: "2 Years", value: "2y" },
];

export default function BacktestPage() {
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_STRATEGY);
  const [timeframe, setTimeframe] = useState("1d");
  const [range, setRange] = useState("1y");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pineCode, setPineCode] = useState("");
  const [parsingPine, setParsingPine] = useState(false);
  const [pineSuccess, setPineSuccess] = useState<string | null>(null);
  const [pineError, setPineError] = useState<string | null>(null);

  const handlePineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === "string") {
        setPineCode(event.target.result);
        setPineSuccess("Pine Script file loaded! Click 'Analyze & Configure' to apply.");
        setPineError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePine = async () => {
    if (!pineCode.trim()) {
      setPineError("Please paste or upload some Pine Script code first.");
      return;
    }
    setParsingPine(true);
    setPineSuccess(null);
    setPineError(null);

    try {
      const res = await fetch("/api/backtest/parse-pine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pineScript: pineCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse Pine Script");
      }

      const parsed = await res.json();

      setConfig((prev) => ({
        ...prev,
        emaFast: parsed.emaFast ?? prev.emaFast,
        emaMedium: parsed.emaMedium ?? prev.emaMedium,
        emaSlow: parsed.emaSlow ?? prev.emaSlow,
        emaTrend: parsed.emaTrend ?? prev.emaTrend,
        rsiPeriod: parsed.rsiPeriod ?? prev.rsiPeriod,
        rsiOversold: parsed.rsiOversold ?? prev.rsiOversold,
        rsiOverbought: parsed.rsiOverbought ?? prev.rsiOverbought,
        atrPeriod: parsed.atrPeriod ?? prev.atrPeriod,
        stopLossMultiplier: parsed.stopLossMultiplier ?? prev.stopLossMultiplier,
        takeProfitMultiplier: parsed.takeProfitMultiplier ?? prev.takeProfitMultiplier,
        buyRules: parsed.buyRules ?? prev.buyRules,
        sellRules: parsed.sellRules ?? prev.sellRules,
      }));

      setPineSuccess("AI successfully parsed your script! Dynamic rules and indicators have been updated below.");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setPineError(errMsg);
    } finally {
      setParsingPine(false);
    }
  };

  const runBacktestFlow = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setCandles([]);

    try {
      // Step 1: Fetch historical data
      const res = await fetch(`/api/history?symbol=${config.symbol}&range=${range}&interval=${timeframe}`);
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        setError("No historical data available for this symbol/range.");
        setLoading(false);
        return;
      }

      const historicalCandles: Candle[] = json.data;
      setCandles(historicalCandles);

      // Step 2: Run backtest engine
      const btResult = runBacktest(historicalCandles, config);
      setResult(btResult);
    } catch {
      setError("Failed to run backtest. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [config, timeframe, range]);

  const updateConfig = (key: keyof StrategyConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]:
        typeof value === "string" && !isNaN(Number(value)) && value.trim() !== "" && key !== "symbol" && key !== "strategyType"
          ? Number(value)
          : value,
    }));
  };

  const addBuyRule = () => {
    setConfig((prev) => ({
      ...prev,
      buyRules: [...prev.buyRules, { left: "close", operator: "greater_than", right: "value", value: 0 }],
    }));
  };

  const removeBuyRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      buyRules: prev.buyRules.filter((_, i) => i !== index),
    }));
  };

  const updateBuyRule = (index: number, field: keyof RuleCondition, val: string | number) => {
    setConfig((prev) => {
      const copy = [...prev.buyRules];
      copy[index] = { ...copy[index], [field]: val } as RuleCondition;
      return { ...prev, buyRules: copy };
    });
  };

  const addSellRule = () => {
    setConfig((prev) => ({
      ...prev,
      sellRules: [...prev.sellRules, { left: "close", operator: "less_than", right: "value", value: 0 }],
    }));
  };

  const removeSellRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      sellRules: prev.sellRules.filter((_, i) => i !== index),
    }));
  };

  const updateSellRule = (index: number, field: keyof RuleCondition, val: string | number) => {
    setConfig((prev) => {
      const copy = [...prev.sellRules];
      copy[index] = { ...copy[index], [field]: val } as RuleCondition;
      return { ...prev, sellRules: copy };
    });
  };

  const stats = result?.stats;

  return (
    <PageShell title="Strategy Backtester" label="Backtest" action="Run Backtest" onActionClick={runBacktestFlow}>
      {/* Strategy Builder */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
            <path d="M9 3v18M3 12h12M21 6l-6 6 6 6" />
          </svg>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Strategy Configuration</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* Asset Selector */}
          <Card className="p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Asset</label>
            <select
              value={config.symbol}
              onChange={(e) => updateConfig("symbol", e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {ASSETS.map((s) => (
                <option key={s} value={s}>{s} — {nameMap[s] ?? s}</option>
              ))}
            </select>

            <label className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">History Range</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Card>

          {/* Indicators */}
          <Card className="p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">EMA Fast (Entry Signal)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="3" max="50" value={config.emaFast} onChange={(e) => updateConfig("emaFast", e.target.value)} className="flex-1 accent-[var(--accent)]" />
              <span className="w-10 text-right text-sm font-bold tabular-nums">{config.emaFast}</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">EMA Medium (Trend Filter)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="10" max="100" value={config.emaMedium} onChange={(e) => updateConfig("emaMedium", e.target.value)} className="flex-1 accent-[var(--accent)]" />
              <span className="w-10 text-right text-sm font-bold tabular-nums">{config.emaMedium}</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">EMA Trend (Long-term)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="50" max="300" value={config.emaTrend} onChange={(e) => updateConfig("emaTrend", e.target.value)} className="flex-1 accent-[var(--accent)]" />
              <span className="w-10 text-right text-sm font-bold tabular-nums">{config.emaTrend}</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">RSI Period</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="5" max="30" value={config.rsiPeriod} onChange={(e) => updateConfig("rsiPeriod", e.target.value)} className="flex-1 accent-[var(--accent)]" />
              <span className="w-10 text-right text-sm font-bold tabular-nums">{config.rsiPeriod}</span>
            </div>
          </Card>

          {/* RSI Thresholds */}
          <Card className="p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">RSI Oversold (Buy Zone)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="15" max="40" value={config.rsiOversold} onChange={(e) => updateConfig("rsiOversold", e.target.value)} className="flex-1 accent-emerald-500" />
              <span className="w-10 text-right text-sm font-bold tabular-nums text-emerald-600">{config.rsiOversold}</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">RSI Overbought (Short Zone)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="60" max="85" value={config.rsiOverbought} onChange={(e) => updateConfig("rsiOverbought", e.target.value)} className="flex-1 accent-red-500" />
              <span className="w-10 text-right text-sm font-bold tabular-nums text-red-500">{config.rsiOverbought}</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">ATR Period (Volatility)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="5" max="30" value={config.atrPeriod} onChange={(e) => updateConfig("atrPeriod", e.target.value)} className="flex-1 accent-[var(--accent)]" />
              <span className="w-10 text-right text-sm font-bold tabular-nums">{config.atrPeriod}</span>
            </div>
          </Card>

          {/* Risk Management */}
          <Card className="p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stop Loss (×ATR)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="0.5" max="5" step="0.1" value={config.stopLossMultiplier} onChange={(e) => updateConfig("stopLossMultiplier", e.target.value)} className="flex-1 accent-red-500" />
              <span className="w-10 text-right text-sm font-bold tabular-nums text-red-500">{config.stopLossMultiplier}×</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Take Profit (×ATR)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="1" max="15" step="0.5" value={config.takeProfitMultiplier} onChange={(e) => updateConfig("takeProfitMultiplier", e.target.value)} className="flex-1 accent-emerald-500" />
              <span className="w-10 text-right text-sm font-bold tabular-nums text-emerald-600">{config.takeProfitMultiplier}×</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Per Trade (%)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="0.5" max="10" step="0.5" value={config.riskPerTrade} onChange={(e) => updateConfig("riskPerTrade", e.target.value)} className="flex-1 accent-amber-500" />
              <span className="w-10 text-right text-sm font-bold tabular-nums text-amber-600">{config.riskPerTrade}%</span>
            </div>

            <label className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Initial Capital ($)</label>
            <input type="number" value={config.initialCapital} onChange={(e) => updateConfig("initialCapital", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm font-bold tabular-nums outline-none focus:border-[var(--accent)]" />
          </Card>
        </div>
      </section>

      {/* Strategy Mode Selector & Rule Builder */}
      <section className="mt-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Backtest Model Type</p>
              <h2 className="mt-1 text-lg font-bold">Strategy Logic Engine</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfig(prev => ({ ...prev, strategyType: "preset_ultimate" }))}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  config.strategyType === "preset_ultimate"
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--card-border)] bg-[var(--card)] text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                Fx Ultimate Presets
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, strategyType: "custom_rules" }))}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  config.strategyType === "custom_rules"
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--card-border)] bg-[var(--card)] text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                Custom Rules Builder
              </button>
            </div>
          </div>

          {config.strategyType === "preset_ultimate" ? (
            <div className="mt-5 rounded-xl bg-slate-50/50 p-4 border border-[var(--card-border)] dark:bg-white/[0.01] text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
              <p className="font-bold text-slate-800 dark:text-slate-200">System Strategy: Fx Ultimate (Default)</p>
              <p className="mt-1">
                Executes trades based on professional algorithmic setups: Trend filters via the EMA 200, deep pullbacks (RSI bounce from oversold levels), shallow EMA 21 pullbacks, and breakout confirmations of 5-bar highs. Fits optimal risk parameters based on ATR volatility indicators.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Pine Script AI Importer Panel */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-slate-50/30 p-5 dark:bg-white/[0.005]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[var(--accent)] animate-pulse">
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                      Pine Script AI Configurator
                    </h3>
                    <p className="text-xs text-slate-500 max-w-2xl">
                      Upload or paste your TradingView Pine Script (.pine) strategy. The AI parser will scan the indicators, parameters, and entry triggers to instantly configure the rules below.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3.5 py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer shadow-sm">
                      Choose Pine File
                      <input
                        type="file"
                        accept=".pine,.txt"
                        onChange={handlePineUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleParsePine}
                      disabled={parsingPine}
                      className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                    >
                      {parsingPine ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Parsing...
                        </>
                      ) : (
                        "Analyze & Configure"
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <textarea
                    rows={4}
                    value={pineCode}
                    onChange={(e) => setPineCode(e.target.value)}
                    placeholder="Paste your Pine Script code here..."
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-xs font-mono outline-none focus:border-[var(--accent)] leading-relaxed resize-y"
                  />
                </div>

                {pineSuccess && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs font-semibold text-emerald-600 dark:border-emerald-500/10 dark:bg-emerald-500/5">
                    {pineSuccess}
                  </div>
                )}
                {pineError && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs font-semibold text-red-500 dark:border-red-500/10 dark:bg-red-500/5">
                    {pineError}
                  </div>
                )}
              </div>

              {/* Rules Grid */}
              <div className="grid gap-6 md:grid-cols-2">
              {/* Buy rules block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Long Entry Rules (BUY)
                  </h3>
                  <button
                    onClick={addBuyRule}
                    className="text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    + Add Condition
                  </button>
                </div>

                {config.buyRules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No conditions defined. Click &quot;Add Condition&quot; above.</p>
                ) : (
                  <div className="space-y-3">
                    {config.buyRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-slate-50/20 p-3 dark:bg-white/[0.005]">
                        <select
                          value={rule.left}
                          onChange={(e) => updateBuyRule(idx, "left", e.target.value as RuleCondition["left"])}
                          className="w-1/3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="close">Close Price</option>
                          <option value="emaFast">EMA Fast</option>
                          <option value="emaMedium">EMA Med</option>
                          <option value="emaSlow">EMA Slow</option>
                          <option value="emaTrend">EMA Trend</option>
                          <option value="rsi">RSI</option>
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) => updateBuyRule(idx, "operator", e.target.value as RuleCondition["operator"])}
                          className="w-1/4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="greater_than">&gt;</option>
                          <option value="less_than">&lt;</option>
                          <option value="crosses_above">Crosses Above</option>
                          <option value="crosses_below">Crosses Below</option>
                        </select>

                        <select
                          value={rule.right}
                          onChange={(e) => updateBuyRule(idx, "right", e.target.value as RuleCondition["right"])}
                          className="w-1/3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="emaFast">EMA Fast</option>
                          <option value="emaMedium">EMA Med</option>
                          <option value="emaSlow">EMA Slow</option>
                          <option value="emaTrend">EMA Trend</option>
                          <option value="rsi">RSI</option>
                          <option value="value">Value</option>
                        </select>

                        {rule.right === "value" && (
                          <input
                            type="number"
                            value={rule.value ?? 0}
                            onChange={(e) => updateBuyRule(idx, "value", Number(e.target.value))}
                            className="w-20 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-xs font-bold outline-none focus:border-[var(--accent)]"
                          />
                        )}

                        <button
                          onClick={() => removeBuyRule(idx)}
                          className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sell rules block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                  <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Short Entry Rules (SELL)
                  </h3>
                  <button
                    onClick={addSellRule}
                    className="text-xs font-bold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    + Add Condition
                  </button>
                </div>

                {config.sellRules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No conditions defined. Click &quot;Add Condition&quot; above.</p>
                ) : (
                  <div className="space-y-3">
                    {config.sellRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-slate-50/20 p-3 dark:bg-white/[0.005]">
                        <select
                          value={rule.left}
                          onChange={(e) => updateSellRule(idx, "left", e.target.value as RuleCondition["left"])}
                          className="w-1/3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="close">Close Price</option>
                          <option value="emaFast">EMA Fast</option>
                          <option value="emaMedium">EMA Med</option>
                          <option value="emaSlow">EMA Slow</option>
                          <option value="emaTrend">EMA Trend</option>
                          <option value="rsi">RSI</option>
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) => updateSellRule(idx, "operator", e.target.value as RuleCondition["operator"])}
                          className="w-1/4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="greater_than">&gt;</option>
                          <option value="less_than">&lt;</option>
                          <option value="crosses_above">Crosses Above</option>
                          <option value="crosses_below">Crosses Below</option>
                        </select>

                        <select
                          value={rule.right}
                          onChange={(e) => updateSellRule(idx, "right", e.target.value as RuleCondition["right"])}
                          className="w-1/3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-xs font-semibold outline-none focus:border-[var(--accent)] cursor-pointer"
                        >
                          <option value="emaFast">EMA Fast</option>
                          <option value="emaMedium">EMA Med</option>
                          <option value="emaSlow">EMA Slow</option>
                          <option value="emaTrend">EMA Trend</option>
                          <option value="rsi">RSI</option>
                          <option value="value">Value</option>
                        </select>

                        {rule.right === "value" && (
                          <input
                            type="number"
                            value={rule.value ?? 0}
                            onChange={(e) => updateSellRule(idx, "value", Number(e.target.value))}
                            className="w-20 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-xs font-bold outline-none focus:border-[var(--accent)]"
                          />
                        )}

                        <button
                          onClick={() => removeSellRule(idx)}
                          className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </Card>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="text-sm font-semibold text-slate-500">Fetching historical data & running backtest...</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !loading && stats && (
        <>
          {/* Stats Cards */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="M3 3v18h18M7 14l4-4 4 4 6-6" />
              </svg>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Performance Results</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Return</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${stats.totalReturn >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {stats.totalReturn >= 0 ? "+" : ""}{stats.totalReturn.toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">${(config.initialCapital * (1 + stats.totalReturn / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })} → ${(config.initialCapital).toLocaleString("en-US")} start</p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Win Rate</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{stats.winRate.toFixed(1)}%</p>
                <p className="mt-1 text-xs text-slate-500">{stats.wins}W / {stats.losses}L · {stats.totalTrades} trades</p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profit Factor</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${stats.profitFactor >= 1.5 ? "text-emerald-600" : stats.profitFactor >= 1 ? "text-amber-600" : "text-red-500"}`}>
                  {stats.profitFactor.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Sharpe: {stats.sharpeRatio}</p>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Max Drawdown</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-red-500">-{stats.maxDrawdown.toFixed(2)}%</p>
                <p className="mt-1 text-xs text-slate-500">Best: +{stats.bestTrade.toFixed(1)}% · Worst: {stats.worstTrade.toFixed(1)}%</p>
              </Card>
            </div>
          </section>

          {/* Candlestick Chart — full width */}
          <section>
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Candlestick Chart</p>
                  <h3 className="text-base font-bold">{config.symbol} · {TIMEFRAMES.find(t => t.value === timeframe)?.label} · {RANGES.find(r => r.value === range)?.label}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> EMA {config.emaFast}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> EMA {config.emaTrend}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Buy</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Sell</span>
                </div>
              </div>
              <div className="overflow-hidden p-2">
                {candles.length > 0 && (
                  <BacktestChart
                    candles={candles}
                    signals={result.signals}
                    emaFastPeriod={config.emaFast}
                    emaSlowPeriod={config.emaTrend}
                    height={420}
                  />
                )}
              </div>
            </Card>
          </section>

          {/* Equity Curve + Quick Stats — side by side, full width */}
          <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Card className="p-0">
              <div className="border-b border-[var(--card-border)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Equity Curve</p>
              </div>
              <div className="overflow-hidden p-4">
                {result.equityCurve.length > 0 && (
                  <EquityCurveChart data={result.equityCurve} height={200} />
                )}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Quick Stats</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Avg Win</span>
                  <span className="font-bold text-emerald-600 tabular-nums">+{stats.avgWin.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Avg Loss</span>
                  <span className="font-bold text-red-500 tabular-nums">{stats.avgLoss.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Avg Bars</span>
                  <span className="font-bold tabular-nums">{stats.avgBarsHeld.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Risk/Reward</span>
                  <span className="font-bold tabular-nums">1:{(config.takeProfitMultiplier / config.stopLossMultiplier).toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-[var(--card-border)] pt-3">
                  <span className="text-slate-500">Best Trade</span>
                  <span className="font-bold text-emerald-600 tabular-nums">+{stats.bestTrade.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Worst Trade</span>
                  <span className="font-bold text-red-500 tabular-nums">{stats.worstTrade.toFixed(2)}%</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Trade List */}
          {result.trades.length > 0 && (
            <section>
              <Card className="p-0">
                <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trade History</p>
                    <h3 className="text-base font-bold">{result.trades.length} trades executed</h3>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 bg-[var(--card)] text-xs uppercase tracking-wider text-slate-400">
                      <tr className="border-b border-[var(--card-border)]">
                        <th className="px-5 py-3 font-semibold">#</th>
                        <th className="px-5 py-3 font-semibold">Direction</th>
                        <th className="px-5 py-3 font-semibold">Entry</th>
                        <th className="px-5 py-3 font-semibold">Exit</th>
                        <th className="px-5 py-3 font-semibold">P&L %</th>
                        <th className="px-5 py-3 font-semibold">P&L $</th>
                        <th className="px-5 py-3 font-semibold">Bars</th>
                        <th className="px-5 py-3 font-semibold">Exit Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((t, i) => (
                        <tr key={i} className="border-b border-[var(--card-border)] last:border-0 hover:bg-slate-50/60 dark:hover:bg-white/[0.03]">
                          <td className="px-5 py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                          <td className="px-5 py-2.5">
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${t.direction === "long" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" : "bg-red-50 text-red-500 dark:bg-red-50/10"}`}>
                              {t.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 tabular-nums text-slate-500">
                            {formatPrice(config.symbol, t.entryPrice)}
                          </td>
                          <td className="px-5 py-2.5 tabular-nums text-slate-500">
                            {formatPrice(config.symbol, t.exitPrice)}
                          </td>
                          <td className={`px-5 py-2.5 font-bold tabular-nums ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}%
                          </td>
                          <td className={`px-5 py-2.5 font-bold tabular-nums ${t.pnlUsd >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {t.pnlUsd >= 0 ? "+" : ""}${Math.abs(t.pnlUsd).toFixed(2)}
                          </td>
                          <td className="px-5 py-2.5 tabular-nums text-slate-500">{t.barsHeld}</td>
                          <td className="px-5 py-2.5">
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                              t.exitReason === "take_profit" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-50/10" :
                              t.exitReason === "stop_loss" ? "bg-red-50 text-red-500 dark:bg-red-50/10" :
                              "bg-slate-100 text-slate-500 dark:bg-white/5"
                            }`}>
                              {t.exitReason === "take_profit" ? "TP" : t.exitReason === "stop_loss" ? "SL" : "Signal"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18M7 14l4-4 4 4 6-6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Ready to Backtest</h3>
              <p className="mt-1 text-sm text-slate-500">Configure your strategy parameters above and click &quot;Run Backtest&quot; to see performance results.</p>
            </div>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
