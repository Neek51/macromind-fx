import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a forex macro sentiment analyst. Return only valid JSON. Do not provide financial advice. Analyze educational market impact only.",
        },
        {
          role: "user",
          content: `Analyze this market news or tweet for forex impact:\n\n${text}\n\nReturn JSON with this shape: {"summary":"","usdSentiment":"bullish|bearish|neutral","riskLevel":"low|medium|high","confidence":0,"timeframe":"short-term|medium-term|long-term","affectedAssets":[{"asset":"","direction":"bullish|bearish|neutral","impactStrength":"low|medium|high","reason":""}],"traderWarning":""}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json({ error: message || "Groq request failed." }, { status: response.status });
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "Groq returned an empty response." }, { status: 502 });
  }

  try {
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON.", raw: content }, { status: 502 });
  }
}
