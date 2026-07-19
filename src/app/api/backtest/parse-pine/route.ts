import { NextResponse } from "next/server";
import { callAI } from "../../ai-provider";

export async function POST(request: Request) {
  try {
    const { pineScript } = await request.json();

    if (!pineScript || typeof pineScript !== "string") {
      return NextResponse.json(
        { error: "Invalid Pine Script payload" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert compiler and parser that translates TradingView Pine Script (v4, v5, or v6) trading strategy code into a structured JSON configuration for a custom backtesting engine.

Translate the buy (long entry) and sell (short entry) conditions and indicator parameters into the exact JSON format specified below.

JSON Schema:
{
  "emaFast": number,          // Look for fast EMA period (default: 9)
  "emaMedium": number,        // Look for medium EMA period (default: 21)
  "emaSlow": number,          // Look for slow EMA period (default: 50)
  "emaTrend": number,         // Look for long-term Trend EMA period (default: 200)
  "rsiPeriod": number,        // Look for RSI length/period (default: 14)
  "rsiOversold": number,      // Look for RSI oversold level (default: 30)
  "rsiOverbought": number,    // Look for RSI overbought level (default: 70)
  "atrPeriod": number,        // Look for ATR length/period (default: 14)
  "stopLossMultiplier": number,    // Look for stop loss ATR multiplier or default to 1.5
  "takeProfitMultiplier": number,  // Look for take profit ATR multiplier or default to 3.0
  "buyRules": Array<{
    "left": "close" | "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi",
    "operator": "crosses_above" | "crosses_below" | "greater_than" | "less_than",
    "right": "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi" | "value",
    "value"?: number // Required ONLY if right is "value"
  }>,
  "sellRules": Array<{
    "left": "close" | "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi",
    "operator": "crosses_above" | "crosses_below" | "greater_than" | "less_than",
    "right": "emaFast" | "emaMedium" | "emaSlow" | "emaTrend" | "rsi" | "value",
    "value"?: number // Required ONLY if right is "value"
  }>
}

Mapping rules:
1. Translate "crossover(a, b)" or "a > b and a[1] <= b[1]" to operator "crosses_above" with left "a" and right "b".
2. Translate "crossunder(a, b)" or "a < b and a[1] >= b[1]" to operator "crosses_below" with left "a" and right "b".
3. Translate simple comparisons like "a > b" to "greater_than" and "a < b" to "less_than".
4. If a comparison references an indicator not in the list, approximate it using the closest supported indicator (e.g. SMA Fast -> emaFast, MACD line -> rsi or emaFast).
5. If the script uses constant values (e.g., 30 for RSI oversold level, or 70 for RSI overbought), set "right" to "value" and populate the "value" field.

Return ONLY a valid JSON object matching the schema. Do not output markdown quotes, descriptions, or explanations.`;

    const userPrompt = `Here is the Pine Script code to analyze and convert:\n\n${pineScript}`;

    const aiResult = await callAI(userPrompt, systemPrompt);

    if (!aiResult || !aiResult.content) {
      return NextResponse.json(
        { error: "AI failed to parse the Pine Script. Please check your keys or configurations." },
        { status: 500 }
      );
    }

    // Try to parse the content returned by the AI
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(aiResult.content);
    } catch {
      // If AI returned json inside markdown block, clean it up
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedConfig = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Unable to parse JSON from AI response: " + aiResult.content);
      }
    }

    return NextResponse.json(parsedConfig);
  } catch (err: unknown) {
    console.error("[PARSE_PINE_API_ERROR]", err);
    const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during parsing.";
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
