"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AssetIcon, formatPrice } from "./asset-icon";
import { Card, PageShell } from "./components";
import { calculateMarketContext, calculateRiskPlan, evaluateTradeSafety } from "./lib/trade-assistant";
import type { CalendarEvent, LiveAsset, AIPrediction, VirtualTrade } from "./types";
import type { Candle } from "./lib/backtest";
import type { SentinelItem } from "./lib/sentiment-scraper";

// Load Chart dynamically with SSR disabled to prevent lightweight-charts hydration issues
const PredictionChart = dynamic(
  () => import("./prediction-chart").then((mod) => mod.PredictionChart),
  { ssr: false }
);

const INSTRUMENTS = [
  { symbol: "XAU/USD", label: "Gold Spot", historyNote: "Levels use COMEX Gold futures as a normalized structure proxy." },
  { symbol: "BTC/USD", label: "Bitcoin Spot", historyNote: "Spot reference from Yahoo Finance." },
  { symbol: "EUR/USD", label: "EUR/USD Spot", historyNote: "Spot forex reference from Yahoo Finance." },
];

const emptyContext = {
  trend: "unavailable" as const, atr: null as number | null, previousDayHigh: null as number | null, previousDayLow: null as number | null,
  previousWeekHigh: null as number | null, previousWeekLow: null as number | null, dailyOpen: null as number | null,
  nearestSupport: null as number | null, nearestResistance: null as number | null,
};

function formatUtcRangeToLocal(startUtcHour: number, endUtcHour: number): string {
  try {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), startUtcHour, 0, 0));
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), endUtcHour, 0, 0));

    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const startStr = startDate.toLocaleTimeString([], options);
    const endStr = endDate.toLocaleTimeString([], options);
    
    const tzName = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || "Local";
    return `${startStr} - ${endStr} (${tzName})`;
  } catch {
    return `${String(startUtcHour).padStart(2, "0")}:00 - ${String(endUtcHour).padStart(2, "0")}:00 UTC`;
  }
}

