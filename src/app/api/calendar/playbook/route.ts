import { NextResponse } from "next/server";

const MACROMIND_OPENAI_KEY = process.env.MACROMIND_OPENAI_KEY ?? process.env.OPENAI_API_KEY ?? process.env.AGENTROUTER_API_KEY;
const AGENTROUTER_URL = process.env.AGENTROUTER_BASE_URL ?? "https://models.inference.ai.azure.com";
const AGENTROUTER_MODEL = process.env.AGENTROUTER_MODEL ?? "gpt-4o";

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

async function callAI(prompt: string, systemPrompt: string): Promise<{ content: string; provider: string } | null> {
  const providers = [
    { name: "Groq", key: GROQ_KEY, url: GROQ_URL, model: GROQ_MODEL },
    {
      name: AGENTROUTER_URL.includes("azure") || AGENTROUTER_URL.includes("github") ? "GitHub Models" : "AgentRouter",
      key: MACROMIND_OPENAI_KEY,
      url: AGENTROUTER_URL,
      model: AGENTROUTER_MODEL
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch(`${provider.url}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return {
          content,
          provider: provider.name,
        };
      }
    } catch {
      // try next provider
    }
  }
  return null;
}

const YAHOO_SYMBOLS: Record<string, string> = {
  "XAU/USD": "GC=F", "XAG/USD": "SI=F", "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X", "USD/JPY": "USDJPY=X", "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X", "USD/CAD": "USDCAD=X", "BTC/USD": "BTC-USD", "ETH/USD": "ETH-USD",
};

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const yahooSymbol = YAHOO_SYMBOLS[symbol] ?? "GC=F";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1m&range=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const json = await res.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { eventTitle, country, forecast, previous, currentPrice, symbol } = await request.json();

    if (!eventTitle || !country) {
      return NextResponse.json({ error: "Missing required event metadata." }, { status: 400 });
    }

    const targetSymbol = symbol ?? "XAU/USD";
    let activePrice = currentPrice;
    if (!activePrice) {
      activePrice = await fetchCurrentPrice(targetSymbol);
    }

    const systemPrompt = "You are a professional macro economics analyst and forex strategist. Return only valid JSON. Educational purposes only.";

    const prompt = `Create an AI Pre-Release Trade Playbook for this upcoming economic news release.
Event: ${eventTitle}
Country/Currency affected: ${country}
Forecast value: ${forecast || "Not specified"}
Previous value: ${previous || "Not specified"}
Primary target asset symbol: ${targetSymbol}
Primary target asset current spot price: ${activePrice ? `$${activePrice}` : "Not specified"}

Formulate exactly three trading scenarios before the news drops:
1. Scenario 1 (Deviation Higher): Expected market reaction and trade recommendation if the actual value comes in higher than the forecast.
2. Scenario 2 (Deviation Lower): Expected market reaction and trade recommendation if the actual value comes in lower than the forecast.
3. Scenario 3 (On-Target): Expected market reaction and trade recommendation if the actual value matches the forecast.

For trade plans, specify clear Entry Triggers, Stop Loss, and Take Profit levels relative to the current price (use sensible volatility levels, e.g. for gold 15-25 pips stops, and a flat 1:2 R:R ratio). Keep everything educational, not financial advice.

Return ONLY a JSON object with this exact shape:
{
  "importance": "1-2 sentences explaining why this economic release is critical for the target currency.",
  "primaryAsset": "${targetSymbol}",
  "currentPrice": "${activePrice ? `$${activePrice}` : "Unknown"}",
  "scenarios": [
    {
      "triggerCondition": "Condition description (e.g. If actual is > 3.3%)",
      "bias": "Directional bias (e.g. Bullish USD / Bearish Gold)",
      "marketReaction": "1 sentence describing the immediate expected price movement.",
      "tradePlan": {
        "action": "BUY | SELL | STAND ASIDE",
        "trigger": "Price level trigger or structure breakout (e.g. Break above $2372)",
        "stopLoss": "Specific stop loss level",
        "takeProfit": "Specific take profit level"
      }
    }
  ]
}`;

    const result = await callAI(prompt, systemPrompt);

    if (!result) {
      return NextResponse.json({ error: "Playbook generator unavailable. Check API keys." }, { status: 502 });
    }

    const playbook = JSON.parse(result.content);
    return NextResponse.json({
      data: {
        ...playbook,
        provider: result.provider
      }
    });

  } catch (err) {
    console.error("Playbook endpoint error:", err);
    return NextResponse.json({ error: "Failed to generate playbook." }, { status: 500 });
  }
}
