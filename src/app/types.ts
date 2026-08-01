export type LiveAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent_change: number;
  high: number;
  low: number;
  source?: string;
  instrumentType?: "spot" | "cash-index" | "futures" | "fallback";
  updatedAt?: string;
  isFallback?: boolean;
  error?: string;
};

export type NewsItem = {
  title: string;
  summary: string;
  source: string;
  link: string;
  pubDate: string;
};

export type CalendarEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
  source?: string;
  sourceUrl?: string;
  group?: string;
  status?: "scheduled" | "released";
};

export type CorrelationData = {
  symbols: string[];
  matrix: { symbol: string; values: Record<string, number> }[];
  strongestPositive: { a: string; b: string; value: number };
  strongestNegative: { a: string; b: string; value: number };
  timeframe: string;
  interval: string;
  updatedAt: string;
  source: string;
};

export type AnalysisResult = {
  summary?: string;
  usdSentiment?: string;
  riskLevel?: string;
  confidence?: number;
  timeframe?: string;
  affectedAssets?: Array<{
    asset: string;
    direction: string;
    impactStrength: string;
    reason: string;
  }>;
  traderWarning?: string;
  error?: string;
};

export type JournalReview = {
  grade?: string;
  summary?: string;
  planQuality?: string;
  newsRisk?: string;
  emotionRisk?: string;
  suggestions?: string;
  strengths?: string;
  riskReward?: string;
  error?: string;
};

export type SavedTrade = {
  id: string;
  pair: string;
  entry: string;
  stop: string;
  target: string;
  reason: string;
  grade: string;
  riskReward: string;
  status: "Open" | "Closed";
  createdAt: string;
};

export type ChartData = {
  prices: number[];
  high: number;
  low: number;
  open: number;
  close: number;
  change: number;
  percentChange: number;
  interval: string;
};

export type MarketOutlook = {
  date: string;
  overallBias: string;
  biasStrength: string;
  summary: string;
  keyLevels: Array<{
    asset: string;
    direction: string;
    levels: string;
    note: string;
  }>;
  eventsToWatch: Array<{
    event: string;
    time: string;
    impact: string;
    why: string;
  }>;
  opportunities: string[];
  risks: string[];
  topMovers: Array<{
    asset: string;
    change: string;
    note: string;
  }>;
  generatedAt: string;
  source: string;
  error?: string;
};

export type PatternResult = {
  symbol: string;
  timeframe: string;
  patterns: Array<{
    name: string;
    type: string;
    confidence: number;
    direction: string;
    description: string;
    entryZone: string;
    invalidation: string;
    aiNote?: string;
  }>;
  supportLevels: number[];
  resistanceLevels: number[];
  trend: string;
  trendStrength: string;
  currentPrice: number;
  computedAt: string;
  source: string;
  error?: string;
};

export type PriceAlert = {
  id: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  currentPriceWhenSet: number;
  note: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt: string | null;
  aiContext: string | null;
};

export type AIPrediction = {
  symbol: string;
  bullishProbability: number;
  bearishProbability: number;
  predictedMove: string;
  confidence: "low" | "medium" | "high";
  keyLevel: string;
  drivers: Array<{ factor: string; contribution: number }>;
  sessionInsight: string;
  reasoning: string;
  smcFeatures: {
    trend: "bullish" | "bearish" | "neutral";
    nearestOB: { price: number; type: "bullish" | "bearish"; description: string } | null;
    activeFVG: { top: number; bottom: number; type: "bullish" | "bearish" } | null;
    lastSweep: string | null;
    inducementLevel: number | null;
  };
  suggestedTrade: {
    direction: "buy" | "sell";
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
  } | null;
  computedAt: string;
  model?: string;
  error?: string;
};

export type VirtualTrade = {
  id: string;
  symbol: string;
  direction: "buy" | "sell";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  reason: string;
  status: "open" | "closed";
  pnlPercentage: number | null;
  pnlAmount: number | null;
  exitPrice: number | null;
  closedAt: string | null;
  createdAt: string;
  postmortem: string | null;
  lesson: string | null;
};