export function TradeAssistantDashboard() {
  const [symbol, setSymbol] = useState("XAU/USD");
  const [assets, setAssets] = useState<LiveAsset[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Lower timeframe candles for chart & scanning
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candlesInterval, setCandlesInterval] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("macromind-timeframe") || "15m";
    }
    return "15m";
  });
  const [chartLoading, setChartLoading] = useState(true);

  // AI Prediction state
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Active virtual paper trade state
  const [activeTrade, setActiveTrade] = useState<VirtualTrade | null>(null);
  const [selectedHistoricalTrade, setSelectedHistoricalTrade] = useState<VirtualTrade | null>(null);

  // Phase 3 Extended states: Virtual Balance & Auto-Pilot Mode
  const [virtualBalance, setVirtualBalance] = useState(10000);
  const [editableBalance, setEditableBalance] = useState("10000");
  const [autoPilot, setAutoPilot] = useState(false);
  const [tradesList, setTradesList] = useState<VirtualTrade[]>([]);
  const [sentinelFeed, setSentinelFeed] = useState<SentinelItem[]>([]);
  const [sentinelLoading, setSentinelLoading] = useState(true);
  const [lastExecuted, setLastExecuted] = useState("");
  const [storageMode, setStorageMode] = useState<"server" | "local">("server");

  // Manual Risk Planner inputs (kept for manual calculations if desired)
  const [accountSize, setAccountSize] = useState("1000");
  const [riskPercent, setRiskPercent] = useState("0.5");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [entryCopied, setEntryCopied] = useState(false);
  
  const [now, setNow] = useState<number | null>(null);

  // 1. Fetch live market prices and calendar safely (avoids nextjs overlay crash on dev server HMR restarts)
  const loadCoreData = useCallback(async () => {
    try {
      const priceRes = await fetch("/api/prices").catch(() => null);
      const calendarRes = await fetch("/api/calendar").catch(() => null);

      if (!priceRes || !calendarRes || !priceRes.ok || !calendarRes.ok) {
        return; // Dev server offline or HMR compilation in progress - exit silently
      }

      const [priceJson, calendarJson] = await Promise.all([
        priceRes.json().catch(() => ({ data: [] })),
        calendarRes.json().catch(() => ({ data: [] }))
      ]);

      setAssets(priceJson.data ?? []);
      setEvents(calendarJson.data ?? []);
    } catch (e) {
      console.warn("Soft check - server connection interrupted:", e);
    }
  }, []);

  // 2. Fetch history candles safely
  const loadHistoryData = useCallback(async (currentSymbol: string, interval: string) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/history?symbol=${encodeURIComponent(currentSymbol)}&interval=${interval}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => ({ data: [] }));
        setCandles(json.data ?? []);
      }
    } catch (e) {
      console.error("Failed to load historical candles:", e);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // 3. Fetch AI predictions safely (transmits dynamic history calibration parameter)
  const getAIPrediction = useCallback(async (currentSymbol: string, interval: string) => {
    setPredictionLoading(true);
    try {
      const res = await fetch(`/api/ai-prediction?symbol=${encodeURIComponent(currentSymbol)}&interval=${interval}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => ({ data: null }));
        setPrediction(json.data ?? null);
      }
    } catch (e) {
      console.error("Failed to fetch AI prediction:", e);
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  // Local storage fallback loader (used if server database is read-only or unreachable)
  const fallbackToLocalStorage = useCallback((currentSymbol: string) => {
    setStorageMode("local");
    console.warn("[Trades Storage] Server-side DB read failed or read-only filesystem. Falling back to local browser storage.");
    
    const saved = localStorage.getItem("macromind-virtual-trades");
    let trades: VirtualTrade[] = [];
    if (saved) {
      try {
        trades = JSON.parse(saved);
        setTradesList(trades);
        const openTrade = trades.find(t => t.symbol === currentSymbol && t.status === "open");
        setActiveTrade(openTrade ?? null);
      } catch {
        setTradesList([]);
        setActiveTrade(null);
      }
    } else {
      setTradesList([]);
      setActiveTrade(null);
    }

    const savedBalance = localStorage.getItem("macromind-virtual-balance");
    if (savedBalance) {
      setVirtualBalance(Number(savedBalance));
      setEditableBalance(savedBalance);
    } else {
      setVirtualBalance(10000);
      setEditableBalance("10000");
    }

    const savedAutoPilot = localStorage.getItem("macromind-autopilot");
    setAutoPilot(savedAutoPilot === "true");
    
    const savedLast = localStorage.getItem("macromind-last-executed-prediction") || "";
    setLastExecuted(savedLast);
  }, []);

  // 4. Load Active Trade, Trades List, and balance states from Server DB with local fallback
  const loadTradesData = useCallback(async (currentSymbol: string) => {
    try {
      const res = await fetch("/api/trades").catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.success && json.data) {
          const { trades, balance, autoPilot: apState, lastExecutedPrediction } = json.data;
          setTradesList(trades);
          const openTrade = trades.find((t: VirtualTrade) => t.symbol === currentSymbol && t.status === "open");
          setActiveTrade(openTrade ?? null);
          setVirtualBalance(balance);
          setEditableBalance(String(balance));
          setAutoPilot(apState);
          setLastExecuted(lastExecutedPrediction || "");
          setStorageMode("server");
          return;
        }
      }
      fallbackToLocalStorage(currentSymbol);
    } catch (err) {
      console.warn("Failed to sync trades data from server, falling back to local:", err);
      fallbackToLocalStorage(currentSymbol);
    }
  }, [fallbackToLocalStorage]);

  // Calculate dynamic trading statistics based on closed trades
  const stats = useMemo(() => {
    const closedTrades = tradesList.filter(t => t.status === "closed");
    const total = closedTrades.length;
    const wins = closedTrades.filter(t => t.pnlAmount !== null && t.pnlAmount > 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const netPnl = closedTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0);

    const startingCapital = virtualBalance - netPnl;
    const netPnlPercent = startingCapital > 0 ? (netPnl / startingCapital) * 100 : 0;

    return {
      total,
      winRate,
      netPnl,
      netPnlPercent,
    };
  }, [tradesList, virtualBalance]);

  // Circuit Breaker: Max 3% daily drawdown or 3 consecutive losses
  const dailyDrawdownExceeded = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const closedToday = tradesList.filter(
      (t) => t.status === "closed" && t.closedAt && new Date(t.closedAt).getTime() >= startOfToday.getTime()
    );
    const dailyPnlAmount = closedToday.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0);
    const maxDailyDrawdown = virtualBalance * 0.03; // 3% drawdown limit

    if (dailyPnlAmount < 0 && Math.abs(dailyPnlAmount) >= maxDailyDrawdown) {
      return true;
    }

    // Check for 3 consecutive losses today
    const sortedClosedToday = [...closedToday]
      .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime());
    if (sortedClosedToday.length >= 3) {
      const last3 = sortedClosedToday.slice(0, 3);
      const allLoss = last3.every((t) => (t.pnlAmount ?? 0) <= 0);
      if (allLoss) return true;
    }

    return false;
  }, [tradesList, virtualBalance]);

  // Dynamic timezone session clocks & overlap tracker (updates real-time with the clock)
  const sessionStatus = useMemo(() => {
    if (!now) return { tokyo: false, london: false, newYork: false, overlap: "Loading sessions...", utcTime: "", localTime: "" };
    const date = new Date(now);
    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();
    const utcSecond = date.getUTCSeconds();
    
    // Define standard trading sessions (UTC)
    const tokyo = utcHour >= 0 && utcHour < 9;
    const london = utcHour >= 8 && utcHour < 17;
    const newYork = utcHour >= 13 && utcHour < 22;

    let overlap = "No Major Overlap (Asian / Quiet Hours)";
    if (london && newYork) {
      overlap = "London & New York Overlap (Peak Volatility)";
    } else if (tokyo && london) {
      overlap = "Tokyo & London Overlap (Cross-session Volatility)";
    } else if (tokyo) {
      overlap = "Tokyo Session Active (Asia-Pacific)";
    } else if (london) {
      overlap = "London Session Active (Europe)";
    } else if (newYork) {
      overlap = "New York Session Active (US)";
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const utcTime = `${pad(utcHour)}:${pad(utcMinute)}:${pad(utcSecond)} UTC`;
    const localTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

    return { tokyo, london, newYork, overlap, utcTime, localTime };
  }, [now]);

  // Reset Virtual Account Capital & Trades History
  const handleResetAccount = async () => {
    const cleanBalance = Number(editableBalance) || 10000;
    if (storageMode === "local") {
      localStorage.setItem("macromind-virtual-balance", String(cleanBalance));
      localStorage.setItem("macromind-virtual-trades", JSON.stringify([]));
      setVirtualBalance(cleanBalance);
      setEditableBalance(String(cleanBalance));
      setActiveTrade(null);
      setTradesList([]);
      alert(`Virtual account reset successfully in local storage with capital: $${cleanBalance}`);
      return;
    }

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", balance: cleanBalance }),
      });
      if (res.ok) {
        setVirtualBalance(cleanBalance);
        setEditableBalance(String(cleanBalance));
        setActiveTrade(null);
        setTradesList([]);
        alert(`Virtual account reset successfully with capital: $${cleanBalance}`);
      } else {
        setStorageMode("local");
        localStorage.setItem("macromind-virtual-balance", String(cleanBalance));
        localStorage.setItem("macromind-virtual-trades", JSON.stringify([]));
        setVirtualBalance(cleanBalance);
        setEditableBalance(String(cleanBalance));
        setActiveTrade(null);
        setTradesList([]);
        alert(`Virtual account reset successfully (Local Storage Fallback) with capital: $${cleanBalance}`);
      }
    } catch (err) {
      console.error("Failed to reset account:", err);
      setStorageMode("local");
      localStorage.setItem("macromind-virtual-balance", String(cleanBalance));
      localStorage.setItem("macromind-virtual-trades", JSON.stringify([]));
      setVirtualBalance(cleanBalance);
      setEditableBalance(String(cleanBalance));
      setActiveTrade(null);
      setTradesList([]);
      alert(`Virtual account reset successfully (Local Storage Fallback) with capital: $${cleanBalance}`);
    }
  };

  // Toggle Auto-Pilot execution state
  const handleToggleAutoPilot = async () => {
    const nextState = !autoPilot;
    if (storageMode === "local") {
      setAutoPilot(nextState);
      localStorage.setItem("macromind-autopilot", String(nextState));
      return;
    }

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-autopilot", autoPilot: nextState }),
      });
      if (res.ok) {
        setAutoPilot(nextState);
      } else {
        console.warn("[Trades Storage] Autopilot write failed. Reverting to local storage.");
        setStorageMode("local");
        setAutoPilot(nextState);
        localStorage.setItem("macromind-autopilot", String(nextState));
      }
    } catch (err) {
      console.error("Failed to toggle autopilot:", err);
      setStorageMode("local");
      setAutoPilot(nextState);
      localStorage.setItem("macromind-autopilot", String(nextState));
    }
  };

  // Initialize clock and primary APIs (wrapped in setTimeout to prevent React 19 cascading renders warning)
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
      void loadCoreData();
    }, 0);
    const refresh = setInterval(loadCoreData, 5000); // Poll prices every 5s
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(timer); clearInterval(refresh); clearInterval(clock); };
  }, [loadCoreData]);

  // Load Sentinel macro feed autonomously
  useEffect(() => {
    let active = true;
    const loadSentinel = async () => {
      try {
        const res = await fetch("/api/sentinel").catch(() => null);
        if (!res || !res.ok) return;
        const json = await res.json().catch(() => ({ data: [] }));
        if (active && json.data) {
          setSentinelFeed(json.data);
        }
      } catch (err) {
        console.warn("Sentinel Feed failed to load:", err);
      } finally {
        if (active) setSentinelLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void loadSentinel();
    }, 0);
    const interval = setInterval(loadSentinel, 60000); // Poll sentinel feed every 60s
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Auto-Pilot Circuit Breaker Trigger (wrapped in setTimeout to prevent React 19 synchronous cascading render warnings)
  useEffect(() => {
    if (autoPilot && dailyDrawdownExceeded) {
      const timer = setTimeout(() => {
        setAutoPilot(false);
        void fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update-autopilot", autoPilot: false }),
        }).catch(() => null);
        alert("⚠️ Auto-Pilot Circuit Breaker Triggered: Daily drawdown limit of 3% or 3 consecutive losses exceeded. Auto-Pilot has been disabled for safety.");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoPilot, dailyDrawdownExceeded]);

  // Load symbol-specific data asynchronously inside setTimeout to comply with React 19 styling rules
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadHistoryData(symbol, candlesInterval);
      void getAIPrediction(symbol, candlesInterval);
      void loadTradesData(symbol);
    }, 0);
    return () => clearTimeout(timer);
  }, [symbol, candlesInterval, loadHistoryData, getAIPrediction, loadTradesData]);

  // Calculate daily indicators context using useMemo (pure render loop, no state updates inside render)
  const context = useMemo(() => {
    if (candles.length === 0) return emptyContext;
    const assetObj = assets.find((item) => item.symbol === symbol);
    return assetObj ? calculateMarketContext(candles, assetObj.price) : emptyContext;
  }, [symbol, candles, assets]);

  const asset = assets.find((item) => item.symbol === symbol);
  const instrument = INSTRUMENTS.find((item) => item.symbol === symbol) ?? INSTRUMENTS[0];
  const effectiveNow = now ?? 0; // Pure fallback instead of impure Date.now() in render
  const safety = evaluateTradeSafety({ symbol, asset, events, now: effectiveNow });

  // Weekend market state detection (Gold/Forex closed, Bitcoin 24/7)
  const isMarketClosed = useMemo(() => {
    if (symbol === "BTC/USD") return false;
    const time = now ? new Date(now) : new Date();
    const day = time.getUTCDay();
    const hour = time.getUTCHours();
    return day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 22);
  }, [symbol, now]);

  const nextEvent = events
    .filter((event) => event.impact === "High" && event.country === "USD" && new Date(event.date).getTime() > effectiveNow)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const riskPlan = useMemo(() => calculateRiskPlan({
    accountSize: Number(accountSize), riskPercent: Number(riskPercent), entry: Number(entry), stop: Number(stop), target: Number(target),
  }), [accountSize, riskPercent, entry, stop, target]);

  const isDirectionBuy = prediction?.suggestedTrade?.direction === "buy" || direction === "buy";
  const pricingLevel = Number(entry) || (prediction?.suggestedTrade?.entry) || (asset?.price ?? 0);
  const hasEquilibrium = prediction?.smcFeatures?.equilibrium;
  const passesEquilibrium = hasEquilibrium 
    ? (isDirectionBuy ? pricingLevel <= hasEquilibrium : pricingLevel >= hasEquilibrium)
    : true;

  const activeCisd = prediction?.smcFeatures?.cisdShift;
  const passesCisd = activeCisd && activeCisd !== "none"
    ? (isDirectionBuy ? activeCisd === "bullish" : activeCisd === "bearish")
    : true;

  const htfTrendValue = prediction?.smcFeatures?.htfTrend;
  const htfLabel = prediction?.smcFeatures?.htfInterval ?? "1H";
  const htfAligned = htfTrendValue && htfTrendValue !== "neutral"
    ? (isDirectionBuy ? htfTrendValue === "bullish" : htfTrendValue === "bearish")
    : true;

  const setupChecks = [
    { label: "Verified price feed is available", pass: Boolean(asset && !asset.isFallback) },
    { label: "No high-impact event inside the safety window", pass: safety.verdict !== "NO TRADE" },
    { label: "Daily trend is not neutral/unavailable", pass: autoPilot || context.trend === "bullish" || context.trend === "bearish" },
    { label: `HTF Trend confirms bias (${htfLabel}: ${htfTrendValue?.toUpperCase() ?? "NEUTRAL"})`, pass: htfAligned },
    { label: `Price zone validated: ${isDirectionBuy ? 'Discount (Buy)' : 'Premium (Sell)'}`, pass: passesEquilibrium },
    { label: "CISD structural pricing shift aligns with bias", pass: passesCisd },
    { label: "Entry confirmation observed on your chart", pass: autoPilot || confirmation },
    { label: "Risk plan has at least 1:2 reward", pass: Boolean(riskPlan && riskPlan.riskReward >= 2) },
  ];
  const setupReady = setupChecks.every((check) => check.pass);

  // Execute AI suggested paper trade
  const handleExecutePaperTrade = useCallback(async () => {
    if (!prediction?.suggestedTrade || !asset) return;

    // Block executions when the market is closed
    if (isMarketClosed) {
      console.warn("AI Virtual Desk: Execution blocked because the market is closed.");
      return;
    }

    const currentPrice = asset.price;
    const isBuy = prediction.suggestedTrade.direction === "buy";

    // Invalidation check: If price has already crossed SL or TP, don't execute
    if (isBuy) {
      if (currentPrice <= prediction.suggestedTrade.stopLoss || currentPrice >= prediction.suggestedTrade.takeProfit) {
        console.warn("AI Virtual Desk: Invalidation triggered. Price is already past SL or TP boundaries.");
        return;
      }
    } else {
      if (currentPrice >= prediction.suggestedTrade.stopLoss || currentPrice <= prediction.suggestedTrade.takeProfit) {
        console.warn("AI Virtual Desk: Invalidation triggered. Price is already past SL or TP boundaries.");
        return;
      }
    }
    
    const riskAmount = virtualBalance * (Number(riskPercent) / 100);
    const stopDistance = Math.abs(currentPrice - prediction.suggestedTrade.stopLoss);
    let multiplier = 1;
    if (symbol === "XAU/USD") multiplier = 100;
    else if (symbol === "EUR/USD") multiplier = 100000;
    else if (symbol === "BTC/USD") multiplier = 1;
    const computedLots = stopDistance > 0 ? Number((riskAmount / (stopDistance * multiplier)).toFixed(3)) : 0.01;

    const newTrade: VirtualTrade = {
      id: Math.random().toString(36).substring(2, 9),
      symbol,
      direction: prediction.suggestedTrade.direction,
      entry: currentPrice,
      stopLoss: prediction.suggestedTrade.stopLoss,
      takeProfit: prediction.suggestedTrade.takeProfit,
      riskReward: prediction.suggestedTrade.riskReward,
      reason: prediction.reasoning,
      status: "open",
      pnlPercentage: 0,
      pnlAmount: 0,
      exitPrice: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
      postmortem: null,
      lesson: null,
      timeframe: candlesInterval,
      lots: computedLots,
    };

    if (storageMode === "local") {
      const saved = localStorage.getItem("macromind-virtual-trades");
      const trades = saved ? JSON.parse(saved) : [];
      trades.push(newTrade);
      localStorage.setItem("macromind-virtual-trades", JSON.stringify(trades));
      setActiveTrade(newTrade);
      setTradesList(trades);
      if (prediction.computedAt) {
        setLastExecuted(prediction.computedAt);
        localStorage.setItem("macromind-last-executed-prediction", prediction.computedAt);
      }
      return;
    }

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-trade", trade: newTrade }),
      });
      if (res.ok) {
        setActiveTrade(newTrade);
        setTradesList((prev) => [...prev, newTrade]);
        
        if (prediction.computedAt) {
          setLastExecuted(prediction.computedAt);
          await fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update-last-executed", computedAt: prediction.computedAt }),
          }).catch(() => null);
        }
      } else {
        throw new Error("Server write failed");
      }
    } catch (err) {
      console.warn("Failed to execute trade on server, falling back to local storage:", err);
      const saved = localStorage.getItem("macromind-virtual-trades");
      const trades = saved ? JSON.parse(saved) : [];
      trades.push(newTrade);
      localStorage.setItem("macromind-virtual-trades", JSON.stringify(trades));
      setActiveTrade(newTrade);
      setTradesList(trades);
      if (prediction.computedAt) {
        setLastExecuted(prediction.computedAt);
        localStorage.setItem("macromind-last-executed-prediction", prediction.computedAt);
      }
      setStorageMode("local");
    }
  }, [prediction, symbol, asset, isMarketClosed, candlesInterval, virtualBalance, riskPercent, storageMode]);

  // AI Auto-Pilot automated execution loop trigger (only executes when setupChecks pass)
  useEffect(() => {
    if (autoPilot && prediction?.suggestedTrade && !activeTrade && asset && !isMarketClosed && setupReady) {
      // Prevent infinite loops on the same prediction instance
      if (prediction.computedAt && prediction.computedAt === lastExecuted) {
        return;
      }

      const timer = setTimeout(() => {
        void handleExecutePaperTrade();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPilot, prediction, activeTrade, asset, handleExecutePaperTrade, isMarketClosed, setupReady, lastExecuted]);

  // Close virtual paper trade manually or automatically
  const handleCloseTrade = useCallback(async (tradeId: string, exitPrice: number, hitType: "TP" | "SL" | "Manual") => {
    const targetTrade = tradesList.find(t => t.id === tradeId);
    if (!targetTrade) return;

    const isBuy = targetTrade.direction === "buy";
    const tickDiff = isBuy ? (exitPrice - targetTrade.entry) : (targetTrade.entry - exitPrice);
    const riskDistance = Math.abs(targetTrade.entry - targetTrade.stopLoss);
    const pnlR = riskDistance > 0 ? tickDiff / riskDistance : 0;

    const tradeRiskPercent = Number(riskPercent);
    const pnlPercentage = pnlR * tradeRiskPercent;
    const pnlAmount = pnlR * (virtualBalance * tradeRiskPercent / 100);

    const closedAtStr = new Date().toISOString();

    if (storageMode === "local") {
      const saved = localStorage.getItem("macromind-virtual-trades");
      if (saved) {
        const trades: VirtualTrade[] = JSON.parse(saved);
        const index = trades.findIndex(t => t.id === tradeId);
        if (index !== -1) {
          const trade = trades[index];
          trade.status = "closed";
          trade.exitPrice = exitPrice;
          trade.closedAt = closedAtStr;
          trade.pnlPercentage = pnlPercentage;
          trade.pnlAmount = pnlAmount;

          trades[index] = trade;
          localStorage.setItem("macromind-virtual-trades", JSON.stringify(trades));

          const nextBalance = virtualBalance + pnlAmount;
          localStorage.setItem("macromind-virtual-balance", String(nextBalance));
          setVirtualBalance(nextBalance);
          setEditableBalance(nextBalance.toFixed(2));

          if (targetTrade.symbol === symbol) {
            setActiveTrade(null);
          }

          // Trigger background AI Trade Audit report
          fetch("/api/trade-audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trade }),
          })
            .then((res) => res.json())
            .then((json) => {
              if (json?.data) {
                const freshSaved = localStorage.getItem("macromind-virtual-trades");
                if (freshSaved) {
                  const freshTrades: VirtualTrade[] = JSON.parse(freshSaved);
                  const freshIndex = freshTrades.findIndex((t) => t.id === trade.id);
                  if (freshIndex !== -1) {
                    freshTrades[freshIndex].postmortem = json.data.review;
                    freshTrades[freshIndex].lesson = json.data.lesson;
                    localStorage.setItem("macromind-virtual-trades", JSON.stringify(freshTrades));
                    setTradesList(freshTrades);
                  }
                }
              }
            })
            .catch((err) => console.error("Error executing background review:", err));

          setTradesList(trades);
          alert(`Virtual Trade Closed (Local Storage)! PnL: ${pnlAmount >= 0 ? "+" : ""}$${pnlAmount.toFixed(2)} (${pnlPercentage.toFixed(2)}%) · [${hitType}]`);
        }
      }
      return;
    }

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close-trade",
          tradeId,
          exitPrice,
          hitType,
          pnlPercentage,
          pnlAmount,
          closedAt: closedAtStr,
        }),
      });

      if (res.ok) {
        const nextBalance = virtualBalance + pnlAmount;
        setVirtualBalance(nextBalance);
        setEditableBalance(nextBalance.toFixed(2));

        const closedTrade: VirtualTrade = {
          ...targetTrade,
          status: "closed",
          exitPrice,
          pnlPercentage,
          pnlAmount,
          closedAt: closedAtStr,
        };

        if (targetTrade.symbol === symbol) {
          setActiveTrade(null);
        }

        // Trigger background AI Trade Audit report
        fetch("/api/trade-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trade: closedTrade }),
        })
          .then((res) => res.json())
          .then((json) => {
            if (json?.data) {
              setTradesList((prev) =>
                prev.map((t) =>
                  t.id === tradeId
                    ? {
                        ...t,
                        status: "closed",
                        exitPrice,
                        pnlPercentage,
                        pnlAmount,
                        closedAt: closedAtStr,
                        postmortem: json.data.review,
                        lesson: json.data.lesson,
                      }
                    : t
                )
              );
            }
          })
          .catch((err) => console.error("Error executing background review:", err));

        setTradesList((prev) =>
          prev.map((t) =>
            t.id === tradeId
              ? { ...t, status: "closed", exitPrice, pnlPercentage, pnlAmount, closedAt: closedAtStr }
              : t
          )
        );

        alert(`Virtual Trade Closed! PnL: ${pnlAmount >= 0 ? "+" : ""}$${pnlAmount.toFixed(2)} (${pnlPercentage.toFixed(2)}%) · [${hitType}]`);
      } else {
        throw new Error("Server write failed");
      }
    } catch (err) {
      console.warn("Failed to close trade on server, falling back to local storage:", err);
      const saved = localStorage.getItem("macromind-virtual-trades");
      if (saved) {
        const trades: VirtualTrade[] = JSON.parse(saved);
        const index = trades.findIndex(t => t.id === tradeId);
        if (index !== -1) {
          const trade = trades[index];
          trade.status = "closed";
          trade.exitPrice = exitPrice;
          trade.closedAt = closedAtStr;
          trade.pnlPercentage = pnlPercentage;
          trade.pnlAmount = pnlAmount;

          trades[index] = trade;
          localStorage.setItem("macromind-virtual-trades", JSON.stringify(trades));

          const nextBalance = virtualBalance + pnlAmount;
          localStorage.setItem("macromind-virtual-balance", String(nextBalance));
          setVirtualBalance(nextBalance);
          setEditableBalance(nextBalance.toFixed(2));

          if (targetTrade.symbol === symbol) {
            setActiveTrade(null);
          }
          setTradesList(trades);
          alert(`Virtual Trade Closed (Local Storage Fallback)! PnL: ${pnlAmount >= 0 ? "+" : ""}$${pnlAmount.toFixed(2)} (${pnlPercentage.toFixed(2)}%) · [${hitType}]`);
        }
      }
      setStorageMode("local");
    }
  }, [virtualBalance, symbol, tradesList, riskPercent, storageMode]);

  // Live PnL Tick calculation for active open trade (compounding risk on current balance)
  const activeTradePnL = useMemo(() => {
    if (!activeTrade || !asset) return { pnlAmount: 0, pnlPercentage: 0, isGain: false };
    
    const currentPrice = asset.price;
    const isBuy = activeTrade.direction === "buy";
    const tickDiff = isBuy ? (currentPrice - activeTrade.entry) : (activeTrade.entry - currentPrice);
    const riskDistance = Math.abs(activeTrade.entry - activeTrade.stopLoss);
    const pnlR = riskDistance > 0 ? tickDiff / riskDistance : 0;

    const pnlPercentage = pnlR * Number(riskPercent);
    const pnlAmount = pnlR * (virtualBalance * Number(riskPercent) / 100);

    return {
      pnlAmount,
      pnlPercentage,
      isGain: pnlAmount >= 0,
    };
  }, [activeTrade, asset, virtualBalance, riskPercent]);

  // Background virtual trade execution ticker: Monitors ALL open trades across all symbols
  useEffect(() => {
    if (isMarketClosed || assets.length === 0 || tradesList.length === 0) return;

    const openTrades = tradesList.filter((t) => t.status === "open");
    if (openTrades.length === 0) return;

    openTrades.forEach((trade) => {
      const tradeAsset = assets.find((a) => a.symbol === trade.symbol);
      if (!tradeAsset) return;

      const currentPrice = tradeAsset.price;
      const isBuy = trade.direction === "buy";

      if (isBuy) {
        if (currentPrice >= trade.takeProfit) {
          setTimeout(() => handleCloseTrade(trade.id, trade.takeProfit, "TP"), 0);
        } else if (currentPrice <= trade.stopLoss) {
          setTimeout(() => handleCloseTrade(trade.id, trade.stopLoss, "SL"), 0);
        }
      } else {
        if (currentPrice <= trade.takeProfit) {
          setTimeout(() => handleCloseTrade(trade.id, trade.takeProfit, "TP"), 0);
        } else if (currentPrice >= trade.stopLoss) {
          setTimeout(() => handleCloseTrade(trade.id, trade.stopLoss, "SL"), 0);
        }
      }
    });
  }, [tradesList, assets, handleCloseTrade, isMarketClosed]);

  const useCurrentPrice = () => {
    if (!asset) return;
    setEntry(String(asset.price));
    setEntryCopied(true);
    window.setTimeout(() => setEntryCopied(false), 2500);
  };

  return (
    <PageShell title="AI Virtual Trading Desk" label="Hybrid AI Market Intelligence Terminal">
      
      {dailyDrawdownExceeded && (
        <div className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-600 dark:text-red-400 flex items-center justify-between gap-4 animate-pulse select-none mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wide">Circuit Breaker Active</p>
              <p className="text-xs font-semibold mt-0.5 opacity-90">
                Max Daily Drawdown (3%) or 3 consecutive losses exceeded. Auto-Pilot has been disabled automatically for capital preservation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Symbol selection & settings bar */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {INSTRUMENTS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSymbol(item.symbol)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                symbol === item.symbol
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--card-border)] bg-[var(--card)] text-slate-600 dark:text-slate-300"
              }`}
            >
              <AssetIcon symbol={item.symbol} size={20} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Interval:</span>
          <select
            value={candlesInterval}
            onChange={(e) => {
              const val = e.target.value;
              setCandlesInterval(val);
              localStorage.setItem("macromind-timeframe", val);
            }}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="5m">5 Minute</option>
            <option value="15m">15 Minute</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hour (Resampled)</option>
            <option value="1d">Daily</option>
          </select>
          
          {/* Refresh AI button */}
          <button
            onClick={() => void getAIPrediction(symbol, candlesInterval)}
            disabled={predictionLoading}
            className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
          >
            {predictionLoading ? "Scanning..." : "Scan Market"}
          </button>
        </div>
      </section>

      {/* Phase 3 HUD: Virtual Account Capital & Auto-Pilot Toggle */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-slate-100/50 dark:bg-white/[0.02] border border-[var(--card-border)] rounded-2xl p-4">
        {/* Capital HUD Card */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block animate-pulse">Virtual Capital</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-slate-400">$</span>
              <input
                type="number"
                value={editableBalance}
                onChange={(e) => setEditableBalance(e.target.value)}
                className="w-24 bg-transparent border-b border-transparent focus:border-[var(--accent)] font-mono text-lg font-black focus:outline-none"
              />
              <button
                onClick={handleResetAccount}
                className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block">Current Balance</span>
            <span className="font-mono text-lg font-black block mt-1 text-slate-900 dark:text-white">${virtualBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Trade Stats Card */}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--card-border)] md:border-t-0 md:border-x md:px-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block">Trading Stats</span>
            <p className="text-sm font-bold mt-1.5 text-slate-700 dark:text-slate-300">
              Total Trades: <strong className="font-mono">{stats.total}</strong> · Win Rate: <strong className="font-mono text-emerald-500">{stats.winRate.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block">Total Net P&L</span>
            <span className={`font-mono text-sm font-black block mt-1.5 ${stats.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {stats.netPnl >= 0 ? "+" : ""}${stats.netPnl.toFixed(2)} ({stats.netPnlPercent >= 0 ? "+" : ""}{stats.netPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Auto-Pilot Toggle Card */}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--card-border)] lg:border-t-0 lg:pl-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono block">AI Execution Mode</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">
              {autoPilot ? "AI automatically enters setups" : "AI suggests, human executes"}
            </span>
          </div>
          <button
            onClick={handleToggleAutoPilot}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
              autoPilot
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                : "bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-300 border border-[var(--card-border)]"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoPilot ? "bg-white animate-pulse" : "bg-slate-400"}`} />
            Auto-Pilot: {autoPilot ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      {/* Row 1: Full-Width Chart Card */}
      <section className="w-full">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <div>
              <h3 className="font-bold">Live Candlestick Chart</h3>
              <p className="text-xs text-slate-400">Ticking every 5 seconds · Source: Yahoo Finance</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedHistoricalTrade && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Viewing Historical Setup</span>
                  <button
                    onClick={() => setSelectedHistoricalTrade(null)}
                    className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 hover:text-red-500 cursor-pointer"
                  >
                    [Clear]
                  </button>
                </div>
              )}
              {asset && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Live Feed</span>
                  <p className="text-lg font-black mt-0.5">{formatPrice(symbol, asset.price)}</p>
                </div>
              )}
            </div>
          </div>
          
          {chartLoading ? (
            <div className="flex h-[570px] items-center justify-center rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[var(--accent)]" />
            </div>
          ) : (
            <PredictionChart
              candles={candles}
              activePrice={asset?.price ?? 0}
              prediction={prediction}
              activeTrade={activeTrade || selectedHistoricalTrade}
              isPredictionExecuted={prediction?.computedAt ? lastExecuted === prediction.computedAt : false}
              height={550}
            />
          )}
        </Card>
      </section>

      {/* Row 2: Grid for AI predictions, trade execution, levels, and structure checks */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Column: AI Forecast and Execution Desk */}
        <div className="space-y-6">
          {/* 1. Active Open Paper Trade Details */}
          {activeTrade ? (
            <Card className="border-emerald-500/30 bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active Trade</span>
                  {activeTrade.timeframe && (
                    <span className="ml-2 rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-black text-slate-500 uppercase">{activeTrade.timeframe}</span>
                  )}
                  <p className="text-xl font-black mt-2 uppercase tracking-wide">
                    {activeTrade.direction} {activeTrade.symbol}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Opened: {new Date(activeTrade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} ({new Date(activeTrade.createdAt).toLocaleDateString()})
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${activeTradePnL.isGain ? "text-emerald-600" : "text-red-500"}`}>
                    {activeTradePnL.isGain ? "+" : ""}${activeTradePnL.pnlAmount.toFixed(2)}
                  </p>
                  <p className={`text-sm font-black ${activeTradePnL.isGain ? "text-emerald-600" : "text-red-500"}`}>
                    {activeTradePnL.isGain ? "+" : ""}{activeTradePnL.pnlPercentage.toFixed(2)}% PnL
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-[var(--card-border)] pt-4">
                <div className="bg-slate-100/30 dark:bg-white/5 p-2.5 rounded-xl border border-[var(--card-border)]">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold block">Entry Price</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200 text-sm font-black block mt-0.5">{formatPrice(symbol, activeTrade.entry)}</strong>
                </div>
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] p-2.5 rounded-xl border border-emerald-500/20">
                  <span className="text-emerald-600 dark:text-emerald-400 uppercase text-[10px] tracking-wider font-extrabold block">Target (TP)</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black block mt-0.5">{formatPrice(symbol, activeTrade.takeProfit)}</strong>
                </div>
                <div className="bg-red-500/[0.03] dark:bg-red-500/[0.05] p-2.5 rounded-xl border border-red-500/20">
                  <span className="text-red-500 dark:text-red-400 uppercase text-[10px] tracking-wider font-extrabold block">Risk (SL)</span>
                  <strong className="font-mono text-red-500 dark:text-red-400 text-sm font-black block mt-0.5">{formatPrice(symbol, activeTrade.stopLoss)}</strong>
                </div>
                <div className="bg-slate-100/30 dark:bg-white/5 p-2.5 rounded-xl border border-[var(--card-border)]">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold block">R:R Ratio</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200 text-sm font-black block mt-0.5">1:{activeTrade.riskReward}</strong>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20 col-span-2 sm:col-span-1">
                  <span className="text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider font-extrabold block">Position Size</span>
                  <strong className="font-mono text-amber-600 dark:text-amber-400 text-sm font-black block mt-0.5">
                    {activeTrade.lots !== undefined && activeTrade.lots !== null ? `${activeTrade.lots.toFixed(3)} Lots` : "—"}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => handleCloseTrade(activeTrade.id, asset?.price ?? activeTrade.entry, "Manual")}
                className="mt-5 w-full rounded-xl bg-red-500 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-600 cursor-pointer"
              >
                Close Trade at Market
              </button>
            </Card>
          ) : (
            /* If no active trade, show suggested trade if AI proposed one */
            prediction?.suggestedTrade && (
              <Card className="border-[var(--accent)]/30 bg-[var(--accent-soft)]/20">
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">Suggested AI Setup Available</p>
                <div className="mt-3 flex items-center justify-between">
                  <h4 className="font-black uppercase text-base">
                    {prediction.suggestedTrade.direction} Suggested Trade
                  </h4>
                  <span className="rounded bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-bold text-[var(--accent)]">
                    1:{prediction.suggestedTrade.riskReward.toFixed(1)} R:R
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center bg-slate-100/50 dark:bg-white/5 p-3 rounded-xl border border-[var(--card-border)]">
                  <div>
                    <p className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Entry</p>
                    <p className="font-mono font-black text-sm text-slate-800 dark:text-slate-200 mt-1">{formatPrice(symbol, prediction.suggestedTrade.entry)}</p>
                  </div>
                  <div className="border-x border-[var(--card-border)]">
                    <p className="text-red-400 uppercase text-[10px] tracking-wider font-extrabold">Stop (SL)</p>
                    <p className="font-mono font-black text-sm text-red-500 mt-1">{formatPrice(symbol, prediction.suggestedTrade.stopLoss)}</p>
                  </div>
                  <div>
                    <p className="text-emerald-500 uppercase text-[10px] tracking-wider font-extrabold">Target (TP)</p>
                    <p className="font-mono font-black text-sm text-emerald-600 mt-1">{formatPrice(symbol, prediction.suggestedTrade.takeProfit)}</p>
                  </div>
                </div>

                <button
                  disabled={isMarketClosed}
                  onClick={handleExecutePaperTrade}
                  className="mt-4 w-full rounded-xl bg-[var(--accent)] py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isMarketClosed ? "Market Closed (Weekend)" : "Execute Virtual Paper Trade"}
                </button>
              </Card>
            )
          )}

          {/* 2. AI Directional Probability Card */}
          <Card className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">Directional Forecast</p>
                <h3 className="font-black mt-0.5 text-lg">AI Probability Model</h3>
              </div>
              {prediction?.confidence && (
                <span className={`self-start sm:self-auto rounded-full px-3 py-1 text-[10px] sm:text-xs font-black uppercase ${
                  prediction.confidence === "high" ? "bg-emerald-500/10 text-emerald-600" :
                  prediction.confidence === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {prediction.confidence} Confidence
                </span>
              )}
            </div>

            {predictionLoading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent)]" />
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                {/* Horizontal probability meter */}
                <div>
                  <div className="flex justify-between text-sm font-black mb-2 uppercase font-mono">
                    <span className="text-emerald-500 text-sm font-extrabold">Bullish {prediction.bullishProbability}%</span>
                    <span className="text-red-400 text-sm font-extrabold">Bearish {prediction.bearishProbability}%</span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 border border-[var(--card-border)]">
                    <div className="bg-emerald-500" style={{ width: `${prediction.bullishProbability}%` }} />
                    <div className="bg-red-500" style={{ width: `${prediction.bearishProbability}%` }} />
                  </div>
                </div>

                {/* Target statistics */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center bg-slate-100/50 dark:bg-white/5 p-4 rounded-xl border border-[var(--card-border)]">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wider">Est. Movement</span>
                    <strong className="font-mono text-base font-black mt-1 block text-slate-900 dark:text-white">{prediction.predictedMove}</strong>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wider">Breakout Level</span>
                    <strong className="font-mono text-sm sm:text-base font-black mt-1 inline-block text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded break-all">{prediction.keyLevel}</strong>
                  </div>
                </div>

                {/* Drivers list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Contributing Drivers</h4>
                  {prediction.drivers.map((driver, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{driver.factor}</span>
                        <span className="font-mono font-extrabold text-[var(--accent)]">{driver.contribution}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                        <div className="bg-[var(--accent)] h-full" style={{ width: `${driver.contribution}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Reasoning */}
                <div className="space-y-1 border-t border-[var(--card-border)] pt-3">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Insight Reasoning</span>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium mt-1">{prediction.reasoning}</p>
                </div>

                {/* Session Clock Note */}
                <div className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 dark:bg-[#1a1917] p-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Session Volume Alert</span>
                  {prediction.sessionInsight}
                </div>

                {/* Model tag */}
                <div className="text-right text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Powered by {prediction.model}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Click &quot;Scan Market&quot; to generate directional calculations.</p>
            )}
          </Card>
        </div>

        {/* Right Column: SMC checks & Objective Daily Levels */}
        <div className="space-y-6">
          {/* 3. SMC Scanner Technical Check Card */}
          <Card>
            <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">SMC Structure Checks</p>
            <h3 className="font-black mt-0.5 text-lg border-b border-[var(--card-border)] pb-3">Institutional Footprint</h3>

            {predictionLoading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent)]" />
              </div>
            ) : prediction?.smcFeatures ? (
              <div className="mt-4 space-y-3.5 text-sm">
                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">SMC Trend Bias:</span>
                  <span className={`font-black uppercase tracking-wider px-2.5 py-1 rounded text-xs ${
                    prediction.smcFeatures.trend === "bullish" ? "bg-emerald-500/10 text-emerald-600" :
                    prediction.smcFeatures.trend === "bearish" ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                  }`}>
                    {prediction.smcFeatures.trend}
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">Nearest Order Block:</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 dark:text-white block text-sm">
                      {prediction.smcFeatures.nearestOB ? formatPrice(symbol, prediction.smcFeatures.nearestOB.price) : "None"}
                    </span>
                    {prediction.smcFeatures.nearestOB && (
                      <span className="text-xs text-slate-400 font-semibold">{prediction.smcFeatures.nearestOB.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Fair Value Gap (FVG):</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded text-sm">
                    {prediction.smcFeatures.activeFVG 
                      ? `${formatPrice(symbol, prediction.smcFeatures.activeFVG.bottom)} - ${formatPrice(symbol, prediction.smcFeatures.activeFVG.top)}`
                      : "None Detected"
                    }
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Liquidity Sweep:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 max-w-[150px] truncate text-right text-sm">
                    {prediction.smcFeatures.lastSweep ?? "None Observed"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold font-sans">Inducement Level (IDM):</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded text-sm">
                    {prediction.smcFeatures.inducementLevel ? formatPrice(symbol, prediction.smcFeatures.inducementLevel) : "None"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold font-sans">Equilibrium (50% Fib):</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">
                    {prediction.smcFeatures.equilibrium ? formatPrice(symbol, prediction.smcFeatures.equilibrium) : "None"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold font-sans">Premium / Discount Zone:</span>
                  <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded uppercase ${
                    prediction.smcFeatures.premiumDiscount === "discount" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : prediction.smcFeatures.premiumDiscount === "premium" 
                      ? "bg-red-500/10 text-red-500" 
                      : "bg-slate-500/10 text-slate-500"
                  }`}>
                    {prediction.smcFeatures.premiumDiscount ?? "None"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-1">
                  <span className="text-slate-500 dark:text-slate-400 font-bold font-sans">CISD State Shift:</span>
                  <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded uppercase ${
                    prediction.smcFeatures.cisdShift === "bullish" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : prediction.smcFeatures.cisdShift === "bearish" 
                      ? "bg-red-500/10 text-red-500" 
                      : "bg-slate-500/10 text-slate-500"
                  }`}>
                    {prediction.smcFeatures.cisdShift && prediction.smcFeatures.cisdShift !== "none" ? `${prediction.smcFeatures.cisdShift} Shift` : "No Shift"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Scan market to detect structural blocks.</p>
            )}
          </Card>

          {/* Real-time Session Clocks & Volatility Overlap Widget */}
          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-b border-[var(--card-border)] pb-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">Market Session Clocks</p>
                <h3 className="font-black mt-0.5 text-lg">Timezone Tracker</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 self-start sm:self-auto font-mono text-[10px] font-black">
                <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                  {sessionStatus.localTime || "00:00:00 AM"} Local
                </span>
                <span className="text-[var(--accent)] bg-[var(--accent-soft)]/20 px-2 py-0.5 rounded border border-[var(--accent)]/10 animate-pulse">
                  {sessionStatus.utcTime || "00:00:00 UTC"}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {[
                { name: "Tokyo Session (Asia)", active: sessionStatus.tokyo, hours: formatUtcRangeToLocal(0, 9) },
                { name: "London Session (Europe)", active: sessionStatus.london, hours: formatUtcRangeToLocal(8, 17) },
                { name: "New York Session (US)", active: sessionStatus.newYork, hours: formatUtcRangeToLocal(13, 22) },
              ].map((s) => (
                <div key={s.name} className="flex justify-between items-center border-b border-[var(--card-border)] pb-2.5 last:border-b-0 last:pb-0">
                  <div>
                    <span className="text-slate-800 dark:text-slate-200 font-bold block text-xs sm:text-sm">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{s.hours}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    s.active ? "bg-emerald-500/10 text-emerald-600 font-extrabold" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.active ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                    {s.active ? "Active" : "Closed"}
                  </span>
                </div>
              ))}

              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <span className="text-[9px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-400 block">Current Overlap Status</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-1">{sessionStatus.overlap}</span>
              </div>
            </div>
          </Card>

          {/* Automated Sentinel HUD Widget (Breaking Geopolitics & Macro Rumors) */}
          <Card className="border-[var(--accent)]/20 bg-[var(--accent-soft)]/[0.02]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">Automated Sentinel Feed</p>
                <h3 className="font-black mt-0.5 text-lg">Breaking Macro & Rumors</h3>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Monitoring
              </span>
            </div>

            <div className="mt-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1 select-none">
              {sentinelLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                  <div className="h-12 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
                </div>
              ) : sentinelFeed.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No live macro rumor bulletins detected.</p>
              ) : (
                sentinelFeed.map((item, idx) => (
                  <div key={idx} className="border-b border-[var(--card-border)] pb-3 last:border-b-0 last:pb-0 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-[var(--accent)] bg-[var(--accent-soft)]/20 px-2 py-0.5 rounded border border-[var(--accent)]/10 font-mono uppercase tracking-wider">{item.source}</span>
                      <span className="text-slate-400 font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{item.text}</p>
                  </div>
                ))
              )}
            </div>
            <p className="mt-4 text-[9px] text-slate-400 text-center font-bold font-mono uppercase tracking-wider">Feed aggregates dynamically from live public channels.</p>
          </Card>

          {/* Objective Levels Card */}
          <Card>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">Objective Daily Levels</p>
              <h2 className="mt-0.5 text-lg font-black">Daily Levels & Trend</h2>
              <p className="mt-1 text-xs text-slate-500">{instrument.historyNote}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Trend", context.trend], ["Daily open", context.dailyOpen], ["ATR (14)", context.atr],
                ["Prev day high", context.previousDayHigh], ["Prev day low", context.previousDayLow], ["Nearest support", context.nearestSupport],
                ["Nearest resistance", context.nearestResistance], ["Prev week high", context.previousWeekHigh], ["Prev week low", context.previousWeekLow],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-[var(--card-border)] p-3">
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{label}</p>
                  <p className={`mt-1 font-black capitalize text-base ${
                    label === "Trend" && value === "bullish" ? "text-emerald-500" :
                    label === "Trend" && value === "bearish" ? "text-red-500" : "text-slate-900 dark:text-white"
                  }`}>{typeof value === "number" ? formatPrice(symbol, value) : value ?? "—"}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Calendar alert section */}
      <section>
        <Card className={safety.verdict === "NO TRADE" ? "border-red-200 dark:border-red-500/30" : "border-emerald-200 dark:border-emerald-500/30"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">News Event Safety Gate</p>
              <h2 className={`mt-1 text-2xl font-black ${safety.verdict === "NO TRADE" ? "text-red-500" : "text-emerald-600"}`}>
                {safety.verdict}
              </h2>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-white/5">30m before / 15m after news</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-300">{safety.reason}</p>
          {nextEvent ? (
            <div className="mt-4 rounded-xl border border-[var(--card-border)] p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Next High-Impact USD Event</p>
              <p className="mt-1 text-sm font-bold">{nextEvent.title}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(nextEvent.date).toLocaleString()} · {nextEvent.source}</p>
            </div>
          ) : null}
        </Card>
      </section>

      {/* Manual Broker-safe risk planner */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manual Setup Checklist</p>
          <h2 className="mt-1 text-lg font-bold">Wait for Confirmation</h2>
          <div className="mt-5 space-y-2.5">
            {setupChecks.map((check) => (
              <div key={check.label} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-slate-50/40 px-3 py-2.5 dark:bg-white/[0.02]">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${check.pass ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300" : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:border-amber-300/50 dark:text-amber-200"}`} aria-hidden="true">{check.pass ? "✓" : "!"}</span>
                <span className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-200">{check.label}</span>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${check.pass ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>{check.pass ? "Pass" : "Wait"}</span>
              </div>
            ))}
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--card-border)] p-3 text-xs"><input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} />I saw a valid confirmation candle on my broker chart</label>
          <div className={`mt-5 rounded-xl border p-4 ${setupReady ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/[0.06] text-amber-800 dark:text-amber-200"}`}><p className="font-bold text-sm">{setupReady ? "SETUP CHECKS PASSED" : "WAIT"}</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{setupReady ? "Checks passed; verify broker spread and execution price before acting." : "One or more safety or confirmation conditions are missing."}</p></div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manual Risk Planner</p>
          <h2 className="mt-1 text-lg font-bold">Know the maximum loss before entry</h2>
          <p className="mt-1 text-xs text-slate-500">Estimates are based on standard account sizing inputs.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-bold text-slate-500">Account ($)<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm focus:outline-none" type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Risk %<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm focus:outline-none" type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Direction<select className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-2 text-sm focus:outline-none cursor-pointer" value={direction} onChange={(e) => setDirection(e.target.value as "buy" | "sell")}><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
            <label className="text-xs font-bold text-slate-500">Entry<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm focus:outline-none" type="number" value={entry} onChange={(e) => setEntry(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Stop loss<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm focus:outline-none" type="number" value={stop} onChange={(e) => setStop(e.target.value)} /></label>
            <label className="text-xs font-bold text-slate-500">Target<input className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-transparent p-2 text-sm focus:outline-none" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          </div>
          <button type="button" disabled={!asset} className="mt-4 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" onClick={useCurrentPrice}>{entryCopied ? "Entry filled" : "Use current price"}</button>
          
          {riskPlan ? (
            <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-5">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-400">Max loss</p><p className="text-lg font-black mt-0.5">${riskPlan.riskAmount.toFixed(2)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-400">Stop distance</p><p className="text-lg font-black mt-0.5">{riskPlan.stopDistance.toFixed(4)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-400">R:R Ratio</p><p className="text-lg font-black mt-0.5">1:{riskPlan.riskReward.toFixed(2)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs text-slate-400">Position Size</p>
                <p className="text-lg font-black mt-0.5 text-[var(--accent)]">
                  {(() => {
                    const stopDistance = riskPlan.stopDistance;
                    if (stopDistance <= 0) return "—";
                    let multiplier = 1;
                    if (symbol === "XAU/USD") multiplier = 100;
                    else if (symbol === "EUR/USD") multiplier = 100000;
                    else if (symbol === "BTC/USD") multiplier = 1;
                    const lots = riskPlan.riskAmount / (stopDistance * multiplier);
                    return `${lots.toFixed(3)} Lots`;
                  })()}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="text-xs text-slate-400">Risk status</p><p className="text-xs font-bold mt-1 text-slate-500">{riskPlan.riskWarning ?? riskPlan.rewardWarning ?? "Within guidelines"}</p></div>
            </div>
          ) : (
            <p className="mt-5 text-xs text-slate-500">Enter a valid stop and target to calculate risk.</p>
          )}
        </Card>
      </section>

      {/* Phase 4: Trade Journal & AI Audit Lessons */}
      <section className="w-full">
        <Card className="flex flex-col gap-4">
          <div className="border-b border-[var(--card-border)] pb-3">
            <h3 className="text-lg font-black">AI Trade Journal & Audit Desk</h3>
            <p className="text-xs text-slate-400">Review historical trades, PnL statistics, and structural trade audits.</p>
          </div>

          {tradesList.filter(t => t.status === "closed" && t.symbol === symbol).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No closed {symbol} trades logged. Auto-Pilot or manual executions on {symbol} will build this log.</p>
          ) : (
            <>
              {/* Desktop View: Standard Journal Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-[10px] uppercase font-bold text-slate-400 font-mono">
                      <th className="py-2.5">Asset / Date</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5 text-right">Entry & Exit</th>
                      <th className="py-2.5 text-right">Net PnL</th>
                      <th className="py-2.5 text-center">Outcome</th>
                      <th className="py-2.5">AI Trade Review & Lessons</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)] font-medium">
                    {tradesList
                      .filter((t) => t.status === "closed" && t.symbol === symbol)
                      .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
                      .map((t) => {
                        const isWin = (t.pnlAmount ?? 0) > 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01]">
                            <td className="py-3">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {t.symbol}
                                {t.timeframe && (
                                  <span className="ml-1.5 rounded bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-black text-slate-500 uppercase">{t.timeframe}</span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase font-mono ${
                                t.direction === "buy" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                              }`}>
                                {t.direction}
                              </span>
                              {t.lots !== undefined && t.lots !== null && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-1">
                                  {t.lots.toFixed(3)} Lots
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right font-mono">
                              <span className="text-slate-700 dark:text-slate-300 block">{formatPrice(t.symbol, t.entry)}</span>
                              <span className="text-slate-400 block">{t.exitPrice ? formatPrice(t.symbol, t.exitPrice) : "—"}</span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold">
                              <span className={isWin ? "text-emerald-500" : "text-red-500"}>
                                {t.pnlAmount !== null ? `${t.pnlAmount >= 0 ? "+" : ""}$${t.pnlAmount.toFixed(2)}` : "—"}
                              </span>
                              <span className={`block text-[10px] ${isWin ? "text-emerald-500" : "text-red-500"}`}>
                                {t.pnlPercentage !== null ? `${t.pnlPercentage >= 0 ? "+" : ""}${t.pnlPercentage.toFixed(2)}%` : "—"}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`rounded-xl px-2 py-0.5 font-bold uppercase ${
                                isWin ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                              }`}>
                                {isWin ? "TP Hit" : "SL Hit"}
                              </span>
                            </td>
                            <td className="py-3 max-w-[320px]">
                              {t.postmortem ? (
                                <div className="space-y-1">
                                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{t.postmortem}</p>
                                  {t.lesson && (
                                    <p className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 mt-1">
                                      💡 <span className="font-extrabold">Lesson:</span> {t.lesson}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-slate-400 animate-pulse font-semibold">
                                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                                  Analyzing trade dynamics...
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setSymbol(t.symbol);
                                  setSelectedHistoricalTrade(t);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white px-2.5 py-1.5 text-[10px] font-black uppercase text-[var(--accent)] transition-all cursor-pointer"
                              >
                                Show on Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Responsive Card Grid (Stack format) */}
              <div className="block md:hidden space-y-4">
                {tradesList
                  .filter((t) => t.status === "closed" && t.symbol === symbol)
                  .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
                  .map((t) => {
                    const isWin = (t.pnlAmount ?? 0) > 0;
                    return (
                      <div key={t.id} className="rounded-xl border border-[var(--card-border)] bg-slate-50/50 dark:bg-white/[0.01] p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
                          <div>
                            <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">{t.symbol}</span>
                            {t.timeframe && (
                              <span className="ml-1.5 rounded bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-black text-slate-500 uppercase">{t.timeframe}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Direction</span>
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase font-mono mt-0.5 ${
                              t.direction === "buy" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                            }`}>
                              {t.direction}
                            </span>
                            {t.lots !== undefined && t.lots !== null && (
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                                {t.lots.toFixed(3)} Lots
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Outcome</span>
                            <span className={`inline-block rounded-xl px-2 py-0.5 text-[9px] font-bold uppercase mt-0.5 ${
                              isWin ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                            }`}>
                              {isWin ? "TP Hit" : "SL Hit"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider font-sans">Entry & Exit</span>
                            <span className="font-mono font-bold block mt-0.5 text-slate-700 dark:text-slate-300">
                              {formatPrice(t.symbol, t.entry)} ➔ {t.exitPrice ? formatPrice(t.symbol, t.exitPrice) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider font-sans">Net PnL</span>
                            <span className={`font-mono font-black block mt-0.5 ${isWin ? "text-emerald-500" : "text-red-500"}`}>
                              {t.pnlAmount !== null ? `${t.pnlAmount >= 0 ? "+" : ""}$${t.pnlAmount.toFixed(2)}` : "—"}
                              <span className="text-[10px] ml-1 font-bold">({t.pnlPercentage !== null ? `${t.pnlPercentage >= 0 ? "+" : ""}${t.pnlPercentage.toFixed(2)}%` : "—"})</span>
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-[var(--card-border)] pt-2 space-y-1">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider font-mono">AI Review & Lessons</span>
                          {t.postmortem ? (
                            <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              <p className="font-medium leading-relaxed">{t.postmortem}</p>
                              {t.lesson && (
                                <p className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 mt-1 leading-normal">
                                  💡 <span className="font-extrabold font-sans">Lesson:</span> {t.lesson}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse font-semibold py-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Analyzing trade dynamics...
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setSymbol(t.symbol);
                            setSelectedHistoricalTrade(t);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="w-full rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white py-2 text-[10px] font-black uppercase text-[var(--accent)] transition-all cursor-pointer text-center"
                        >
                          Show on Chart
                        </button>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </Card>
      </section>

      <p className="text-center text-[10px] text-slate-400 font-medium">Safety and education tool only. Always verify prices, spreads, and contract specifications on your broker platform.</p>
    </PageShell>
  );
}
