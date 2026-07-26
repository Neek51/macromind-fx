import { NextResponse } from "next/server";

type CalendarEvent = {
  title: string;
  country: string;
  date: string;
  impact: "High" | "Medium" | "Low";
  forecast: string;
  previous: string;
  actual: string;
  source: string;
  sourceUrl: string;
  group: string;
  status: "scheduled" | "released";
};

type FfEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
};

const FED_SOURCE = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
const BLS_SOURCE = "https://www.bls.gov/schedule/news_release/bls.ics";
const FF_SOURCE = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

const FOMC_DATES_2026 = [
  "2026-01-28T19:00:00.000Z",
  "2026-03-18T18:00:00.000Z",
  "2026-04-29T18:00:00.000Z",
  "2026-07-29T18:00:00.000Z",
  "2026-09-16T18:00:00.000Z",
  "2026-10-28T18:00:00.000Z",
  "2026-12-09T19:00:00.000Z",
];

function impact(value: string | undefined): CalendarEvent["impact"] {
  if (value === "High" || value === "Medium" || value === "Low") return value;
  return "Medium";
}

function statusFor(date: string): CalendarEvent["status"] {
  return new Date(date).getTime() < Date.now() ? "released" : "scheduled";
}

function groupFfEvent(title: string) {
  if (/(Federal Funds Rate|FOMC Statement|FOMC Press Conference)/i.test(title)) return "FOMC";
  if (/(Non-Farm Employment Change|Nonfarm Payrolls|Unemployment Rate|Average Hourly Earnings)/i.test(title)) return "Employment Situation";
  if (/(CPI|Consumer Price Index)/i.test(title)) return "CPI";
  return title;
}

function normalizeFfEvent(event: FfEvent): CalendarEvent | null {
  if (!event.title || !event.date) return null;
  const group = groupFfEvent(event.title);
  const title = group === "Employment Situation"
    ? "US Employment Situation (NFP + Unemployment)"
    : group === "FOMC"
      ? "FOMC Rate Decision / Meeting"
      : event.title;
  return {
    title,
    country: event.country ?? "",
    date: event.date,
    impact: impact(event.impact),
    forecast: event.forecast ?? "",
    previous: event.previous ?? "",
    actual: event.actual ?? "",
    source: "ForexFactory",
    sourceUrl: FF_SOURCE,
    group,
    status: statusFor(event.date),
  };
}

function getEasternOffsetHours(year: number, month: number, day: number) {
  const secondSundayMarch = 14 - new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const firstSundayNovember = 7 - new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const afterDstStart = month > 3 || (month === 3 && day >= secondSundayMarch);
  const beforeDstEnd = month < 11 || (month === 11 && day < firstSundayNovember);
  return afterDstStart && beforeDstEnd ? 4 : 5;
}

function parseIcsDate(value: string): string | null {
  const match = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const offset = getEasternOffsetHours(Number(year), Number(month), Number(day));
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) + offset, Number(minute), Number(second));
  return new Date(utc).toISOString();
}

function parseBlsEvents(ics: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = ics.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim();
    const rawDate = block.match(/DTSTART[^:]*:(\d{8}T\d{6})/)?.[1];
    const date = rawDate ? parseIcsDate(rawDate) : null;
    if (!summary || !date || !/(Consumer Price Index|Employment Situation)/i.test(summary)) continue;
    const isEmployment = /Employment Situation/i.test(summary);
    events.push({
      title: isEmployment ? "US Employment Situation (NFP + Unemployment)" : "US Consumer Price Index (CPI)",
      country: "USD",
      date,
      impact: "High",
      forecast: "",
      previous: "",
      actual: "",
      source: "U.S. Bureau of Labor Statistics",
      sourceUrl: BLS_SOURCE,
      group: isEmployment ? "Employment Situation" : "CPI",
      status: statusFor(date),
    });
  }
  return events;
}

function buildFomcEvents(): CalendarEvent[] {
  return FOMC_DATES_2026.map((date) => ({
    title: "FOMC Rate Decision / Meeting",
    country: "USD",
    date,
    impact: "High" as const,
    forecast: "",
    previous: "",
    actual: "",
    source: "Federal Reserve",
    sourceUrl: FED_SOURCE,
    group: "FOMC",
    status: statusFor(date),
  }));
}

function dedupe(events: CalendarEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.group}|${event.date.slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  const [ffResult, blsResult] = await Promise.allSettled([
    fetch(FF_SOURCE, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) }),
    fetch(BLS_SOURCE, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(5000) }),
  ]);

  const events: CalendarEvent[] = [];
  const sources: string[] = [];

  if (ffResult.status === "fulfilled" && ffResult.value.ok) {
    const ffEvents = await ffResult.value.json() as FfEvent[];
    events.push(...ffEvents.map(normalizeFfEvent).filter((event): event is CalendarEvent => Boolean(event)));
    sources.push("ForexFactory");
  }

  if (blsResult.status === "fulfilled" && blsResult.value.ok) {
    events.push(...parseBlsEvents(await blsResult.value.text()));
    sources.push("BLS");
  }

  events.push(...buildFomcEvents());
  sources.push("Federal Reserve");

  const data = dedupe(events);
  return NextResponse.json({
    data,
    count: data.length,
    sources,
    fetchedAt: new Date().toISOString(),
    warning: sources.length < 3 ? "One or more calendar sources were unavailable." : undefined,
  });
}
