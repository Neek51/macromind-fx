import { NextResponse } from "next/server";
import { GET as getPrices } from "../prices/route";
import { GET as getNews } from "../news/route";
import { GET as getCalendar } from "../calendar/route";

// Try AgentRouter first, fall back to Groq
const AGENTROUTER_KEY = process.env.OPENAI_API_KEY ?? process.env.AGENTROUTER_API_KEY;
const AGENTROUTER_URL = process.env.AGENTROUTER_BASE_URL ?? "https://agentrouter.org/v1";
const AGENTROUTER_MODEL = process.env.AGENTROUTER_MODEL ?? "gpt-5.5";
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const HAS_AI = Boolean(AGENTROUTER_KEY || GROQ_KEY);

async function callAI(prompt: string, systemPrompt: string): Promise<string | null> {
  const providers = [
    { key: AGENTROUTER_KEY, url: AGENTROUTER_URL, model: AGENTROUTER_MODEL },
    { key: GROQ_KEY, url: GROQ_URL, model: GROQ_MODEL },
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
      if (content) return content;
    } catch {
      // try next provider
    }
  }
  return null;
}

const DISPLAY_NAMES: Record<string, string> = {
  "XAU/USD": "Gold", "XAG/USD": "Silver", "EUR/USD": "Euro / Dollar",
  "GBP/USD": "Pound / Dollar", "USD/JPY": "Dollar / Yen",
  "USD/CHF": "Dollar / Franc", "AUD/USD": "Aussie / Dollar",
  "USD/CAD": "Dollar / Loonie", "BTC/USD": "Bitcoin", "ETH/USD": "Ethereum",
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

export async function GET() {
  try {
    const [prices, news, calendar] = await Promise.all([fetchPrices(), fetchNews(), fetchCalendar()]);

    if (!HAS_AI) {
      return NextResponse.json({
        data: {
          date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
          overallBias: "neutral",
          biasStrength: "low",
          summary: "AI outlook unavailable — set OPENAI_API_KEY or AGENTROUTER_API_KEY in .env.local to enable AI-generated market analysis.",
          keyLevels: prices.slice(0, 4).map((p: { symbol: string; percent_change: number }) => ({
            asset: p.symbol, direction: p.percent_change >= 0 ? "bullish" : "bearish",
            levels: `${DISPLAY_NAMES[p.symbol] ?? p.symbol} at ${p.percent_change?.toFixed(2)}%`,
            note: "Live price data without AI analysis.",
          })),
          eventsToWatch: calendar.map((e: { title: string; date: string; impact: string }) => ({
            event: e.title, time: e.date, impact: e.impact, why: "Scheduled macro event.",
          })),
          opportunities: ["Enable AI to get personalized market opportunities."],
          risks: ["API key not configured."],
          topMovers: prices
            .sort((a: { percent_change: number }, b: { percent_change: number }) => Math.abs(b.percent_change) - Math.abs(a.percent_change))
            .slice(0, 3)
            .map((p: { symbol: string; percent_change: number }) => ({
              asset: p.symbol, change: `${p.percent_change >= 0 ? "+" : ""}${p.percent_change?.toFixed(2)}%`,
              note: DISPLAY_NAMES[p.symbol] ?? p.symbol,
            })),
          generatedAt: new Date().toISOString(),
          source: "Live data (AI not configured)",
        },
      });
    }

    const marketData = prices
      .map((p: { symbol: string; name: string; price: number; percent_change: number; high: number; low: number }) =>
        `${p.symbol} (${p.name}): $${p.price} (${p.percent_change >= 0 ? "+" : ""}${p.percent_change.toFixed(2)}%), H:${p.high} L:${p.low}`)
      .join("\n");

    const newsData = news.length > 0
      ? news.map((n: { title: string; source: string }) => `- ${n.title} (${n.source})`).join("\n")
      : "No major headlines today.";

    const calendarData = calendar.length > 0
      ? calendar.map((e: { title: string; date: string; impact: string; forecast: string; previous: string }) =>
        `- ${e.title} (${e.impact} impact) — Forecast: ${e.forecast || "N/A"}, Previous: ${e.previous || "N/A"}`).join("\n")
      : "No major events this week.";

    const prompt = `You are a professional forex market analyst. Analyze today's market conditions and provide a daily outlook.

Today's market data:
${marketData}

Latest news headlines:
${newsData}

Upcoming economic events:
${calendarData}

Return ONLY valid JSON with this exact shape:
{
  "overallBias": "bullish|bearish|neutral",
  "biasStrength": "low|medium|high",
  "summary": "2-3 sentence overall market summary",
  "keyLevels": [
    {"asset":"XAU/USD","direction":"bullish|bearish|neutral","levels":"key support/resistance zones","note":"why this level matters"}
  ],
  "eventsToWatch": [
    {"event":"event name","time":"date/time","impact":"High|Medium","why":"why traders should watch this"}
  ],
  "opportunities": ["2-3 trading opportunities with educational reasoning"],
  "risks": ["2-3 risk factors to be aware of"],
  "topMovers": [
    {"asset":"symbol","change":"+/-X.XX%","note":"why it's moving"}
  ]
}

Provide 3-5 keyLevels for the most relevant assets. Provide 2-4 eventsToWatch. Keep everything educational, not financial advice.`;

    const content = await callAI(prompt, "You are a forex market analyst. Return only valid JSON. Provide educational analysis only, not financial advice.");

    if (!content) {
      return NextResponse.json({ data: { error: "AI service unavailable. Check API keys in .env.local." } }, { status: 502 });
    }

    const aiResult = JSON.parse(content);

    return NextResponse.json({
      data: {
        ...aiResult,
        date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
        generatedAt: new Date().toISOString(),
        source: "AI-generated from live market data",
      },
    });
  } catch {
    return NextResponse.json({ data: { error: "Failed to generate market outlook." } }, { status: 502 });
  }
}
