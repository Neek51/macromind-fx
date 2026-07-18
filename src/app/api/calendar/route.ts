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
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json");

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch economic calendar." }, { status: 502 });
    }

    const events: CalendarEvent[] = await res.json();

    // Sort by date (earliest first)
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Return all events — client will filter/display
    return NextResponse.json({ data: events });
  } catch {
    return NextResponse.json({ error: "Failed to fetch economic calendar." }, { status: 502 });
  }
}
