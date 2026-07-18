import { NextResponse } from "next/server";

type Candle = { open: number; high: number; low: number; close: number; volume: number; timestamp: number; date: Date };

// Map dashboard symbols to Yahoo Finance symbols
const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "GC=F", // Gold Futures
  "XAG/USD": "SI=F", // Silver Futures
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X",
  "USD/CAD": "USDCAD=X",
  "BTC/USD": "BTC-USD",
  "ETH/USD": "ETH-USD",
};

// Indicator Calculations
function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  if (prices.length === 0) return ema;

  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i];
  }
  let currentEma = sum / Math.min(period, prices.length);
  for (let i = 0; i < Math.min(period - 1, prices.length); i++) {
    ema.push(currentEma);
  }
  ema.push(currentEma);

  for (let i = period; i < prices.length; i++) {
    currentEma = prices[i] * k + currentEma * (1 - k);
    ema.push(currentEma);
  }
  return ema;
}

function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (prices.length <= period) {
    return Array(prices.length).fill(50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) rsi.push(50);
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

function calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const fastEMA = calculateEMA(prices, fast);
  const slowEMA = calculateEMA(prices, slow);
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(fastEMA[i] - (slowEMA[i] ?? 0));
  }
  const signalLine = calculateEMA(macdLine, signal);
  const histogram: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    histogram.push(macdLine[i] - (signalLine[i] ?? 0));
  }
  return { macdLine, signalLine, histogram };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const atr: number[] = [];
  if (closes.length === 0) return atr;
  const tr: number[] = [];
  tr.push(highs[0] - lows[0]);
  for (let i = 1; i < closes.length; i++) {
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }

  let currentAtr = tr[0];
  atr.push(currentAtr);
  for (let i = 1; i < tr.length; i++) {
    currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
    atr.push(currentAtr);
  }
  return atr;
}

function calculateADX(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const adx: number[] = [];
  if (closes.length <= period) {
    return Array(closes.length).fill(0);
  }

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));

    const up = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];

    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
  }

  let trSmooth = 0;
  let plusDMSmooth = 0;
  let minusDMSmooth = 0;

  for (let i = 0; i < period; i++) {
    trSmooth += tr[i];
    plusDMSmooth += plusDM[i];
    minusDMSmooth += minusDM[i];
    adx.push(0);
  }
  adx.push(0);

  const dx: number[] = [];
  let plusDI = (plusDMSmooth / trSmooth) * 100;
  let minusDI = (minusDMSmooth / trSmooth) * 100;
  dx.push(Math.abs(plusDI - minusDI) / (plusDI + minusDI === 0 ? 1 : plusDI + minusDI) * 100);

  for (let i = period; i < tr.length; i++) {
    trSmooth = trSmooth - (trSmooth / period) + tr[i];
    plusDMSmooth = plusDMSmooth - (plusDMSmooth / period) + plusDM[i];
    minusDMSmooth = minusDMSmooth - (minusDMSmooth / period) + minusDM[i];

    plusDI = (plusDMSmooth / trSmooth) * 100;
    minusDI = (minusDMSmooth / trSmooth) * 100;
    const dxVal = Math.abs(plusDI - minusDI) / (plusDI + minusDI === 0 ? 1 : plusDI + minusDI) * 100;
    dx.push(dxVal);
  }

  let sumDx = 0;
  for (let i = 0; i < period; i++) {
    sumDx += dx[i];
  }
  let currentAdx = sumDx / period;
  for (let i = 0; i < period; i++) {
    adx.push(currentAdx);
  }

  for (let i = period; i < dx.length; i++) {
    currentAdx = (currentAdx * (period - 1) + dx[i]) / period;
    adx.push(currentAdx);
  }

  return adx;
}

// Fetch historical candles from Yahoo Finance
async function fetchHistory(yahooSymbol: string, interval = "1d", range = "1y"): Promise<Candle[] | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!q || !q.open || !q.close) return null;

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (q.open[i] == null || q.close[i] == null || q.high[i] == null || q.low[i] == null) continue;
      candles.push({
        open: q.open[i],
        high: q.high[i],
        low: q.low[i],
        close: q.close[i],
        volume: q.volume[i] ?? 0,
        timestamp: timestamps[i],
        date: new Date(timestamps[i] * 1000)
      });
    }
    return candles;
  } catch {
    return null;
  }
}

