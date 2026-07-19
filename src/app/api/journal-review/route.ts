import { NextResponse } from "next/server";
import { callAI, hasAIKey } from "../ai-provider";

export async function POST(request: Request) {
  const { pair, entry, stopLoss, takeProfit, reason } = await request.json();

  if (!pair || !entry || !stopLoss || !takeProfit) {
    return NextResponse.json({ error: "Pair, entry, stop loss, and take profit are required." }, { status: 400 });
  }

  if (!hasAIKey()) {
    return NextResponse.json(
      { error: "No AI provider configured. Set OPENCODE_ZEN_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env.local" },
      { status: 500 },
    );
  }

  // Calculate risk-reward ratio
  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stopLoss);
  const targetNum = parseFloat(takeProfit);
  const risk = Math.abs(entryNum - stopNum);
  const reward = Math.abs(targetNum - entryNum);
  const riskReward = risk > 0 ? reward / risk : 0;

  const result = await callAI(
    `Review this trade journal entry:\n\nPair: ${pair}\nEntry: ${entry}\nStop Loss: ${stopLoss}\nTake Profit: ${takeProfit}\nRisk/Reward Ratio: ${riskReward.toFixed(2)}R\nReason: ${reason || "No reason provided"}\n\nReturn JSON with this shape: {"grade":"A|A-|B+|B|B-|C+|C","summary":"","planQuality":"Good|Fair|Poor","newsRisk":"Low|Medium|High","emotionRisk":"Low|Medium|High","suggestions":"","strengths":""}`,
    "You are a forex trading mentor and trade journal reviewer. Return only valid JSON. Do not provide financial advice. Provide educational trade analysis only.",
  );

  if (!result) {
    return NextResponse.json({ error: "All AI providers failed." }, { status: 502 });
  }

  try {
    const aiResult = JSON.parse(result.content);
    return NextResponse.json({ ...aiResult, riskReward: riskReward.toFixed(2) });
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON.", raw: result.content }, { status: 502 });
  }
}
