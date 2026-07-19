import { NextResponse } from "next/server";
import { callAI, hasAIKey } from "../ai-provider";

export async function POST(request: Request) {
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  if (!hasAIKey()) {
    return NextResponse.json(
      { error: "No AI provider configured. Set OPENCODE_ZEN_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env.local" },
      { status: 500 },
    );
  }

  const result = await callAI(
    `Analyze this market news or tweet for forex impact:\n\n${text}\n\nReturn JSON with this shape: {"summary":"","usdSentiment":"bullish|bearish|neutral","riskLevel":"low|medium|high","confidence":0,"timeframe":"short-term|medium-term|long-term","affectedAssets":[{"asset":"","direction":"bullish|bearish|neutral","impactStrength":"low|medium|high","reason":""}],"traderWarning":""}`,
    "You are a forex macro sentiment analyst. Return only valid JSON. Do not provide financial advice. Analyze educational market impact only.",
  );

  if (!result) {
    return NextResponse.json({ error: "All AI providers failed." }, { status: 502 });
  }

  try {
    return NextResponse.json(JSON.parse(result.content));
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON.", raw: result.content }, { status: 502 });
  }
}
