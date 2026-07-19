export const assets = [
  {
    symbol: "XAU/USD",
    name: "Gold",
    price: "2,365.40",
    change: "-0.42%",
    sentiment: "Bearish",
    risk: "High",
    accent: "bg-amber-500",
  },
  {
    symbol: "XAG/USD",
    name: "Silver",
    price: "30.84",
    change: "+0.18%",
    sentiment: "Neutral",
    risk: "Medium",
    accent: "bg-slate-400",
  },
  {
    symbol: "EUR/USD",
    name: "Euro / Dollar",
    price: "1.0824",
    change: "-0.21%",
    sentiment: "Bearish",
    risk: "Medium",
    accent: "bg-blue-500",
  },
  {
    symbol: "GBP/USD",
    name: "Pound / Dollar",
    price: "1.2738",
    change: "+0.09%",
    sentiment: "Bullish",
    risk: "Low",
    accent: "bg-emerald-500",
  },
  {
    symbol: "USD/JPY",
    name: "Dollar / Yen",
    price: "149.85",
    change: "+0.32%",
    sentiment: "Bullish",
    risk: "Medium",
    accent: "bg-rose-500",
  },
  {
    symbol: "USD/CHF",
    name: "Dollar / Franc",
    price: "0.9012",
    change: "-0.15%",
    sentiment: "Bearish",
    risk: "Medium",
    accent: "bg-red-500",
  },
  {
    symbol: "AUD/USD",
    name: "Aussie / Dollar",
    price: "0.6584",
    change: "+0.22%",
    sentiment: "Bullish",
    risk: "Medium",
    accent: "bg-purple-500",
  },
  {
    symbol: "USD/CAD",
    name: "Dollar / Loonie",
    price: "1.3720",
    change: "-0.08%",
    sentiment: "Bearish",
    risk: "Low",
    accent: "bg-cyan-500",
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin",
    price: "62,648.63",
    change: "+0.62%",
    sentiment: "Bullish",
    risk: "High",
    accent: "bg-orange-500",
  },
  {
    symbol: "ETH/USD",
    name: "Ethereum",
    price: "1,788.79",
    change: "+0.83%",
    sentiment: "Bullish",
    risk: "High",
    accent: "bg-indigo-500",
  },
];

export const newsItems = [
  {
    title: "Fed signals rates may stay higher for longer",
    source: "Macro desk",
    impact: "USD bullish, gold bearish",
    confidence: "82%",
    risk: "High",
    summary: "Higher-for-longer rate expectations can support USD strength and reduce short-term gold demand.",
  },
  {
    title: "US inflation data beats market forecast",
    source: "Economic release",
    impact: "High volatility expected",
    confidence: "76%",
    risk: "High",
    summary: "Hot inflation increases uncertainty around rate cuts and can create fast moves across USD pairs.",
  },
  {
    title: "Risk sentiment improves before New York open",
    source: "Market flow",
    impact: "Safe-haven pressure possible",
    confidence: "68%",
    risk: "Medium",
    summary: "When risk appetite improves, gold can face pressure as traders rotate into higher-risk assets.",
  },
];

// Helper to generate dynamic dates anchored to specific weekdays (1 = Monday, 2 = Tuesday, etc.)
// On weekends, it automatically rolls forward to next week's weekdays.
const getWeekdayISOString = (targetDay: number, hour: number, minute: number) => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  let diff = targetDay - day;
  if (day === 6) { // Saturday -> roll forward to next week
    diff += 7;
  } else if (day === 0 && targetDay < 1) { // Sunday looking at past events
    diff -= 7;
  }
  
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const events = [
  // Past Weekday Events (simulating last week Thursday/Friday)
  { date: getWeekdayISOString(-1, 8, 30), event: "US PPI m/m", country: "USD", impact: "High", forecast: "0.2%", previous: "0.0%" }, // previous Friday
  { date: getWeekdayISOString(-2, 14, 30), event: "BOC Gov Macklem Speaks", country: "CAD", impact: "High", forecast: "-", previous: "-" }, // previous Thursday
  
  // Monday July 20 Events (TargetDay = 1)
  { date: getWeekdayISOString(1, 4, 15), event: "Trade Balance", country: "NZD", impact: "Medium", forecast: "250M", previous: "800M" },
  { date: getWeekdayISOString(1, 4, 31), event: "Rightmove HPI m/m", country: "GBP", impact: "Low", forecast: "-", previous: "-0.6%" },
  { date: getWeekdayISOString(1, 6, 30), event: "1-y Loan Prime Rate", country: "CNY", impact: "Medium", forecast: "3.00%", previous: "3.00%" },
  { date: getWeekdayISOString(1, 6, 30), event: "5-y Loan Prime Rate", country: "CNY", impact: "Medium", forecast: "3.50%", previous: "3.50%" },
  { date: getWeekdayISOString(1, 11, 30), event: "German PPI m/m", country: "EUR", impact: "Low", forecast: "-0.2%", previous: "0.3%" },
  { date: getWeekdayISOString(1, 18, 0), event: "CPI m/m", country: "CAD", impact: "High", forecast: "-0.2%", previous: "1.0%" },
  { date: getWeekdayISOString(1, 18, 0), event: "Median CPI y/y", country: "CAD", impact: "High", forecast: "2.1%", previous: "2.1%" },
  { date: getWeekdayISOString(1, 18, 0), event: "Trimmed CPI y/y", country: "CAD", impact: "High", forecast: "2.0%", previous: "2.0%" },
  { date: getWeekdayISOString(1, 18, 0), event: "Core CPI m/m", country: "CAD", impact: "Medium", forecast: "-", previous: "0.6%" },
  { date: getWeekdayISOString(1, 19, 30), event: "CB Leading Index m/m", country: "USD", impact: "Medium", forecast: "-0.1%", previous: "0.1%" },

  // Rest of Weekday Upcoming (TargetDays: 2 = Tuesday, 3 = Wednesday, etc.)
  { date: getWeekdayISOString(2, 8, 30), event: "US Retail Sales m/m", country: "USD", impact: "High", forecast: "0.3%", previous: "0.1%" },
  { date: getWeekdayISOString(3, 12, 30), event: "Jobless Claims", country: "USD", impact: "Medium", forecast: "225K", previous: "229K" },
  { date: getWeekdayISOString(4, 18, 0), event: "Fed Chair Speech", country: "USD", impact: "High", forecast: "-", previous: "-" },
  { date: getWeekdayISOString(5, 6, 0), event: "UK GDP m/m", country: "GBP", impact: "Medium", forecast: "0.2%", previous: "0.1%" },
];

export const trades = [
  {
    pair: "XAU/USD",
    setup: "Rejected resistance after USD bullish headline",
    entry: "2368.20",
    stop: "2376.00",
    target: "2352.00",
    grade: "B+",
  },
  {
    pair: "EUR/USD",
    setup: "Bearish continuation after CPI surprise",
    entry: "1.0830",
    stop: "1.0872",
    target: "1.0750",
    grade: "A-",
  },
];
