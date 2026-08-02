import { NextResponse } from "next/server";
import { scrapeTelegramChannel } from "../../lib/sentiment-scraper";

export async function GET() {
  try {
    // Run scrapes concurrently for top speed
    const [zeroHedge, forexLive] = await Promise.all([
      scrapeTelegramChannel("zerohedge", "ZeroHedge Feed"),
      scrapeTelegramChannel("forexlive", "ForexLive Feed"),
    ]);
    
    // Combine and shuffle slightly to interleave updates, or just concatenate
    const combined = [...zeroHedge, ...forexLive].slice(0, 10);
    
    return NextResponse.json({ data: combined });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Scraper execution failed";
    return NextResponse.json({ data: [], error: msg }, { status: 502 });
  }
}