// Telegram Alert Dispatcher
async function sendTelegramAlert(botToken: string, chatId: string, text: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, mode, timeframe, botToken, chatId, sendTelegram, isTest } = body;

    if (isTest) {
      if (!botToken || !chatId) {
        return NextResponse.json({ success: false, error: "Telegram Bot Token and Chat ID are required." }, { status: 400 });
      }
      const testMsg = `🔔 <b>MacroMind FX • System Test</b>\nYour Telegram Alert configuration is working perfectly! Configured for Strategy Alerts.`;
      const ok = await sendTelegramAlert(botToken, chatId, testMsg);
      if (ok) {
        return NextResponse.json({ success: true, message: "Test alert dispatched to Telegram." });
      } else {
        return NextResponse.json({ success: false, error: "Failed to dispatch Telegram message. Check Token/Chat ID." }, { status: 400 });
      }
    }

    const yahooSymbol = YAHOO_SYMBOLS[symbol];
    if (!yahooSymbol) {
      return NextResponse.json({ success: false, error: `Unsupported symbol: ${symbol}` }, { status: 400 });
    }

    // Set interval and range based on timeframe
    let interval = "1d";
    let range = "1y"; // Needs enough bars for 200 EMA
    if (timeframe === "1h") {
      interval = "1h";
      range = "1mo"; // ~720 bars
    } else if (timeframe === "4h") {
      interval = "4h";
      range = "3mo"; // ~540 bars
    }

    const candles = await fetchHistory(yahooSymbol, interval, range);
    if (!candles || candles.length < 50) {
      return NextResponse.json({ success: false, error: "Failed to fetch enough historical price candles." }, { status: 400 });
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // Calculate Indicators
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const rsi = calculateRSI(closes, 14);
    const { macdLine, signalLine } = calculateMACD(closes);
    const atr = calculateATR(highs, lows, closes, 14);
    const adx = calculateADX(highs, lows, closes, 14);

    const len = candles.length;
    const curIdx = len - 1;
    const prevIdx = len - 2;

    const closeCur = closes[curIdx];
    const rsiCur = rsi[curIdx];
    const rsiPrev = rsi[prevIdx];
    const macdCur = macdLine[curIdx];
    const macdPrev = macdLine[prevIdx];
    const sigCur = signalLine[curIdx];
    const sigPrev = signalLine[prevIdx];

    let goL = false;
    let goS = false;
    let signalDetails = "";

    // crossover helpers
    const rsiCrossUp30 = rsiPrev <= 30 && rsiCur > 30;
    const rsiCrossDn70 = rsiPrev >= 70 && rsiCur < 70;
    const macdCrossUp = macdPrev <= sigPrev && macdCur > sigCur;
    const macdCrossDn = macdPrev >= sigPrev && macdCur < sigCur;

    if (mode === "Simple") {
      const uptrend = closeCur > ema200[curIdx];
      const dntrend = closeCur < ema200[curIdx];
      goL = uptrend && rsiCrossUp30;
      goS = dntrend && rsiCrossDn70;
      signalDetails = `Simple Mode: ${goL ? "RSI crossover 30 in uptrend" : "RSI crossunder 70 in downtrend"}`;
    } 
    
    else if (mode === "Scoring") {
      const bull = ema9[curIdx] > ema21[curIdx] && ema21[curIdx] > ema50[curIdx];
      const bear = ema9[curIdx] < ema21[curIdx] && ema21[curIdx] < ema50[curIdx];
      const htfOk = closeCur > ema200[curIdx];

      // Pivot Support / Resistance zones
      let zH = 0;
      let zL = 0;
      let zT = 0;
      let zA = false;

      // Scan for latest pivot high or low (10-bar lookback/lookahead window)
      for (let i = curIdx - 11; i >= 10; i--) {
        let isHigh = true;
        for (let j = 1; j <= 10; j++) {
          if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) { isHigh = false; break; }
        }
        if (isHigh) {
          zH = highs[i];
          zL = highs[i] - (atr[i] * 1.2);
          zT = 1;
          zA = true;
          break;
        }

        let isLow = true;
        for (let j = 1; j <= 10; j++) {
          if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) { isLow = false; break; }
        }
        if (isLow) {
          zH = lows[i] + (atr[i] * 1.2);
          zL = lows[i];
          zT = -1;
          zA = true;
          break;
        }
      }

      const nearSup = zT === 1 && closeCur >= zL - (atr[curIdx] * 0.5) && closeCur <= zH + (atr[curIdx] * 0.5) && zA;
      const nearDem = zT === -1 && closeCur >= zL - (atr[curIdx] * 0.5) && closeCur <= zH + (atr[curIdx] * 0.5) && zA;

      const rsiBull = rsiCur < 35 && rsiCur > rsiPrev;
      const rsiBear = rsiCur > 65 && rsiCur < rsiPrev;

      let scL = 0;
      let scS = 0;

      if (bull && htfOk && adx[curIdx] > 20) scL += 2;
      if (bear && !htfOk && adx[curIdx] > 20) scS += 2;
      if (nearDem) scL += 2;
      if (nearSup) scS += 2;
      if (rsiBull) scL += 1;
      if (rsiBear) scS += 1;
      if (macdCrossUp) scL += 1;
      if (macdCrossDn) scS += 1;

      goL = scL >= 3;
      goS = scS >= 3;
      signalDetails = `Scoring Mode: score long=${scL}, short=${scS}`;
    } 
    
    else if (mode === "Low TF") {
      const ltfBull = ema9[curIdx] > ema21[curIdx] && closeCur > ema21[curIdx];
      const ltfBear = ema9[curIdx] < ema21[curIdx] && closeCur < ema21[curIdx];
      goL = ltfBull && (rsiCur < 35 || macdCrossUp) && lows[curIdx] > ema50[curIdx];
      goS = ltfBear && (rsiCur > 65 || macdCrossDn) && highs[curIdx] < ema50[curIdx];
      signalDetails = `Low TF Mode: aligned scalp indicators`;
    } 
    
    else if (mode === "Session") {
      // Session breakouts check hourly timezone-aligned hour boundaries
      const currentUTCHour = candles[curIdx].date.getUTCHours();

      // Detect if we are in London (7-9 UTC), NY (13-15 UTC), or Asia (0-2 UTC)
      const isLondon = currentUTCHour === 7 || currentUTCHour === 8;
      const isNY = currentUTCHour === 13 || currentUTCHour === 14;
      const isAsia = currentUTCHour === 0 || currentUTCHour === 1;

      // Find start of current session to establish High/Low boundaries
      let sBarIdx = -1;
      let sHigh = -Infinity;
      let sLow = Infinity;

      for (let i = curIdx; i >= Math.max(0, curIdx - 24); i--) {
        const h = candles[i].date.getUTCHours();
        const m = candles[i].date.getUTCMinutes();
        if ((h === 7 || h === 13 || h === 0) && m === 0) {
          sBarIdx = i;
          break;
        }
      }

      if (sBarIdx !== -1) {
        // Collect highs and lows in range window (e.g. 2 hours / 2 candles)
        const rangeEndIdx = Math.min(curIdx, sBarIdx + 2);
        for (let i = sBarIdx; i <= rangeEndIdx; i++) {
          if (highs[i] > sHigh) sHigh = highs[i];
          if (lows[i] < sLow) sLow = lows[i];
        }

        const breakoutHigh = closes[prevIdx] <= sHigh && closeCur > sHigh;
        const breakoutLow = closes[prevIdx] >= sLow && closeCur < sLow;

        // Trigger breakout entry
        goL = breakoutHigh && rsiCur > 50 && (isLondon || isNY || isAsia);
        goS = breakoutLow && rsiCur < 50 && (isLondon || isNY || isAsia);
      }
      signalDetails = `Session Mode: breakout bounds tracking`;
    }

    const signal = goL ? "BUY" : goS ? "SELL" : "NONE";

    // If signal triggered and telegram enabled, send dispatch
    if (signal !== "NONE" && sendTelegram && botToken && chatId) {
      const direction = signal === "BUY" ? "🟢 <b>BUY SIGNAL</b>" : "🔴 <b>SELL SIGNAL</b>";
      const message = `📈 <b>Fx Ultimate Strategy Alert</b>\n\n` +
                      `<b>Symbol:</b> ${symbol}\n` +
                      `<b>Mode:</b> ${mode}\n` +
                      `<b>Timeframe:</b> ${timeframe}\n` +
                      `<b>Signal:</b> ${direction}\n` +
                      `<b>Trigger Price:</b> ${closeCur.toFixed(symbol.includes("JPY") ? 3 : 5)}\n` +
                      `<b>Details:</b> ${signalDetails}\n` +
                      `<b>Time:</b> ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC`;
      await sendTelegramAlert(botToken, chatId, message);
    }

    return NextResponse.json({
      success: true,
      signal,
      price: closeCur,
      time: candles[curIdx].date.toISOString(),
      details: signalDetails,
      indicators: {
        ema9: ema9[curIdx],
        ema21: ema21[curIdx],
        ema50: ema50[curIdx],
        ema200: ema200[curIdx],
        rsi: rsiCur,
        macd: macdCur,
        signal: sigCur,
        adx: adx[curIdx],
        atr: atr[curIdx],
      }
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
