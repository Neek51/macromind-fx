export interface SentinelItem {
  text: string;
  source: string;
  timestamp: string;
}

export async function scrapeTelegramChannel(channel: string, sourceName: string): Promise<SentinelItem[]> {
  try {
    const url = `https://t.me/s/${channel}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    // Regex matching the text content container of public Telegram widget messages
    const regex = /<div class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    const matches: SentinelItem[] = [];
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      let rawText = match[1];
      // Strip inner html formatting tags safely
      rawText = rawText.replace(/<[^>]*>/g, "").trim();
      // Decode HTML basic entities
      rawText = rawText
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      if (rawText && rawText.length > 8) {
        const cleanText = rawText.length > 250 ? rawText.substring(0, 250) + "..." : rawText;
        matches.push({
          text: cleanText,
          source: sourceName,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    // Take the 6 most recent updates
    return matches.slice(-6).reverse();
  } catch (error) {
    console.error(`Sentinel: Failed to scrape channel ${channel}:`, error);
    return [];
  }
}
