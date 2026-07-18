"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, PageShell } from "../components";
import { AssetIcon, nameMap, formatPrice } from "../asset-icon";
import type { PriceAlert, LiveAsset } from "../types";

const STORAGE_KEY = "macromind-alerts";
const POLL_INTERVAL = 5000;

type AlertForm = {
  symbol: string;
  condition: "above" | "below";
  targetPrice: string;
  note: string;
};

type StrategyAlert = {
  id: string;
  symbol: string;
  mode: "Simple" | "Scoring" | "Low TF" | "Session";
  timeframe: "1h" | "4h" | "1d";
  active: boolean;
};

type StrategyConfig = {
  botToken: string;
  chatId: string;
  alerts: StrategyAlert[];
};

type HUDData = {
  signal: string;
  price: number;
  time: string;
  details: string;
  loading: boolean;
  indicators?: {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
    rsi: number;
    macd: number;
    signal: number;
    adx: number;
    atr: number;
  };
};

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"price" | "strategy">("price");
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [form, setForm] = useState<AlertForm>({ symbol: "XAU/USD", condition: "above", targetPrice: "", note: "" });
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [lastChecked, setLastChecked] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const alertedSet = useRef<Set<string>>(new Set());

  // Global bot config & strategy lists
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    botToken: "",
    chatId: "",
    alerts: [],
  });

  // Local strategy form state
  const [stratForm, setStratForm] = useState<{
    symbol: string;
    mode: "Simple" | "Scoring" | "Low TF" | "Session";
    timeframe: "1h" | "4h" | "1d";
  }>({
    symbol: "XAU/USD",
    mode: "Simple",
    timeframe: "1h",
  });

  // Strategy HUD data mapped by alert ID
  const [huds, setHuds] = useState<Record<string, HUDData>>({});
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Hydrate from localStorage and server configuration
  useEffect(() => {
    try {
      const storedAlerts = localStorage.getItem(STORAGE_KEY);
      if (storedAlerts) {
        const parsed = JSON.parse(storedAlerts);
        if (Array.isArray(parsed)) {
          setTimeout(() => setAlerts(parsed), 0);
        }
      }
    } catch { /* corrupted */ }

    // Fetch config from server
    fetch("/api/strategy-config")
      .then((res) => res.json())
      .then((json) => {
        if (json && typeof json === "object" && !json.error) {
          setTimeout(
            () =>
              setStrategyConfig({
                botToken: json.botToken || "",
                chatId: json.chatId || "",
                alerts: Array.isArray(json.alerts) ? json.alerts : [],
              }),
            0
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        setHydrated(true);
      });

    if (typeof window !== "undefined" && "Notification" in window) {
      setTimeout(() => setNotifPermission(Notification.permission), 0);
    }
  }, []);

  // Save price alerts to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {}
  }, [alerts, hydrated]);

  // Save strategy configurations to server
  const saveStrategyConfig = useCallback(async (newConfig: StrategyConfig) => {
    try {
      await fetch("/api/strategy-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
    } catch { /* save fail */ }
  }, []);

  // Poll prices and check alerts
  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (!json.data) return;
      const data: LiveAsset[] = json.data;

      const priceMap: Record<string, number> = {};
      for (const a of data) priceMap[a.symbol] = a.price;
      setLivePrices(priceMap);
      setLastChecked(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );

      // Check alerts
      setAlerts((prev) => {
        let changed = false;
        const updated = prev.map((alert) => {
          if (alert.triggered || alertedSet.current.has(alert.id)) return alert;
          const price = priceMap[alert.symbol];
          if (!price) return alert;

          const shouldTrigger = alert.condition === "above" ? price >= alert.targetPrice : price <= alert.targetPrice;
          if (shouldTrigger) {
            changed = true;
            alertedSet.current.add(alert.id);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const dir = alert.condition === "above" ? "risen above" : "fallen below";
              new Notification(`${alert.symbol} Alert Triggered`, {
                body: `${alert.symbol} has ${dir} ${formatPrice(alert.symbol, alert.targetPrice)} (now: ${formatPrice(
                  alert.symbol,
                  price
                )})${alert.note ? `\n${alert.note}` : ""}`,
                tag: alert.id,
              });
            }
            return { ...alert, triggered: true, triggeredAt: new Date().toISOString() };
          }
          return alert;
        });
        return changed ? updated : prev;
      });
    } catch { /* keep last known */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkAlerts, 0);
    const interval = setInterval(checkAlerts, POLL_INTERVAL);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkAlerts]);

  // Execute manual strategy check for a specific alert configuration
  async function runStrategyCheck(alert: StrategyAlert) {
    if (!strategyConfig.botToken || !strategyConfig.chatId) return;
    try {
      setHuds((prev) => ({ ...prev, [alert.id]: { ...(prev[alert.id] || { signal: "NONE", price: 0, time: "", details: "" }), loading: true } }));
      const res = await fetch("/api/strategy-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: alert.symbol,
          mode: alert.mode,
          timeframe: alert.timeframe,
          botToken: strategyConfig.botToken,
          chatId: strategyConfig.chatId,
          sendTelegram: false, // manual check doesn't send message
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHuds((prev) => ({
          ...prev,
          [alert.id]: {
            signal: json.signal,
            price: json.price,
            time: json.time,
            details: json.details,
            indicators: json.indicators,
            loading: false,
          },
        }));
      }
    } catch {
      setHuds((prev) => ({ ...prev, [alert.id]: { ...(prev[alert.id] || { signal: "NONE", price: 0, time: "", details: "" }), loading: false } }));
    }
  }

  async function testTelegram() {
    if (!strategyConfig.botToken || !strategyConfig.chatId) return;
    try {
      setTestLoading(true);
      setTestStatus(null);
      const res = await fetch("/api/strategy-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: strategyConfig.botToken,
          chatId: strategyConfig.chatId,
          isTest: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestStatus({ success: true, message: "Test message sent! Check your phone." });
      } else {
        setTestStatus({ success: false, message: json.error || "Failed to send message." });
      }
    } catch {
      setTestStatus({ success: false, message: "Network connection failed." });
    } finally {
      setTestLoading(false);
    }
  }

  function requestNotifications() {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((p) => setNotifPermission(p));
    }
  }

  function addPriceAlert() {
    const target = parseFloat(form.targetPrice);
    if (!target || target <= 0) return;
    const currentPrice = livePrices[form.symbol] ?? 0;
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: form.symbol,
      condition: form.condition,
      targetPrice: target,
      currentPriceWhenSet: currentPrice,
      note: form.note || "",
      createdAt: new Date().toISOString(),
      triggered: false,
      triggeredAt: null,
      aiContext: null,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setForm((f) => ({ ...f, targetPrice: "", note: "" }));
  }

  function deletePriceAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    alertedSet.current.delete(id);
  }

  function clearTriggeredPriceAlerts() {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  }

  function resetPriceAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, triggered: false, triggeredAt: null } : a)));
    alertedSet.current.delete(id);
  }

  // Strategy alerts array management
  function addStrategyAlert() {
    const newAlert: StrategyAlert = {
      id: `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol: stratForm.symbol,
      mode: stratForm.mode,
      timeframe: stratForm.timeframe,
      active: true,
    };
    setStrategyConfig((prev) => {
      const updated = { ...prev, alerts: [...prev.alerts, newAlert] };
      saveStrategyConfig(updated);
      return updated;
    });
  }

  function deleteStrategyAlert(id: string) {
    setStrategyConfig((prev) => {
      const updated = { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) };
      saveStrategyConfig(updated);
      return updated;
    });
    setHuds((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function toggleStrategyAlert(id: string) {
    setStrategyConfig((prev) => {
      const updated = {
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
      };
      saveStrategyConfig(updated);
      return updated;
    });
  }

  function handleCredentialChange(key: "botToken" | "chatId", val: string) {
    setStrategyConfig((prev) => {
      const updated = { ...prev, [key]: val };
      saveStrategyConfig(updated);
      return updated;
    });
  }

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const livePriceForPair = livePrices[form.symbol];

  return (
    <PageShell title="Price & Strategy Alerts" label="Alerts Manager" action="Enable Alerts">
      {/* Navigation Tab Selector */}
      <div className="mb-6 flex gap-2 border-b border-[var(--card-border)] pb-2">
        <button
          onClick={() => setActiveTab("price")}
          className={`px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "price"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Price Alerts
        </button>
        <button
          onClick={() => setActiveTab("strategy")}
          className={`px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "strategy"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Strategy Alerts Bot (Fx Ultimate)
        </button>
      </div>

      {activeTab === "price" ? (
        <>
          {/* Notification permission banner */}
          {notifPermission !== "granted" && (
            <Card className="animate-fade-up border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold">Browser notifications are {notifPermission === "denied" ? "blocked" : "not enabled"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {notifPermission === "denied"
                        ? "You'll need to update your browser settings to enable alerts."
                        : "Enable notifications to get desktop alerts when your price targets are hit."}
                    </p>
                  </div>
                </div>
                {notifPermission !== "denied" && (
                  <button onClick={requestNotifications} className="shrink-0 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    Enable
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Create alert */}
          <section>
            <Card className="animate-fade-up">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New alert</p>
              </div>
              <h2 className="mt-3 text-xl font-bold">Set a price alert</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Asset</label>
                  <select
                    value={form.symbol}
                    onChange={(e) => setForm(f => ({ ...f, symbol: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  >
                    {Object.keys(nameMap).map(sym => <option key={sym} value={sym}>{sym} — {nameMap[sym]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm(f => ({ ...f, condition: e.target.value as "above" | "below" }))}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  >
                    <option value="above">Price rises above</option>
                    <option value="below">Price falls below</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Target Price
                    {livePriceForPair && <span className="ml-1.5 font-normal text-slate-400">(now: {formatPrice(form.symbol, livePriceForPair)})</span>}
                  </label>
                  <input
                    type="number"
                    value={form.targetPrice}
                    onChange={(e) => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Note (optional)</label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="e.g. Breakout watch"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <button
                onClick={addPriceAlert}
                disabled={!form.targetPrice}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Alert
              </button>
            </Card>
          </section>

          {/* Live status */}
          <section>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Monitoring
                </span>
                <span className="text-xs text-slate-400">
                  {activeAlerts.length} active • {triggeredAlerts.length} triggered • Checked {lastChecked || "starting..."}
                </span>
              </div>
              {triggeredAlerts.length > 0 && (
                <button onClick={clearTriggeredPriceAlerts} className="text-xs font-semibold text-slate-400 transition-colors hover:text-red-500">
                  Clear triggered
                </button>
              )}
            </div>
          </section>

          {/* Active alerts */}
          {activeAlerts.length > 0 ? (
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Active Price Alerts ({activeAlerts.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeAlerts.map((alert, i) => {
                  const livePrice = livePrices[alert.symbol];
                  const distance = livePrice ? Math.abs(livePrice - alert.targetPrice) / livePrice * 100 : null;
                  return (
                    <Card key={alert.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 4) * 0.05}s` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <AssetIcon symbol={alert.symbol} size={32} />
                          <div>
                            <p className="text-sm font-bold">{alert.symbol}</p>
                            <p className="text-xs text-slate-500">{nameMap[alert.symbol] ?? alert.symbol}</p>
                          </div>
                        </div>
                        <button onClick={() => deletePriceAlert(alert.id)} className="text-slate-300 transition-colors hover:text-red-500">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${alert.condition === "above" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10" : "bg-red-50 text-red-600 dark:bg-red-50/10"}`}>
                          {alert.condition === "above" ? "▲ Above" : "▼ Below"} {formatPrice(alert.symbol, alert.targetPrice)}
                        </span>
                        {livePrice && (
                          <span className="text-xs text-slate-400">
                            Now: <span className="font-bold tabular-nums">{formatPrice(alert.symbol, livePrice)}</span>
                            {distance !== null && <span className="ml-1">({distance.toFixed(1)}% away)</span>}
                          </span>
                        )}
                      </div>

                      {/* Distance bar */}
                      {livePrice ? (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                            style={{ width: `${Math.max(3, 100 - (distance ?? 100))}%` }}
                          />
                        </div>
                      ) : null}

                      {alert.note ? <p className="mt-3 text-xs text-slate-500">{alert.note}</p> : null}
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Triggered alerts */}
          {triggeredAlerts.length > 0 ? (
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Triggered ({triggeredAlerts.length})</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {triggeredAlerts.map((alert, i) => (
                  <Card key={alert.id} className="animate-fade-up border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-500/5" style={{ animationDelay: `${Math.min(i, 4) * 0.05}s` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={alert.symbol} size={32} />
                        <div>
                          <p className="text-sm font-bold">{alert.symbol}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">Triggered</span>
                            {alert.triggeredAt && (
                              <span className="text-xs text-slate-400">• {new Date(alert.triggeredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => resetPriceAlert(alert.id)} className="text-xs font-semibold text-[var(--accent)] transition-colors hover:underline">
                          Reset
                        </button>
                        <button onClick={() => deletePriceAlert(alert.id)} className="text-slate-300 transition-colors hover:text-red-500">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${alert.condition === "above" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-50/10" : "bg-red-50 text-red-600 dark:bg-red-50/10"}`}>
                        {alert.condition === "above" ? "▲" : "▼"} {formatPrice(alert.symbol, alert.targetPrice)}
                      </span>
                      {livePrices[alert.symbol] && (
                        <span className="text-xs text-slate-400">
                          Now: <span className="font-bold tabular-nums">{formatPrice(alert.symbol, livePrices[alert.symbol])}</span>
                        </span>
                      )}
                    </div>
                    {alert.note ? <p className="mt-3 text-xs text-slate-500">{alert.note}</p> : null}
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* Empty state */}
          {alerts.length === 0 && hydrated ? (
            <Card className="border-dashed text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-400">No alerts yet. Set one above to get notified when your target price is hit.</p>
            </Card>
          ) : null}

          <p className="text-center text-xs text-slate-400 mt-6">
            Alerts are stored locally in your browser and monitored every 5 seconds. No account needed.
          </p>
        </>
      ) : (
        <>
          {/* Strategy Alerts Layout */}
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-6">
              {/* Telegram bot configurations */}
              <Card>
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                  </svg>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Telegram Link</p>
                </div>
                <h2 className="mt-3 text-lg font-bold">Bot Config</h2>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bot Token</label>
                    <input
                      type="password"
                      value={strategyConfig.botToken}
                      onChange={(e) => handleCredentialChange("botToken", e.target.value)}
                      placeholder="Token ID..."
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chat ID</label>
                    <input
                      type="text"
                      value={strategyConfig.chatId}
                      onChange={(e) => handleCredentialChange("chatId", e.target.value)}
                      placeholder="Chat ID..."
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <button
                  onClick={testTelegram}
                  disabled={testLoading || !strategyConfig.botToken || !strategyConfig.chatId}
                  className="mt-4 w-full rounded-xl bg-slate-100 dark:bg-white/5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {testLoading ? "Testing..." : "Send Test Alert"}
                </button>

                {testStatus && (
                  <div className={`mt-3 rounded-lg p-3 text-xs font-semibold leading-relaxed ${
                    testStatus.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}>
                    {testStatus.message}
                  </div>
                )}
              </Card>

              {/* Add strategy panel */}
              <Card>
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">New setup</p>
                </div>
                <h2 className="mt-3 text-lg font-bold">Add Signal</h2>

                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Asset</label>
                    <select
                      value={stratForm.symbol}
                      onChange={(e) => setStratForm((f) => ({ ...f, symbol: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                    >
                      {Object.keys(nameMap).map(sym => <option key={sym} value={sym}>{sym}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mode</label>
                    <select
                      value={stratForm.mode}
                      onChange={(e) => setStratForm((f) => ({ ...f, mode: e.target.value as "Simple" | "Scoring" | "Low TF" | "Session" }))}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                    >
                      <option value="Simple">Simple</option>
                      <option value="Scoring">Scoring (A+)</option>
                      <option value="Low TF">Low TF</option>
                      <option value="Session">Session</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Timeframe</label>
                    <select
                      value={stratForm.timeframe}
                      onChange={(e) => setStratForm((f) => ({ ...f, timeframe: e.target.value as "1h" | "4h" | "1d" }))}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
                    >
                      <option value="1h">1H Chart</option>
                      <option value="4h">4H Chart</option>
                      <option value="1d">Daily (1D)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={addStrategyAlert}
                  disabled={!strategyConfig.botToken || !strategyConfig.chatId}
                  className="mt-5 w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Setup
                </button>
              </Card>
            </div>

            {/* List of active strategy setups */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Strategy Listeners ({strategyConfig.alerts.length})</h3>

              {strategyConfig.alerts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {strategyConfig.alerts.map((alert) => {
                    const hud = huds[alert.id];
                    return (
                      <Card key={alert.id} className="relative flex flex-col justify-between p-6 border border-[var(--card-border)]">
                        <div>
                          {/* Alert details */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AssetIcon symbol={alert.symbol} size={32} />
                              <div>
                                <h4 className="text-base font-extrabold">{alert.symbol}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Timeframe: <span className="font-bold text-slate-700 dark:text-slate-200">{alert.timeframe}</span></p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStrategyAlert(alert.id)}
                                className={`rounded-xl px-3 py-1 text-xs font-bold uppercase transition-colors ${
                                  alert.active
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100/50"
                                    : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-200/50"
                                }`}
                                title="Toggle listener active/pause"
                              >
                                {alert.active ? "Listening" : "Paused"}
                              </button>
                              <button
                                onClick={() => deleteStrategyAlert(alert.id)}
                                className="text-slate-300 transition-colors hover:text-red-500"
                                title="Remove setup"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] rounded-xl px-3 py-2.5 border border-[var(--card-border)] text-sm">
                            <span className="text-slate-500 font-medium">Strategy Mode:</span>
                            <span className="font-bold text-[var(--accent)]">{alert.mode}</span>
                          </div>

                          {/* Calculated indicators HUD */}
                          {hud && (
                            <div className="mt-4 border-t border-[var(--card-border)] pt-4 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Last Signal Trigger:</span>
                                <span className={`rounded-lg px-2.5 py-1 font-bold text-xs ${
                                  hud.signal === "BUY" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                  hud.signal === "SELL" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                                }`}>{hud.signal}</span>
                              </div>
                              {hud.indicators && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <span className="bg-slate-100/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-semibold flex justify-between">
                                    <span>RSI</span>
                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{hud.indicators.rsi.toFixed(1)}</span>
                                  </span>
                                  <span className="bg-slate-100/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-semibold flex justify-between">
                                    <span>ATR</span>
                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{hud.indicators.atr.toFixed(4)}</span>
                                  </span>
                                  <span className="bg-slate-100/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-semibold flex justify-between">
                                    <span>ADX</span>
                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{hud.indicators.adx.toFixed(1)}</span>
                                  </span>
                                  <span className="bg-slate-100/50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-semibold flex justify-between">
                                    <span>EMA200</span>
                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{hud.indicators.ema200.toFixed(0)}</span>
                                  </span>
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400 italic text-right leading-none">Calculated: {new Date(hud.time).toLocaleTimeString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Daemon check running...</span>
                          <button
                            onClick={() => runStrategyCheck(alert)}
                            disabled={hud?.loading || !strategyConfig.botToken || !strategyConfig.chatId}
                            className="text-xs font-bold text-[var(--accent)] border border-[var(--accent)] rounded-xl px-3 py-1.5 transition-all hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                          >
                            {hud?.loading ? "Processing..." : "Manual Check"}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed text-center p-8">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-slate-400">No strategy setups added yet.</p>
                  <p className="text-xs text-slate-500">Configure your credentials, select your parameters, and click Create Setup to start monitoring.</p>
                </Card>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            The strategy background daemon runs locally on your server. As long as your terminal is running <code>npm run dev</code>, setups will be scanned every 30 seconds.
          </p>
        </>
      )}
    </PageShell>
  );
}
