/**
 * Backtest Engine — runs a trading strategy bar-by-bar on historical candles.
 *
 * Ported from fx_ultimate_python — implements EMA crossover + RSI pullback
 * strategies with ATR-based risk management.
 */

export type Candle = {
  time: number; // unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Trade = {
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  direction: "long" | "short";
  pnl: number; // % return
  pnlUsd: number; // $ return on $10k account
  barsHeld: number;
  exitReason: "take_profit" | "stop_loss" | "signal_exit";
};

export type BacktestResult = {
  trades: Trade[];
  stats: BacktestStats;
  equityCurve: Array<{ time: number; equity: number }>;
  signals: Array<{ time: number; type: "buy" | "sell"; price: number }>;
};

export type BacktestStats = {
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  profitFactor: number;
  totalReturn: number; // %
  maxDrawdown: number; // %
  avgWin: number; // %
  avgLoss: number; // %
  sharpeRatio: number;
  avgBarsHeld: number;
  bestTrade: number; // %
  worstTrade: number; // %
};

export type RuleCondition = {
  left: "close" | "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi";
  operator: "crosses_above" | "crosses_below" | "greater_than" | "less_than";
  right: "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi" | "value";
  value?: number; // Numeric value if right is "value"
};

export type StrategyConfig = {
  symbol: string;
  emaFast: number; // 9
  emaMedium: number; // 21
  emaSlow: number; // 50
  emaTrend: number; // 200
  rsiPeriod: number; // 14
  rsiOversold: number; // 30
  rsiOverbought: number; // 70
  atrPeriod: number; // 14
  stopLossMultiplier: number; // 1.5 (ATR multiplier)
  takeProfitMultiplier: number; // 3.0 (ATR multiplier)
  initialCapital: number; // $10,000
  riskPerTrade: number; // 2% of equity
  strategyType: "preset_ultimate" | "custom_rules";
  buyRules: RuleCondition[];
  sellRules: RuleCondition[];
};

export const DEFAULT_STRATEGY: StrategyConfig = {
  symbol: "XAU/USD",
  emaFast: 9,
  emaMedium: 21,
  emaSlow: 50,
  emaTrend: 200,
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  atrPeriod: 14,
  stopLossMultiplier: 1.5,
  takeProfitMultiplier: 3.0,
  initialCapital: 10000,
  riskPerTrade: 2,
  strategyType: "preset_ultimate",
  buyRules: [
    { left: "close", operator: "crosses_above", right: "emaFast" },
    { left: "rsi", operator: "less_than", right: "value", value: 30 },
  ],
  sellRules: [
    { left: "close", operator: "crosses_below", right: "emaFast" },
    { left: "rsi", operator: "greater_than", right: "value", value: 70 },
  ],
};

// ── Indicator calculations ──────────────────────────────────────────────

export function calcEMA(values: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prev = values[0] ?? 0;
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      prev = values[i];
      ema.push(prev);
    } else {
      prev = values[i] * k + prev * (1 - k);
      ema.push(prev);
    }
  }
  return ema;
}

export function calcRSI(candles: Candle[], period: number): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      rsi.push(50);
      continue;
    }
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      gains += gain;
      losses += loss;
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(50);
      }
    } else {
      const prevRsi = rsi[i - 1];
      const prevAvgGain = (prevRsi !== undefined) ? gains / period : 0;
      gains = (prevAvgGain * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses > 0 ? gains / losses : 100;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

export function calcATR(candles: Candle[], period: number): number[] {
  const atr: number[] = [];
  let trSum = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      atr.push(0);
      continue;
    }
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );

    if (i <= period) {
      trSum += tr;
      atr.push(i === period ? trSum / period : tr);
    } else {
      const prevAtr = atr[i - 1];
      atr.push((prevAtr * (period - 1) + tr) / period);
    }
  }
  return atr;
}

// ── Backtest runner ─────────────────────────────────────────────────────

