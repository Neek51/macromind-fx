import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  const { pair, entry, stopLoss, takeProfit, reason } = await request.json();

  if (!pair || !entry || !stopLoss || !takeProfit) {
    return NextResponse.json({ error: "Pair, entry, stop loss, and take profit are required." }, { status: 400 });
  }

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "Missing GROQ_API_KEY environment variable." }, { status: 500 });
  }

  // Calculate risk-reward ratio
  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stopLoss);
  const targetNum = parseFloat(takeProfit);
  const risk = Math.abs(entryNum - stopNum);
  const reward = Math.abs(targetNum - entryNum);
  const riskReward = risk > 0 ? reward / risk : 0;

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
            "You are a forex trading mentor and trade journal reviewer. Return only valid JSON. Do not provide financial advice. Provide educational trade analysis only.",
        },
        {
          role: "user",
          content: `Review this trade journal entry:\n\nPair: ${pair}\nEntry: ${entry}\nStop Loss: ${stopLoss}\nTake Profit: ${takeProfit}\nRisk/Reward Ratio: ${riskReward.toFixed(2)}R\nReason: ${reason || "No reason provided"}\n\nReturn JSON with this shape: {"grade":"A|A-|B+|B|B-|C+|C","summary":"","planQuality":"Good|Fair|Poor","newsRisk":"Low|Medium|High","emotionRisk":"Low|Medium|High","suggestions":"","strengths":""}`,
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
    const aiResult = JSON.parse(content);
    return NextResponse.json({ ...aiResult, riskReward: riskReward.toFixed(2) });
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON.", raw: content }, { status: 502 });
  }
}
