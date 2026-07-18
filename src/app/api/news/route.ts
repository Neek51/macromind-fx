import { NextResponse } from "next/server";

type NewsItem = {
  title: string;
  summary: string;
  source: string;
  link: string;
  pubDate: string;
};

type RssItem = {
  title?: string;
  pubDate?: string;
  link?: string;
  content?: string;
  description?: string;
  author?: string;
};

// Yahoo Finance RSS feeds for different assets
const FEEDS = [
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X&region=US&lang=en-US",
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GBPUSD=X&region=US&lang=en-US",
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F&region=US&lang=en-US",
  "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SI=F&region=US&lang=en-US",
];

export async function GET() {
  try {
    // Fetch all feeds in parallel via rss2json (no key needed, 10k/day free)
    const feedResults = await Promise.all(
      FEEDS.map(async (feedUrl) => {
        try {
          const res = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
          );
          if (!res.ok) return [];
          const json = await res.json();
          return (json?.items ?? []) as RssItem[];
        } catch {
          return [];
        }
      }),
    );

    // Merge, deduplicate by title, and map to our format
    const seen = new Set<string>();
    const allNews: NewsItem[] = [];

    for (const items of feedResults) {
      for (const item of items) {
        if (!item.title || seen.has(item.title)) continue;
        seen.add(item.title);

        allNews.push({
          title: item.title,
          summary: item.content || item.description || "",
          source: "Yahoo Finance",
          link: item.link || "",
          pubDate: item.pubDate || "",
        });
      }
    }

    // Sort by date (newest first) and take top 12
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({ data: allNews.slice(0, 12) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch news." }, { status: 502 });
  }
}