export function runBacktest(
  candles: Candle[],
  config: StrategyConfig = DEFAULT_STRATEGY,
): BacktestResult {
  if (candles.length < config.emaTrend + 10) {
    return {
      trades: [],
      stats: {
        totalTrades: 0,
        winRate: 0,
        wins: 0,
        losses: 0,
        profitFactor: 0,
        totalReturn: 0,
        maxDrawdown: 0,
        avgWin: 0,
        avgLoss: 0,
        sharpeRatio: 0,
        avgBarsHeld: 0,
        bestTrade: 0,
        worstTrade: 0,
      },
      equityCurve: [],
      signals: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const emaFast = calcEMA(closes, config.emaFast);
  const emaMedium = calcEMA(closes, config.emaMedium);
  const emaSlow = calcEMA(closes, config.emaSlow);
  const emaTrend = calcEMA(closes, config.emaTrend);
  const rsi = calcRSI(candles, config.rsiPeriod);
  const atr = calcATR(candles, config.atrPeriod);

  const trades: Trade[] = [];
  const signals: Array<{ time: number; type: "buy" | "sell"; price: number }> = [];
  const equityCurve: Array<{ time: number; equity: number }> = [];

  let equity = config.initialCapital;
  let peak = equity;
  let maxDD = 0;

  let position: {
    direction: "long" | "short";
    entryPrice: number;
    entryTime: number;
    entryBar: number;
    stopLoss: number;
    takeProfit: number;
    size: number;
  } | null = null;

  const minStart = Math.max(config.emaTrend, config.emaSlow, config.rsiPeriod, config.atrPeriod) + 1;

  for (let i = minStart; i < candles.length; i++) {
    const candle = candles[i];
    const prev = candles[i - 1];

    // Check exit conditions for open position
    if (position) {
      let exitPrice: number | null = null;
      let exitReason: Trade["exitReason"] = "signal_exit";

      if (position.direction === "long") {
        if (candle.low <= position.stopLoss) {
          exitPrice = position.stopLoss;
          exitReason = "stop_loss";
        } else if (candle.high >= position.takeProfit) {
          exitPrice = position.takeProfit;
          exitReason = "take_profit";
        }
      } else {
        if (candle.high >= position.stopLoss) {
          exitPrice = position.stopLoss;
          exitReason = "stop_loss";
        } else if (candle.low <= position.takeProfit) {
          exitPrice = position.takeProfit;
          exitReason = "take_profit";
        }
      }

      // Exit on trend reversal signal
      if (!exitPrice && emaFast[i] < emaMedium[i] && emaFast[i - 1] >= emaMedium[i - 1]) {
        exitPrice = candle.close;
        exitReason = "signal_exit";
      }

      if (exitPrice !== null) {
        const pnlPct =
          position.direction === "long"
            ? (exitPrice - position.entryPrice) / position.entryPrice
            : (position.entryPrice - exitPrice) / position.entryPrice;

        const pnlUsd = position.size * pnlPct;
        equity += pnlUsd;
        peak = Math.max(peak, equity);
        maxDD = Math.max(maxDD, (peak - equity) / peak);

        trades.push({
          entryTime: position.entryTime,
          entryPrice: position.entryPrice,
          exitTime: candle.time,
          exitPrice,
          direction: position.direction,
          pnl: pnlPct * 100,
          pnlUsd,
          barsHeld: i - position.entryBar,
          exitReason,
        });

        signals.push({ time: candle.time, type: "sell", price: exitPrice });

        position = null;
      }
    }

    // Check entry conditions (only when flat)
    if (!position && i >= minStart + 5) {
      const evaluateRule = (rule: RuleCondition, index: number): boolean => {
        const getValue = (operand: string, idx: number): number => {
          switch (operand) {
            case "close": return candles[idx].close;
            case "emaFast": return emaFast[idx];
            case "emaMedium": return emaMedium[idx];
            case "emaSlow": return emaSlow[idx];
            case "emaTrend": return emaTrend[idx];
            case "rsi": return rsi[idx];
            default: return rule.value ?? 0;
          }
        };

        const val1 = getValue(rule.left, index);
        const val2 = rule.right === "value" ? (rule.value ?? 0) : getValue(rule.right, index);

        const prevVal1 = getValue(rule.left, index - 1);
        const prevVal2 = rule.right === "value" ? (rule.value ?? 0) : getValue(rule.right, index - 1);

        switch (rule.operator) {
          case "greater_than":
            return val1 > val2;
          case "less_than":
            return val1 < val2;
          case "crosses_above":
            return val1 > val2 && prevVal1 <= prevVal2;
          case "crosses_below":
            return val1 < val2 && prevVal1 >= prevVal2;
          default:
            return false;
        }
      };

      let longSignal = false;
      let shortSignal = false;

      if (config.strategyType === "custom_rules") {
        longSignal = config.buyRules.length > 0 && config.buyRules.every((r) => evaluateRule(r, i));
        shortSignal = config.sellRules.length > 0 && config.sellRules.every((r) => evaluateRule(r, i));
      } else {
        const isUptrend =
          emaFast[i] > emaMedium[i] &&
          emaMedium[i] > emaSlow[i] &&
          candle.close > emaTrend[i];
        const isDowntrend =
          emaFast[i] < emaMedium[i] &&
          emaMedium[i] < emaSlow[i] &&
          candle.close < emaTrend[i];

        // Entry: Deep Pullback (RSI bounces from oversold)
        const rsiBounceUp =
          rsi[i - 1] < config.rsiOversold && rsi[i] > config.rsiOversold && isUptrend;

        // Entry: Shallow Pullback (price touches EMA21 in uptrend)
        const nearEma =
          Math.abs(candle.low - emaMedium[i]) / emaMedium[i] < 0.003 &&
          isUptrend &&
          rsi[i] > 50;

        // Entry: Trend Continuation (breakout above 5-bar high)
        const breakout =
          candle.close > prev.high &&
          candle.close > candles[i - 2].high &&
          candle.close > candles[i - 3].high &&
          isUptrend &&
          rsi[i] > 55;

        longSignal = rsiBounceUp || nearEma || breakout;
        shortSignal = rsi[i - 1] > config.rsiOverbought && rsi[i] < config.rsiOverbought && isDowntrend;
      }

      if (longSignal && atr[i] > 0) {
        const entryPrice = candle.close;
        const stopDistance = atr[i] * config.stopLossMultiplier;
        const stopLoss = entryPrice - stopDistance;
        const takeProfit = entryPrice + stopDistance * config.takeProfitMultiplier;
        const riskAmount = equity * (config.riskPerTrade / 100);
        const size = riskAmount / stopDistance;

        position = {
          direction: "long",
          entryPrice,
          entryTime: candle.time,
          entryBar: i,
          stopLoss,
          takeProfit,
          size,
        };

        signals.push({ time: candle.time, type: "buy", price: entryPrice });
      }

      if (shortSignal && atr[i] > 0 && !position) {
        const entryPrice = candle.close;
        const stopDistance = atr[i] * config.stopLossMultiplier;
        const stopLoss = entryPrice + stopDistance;
        const takeProfit = entryPrice - stopDistance * config.takeProfitMultiplier;
        const riskAmount = equity * (config.riskPerTrade / 100);
        const size = riskAmount / stopDistance;

        position = {
          direction: "short",
          entryPrice,
          entryTime: candle.time,
          entryBar: i,
          stopLoss,
          takeProfit,
          size,
        };

        signals.push({ time: candle.time, type: "buy", price: entryPrice });
      }
    }

    equityCurve.push({ time: candle.time, equity });
  }

  // Close any remaining position at the last close
  if (position) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const pnlPct =
      position.direction === "long"
        ? (exitPrice - position.entryPrice) / position.entryPrice
        : (position.entryPrice - exitPrice) / position.entryPrice;
    const pnlUsd = position.size * pnlPct;
    equity += pnlUsd;
    trades.push({
      entryTime: position.entryTime,
      entryPrice: position.entryPrice,
      exitTime: lastCandle.time,
      exitPrice,
      direction: position.direction,
      pnl: pnlPct * 100,
      pnlUsd,
      barsHeld: candles.length - 1 - position.entryBar,
      exitReason: "signal_exit",
    });
    signals.push({ time: lastCandle.time, type: "sell", price: exitPrice });
    equityCurve.push({ time: lastCandle.time, equity });
  }

  // Calculate stats
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const totalReturn = ((equity - config.initialCapital) / config.initialCapital) * 100;

  const returns = trades.map((t) => t.pnl);
  const avgReturn = returns.reduce((s, r) => s + r, 0) / (returns.length || 1);
  const variance =
    returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(12) : 0; // annualized for monthly-ish

  return {
    trades,
    stats: {
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      wins: wins.length,
      losses: losses.length,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
      totalReturn,
      maxDrawdown: maxDD * 100,
      avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0,
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      avgBarsHeld: trades.length > 0 ? trades.reduce((s, t) => s + t.barsHeld, 0) / trades.length : 0,
      bestTrade: trades.length > 0 ? Math.max(...trades.map((t) => t.pnl)) : 0,
      worstTrade: trades.length > 0 ? Math.min(...trades.map((t) => t.pnl)) : 0,
    },
    equityCurve,
    signals,
  };
}
