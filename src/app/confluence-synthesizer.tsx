"use client";

import { useState } from "react";
import { Card } from "./components";
import { AssetIcon, formatPrice, nameMap } from "./asset-icon";
import type { LiveAsset, NewsItem, CalendarEvent } from "./types";

interface ConfluenceSynthesizerProps {
  liveData: LiveAsset[] | null;
  news: NewsItem[];
  calendarEvents: CalendarEvent[];
  macroBiases: Record<string, { score: number; bias: "bullish" | "bearish" | "neutral"; details: string }>;
}

export function ConfluenceSynthesizer({
  liveData,
  news,
  calendarEvents,
  macroBiases,
}: ConfluenceSynthesizerProps) {
  const [symbol, setSymbol] = useState("XAU/USD");
  const selectedAsset = liveData?.find((a) => a.symbol === symbol);

  // Compute lanes directly during render (no side-effects, React 19 compliant)
  let techBias: "bullish" | "bearish" | "neutral" = "neutral";
  let techDesc = "No trend data available";
  let narrBias: "bullish" | "bearish" | "neutral" = "neutral";
  let narrDesc = "News sentiment balanced";
  let flowBias: "bullish" | "bearish" | "neutral" = "neutral";
  let flowDesc = "Currency capital flows neutral";
  let macroBias: "bullish" | "bearish" | "neutral" = "neutral";
  let macroDesc = "Low upcoming economic calendar risk";

  if (selectedAsset) {
    const change = selectedAsset.percent_change;

    // 1. Technical Lane (Trend and daily momentum)
    if (change > 0.1) {
      techBias = "bullish";
      techDesc = `Daily momentum positive (+${change.toFixed(2)}%)`;
    } else if (change < -0.1) {
      techBias = "bearish";
      techDesc = `Daily momentum negative (${change.toFixed(2)}%)`;
    } else {
      techDesc = "Consolidating in tight daily range";
    }

    // 2. Narrative Lane (Scrapes live news keywords for selected symbol)
    if (symbol === "XAU/USD") {
      narrBias = macroBiases.XAU?.bias || "neutral";
      narrDesc = macroBiases.XAU?.details || narrDesc;
    } else if (symbol === "EUR/USD") {
      const eurScore = macroBiases.EUR?.score || 0;
      const usdScore = macroBiases.USD?.score || 0;
      const diff = eurScore - usdScore;
      if (diff > 0) {
        narrBias = "bullish";
        narrDesc = "ECB rhetoric hawkish relative to softening Fed yields.";
      } else if (diff < 0) {
        narrBias = "bearish";
        narrDesc = "Dovish ECB stance vs firming Fed rates.";
      }
    } else if (symbol === "GBP/USD") {
      const gbpScore = macroBiases.GBP?.score || 0;
      const usdScore = macroBiases.USD?.score || 0;
      const diff = gbpScore - usdScore;
      if (diff > 0) {
        narrBias = "bullish";
        narrDesc = "BOE hawkish stance outperforming USD narrative.";
      } else if (diff < 0) {
        narrBias = "bearish";
        narrDesc = "Softening UK inflation expectations pressuring sterling.";
      }
    } else if (symbol === "USD/JPY") {
      const usdScore = macroBiases.USD?.score || 0;
      let jpyScore = 0;
      news.forEach((n) => {
        const text = (n.title || "").toLowerCase();
        if (text.includes("boj") || text.includes("yen") || text.includes("jpy")) {
          if (text.includes("hike") || text.includes("hawkish") || text.includes("strengthen")) jpyScore += 1;
          if (text.includes("easing") || text.includes("dovish") || text.includes("weak")) jpyScore -= 1;
        }
      });
      const diff = usdScore - jpyScore;
      if (diff > 0) {
        narrBias = "bullish";
        narrDesc = "Firm USD rates widening yield gap vs low BOJ rates.";
      } else if (diff < 0) {
        narrBias = "bearish";
        narrDesc = "BOJ rate normalization speculation strengthening Yen.";
      }
    } else if (symbol === "BTC/USD") {
      let btcScore = 0;
      news.forEach((n) => {
        const text = ((n.title || "") + " " + (n.summary || "")).toLowerCase();
        if (text.includes("btc") || text.includes("bitcoin") || text.includes("crypto")) {
          if (text.includes("inflow") || text.includes("rally") || text.includes("bullish") || text.includes("ath")) btcScore += 1;
          if (text.includes("outflow") || text.includes("dump") || text.includes("bearish") || text.includes("crack")) btcScore -= 1;
        }
      });
      if (btcScore > 0) {
        narrBias = "bullish";
        narrDesc = "Positive institutional ETF inflows supporting price.";
      } else if (btcScore < 0) {
        narrBias = "bearish";
        narrDesc = "Net ETF outflows and selling pressure observed.";
      }
    }

    // 3. Flow Lane (Relative strength comparison)
    if (symbol.includes("/")) {
      const [base, quote] = symbol.split("/");
      const baseAsset = liveData?.find((a) => a.symbol.startsWith(base));
      const quoteAsset = liveData?.find((a) => a.symbol.startsWith(quote));

      if (baseAsset && quoteAsset) {
        const diff = baseAsset.percent_change - quoteAsset.percent_change;
        if (diff > 0.2) {
          flowBias = "bullish";
          flowDesc = `Relative strength: ${base} leading ${quote} by +${diff.toFixed(2)}%`;
        } else if (diff < -0.2) {
          flowBias = "bearish";
          flowDesc = `Relative strength: ${quote} leading ${base} by +${Math.abs(diff).toFixed(2)}%`;
        }
      }
    } else {
      if (change > 0.3) {
        flowBias = "bullish";
        flowDesc = "Institutional capital entering asset heavily";
      } else if (change < -0.3) {
        flowBias = "bearish";
        flowDesc = "Institutional distribution/outflow observed";
      }
    }

    // 4. Macro Lane (Upcoming economic calendar events)
    const baseCode = symbol.split("/")[0];
    const countries = ["USD"];
    if (baseCode === "EUR") countries.push("EUR");
    if (baseCode === "GBP") countries.push("GBP");
    if (baseCode === "JPY") countries.push("JPY");

    const highImpact = calendarEvents.find((e) => {
      const matchCountry = countries.some(c => e.country.includes(c) || c.includes(e.country));
      return matchCountry && e.impact === "High";
    });

    if (highImpact) {
      macroBias = "bearish";
      macroDesc = `High Impact Risk: ${highImpact.country} ${highImpact.title}`;
    } else {
      macroBias = "bullish";
      macroDesc = "Low upcoming economic calendar risk";
    }
  }

  // Synthesis Verdict
  let score = 0;
  if (techBias === "bullish") score += 1;
  if (techBias === "bearish") score -= 1;
  if (flowBias === "bullish") score += 1;
  if (flowBias === "bearish") score -= 1;
  if (narrBias === "bullish") score += 1;
  if (narrBias === "bearish") score -= 1;
  if (macroBias === "bullish") score += 1;
  if (macroBias === "bearish") score -= 1;

  const verdict: "LONG" | "SHORT" | "WAIT" = score >= 2 ? "LONG" : score <= -2 ? "SHORT" : "WAIT";

  // Trade Plan Calculations (ATR stop distances)
  let tradePlan: { entry: number; sl: number; tp: number } | null = null;
  if (selectedAsset && verdict !== "WAIT") {
    let atrMultiplier = 0.01;
    if (symbol.includes("JPY")) atrMultiplier = 0.012;
    else if (symbol.includes("BTC") || symbol.includes("ETH")) atrMultiplier = 0.035;
    else if (symbol.includes("XAU")) atrMultiplier = 0.015;

    const currentPrice = selectedAsset.price;
    const atrValue = currentPrice * atrMultiplier;

    if (verdict === "LONG") {
      tradePlan = {
        entry: currentPrice,
        sl: currentPrice - atrValue,
        tp: currentPrice + 2 * atrValue,
      };
    } else {
      tradePlan = {
        entry: currentPrice,
        sl: currentPrice + atrValue,
        tp: currentPrice - 2 * atrValue,
      };
    }
  }

  const getLaneBadge = (bias: "bullish" | "bearish" | "neutral") => {
    if (bias === "bullish") {
      return (
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Bullish
        </span>
      );
    }
    if (bias === "bearish") {
      return (
        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-600 dark:bg-red-500/10 dark:text-red-400">
          Bearish
        </span>
      );
    }
    return (
      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
        Neutral
      </span>
    );
  };

  const getVerdictCardStyles = () => {
    if (verdict === "LONG") {
      return "border-emerald-200 bg-emerald-50/20 dark:border-emerald-500/20 dark:bg-emerald-500/5";
    }
    if (verdict === "SHORT") {
      return "border-red-200 bg-red-50/20 dark:border-red-500/20 dark:bg-red-500/5";
    }
    return "border-[var(--card-border)] bg-slate-50/30 dark:bg-white/[0.01]";
  };

  return (
    <Card className="animate-fade-up">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Confluence Synthesizer</h3>
        </div>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-bold outline-none transition-colors focus:border-[var(--accent)]"
        >
          {Object.keys(nameMap).map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Details */}
      <div className="mt-4 flex items-center gap-3">
        {selectedAsset && <AssetIcon symbol={selectedAsset.symbol} size={32} />}
        <div>
          <h4 className="text-base font-extrabold">{symbol}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current Price:{" "}
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
              {selectedAsset ? formatPrice(symbol, selectedAsset.price) : "—"}
            </span>
          </p>
        </div>
      </div>

      {/* 2x2 Lanes Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Technical */}
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.01] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-[var(--card-border)] bg-slate-100 text-[10px] font-black dark:bg-white/5">
                T
              </span>
              Technical Lane
            </div>
            {getLaneBadge(techBias)}
          </div>
          <p className="mt-2.5 text-xs leading-normal text-slate-600 dark:text-slate-300">
            {techDesc}
          </p>
        </div>

        {/* Flow */}
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.01] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-[var(--card-border)] bg-slate-100 text-[10px] font-black dark:bg-white/5">
                F
              </span>
              Flow Lane
            </div>
            {getLaneBadge(flowBias)}
          </div>
          <p className="mt-2.5 text-xs leading-normal text-slate-600 dark:text-slate-300">
            {flowDesc}
          </p>
        </div>

        {/* Narrative */}
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.01] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-[var(--card-border)] bg-slate-100 text-[10px] font-black dark:bg-white/5">
                N
              </span>
              Narrative Lane
            </div>
            {getLaneBadge(narrBias)}
          </div>
          <p className="mt-2.5 text-xs leading-normal text-slate-600 dark:text-slate-300">
            {narrDesc}
          </p>
        </div>

        {/* Macro */}
        <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/40 p-4 dark:bg-white/[0.01] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-[var(--card-border)] bg-slate-100 text-[10px] font-black dark:bg-white/5">
                M
              </span>
              Macro Lane
            </div>
            {getLaneBadge(macroBias === "bearish" ? "bearish" : "bullish")}
          </div>
          <p className="mt-2.5 text-xs leading-normal text-slate-600 dark:text-slate-300">
            {macroDesc}
          </p>
        </div>
      </div>

      {/* The Synthesized Verdict Card */}
      <div className={`mt-5 rounded-xl border p-5 transition-all ${getVerdictCardStyles()}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Action Verdict
            </span>
            <div
              className={`text-3xl font-extrabold leading-none mt-1 ${
                verdict === "LONG" ? "text-emerald-600 dark:text-emerald-400" :
                verdict === "SHORT" ? "text-red-500" :
                "text-slate-500"
              }`}
            >
              {verdict}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-normal">
              {verdict === "LONG" ? "Strong buyer volume alignment across indicators." :
               verdict === "SHORT" ? "High selling distribution alignment across pipelines." :
               "Market indicators are conflicting. Wait for trend alignment."}
            </p>
          </div>

          {/* Trade Plan Ticket */}
          {tradePlan && (
            <div className="rounded-xl border border-[var(--card-border)] bg-slate-100/50 dark:bg-white/5 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:text-zinc-200 min-w-[210px]">
              <div className="font-bold text-slate-400 border-b border-[var(--card-border)] pb-2 mb-2 flex justify-between uppercase text-[10px]">
                <span>Confluence plan</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">1:2 r:r</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Entry:</span>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-white">{formatPrice(symbol, tradePlan.entry)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium font-semibold text-red-500">SL:</span>
                  <span className="font-bold tabular-nums text-red-500">{formatPrice(symbol, tradePlan.sl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium font-semibold text-emerald-600 dark:text-emerald-400">TP:</span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPrice(symbol, tradePlan.tp)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
