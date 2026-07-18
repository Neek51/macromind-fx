"use client";

export const LOGO_URLS: Record<string, { type: "single" | "pair"; primary: string; secondary?: string }> = {
  "XAU/USD": { type: "single", primary: "https://s3-symbol-logo.tradingview.com/metal/gold.svg" },
  "XAG/USD": { type: "single", primary: "https://s3-symbol-logo.tradingview.com/metal/silver.svg" },
  "EUR/USD": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/EU.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/US.svg" },
  "GBP/USD": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/GB.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/US.svg" },
  "USD/JPY": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/US.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/JP.svg" },
  "USD/CHF": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/US.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/CH.svg" },
  "AUD/USD": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/AU.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/US.svg" },
  "USD/CAD": { type: "pair", primary: "https://s3-symbol-logo.tradingview.com/country/US.svg", secondary: "https://s3-symbol-logo.tradingview.com/country/CA.svg" },
  "BTC/USD": { type: "single", primary: "https://s3-symbol-logo.tradingview.com/crypto/XTVCBTC.svg" },
  "ETH/USD": { type: "single", primary: "https://s3-symbol-logo.tradingview.com/crypto/XTVCETH.svg" },
};

export const nameMap: Record<string, string> = {
  "XAU/USD": "Gold",
  "XAG/USD": "Silver",
  "EUR/USD": "Euro / Dollar",
  "GBP/USD": "Pound / Dollar",
  "USD/JPY": "Dollar / Yen",
  "USD/CHF": "Dollar / Franc",
  "AUD/USD": "Aussie / Dollar",
  "USD/CAD": "Dollar / Loonie",
  "BTC/USD": "Bitcoin",
  "ETH/USD": "Ethereum",
};

export function formatPrice(symbol: string, price: number): string {
  if (symbol === "XAU/USD" || symbol === "BTC/USD") return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "XAG/USD") return price.toFixed(2);
  if (symbol === "ETH/USD") return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "USD/JPY") return price.toFixed(2);
  return price.toFixed(4);
}

export function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AssetIcon({ symbol, size = 36 }: { symbol: string; size?: number }) {
  const logo = LOGO_URLS[symbol];
  if (!logo) {
    return <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-xs text-white">?</div>;
  }

  if (logo.type === "single") {
    return (
      <img
        src={logo.primary}
        alt={symbol}
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, minWidth: size }}
      />
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size + 6, height: size + 6 }}>
      <img
        src={logo.secondary!}
        alt=""
        width={size}
        height={size}
        className="absolute rounded-full ring-2 ring-[var(--card)]"
        style={{ width: size, height: size, top: 0, left: 6, zIndex: 0 }}
      />
      <img
        src={logo.primary}
        alt={symbol}
        width={size}
        height={size}
        className="absolute rounded-full ring-2 ring-[var(--card)]"
        style={{ width: size, height: size, top: 6, left: 0, zIndex: 1 }}
      />
    </div>
  );
}
