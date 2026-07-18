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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [form, setForm] = useState<AlertForm>({ symbol: "XAU/USD", condition: "above", targetPrice: "", note: "" });
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [lastChecked, setLastChecked] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const alertedSet = useRef<Set<string>>(new Set());

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PriceAlert[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTimeout(() => {
            setAlerts(parsed);
          }, 0);
        }
      }
    } catch { /* corrupted */ }
    setTimeout(() => {
      setHydrated(true);
    }, 0);

    if (typeof window !== "undefined" && "Notification" in window) {
      setTimeout(() => {
        setNotifPermission(Notification.permission);
      }, 0);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch {}
  }, [alerts, hydrated]);

  // Poll prices + check alerts
  const checkAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (!json.data) return;
      const data: LiveAsset[] = json.data;

      const priceMap: Record<string, number> = {};
      for (const a of data) priceMap[a.symbol] = a.price;
      setLivePrices(priceMap);
      setLastChecked(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      // Check alerts
      setAlerts(prev => {
        let changed = false;
        const updated = prev.map(alert => {
          if (alert.triggered || alertedSet.current.has(alert.id)) return alert;
          const price = priceMap[alert.symbol];
          if (!price) return alert;

          const shouldTrigger = alert.condition === "above" ? price >= alert.targetPrice : price <= alert.targetPrice;
          if (shouldTrigger) {
            changed = true;
            alertedSet.current.add(alert.id);
            // Fire browser notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const dir = alert.condition === "above" ? "risen above" : "fallen below";
              new Notification(`${alert.symbol} Alert Triggered`, {
                body: `${alert.symbol} has ${dir} ${formatPrice(alert.symbol, alert.targetPrice)} (now: ${formatPrice(alert.symbol, price)})${alert.note ? `\n${alert.note}` : ""}`,
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

  function requestNotifications() {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then(p => setNotifPermission(p));
    }
  }

  function addAlert() {
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
    setAlerts(prev => [newAlert, ...prev]);
    setForm(f => ({ ...f, targetPrice: "", note: "" }));
  }

  function deleteAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
    alertedSet.current.delete(id);
  }

  function clearTriggered() {
    setAlerts(prev => prev.filter(a => !a.triggered));
  }

  function resetAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, triggered: false, triggeredAt: null } : a));
    alertedSet.current.delete(id);
  }

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const livePriceForPair = livePrices[form.symbol];

  return (
    <PageShell title="Smart Price Alerts" label="Alerts" action="Enable Notifications">
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
                <p className="text-xs text-slate-500">{notifPermission === "denied" ? "You'll need to update your browser settings to enable alerts." : "Enable notifications to get desktop alerts when your price targets are hit."}</p>
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
            onClick={addAlert}
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
            <button onClick={clearTriggered} className="text-xs font-semibold text-slate-400 transition-colors hover:text-red-500">
              Clear triggered
            </button>
          )}
        </div>
      </section>

      {/* Active alerts */}
      {activeAlerts.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Active Alerts ({activeAlerts.length})</h2>
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
                    <button onClick={() => deleteAlert(alert.id)} className="text-slate-300 transition-colors hover:text-red-500">
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
                    <button onClick={() => resetAlert(alert.id)} className="text-xs font-semibold text-[var(--accent)] transition-colors hover:underline">
                      Reset
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} className="text-slate-300 transition-colors hover:text-red-500">
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

      <p className="text-center text-xs text-slate-400">
        Alerts are stored locally in your browser and monitored every 5 seconds. No account needed.
      </p>
    </PageShell>
  );
}
