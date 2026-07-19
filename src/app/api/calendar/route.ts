import { NextResponse } from "next/server";

type CalendarEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
};

export async function GET() {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch economic calendar." }, { status: 502 });
    }

    const events: CalendarEvent[] = await res.json();

    // Sort by date (earliest first)
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      data: events,
      count: events.length,
      source: "ForexFactory free JSON feed (this week)",
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch economic calendar." }, { status: 502 });
  }
}
