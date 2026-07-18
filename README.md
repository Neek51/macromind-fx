# MacroMind FX — AI Forex Intelligence Dashboard

AI-powered forex dashboard tracking 10 assets (Gold, Silver, 6 forex pairs, Bitcoin, Ethereum) with live prices, correlation matrix, currency strength meter, position size calculator, market sessions clock, AI news analysis, economic calendar, and AI trade journal.

## Features

- **Live Market Prices** — Real-time data from Yahoo Finance + gold-api.com (no API keys)
- **Currency Strength Meter** — Real-time heatmap across 7 currencies
- **Correlation Matrix** — 10×10 Pearson correlation from 3 months of historical data
- **Position Size Calculator** — Full risk management tool
- **Market Sessions Clock** — Tokyo/London/NY with 24h timeline
- **TradingView Advanced Chart** — Candlestick chart with RSI, MA indicators
- **AI News Impact Analyzer** — Groq-powered sentiment analysis (requires `GROQ_API_KEY`)
- **Economic Calendar** — ForexFactory feed via `nfs.faireconomy.media`
- **AI Trade Journal** — Grade, risk-reward, plan quality assessment

## Tech Stack

Next.js 16.2.10, React 19.2.4, Tailwind CSS v4, TypeScript 5

## Getting Started

```bash
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local
npm install
npm run dev
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key for AI features |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model to use |

## Project Structure

```
src/app/
├── api/
│   ├── prices/route.ts         ← Live market data pipeline
│   ├── correlation/route.ts    ← Pearson correlation engine
│   ├── news/route.ts           ← Yahoo Finance RSS feed
│   ├── analyze/route.ts        ← AI sentiment analysis
│   ├── calendar/route.ts       ← Economic calendar
│   └── journal-review/route.ts ← AI trade review
├── page.tsx                    ← Dashboard (Overview)
├── news/page.tsx               ← News Impact Analyzer
├── calendar/page.tsx           ← Economic Calendar
├── journal/page.tsx            ← AI Trade Journal
├── components.tsx              ← Sidebar, PageShell, Card
├── currency-strength-meter.tsx ← Currency strength component
├── position-size-calculator.tsx← Position size component
├── market-sessions-clock.tsx   ← Session clock component
├── correlation-matrix.tsx      ← Correlation matrix component
├── asset-icon.tsx              ← Asset icons + helpers
├── tradingview-chart.tsx       ← TradingView chart widget
├── theme-provider.tsx          ← Dark/light mode context
├── data.ts                     ← Fallback static data
├── types.ts                    ← Shared TypeScript types
├── loading.tsx                 ← Dashboard loading skeleton
└── error.tsx                   ← Global error boundary
```
