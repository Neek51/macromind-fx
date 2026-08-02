import { NextResponse } from "next/server";
import { GET as getPrices } from "../prices/route";
import { GET as getNews } from "../news/route";
import { GET as getCalendar } from "../calendar/route";
import { GET as getHistory } from "../history/route";
import { callAI, hasAIKey } from "../ai-provider";
import { scrapeTelegramChannel } from "../../lib/sentiment-scraper";

const DISPLAY_NAMES: Record<string, string> = {
  "XAU/USD": "Gold Spot",
  "BTC/USD": "Bitcoin Spot",
  "EUR/USD": "Euro / Dollar Spot",
};

async function fetchPrices() {
  try {
    const res = await getPrices();
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

async function fetchNews() {
  try {
    const res = await getNews();
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).slice(0, 5);
  } catch { return []; }
}

async function fetchCalendar() {
  try {
    const res = await getCalendar();
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).filter((e: { impact: string }) => e.impact === "High" || e.impact === "Medium").slice(0, 5);
  } catch { return []; }
}

async function fetchCandles(symbol: string, interval: string) {
  try {
    const url = `http://localhost/api/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}`;
    const req = new Request(url);
    const res = await getHistory(req);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

async function fetchSentinelRumors() {
  try {
    const [zeroHedge, forexLive] = await Promise.all([
      scrapeTelegramChannel("zerohedge", "ZeroHedge Feed"),
      scrapeTelegramChannel("forexlive", "ForexLive Feed"),
    ]);
    return [...zeroHedge, ...forexLive].slice(0, 8);
  } catch {
    return [];
  }
}

function getActiveSessions(): string {
  const hour = new Date().getUTCHours();
  const sessions = [];
  if (hour >= 0 && hour < 9) sessions.push("Tokyo");
  if (hour >= 8 && hour < 17) sessions.push("London");
  if (hour >= 13 && hour < 22) sessions.push("New York");
  return sessions.length > 0 ? sessions.join(" & ") : "No major session (Late NY/Asian pre-open)";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "XAU/USD";
  const interval = searchParams.get("interval") ?? "15m";
  const historyParam = searchParams.get("history");

  // Format self-calibration context from history
  let selfCalibrationText = "";
  if (historyParam) {
    try {
      const historyList = JSON.parse(historyParam);
      if (Array.isArray(historyList) && historyList.length > 0) {
        selfCalibrationText = `\nRECENT TRADES SELF-CALIBRATION HISTORY (Mistakes to avoid and rules to follow):
${historyList.map((t: { symbol: string; direction: string; outcome: string; lesson?: string; postmortem?: string }, idx: number) => {
  return `- Trade ${idx + 1} (${t.symbol} ${t.direction.toUpperCase()}): Outcome = ${t.outcome.toUpperCase()}. Lesson = "${t.lesson ?? "None"}". Postmortem = "${t.postmortem ?? "None"}".`;
}).join("\n")}
Ensure your new suggested trade entry coordinates, SL/TP positions, and direction do not repeat these mistakes. Adapt your checklist rules accordingly.
`;
      }
    } catch (err) {
      console.error("Failed to parse history self-calibration parameter:", err);
    }
  }

  try {
    const [prices, news, calendar, candles, sentinelRumors] = await Promise.all([
      fetchPrices(),
      fetchNews(),
      fetchCalendar(),
      fetchCandles(symbol, interval),
      fetchSentinelRumors(),
    ]);

    const activePrice = prices.find((p: { symbol: string }) => p.symbol === symbol)?.price ?? 0;
    const activeSessions = getActiveSessions();

    // Calculate Dealing Range & Equilibrium mathematically (based on the last 20 candles)
    const recent20 = candles.slice(-20);
    const dealingHigh = recent20.length > 0 ? Math.max(...recent20.map((c: { high: number }) => c.high)) : 0;
    const dealingLow = recent20.length > 0 ? Math.min(...recent20.map((c: { low: number }) => c.low)) : 0;
    const equilibrium = (dealingHigh + dealingLow) / 2;
    const premiumDiscount = activePrice > equilibrium ? "premium" : activePrice < equilibrium ? "discount" : "equilibrium";

    // Calculate CISD Shift mathematically
    let cisdShift: "bullish" | "bearish" | "none" = "none";
    if (candles.length >= 2) {
      const c1 = candles[candles.length - 2];
      const c2 = candles[candles.length - 1];
      const c1IsBearish = c1.close < c1.open;
      const c1IsBullish = c1.close > c1.open;
      const c2IsBullish = c2.close > c2.open;
      const c2IsBearish = c2.close < c2.open;

      if (c1IsBearish && c2IsBullish && c2.close > c1.open) {
        cisdShift = "bullish";
      } else if (c1IsBullish && c2IsBearish && c2.close < c1.open) {
        cisdShift = "bearish";
      }
    }

    if (!hasAIKey()) {
      // Return a structured mockup response so the frontend still renders beautifully
      const mockPrediction = {
        symbol,
        bullishProbability: 55,
        bearishProbability: 45,
        predictedMove: "+0.1% to +0.4%",
        confidence: "medium" as const,
        keyLevel: activePrice ? `$${(activePrice * 1.002).toFixed(2)}` : "Unavailable",
        drivers: [
          { factor: "SMC structure", contribution: 40 },
          { factor: "Session Openings", contribution: 30 },
          { factor: "Technical indicators", contribution: 30 },
        ],
        sessionInsight: `${activeSessions} active. Market volatility is moderate. Configure API keys in .env.local to enable real AI predictions.`,
        reasoning: `SMC analysis shows a tentative bullish breakout. Configure GROQ_API_KEY or OPENAI_API_KEY in .env.local to replace this mockup with live Llama/GPT analysis.`,
        smcFeatures: {
          trend: "bullish" as const,
          nearestOB: activePrice ? { price: activePrice * 0.998, type: "bullish" as const, description: "H4 Demands Zone" } : null,
          activeFVG: activePrice ? { top: activePrice * 1.001, bottom: activePrice * 1.0002, type: "bullish" as const } : null,
          lastSweep: "Previous session low swept",
          inducementLevel: activePrice ? activePrice * 0.999 : null,
          equilibrium: equilibrium || activePrice * 0.9995,
          dealingRange: { high: dealingHigh || activePrice * 1.001, low: dealingLow || activePrice * 0.998 },
          premiumDiscount: premiumDiscount,
          cisdShift: cisdShift !== "none" ? cisdShift : "bullish" as const,
        },
        suggestedTrade: activePrice ? {
          direction: "buy" as const,
          entry: activePrice * 1.0005,
          stopLoss: activePrice * 0.997,
          takeProfit: activePrice * 1.0075,
          riskReward: 2.0,
        } : null,
        computedAt: new Date().toISOString(),
        model: "Mock Data (API key missing)",
      };

      return NextResponse.json({ data: mockPrediction });
    }

    // Format inputs for AI prompt
    const recentCandlesText = candles.slice(-15).map((c: { time: number; open: number; high: number; low: number; close: number }) => 
      `- Time: ${new Date(c.time * 1000).toISOString().substring(11, 16)} UTC, O:${c.open}, H:${c.high}, L:${c.low}, C:${c.close}`
    ).join("\n");

    const newsText = news.length > 0
      ? news.map((n: { title: string; source: string }) => `- ${n.title} (${n.source})`).join("\n")
      : "No major headlines today.";

    const calendarText = calendar.length > 0
      ? calendar.map((e: { title: string; date: string; impact: string }) => 
        `- ${e.title} (${e.impact} impact) at ${e.date}`).join("\n")
      : "No upcoming economic events.";

    const sentinelText = sentinelRumors.length > 0
      ? sentinelRumors.map((r: { text: string; source: string }) => `- [${r.source}] ${r.text}`).join("\n")
      : "No live breaking macro rumor bulletins detected.";

    const prompt = `You are a professional forex trading algorithm specializing in Smart Money Concepts (SMC), market structure shifts, and macroeconomic sentiment analysis.
Analyze this raw data for ${DISPLAY_NAMES[symbol] ?? symbol} (${symbol}) and generate a probability directional forecast and a virtual trade setup for the next 1-4 hours on the ${interval} timeframe.
${selfCalibrationText}
Current Price: ${activePrice}
Active Trading Session: ${activeSessions}

Live Automated Sentinel Feed (Breaking Geopolitics & Institutional Rumors):
${sentinelText}

This sentinel feed tracks fast-breaking macro rumors, central bank reserve updates, and geopolitical bulletins gathered directly from institutional trading desk feeds. Synthesize this data to detect immediate sentiment shifts (such as sudden treasury selloffs, central bank reserve restructuring, or geopolitical announcements) that may override standard technical indicators or RSS feeds.

Mathematical SMC Overlays:
- Dealing Range High: ${dealingHigh}
- Dealing Range Low: ${dealingLow}
- Equilibrium (50% Fibonacci level): ${equilibrium}
- Price Zone: ${premiumDiscount.toUpperCase()}
- CISD State Shift: ${cisdShift.toUpperCase()}

Recent ${interval} Candlestick Data (newest last):
${recentCandlesText}

Latest News Headlines:
${newsText}

Upcoming High/Medium Impact Calendar Events:
${calendarText}

SMC Strategy Guidelines:
1. Identify the structural trend (bullish/bearish/neutral) based on the latest BOS (Break of Structure) or CHOCH (Change of Character).
2. Scan for the nearest active Order Block (OB) - the last down-candle before a strong upward expansion (bullish OB) or last up-candle before a downward expansion (bearish OB).
3. Scan for active Fair Value Gaps (FVG) - imbalances between candle 1 wick and candle 3 wick that price is likely to pull back and fill.
4. Detect if a recent liquidity sweep has occurred (price piercing a previous high or low and reversing immediately).
5. Identify the nearest Inducement (IDM) level - the first pullback low in an uptrend or high in a downtrend. Ensure we do not suggest entries at the IDM, but wait for it to be swept.
6. Premium vs. Discount Entry Rule:
   - For a suggested BUY setup: The entry price MUST be below the Equilibrium level (in the Discount zone).
   - For a suggested SELL setup: The entry price MUST be above the Equilibrium level (in the Premium zone).
7. CISD Entry Confirmation:
   - If a CISD Shift is active (e.g. Bullish CISD), favor entering in that direction, using the sweep candle high/low as stop-loss reference for a tighter exit.
8. Provide a suggested trade setup (BUY or SELL) ONLY if a valid setup aligns with the trend. The trade MUST have a Risk-to-Reward ratio (R:R) of at least 1:2.

You MUST return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "symbol": "${symbol}",
  "bullishProbability": number, (percentage value 0 to 100)
  "bearishProbability": number, (percentage value 0 to 100, sum of bullish and bearish must equal 100)
  "predictedMove": "estimated move string (e.g. +0.3% to +0.8% or -200 pips)",
  "confidence": "low" | "medium" | "high",
  "keyLevel": "string explaining the most important breakout or bounce level to watch",
  "drivers": [
    {"factor": "factor name (e.g. USD weakness, London opening momentum, FVG fill, etc.)", "contribution": number}
  ], (limit to 3 main drivers, sum of contribution values must equal 100)
  "sessionInsight": "detailed session-specific volatility and behavior note in English",
  "reasoning": "brief 2-3 sentence fundamental and technical reason for this bias in English",
  "smcFeatures": {
    "trend": "bullish" | "bearish" | "neutral",
    "nearestOB": {
      "price": number,
      "type": "bullish" | "bearish",
      "description": "brief note on why this OB is valid"
    } | null,
    "activeFVG": {
      "top": number,
      "bottom": number,
      "type": "bullish" | "bearish"
    } | null,
    "lastSweep": "description of the last swept high/low (e.g., 'Tokyo High swept at London open') or null",
    "inducementLevel": number | null
  },
  "suggestedTrade": {
    "direction": "buy" | "sell",
    "entry": number,
    "stopLoss": number,
    "takeProfit": number,
    "riskReward": number
  } | null (null if no high-probability setup exists)
}

Do not add markdown formatting or backticks around the JSON. Return only the raw JSON.`;

    const systemPrompt = `You are an institutional SMC forex trading bot. Return only valid raw JSON matching the requested schema. Everything must be in standard English.`;

    const result = await callAI(prompt, systemPrompt);

    if (!result) {
      return NextResponse.json({ data: { error: "Failed to connect to AI providers." } }, { status: 502 });
    }

    try {
      const data = JSON.parse(result.content.trim());
      
      // Inject exact mathematical SMC overlays
      if (data.smcFeatures) {
        data.smcFeatures.equilibrium = equilibrium;
        data.smcFeatures.dealingRange = { high: dealingHigh, low: dealingLow };
        data.smcFeatures.premiumDiscount = premiumDiscount;
        data.smcFeatures.cisdShift = cisdShift;
      }

      return NextResponse.json({
        data: {
          ...data,
          computedAt: new Date().toISOString(),
          model: `${result.model} (${result.provider})`,
        }
      });
    } catch (parseError) {
      console.error("Failed to parse AI output:", result.content, parseError);
      return NextResponse.json({ data: { error: "AI returned invalid JSON formatting. Retry in a few seconds." } }, { status: 502 });
    }

  } catch (error) {
    console.error("AI Prediction Route Error:", error);
    return NextResponse.json({ data: { error: "Failed to generate market prediction." } }, { status: 502 });
  }
}
