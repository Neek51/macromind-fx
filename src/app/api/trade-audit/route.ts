import { NextResponse } from "next/server";
import { callAI } from "../ai-provider";

export async function POST(req: Request) {
  try {
    const { trade } = await req.json();

    if (!trade) {
      return NextResponse.json({ data: { error: "No trade data provided." } }, { status: 400 });
    }

    const isBuy = trade.direction === "buy";
    const outcome = trade.exitPrice !== null 
      ? (isBuy ? (trade.exitPrice > trade.entry ? "WIN" : "LOSS") : (trade.exitPrice < trade.entry ? "WIN" : "LOSS"))
      : "CLOSED";

    const prompt = `Analyze this virtual paper trade outcome and explain the structural reason (SMC/Fundamentals) behind its execution:

Trade Details:
- Symbol: ${trade.symbol}
- Direction: ${trade.direction.toUpperCase()}
- Entry Price: ${trade.entry}
- Stop Loss (SL): ${trade.stopLoss}
- Take Profit (TP): ${trade.takeProfit}
- Exit Price: ${trade.exitPrice ?? "N/A"}
- Outcome: ${outcome} (Reasoning: ${trade.reason ?? "None"})

SMC Guidelines:
- If the trade was a LOSS (SL hit), analyze if the market swept the entry zone, tapped a deeper Order Block (OB), filled a Fair Value Gap (FVG), swept Inducement (IDM), or reacted to news volatility.
- If the trade was a WIN (TP hit), explain what aligned correctly (e.g., momentum, FVG fill, session breakouts).
- Return a professional, objective analysis from the perspective of a 10-year veteran institutional trader.

Return ONLY a valid JSON object matching the following structure:
{
  "review": "A clear, professional 2-3 sentence explanation of what happened structurally and why the price hit target or stop-loss.",
  "lesson": "A single-sentence key trading lesson that the user must remember to avoid repeating this loss or to replicate this win."
}

Do not add markdown formatting or backticks around the JSON. Return only the raw JSON.`;

    const systemPrompt = `You are a professional trading review analyzer. Return only valid raw JSON matching the requested schema. Everything must be in standard English.`;

    const result = await callAI(prompt, systemPrompt);

    if (!result) {
      return NextResponse.json({
        data: {
          review: "AI analysis is currently unavailable. The trade hit target under normal market conditions.",
          lesson: "Review your entry parameters and keep trading."
        }
      });
    }

    try {
      const data = JSON.parse(result.content.trim());
      return NextResponse.json({ data });
    } catch (parseError) {
      console.error("Failed to parse trade review output:", result.content, parseError);
      return NextResponse.json({
        data: {
          review: "Failed to format AI trade review. Check entry coordinates.",
          lesson: "Verify entry invalidation zones on your chart."
        }
      });
    }
  } catch (err) {
    console.error("Trade Review API Route Error:", err);
    return NextResponse.json({ data: { error: "Failed to generate trade review." } }, { status: 500 });
  }
}
