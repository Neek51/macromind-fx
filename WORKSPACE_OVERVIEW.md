# 📂 Workspace Overview — /home/nisarg/Desktop/ideas

**Last Updated:** August 2, 2026 (Implemented AI Trade Audit rebranding, mathematical Premium/Discount & CISD zone filters, safe calendar timeouts, printable SMC playbook, localized charting timezone scales, TradingView-smooth dotted crosshair, responsive mobile trade journal cards, and local timezone Market Session clocks)
**Workspace Root:** `/home/nisarg/Desktop/ideas`

This document is a comprehensive, in-depth record of every project, file, and resource in this workspace. It covers what each project is, how it works, its architecture, current status, and all relevant code/configuration details.

---

## Table of Contents

1. [Workspace Structure](#1-workspace-structure)
2. [Project 1: MacroMind FX — AI Forex Intelligence Dashboard](#2-project-1-macromind-fx--ai-forex-intelligence-dashboard)
3. [Project 2: Fx Ultimate — Multi-Platform Trading Strategy](#3-project-2-fx-ultimate--multi-platform-trading-strategy)
4. [Project 3: Design Fetcher — Website Design Token Extractor](#4-project-3-design-fetcher--website-design-token-extractor)
5. [Project 4: P2P File Share — Browser-Based File Transfer](#5-project-4-p2p-file-share--browser-based-file-transfer)
6. [Research: Free Financial/Forex News API Analysis](#6-research-free-financialforex-news-api-analysis)
7. [Qwen Configuration](#7-qwen-configuration)
8. [Resume/Session Files](#8-resumesession-files)

---

## 1. Workspace Structure

```
/home/nisarg/Desktop/ideas/
├── news-api-analysis.md          ← Deep research: 7+ forex news APIs tested & ranked
├── project-plan.md               ← P2P File Share project plan (WebRTC)
├── resume.text                   ← OpenCode session token
├── .qwen/
│   ├── settings.json             ← Qwen Code permissions config
│   ├── pending-skills/
│   └── skills/                   ← Custom skills (free-market-data-fallback, nextjs-mvp-scaffold, warm-minimal-ux-redesign)
├── Desing_Fetcher/               ← Website → DESIGN.md extractor (Puppeteer + Express)
│   ├── DESIGN.md                 ← Claude.com design system tokens (extracted)
│   ├── MDL.md                    ← Beast Procure design extraction (sample output)
│   ├── extractor.js              ← Core extraction engine (647 lines)
│   ├── server.js                 ← Express API + Markdown generator
│   ├── work_done.md              ← Progress tracker
│   ├── package.json              ← Dependencies: express, puppeteer
│   ├── resume.text               ← OpenCode session token
│   └── public/                   ← Frontend UI
├── Fx/                           ← Fx Ultimate trading strategy (3 platform implementations)
│   ├── fx_ultimate_python/       ← Python backtest engine + Streamlit dashboard
│   ├── FxTrader/                 ← TradingView Pine Script v6
│   └── MQL5_Strategy/            ← MetaTrader 5 Expert Advisor (.mq5)
└── macromind-fx/                 ← Next.js 16 forex dashboard (flagship project)
    ├── src/app/                  ← Next.js App Router pages + API routes
    ├── public/                   ← Static assets
    ├── package.json              ← Next.js 16, React 19, Tailwind v4
    ├── AGENTS.md                 ← Next.js agent rules
    ├── CLAUDE.md                 ← Claude agent config
    └── README.md                 ← Default create-next-app README
```

---

## 2. Project 1: MacroMind FX — AI Forex Intelligence Dashboard

**Location:** `/home/nisarg/Desktop/ideas/macromind-fx`  
**Status:** Active development — flagship project  
**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS v4, TypeScript 5

### 2.1 What It Is

MacroMind FX remains a broad market-research codebase, but its primary Overview is now intentionally focused on **three instruments** — Gold Spot (XAU/USD), Bitcoin Spot (BTC/USD), and EUR/USD Spot. Nasdaq is deferred until a broker-specific execution instrument/feed and contract specification are known. Existing advanced routes and legacy multi-asset components remain preserved.

- **Live market prices** — verified spot references for Gold, Bitcoin, and EUR/USD with explicit source, instrument type, update time, and fallback status
- **Trade Safety & Setup Assistant** — focused beginner workflow with verified-event safety gate, objective candle-derived levels, trend context, confirmation checklist, and broker-safe dollar-risk/R:R planning
- **Correlation Matrix** — implemented but temporarily hidden from Overview; its live Pearson-correlation pipeline, preset fallback, component, and API remain intact
- **Position Size Calculator** — implemented but temporarily hidden from Overview; the full risk management component remains available for future restoration
- **Market Sessions Clock** — live status of Tokyo, London & New York trading sessions with a 24h UTC timeline, open/close countdown, and overlap detection
- **AI Daily Market Outlook** — auto-generated daily summary with overall bias (bullish/bearish/neutral), key levels, events to watch, opportunities, risks, and top movers. Uses AgentRouter (OpenAI-compatible) with live price + news + calendar data
- **AI Pattern Detection** — focused on Gold, Bitcoin, and EUR/USD only. Bitcoin/EURUSD use Yahoo spot history; Gold uses the same Gold API spot price as Overview while GC futures candles are ratio-normalized only for historical structure, with the mixed-source calculation explicitly labelled
- **Smart Price Alerts** — set price alerts for any asset, monitored every 5 seconds against live prices, with browser notifications. Fully client-side (localStorage), no account needed
- **AI News Impact Analyzer** — paste any news headline or tweet, get AI-powered market sentiment analysis (bullish/bearish, risk level, affected assets, confidence score)
- **Economic Calendar** — real upcoming macro events from ForexFactory's free JSON feed
- **AI Trade Journal** — log trades, get AI review with grade (A/B/C), risk-reward ratio, plan quality assessment, and suggestions
- **Dark mode** — full light/dark theme toggle with system preference detection
- **TradingView Advanced Chart** — pro-level charting with candlesticks, RSI, MA indicators, multiple timeframes, and pair selector for all 10 assets (free embed, no API key)

### 2.2 Architecture

```
macromind-fx/
├── src/app/
│   ├── layout.tsx              ← Root layout: Geist font, ThemeProvider, anti-flash script
│   ├── page.tsx                ← Thin route wrapper for the focused Trade Safety Assistant
│   ├── trade-assistant-dashboard.tsx ← Three-instrument safety gate, objective levels, checklist, and risk plan
│   ├── components.tsx          ← Sidebar, MobileNav, PageShell, Card components (5 visible nav items)
│   ├── types.ts                ← Shared TypeScript types (LiveAsset, CalendarEvent, CorrelationData, MarketOutlook, PatternResult, PriceAlert, etc.)
│   ├── asset-icon.tsx          ← AssetIcon component + LOGO_URLS + nameMap + formatPrice + timeAgo
│   ├── currency-strength-meter.tsx ← Currency Strength Meter component
│   ├── position-size-calculator.tsx ← Position Size Calculator component
│   ├── market-sessions-clock.tsx ← Market Sessions Clock component
│   ├── correlation-matrix.tsx  ← Correlation Matrix component (with preset fallbacks)
│   ├── confluence-synthesizer.tsx ← Confluence Synthesizer component (4 lanes + verdict plan)
│   ├── tradingview-chart.tsx   ← TradingView Advanced Chart widget (free embed, pair selector, dark mode, safe cleanup)
│   ├── theme-provider.tsx      ← React Context for dark/light mode
│   ├── data.ts                 ← Fallback static data (assets, news, events, trades)
│   ├── globals.css             ← Tailwind v4 + CSS custom properties + dark mode overrides
│   ├── loading.tsx             ← Dashboard loading skeleton
│   ├── error.tsx               ← Global error boundary (uses reset — fixed from unstable_retry)
│   ├── api/
│   │   ├── prices/route.ts     ← Live market data (Yahoo Finance + gold-api.com + fallbacks)
│   │   ├── correlation/route.ts ← Live Pearson correlation matrix from Yahoo historical daily closes
│   │   ├── calendar/route.ts   ← Verified aggregation: ForexFactory + official Federal Reserve FOMC + BLS CPI/Employment schedules
│   │   ├── news/route.ts       ← Yahoo Finance RSS → rss2json (no key, real-time forex news)
│   │   ├── analyze/route.ts    ← AI sentiment analysis (shared 2-tier fallback: Groq → AgentRouter)
│   │   ├── journal-review/route.ts ← AI trade review (shared 2-tier fallback)
│   │   ├── outlook/route.ts    ← AI Daily Market Outlook (shared 2-tier fallback, fetches live data internally)
│   │   ├── patterns/route.ts   ← AI Pattern Detection (algorithmic swing detection + shared 2-tier AI notes)
│   │   ├── ai-provider.ts     ← Shared 2-tier AI fallback chain (Groq llama-3.3-70b → AgentRouter gpt-5.5)
│   │   ├── history/route.ts   ← Historical candle data (Yahoo Finance, any timeframe/range)
│   │   ├── strategy-signals/route.ts ← Fx Ultimate Pine strategy compiler & Telegram dispatcher
│   │   └── backtest/
│   │       └── parse-pine/route.ts ← Pine Script AI parser API (reads Pine Script code, returns parsed config JSON)
│   ├── lib/
│   │   ├── backtest.ts        ← Backtest engine plus reusable EMA/ATR/RSI calculations
│   │   └── trade-assistant.ts ← Deterministic safety, market-context, and broker-safe risk helpers
│   ├── htf/ (outlook, patterns, alerts etc.)
│   ├── outlook/
│   │   ├── layout.tsx          ← Metadata for Outlook page
│   │   ├── page.tsx            ← AI Daily Market Outlook page
│   │   ├── loading.tsx         ← Outlook loading skeleton
│   │   └── error.tsx           ← Outlook error boundary
│   ├── patterns/
│   │   ├── layout.tsx          ← Metadata for Patterns page
│   │   ├── page.tsx            ← AI Pattern Detection page
│   │   ├── loading.tsx         ← Patterns loading skeleton
│   │   └── error.tsx           ← Patterns error boundary
│   ├── alerts/
│   │   ├── layout.tsx          ← Metadata for Alerts page
│   │   ├── page.tsx            ← Smart Price & Strategy Alerts page (localStorage + Telegram dispatcher)
│   │   ├── loading.tsx         ← Alerts loading skeleton
│   │   └── error.tsx           ← Alerts error boundary
│   ├── news/
│   │   ├── layout.tsx          ← Metadata for News page
│   │   ├── page.tsx            ← AI News Impact Analyzer page
│   │   ├── loading.tsx         ← News loading skeleton
│   │   └── error.tsx           ← News error boundary
│   ├── calendar/
│   │   ├── layout.tsx          ← Metadata for Calendar page
│   │   ├── page.tsx            ← Economic Calendar page
│   │   ├── loading.tsx         ← Calendar loading skeleton
│   │   └── error.tsx           ← Calendar error boundary
│   └── journal/
│       ├── layout.tsx          ← Metadata for Journal page
│       ├── page.tsx            ← AI Trade Journal page
│       ├── loading.tsx         ← Journal loading skeleton
│       └── error.tsx           ← Journal error boundary
│   ├── backtest/
│       ├── layout.tsx          ← Metadata for Backtest page
│       ├── page.tsx            ← Strategy Backtester page (builder + results + chart + equity + trade list)
│       ├── backtest-chart.tsx  ← Candlestick chart with EMA overlays + buy/sell markers (lightweight-charts)
│       ├── equity-chart.tsx   ← Equity curve area chart (lightweight-charts)
│       ├── loading.tsx         ← Backtest loading skeleton
│       └── error.tsx           ← Backtest error boundary
├── .env.example                ← Environment variable template
├── .env.local                  ← Active env (GROQ_API_KEY, OPENAI_API_KEY, AGENTROUTER_BASE_URL, AGENTROUTER_MODEL)
├── package.json                ← Next.js 16, React 19, Tailwind v4, TypeScript 5
├── tsconfig.json               ← ES2017 target, strict mode, @/* path alias
├── next.config.ts              ← Configured with turbopack.root, images.remotePatterns
├── postcss.config.mjs          ← Tailwind v4 PostCSS
├── eslint.config.mjs           ← ESLint 9 + next config
├── README.md                   ← Project-specific README (no longer create-next-app default)
└── .gitignore
```

### 2.3 Live Market Data Pipeline

The `/api/prices` route uses a **multi-layer fallback strategy** — all free, no API keys:

```
Metals (XAU/USD, XAG/USD):
  1. gold-api.com (XAU / XAG spot) — no key, no limit
  2. Yahoo Finance spot (XAUUSD=X / XAGUSD=X) — real-time, no key
  3. Yahoo Finance futures (GC=F / SI=F) — last resort

Forex pairs (EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD):
  1. Yahoo Finance (EURUSD=X, GBPUSD=X, USDJPY=X, USDCHF=X, AUDUSD=X, USDCAD=X) — real-time, no key
  2. fawazahmed0 currency-api CDN — daily EOD, no key, unlimited (fallback)

Crypto (BTC/USD, ETH/USD):
  1. Yahoo Finance (BTC-USD, ETH-USD) — real-time, no key
```

The API uses a `YAHOO_FOREX_SYMBOLS` map for all 6 forex pairs and a `fetchCrypto` function for BTC/ETH. Each source returns: `symbol`, `name`, `price`, `change`, `percent_change`, `high`, `low`.

The `/api/correlation` route fetches **3 months of daily closes** from Yahoo Finance for all 10 assets, converts closes into daily returns, then calculates a Pearson correlation value for every pair. It returns the full 10×10 matrix, strongest same-direction relationship, strongest opposite/hedge relationship, timeframe, interval, updated timestamp, and source. The frontend polls it every **15 minutes** and falls back to preset estimates only if live historical data fails.

The frontend polls `/api/prices` every **5 seconds**, `/api/chart` every **60 seconds**, and `/api/correlation` every **15 minutes**.

### 2.4 AI Features

**News Impact Analyzer** (`/api/analyze`):
- Uses **Groq API** with `llama-3.3-70b-versatile` model
- Accepts any news text or tweet
- Returns structured JSON: `summary`, `usdSentiment` (bullish/bearish/neutral), `riskLevel` (low/medium/high), `confidence` (0-100), `timeframe`, `affectedAssets[]` (asset, direction, impactStrength, reason), `traderWarning`
- System prompt: "You are a forex macro sentiment analyst. Return only valid JSON. Do not provide financial advice."
- Environment variables: `GROQ_API_KEY`, `GROQ_MODEL`

**Trade Journal Review** (`/api/journal-review`):
- Uses same Groq API
- Accepts: pair, entry, stopLoss, takeProfit, reason
- Calculates risk-reward ratio server-side
- Returns: `grade` (A/A-/B+/B/B-/C+/C), `summary`, `planQuality` (Good/Fair/Poor), `newsRisk`, `emotionRisk`, `suggestions`, `strengths`

**AI Daily Market Outlook** (`/api/outlook`):
- Uses **AgentRouter** (OpenAI-compatible API) with `gpt-5.5` model (configurable via `AGENTROUTER_MODEL`)
- Fetches live data internally: `/api/prices`, `/api/news`, `/api/calendar` — sends all to AI as context
- Returns structured JSON: `overallBias` (bullish/bearish/neutral), `biasStrength` (low/medium/high), `summary`, `keyLevels[]` (asset, direction, levels, note), `eventsToWatch[]` (event, time, impact, why), `opportunities[]`, `risks[]`, `topMovers[]` (asset, change, note)
- The Outlook page displays: bias badge with strength, market summary, top movers cards, key levels with asset icons, events to watch, opportunities (green), risks (amber), and a "Regenerate" button
- Environment variables: `OPENAI_API_KEY` or `AGENTROUTER_API_KEY`, `AGENTROUTER_BASE_URL` (defaults to `https://agentrouter.org/v1`), `AGENTROUTER_MODEL` (defaults to `gpt-5.5`)
- **Multi-provider fallback**: tries AgentRouter first, falls back to Groq (`GROQ_API_KEY`) if AgentRouter is unavailable — ensures AI features work even when one provider's key is invalid/expired
- Falls back gracefully if no AI keys configured (shows live data with placeholder text)

**AI Pattern Detection** (`/api/patterns`):
- Available only for the focused instruments: Gold Spot, Bitcoin Spot, and EUR/USD Spot; unsupported API symbols are rejected rather than silently defaulting to Gold
- Uses 6 months of Yahoo Finance daily candles for algorithmic swing, support/resistance, and trend detection
- Bitcoin and EUR/USD use matching Yahoo spot history. Yahoo does not expose usable XAU/USD spot candles, so Gold uses `GC=F` only as a historical-structure proxy; candles are ratio-normalized to the current Gold API spot price before levels/patterns are calculated
- The Gold current price therefore matches the Overview Gold API feed, and the Patterns source label explicitly discloses `Gold API spot price + GC futures structure normalized to spot`
- Detects Double Top, Double Bottom, Head and Shoulders, Trend, and nearest Support/Resistance levels
- AI educational notes explain deterministic patterns but do not supply the current market price
- The Patterns page selector exposes only XAU/USD, BTC/USD, and EUR/USD

### 2.4.1 Smart Price Alerts (Client-Side)

**No API route needed** — fully client-side with localStorage + browser notifications:

- **Create alerts**: Select asset, condition (above/below), target price, optional note
- **Live monitoring**: Polls `/api/prices` every 5 seconds, checks all active alerts against live prices
- **Browser notifications**: Uses `Notification API` — requests permission, fires desktop notification when alert triggers
- **Alert lifecycle**: Active → Triggered (with timestamp) → can be reset or deleted
- **Persistence**: Alerts stored in `localStorage` under key `macromind-alerts` — survive page refresh
- **Distance tracking**: Shows how far current price is from target (% away) with a progress bar
- **Dedup**: Uses a `Set` ref to prevent re-triggering the same alert multiple times

### 2.5 News Feed

The `/api/news` route fetches **real Yahoo Finance RSS feeds** converted to JSON via rss2json.com (no key, 10K/day free):

```
Feeds fetched in parallel:
- EURUSD=X (Euro news)
- GBPUSD=X (Pound news)
- GC=F (Gold futures news)
- SI=F (Silver futures news)
```

Articles are merged, deduplicated by title, sorted by date (newest first), and capped at 12 items. Each article has: `title`, `summary`, `source`, `link`, `pubDate`.

The News AI page auto-analyzes the latest headline on load and caches results in `sessionStorage` (5-minute TTL). Users can click any headline to analyze it instantly.

### 2.6 Economic Calendar

The `/api/calendar` route now aggregates three verified sources: ForexFactory's current-week JSON feed for broad macro coverage, the official Federal Reserve FOMC calendar for future policy meetings, and the official BLS iCalendar feed for CPI and Employment Situation schedules. Events are normalized with source, source URL, status, group, actual/forecast/previous fields, sorted, and deduplicated. Employment Situation is presented as the grouped NFP + Unemployment risk event. The former dynamically shifted hardcoded calendar events were removed and are never shown as live data.

The Calendar page clearly labels event sources and unavailable actual values. If verified sources fail, it shows an explicit unavailable warning instead of fabricated upcoming releases. The focused Trade Safety Gate blocks new setups from 30 minutes before until 15 minutes after verified high-impact events.

### 2.7 Design System

**CSS Custom Properties (Light Mode):**
```css
--background: #f5f4f0    ← Warm cream canvas
--foreground: #1a1a17     ← Warm dark ink
--card: #ffffff           ← White cards
--card-border: #e8e6e0   ← Soft hairline
--accent: #d97757         ← Warm coral (Claude-inspired)
--accent-soft: #fdf3ef    ← Coral tint
--muted: #8a8880          ← Muted text
--sidebar: #faf9f6        ← Light sidebar
```

**Dark Mode:**
```css
--background: #1a1a17     ← Warm dark
--foreground: #e8e6e0     ← Cream text
--card: #252421           ← Elevated surface
--card-border: #3a3833   ← Dark hairline
--accent: #e8967a         ← Lighter coral (dark mode adjusted)
--accent-soft: #2e2520    ← Dark coral tint
--muted: #9a988f
--sidebar: #211f1c
```

**Key design choices:**
- Warm cream/coral palette inspired by Claude.ai (Anthropic)
- Geist Sans + Geist Mono fonts
- Anti-flash dark mode script runs before React hydration
- Custom scrollbar styling
- Fade-up animations with staggered delays (0.05s intervals, up to 10 steps for 10 asset cards)
- Real TradingView logo URLs for asset icons (gold/silver SVGs, country flag SVGs for forex pairs)
- Dark mode overrides for Tailwind utility classes (bg-slate-50, bg-emerald-50, etc.)

### 2.8 Components

**Sidebar:** Fixed 256px left sidebar (hidden on mobile) with a compact grouped trading-terminal layout. It contains the MacroMind FX identity, feed-source strip, **5 visible nav items** grouped as Market (Overview, Outlook, Patterns) and Intelligence (News AI, Calendar), plus a risk reminder. Alerts, Trade Journal, and Backtest are temporarily hidden from navigation; their `/alerts`, `/journal`, and `/backtest` routes remain intact and directly accessible. The active route uses an accent surface, rail, and status dot.

**MobileNav:** Slide-out drawer for mobile/tablet (visible below `lg` breakpoint). Triggered by a hamburger button in the `PageShell` header. Includes a backdrop overlay (click to close), body scroll lock while open, auto-close on route change, and reuses the same grouped `navItems` array as the Sidebar. It therefore shows the same 5 visible links while preserving hidden routes for direct access.

**PageShell:** Main layout wrapper. Sticky header with hamburger button (mobile only), page title, label, theme toggle (sun/moon switch), and action button. Header and content use the established 1280px (`max-w-7xl`) aligned container with responsive padding.

**Card:** Rounded-2xl (16px) with border, white/dark background, shadow-sm, hover:shadow-md transition.

**AssetIcon:** Renders real TradingView logos. Single logo for metals (gold.svg, silver.svg) and crypto (XTVCBTC.svg, XTVCETH.svg), dual overlapping flag icons for forex pairs (EU+US, GB+US, US+JP, US+CH, AU+US, US+CA) matching TradingView's style.

**Currency Strength Meter** (`currency-strength-meter.tsx`): Full-width card section. Calculates real-time strength for 7 currencies (USD, EUR, GBP, JPY, CHF, AUD, CAD) by aggregating % changes across all 6 forex pairs. Base currency gets +change, quote gets -change. Sorted strongest to weakest with green/red gradient bars. Updates every 5s with live price data.

**Correlation Matrix** (`correlation-matrix.tsx`): Full-width risk overlay card. Shows a 10×10 matrix for all tracked assets, using a diverging red/neutral/green color scale with numeric labels in every cell. Positive values mean assets moved in the same direction over the selected historical window; negative values mean they moved opposite. Side callouts highlight the strongest same-direction exposure and strongest hedge relationship. Current implementation is live/statistical: `/api/correlation` fetches 3 months of Yahoo Finance daily closes, calculates daily returns, runs Pearson correlation for every pair, and refreshes on the frontend every 15 minutes. If Yahoo historical data fails, the UI falls back to preset relationship estimates (stored in the component) and labels the matrix as "Preset fallback".

**Position Size Calculator** (`position-size-calculator.tsx`): Implemented but temporarily hidden from the Overview as part of the beginner-focused simplification. The component remains intact for future restoration. Inputs: pair selector (all 10 assets), account size ($), risk %, entry price (with "use live" button to auto-fill from current market price), stop loss price. Outputs: position size (lots + units), risk amount ($), stop distance (pips), pip value per lot ($), potential loss ($). Uses pair-specific pip sizes (0.0001 for most forex, 0.01 for JPY pairs and metals, $1 for crypto) and contract sizes (100,000 for forex, 100 oz for gold, 5,000 oz for silver, 1 unit for crypto).

**Temporarily hidden Overview tools (July 25, 2026):** The Confluence Synthesizer, Position Size Calculator, AI Risk Score, Institutional Macro Bias Matrix, and Correlation Matrix/Risk Overlay are not rendered on the current beginner-focused Overview. Their underlying components, calculations, and data pipelines remain intact for future restoration. The Economic Calendar preview remains full-width. Live news and correlation fetching are currently preserved even while their Overview cards are hidden.

**Market Sessions Clock** (`market-sessions-clock.tsx`): Rendered directly in the focused Overview immediately after the Trade Safety Gate. Shows Tokyo (00:00–09:00 UTC), London (08:00–17:00 UTC), and New York (13:00–22:00 UTC) windows with UTC/local clocks and a 24-hour timeline. The former static Institutional Session Profiles were replaced with real hourly-candle metrics for the selected instrument: session high, low, range, completion state, and prior-session boundary sweep. Bitcoin is treated as a 24/7 market on weekends, with sessions labelled as liquidity windows rather than open/closed exchanges. Gold/EURUSD retain forex-weekend closure behavior. BTC and EUR/USD use matching spot-market candles; Gold session structure uses the explicitly labelled `GC=F` futures proxy because the free Gold spot endpoint does not provide intraday candles. If candle data fails, the UI shows unavailable instead of a fabricated session claim.

**Entry fill interaction:** The Verified Instrument card no longer displays visible provider/update/status lines. `Use current price as entry` now fills the risk-plan Entry input, smoothly scrolls to it, focuses/selects the value, and displays temporary confirmation text. Backend source, freshness, and fallback metadata remain active for Safety Gate decisions.

**TradingView Chart (`tradingview-chart.tsx`):** Free embedded TradingView Advanced Chart widget. Replaces the old basic bar chart. Features: candlestick chart with 15-minute default interval, RSI + Moving Average studies auto-loaded, side toolbar enabled, dark/light theme synced with dashboard, pair selector dropdown for all 10 assets. Symbol mapping: OANDA:XAUUSD, OANDA:XAGUSD, FX:EURUSD, FX:GBPUSD, FX:USDJPY, FX:USDCHF, FX:AUDUSD, FX:USDCAD, BINANCE:BTCUSDT, BINANCE:ETHUSDT. Script loaded dynamically via `useEffect` with singleton loading pattern to avoid duplicate script tags. **Bug fix (July 18):** `widget.remove()` calls wrapped in `try/catch` to prevent "Cannot read properties of null (reading 'parentNode')" crash when navigating away from the Overview page (TradingView's tv.js tried to access a container DOM node that React had already removed during navigation).

**Shared types (`types.ts`):** Centralized TypeScript types used across all components: `LiveAsset`, `NewsItem`, `CalendarEvent`, `CorrelationData`, `AnalysisResult`, `JournalReview`, `SavedTrade`, `ChartData`, `MarketOutlook`, `PatternResult`, `PriceAlert`.

**Asset icon + helpers (`asset-icon.tsx`):** Shared `AssetIcon` component (renders TradingView flag/crypto logos with pair overlay pattern), `LOGO_URLS` map with per-asset icon URLs, `nameMap` for display names, `formatPrice(symbol, price)` for pair-aware decimal formatting, and `timeAgo(pubDate)` for relative timestamps.

**Loading boundaries:** Each route segment (`/`, `/outlook`, `/patterns`, `/alerts`, `/news`, `/calendar`, `/journal`) has `loading.tsx` (Suspense fallback with animated skeleton UI) and `error.tsx` (error boundary with `unstable_retry` button). The global `src/app/loading.tsx` shows a 4-card skeleton matching the featured assets grid. Sub-page skeletons mirror their respective page layouts.

**Refactoring notes (July 15, 2026):**
- `page.tsx` reduced from ~1250 to ~350 lines by extracting 5 components
- Orphaned `/api/chart/route.ts` removed (data was never consumed — TradingView embed handles charting)
- `CORRELATION_PRESETS`, format helpers, and animation logic moved into respective component files
- Hardcoded animation delay classes (`animate-fade-up-delay-N`) partially replaced with inline `style={{ animationDelay }}` for dynamic item counts

**Bug fixes & new features (July 18, 2026):**
- **Turbopack root config fix:** `next.config.ts` now explicitly sets `turbopack.root` to project directory — stray `/home/nisarg/package-lock.json` was causing Turbopack to use wrong workspace root, breaking client-side navigation (manifest file empty, @swc/helpers module not found)
- **TradingView navigation crash fix:** `widget.remove()` calls in `tradingview-chart.tsx` wrapped in `try/catch` — TradingView's tv.js threw "Cannot read properties of null (reading 'parentNode')" during React cleanup when navigating away from Overview, escaping all error boundaries → "This page couldn't load"
- **3 new pages added:** `/outlook` (AI Daily Market Outlook), `/patterns` (AI Pattern Detection), `/alerts` (Smart Price Alerts)
- **2 new API routes:** `/api/outlook` (AgentRouter AI daily summary), `/api/patterns` (algorithmic pattern detection + AI notes)
- **Sidebar history:** Expanded from 4 to 8 items when Outlook, Patterns, Alerts, Journal, and Backtest were introduced; the current beginner-focused navigation intentionally exposes 5 items while `/alerts`, `/journal`, and `/backtest` remain directly accessible.
- **3 new types:** `MarketOutlook`, `PatternResult`, `PriceAlert` added to `types.ts`
- **AI provider split:** Groq for existing AI features (news, journal), AgentRouter for new AI features (outlook, patterns) — per user preference
- **Pattern Detection Yahoo symbol fix:** Changed `XAUUSD=X`/`XAGUSD=X` → `GC=F`/`SI=F` (futures) for historical data — Yahoo's chart API returns 404 for spot metal symbols
- **AI multi-provider fallback:** Both `/api/outlook` and `/api/patterns` now try AgentRouter first, then fall back to Groq — AgentRouter key was returning "unauthorized client detected", so Groq ensures AI features still work
- **Dashboard Information Hierarchy History:** The Confluence Synthesizer was previously promoted near the top as the "AI Confluence Verdict," with deeper tools and risk sections grouped below it. As of July 25, 2026, the Synthesizer, Position Size Calculator, and AI Risk Score are temporarily hidden from Overview to reduce beginner overload; their implementations remain intact.

- **Price Flash Effect:** Added Bloomberg/TradingView-style price flash — when a live price ticks up, the price cell briefly flashes green (emerald); when it ticks down, it flashes red. Uses `useRef` to track previous prices per asset, computes direction on each 5-second poll, applies a CSS `@keyframes flashUp`/`flashDown` animation, and clears after 1 second. Applied to both the 4 featured asset cards and the watchlist table. Added `tabular-nums` to featured card prices so digits stay aligned and the layout doesn't jitter when prices change.

- **Persistent Layout Sidebar:** Relocated the `<Sidebar />` component to `layout.tsx` to keep the navigation permanently mounted, preventing unmounting, layout shifts, or flickering on page routing.
- **Theme Switcher simplified:** Replaced the sliding toggle (left/right swipe) with a simple click-to-toggle icon button — shows a moon icon in light mode (click → dark) and a sun icon in dark mode (click → light). One click, instant switch, no swipe.

- **Theme Switcher anti-flash fix:** Refactored the theme switch knob translation to use Tailwind classes `translate-x-0 dark:translate-x-[28px]` rather than inline JS styles, aligning with the inline `<head>` script to prevent layout flashes on dark mode refreshes.
- **Dynamic Institutional Macro Bias Matrix:** Implemented live-news keyword scoring for USD, EUR, GBP, and Gold; the Overview card is currently hidden behind the reversible advanced-analysis visibility flag, while its calculation logic remains available for future restoration.
- **Proactive Economic News Warnings:** Added high-impact event window scanning that flashes warnings when a high-impact calendar event is scheduled within the next 60 minutes or occurred in the past 15 minutes.
- **Open Trade Correlation Alerts:** Integrated a pre-trade correlation lookup inside the Trade Journal that automatically scans active open positions and flags currency concentration risks before new trades are saved.
- **Outlook API Memory Optimization:** Replaced hardcoded localhost fetch loops inside `api/outlook/route.ts` with direct function imports and executions to support clean deployment and eliminate port conflicts.
- **Purity & React 19 Hydration Compliance:** Replaced all impure functions during render (like `Math.random` in keys and raw `Date.now` checks) with React-safe mappings and state/effect hooks. Cleaned up all ESLint warnings (switched to next/image unoptimized flags) and LCP issues.
- **Fx Ultimate Pine strategy compiler & Telegram dispatcher:** Ported the `Fx_Ultimate.pine` (v6) Pine Script indicator rules (EMA crossovers, RSI pullbacks, Scoring matrix, dynamic pivot swing detection, session breakouts, and ATR ranges) into TypeScript, creating a new `/api/strategy-signals` route.
- **Telegram Bot Configuration Panel:** Created a new tabbed UI inside `/alerts` page to configure Telegram bots, send test messages, save configurations in `localStorage`, and display a strategy HUD containing live calculated indicator values and alert triggers.
- **Confluence Synthesizer (4-Lane Verdict Engine):** Implemented a custom analyzer widget (`src/app/confluence-synthesizer.tsx`) on the home dashboard that combines Technical, Flow, Narrative, and Macro lanes into an aligned trade plan with stop-loss and take-profit targets (1:2 R:R). Removed the Live TradingView Chart card and expanded the Synthesizer to render at full-width.
- **Interactive PageShell Action Buttons:** Resolved usability defects in the global `<PageShell />` component header buttons (e.g., "Re-scan", "Refresh", "Add Trade"). Converted the hardcoded markup into dynamic trigger elements supporting `actionHref` redirects and custom `onActionClick` handler callbacks with `cursor-pointer` mouse states.
- **Fast-First AI Route Prioritization (Groq first):** Swapped model processing priority in the AI routes (`api/outlook/route.ts` and `api/patterns/route.ts`) to prioritize Groq (Llama 70B) first for near-instant 1-second load times, falling back to GitHub Models (GPT-4o) when limits are exceeded. Also enriched patterns route to track and output the active model provider.
- **Calendar data-integrity rebuild (July 26):** Removed the dynamic weekday-rolling sample calendar that could present fabricated Retail Sales, Jobless Claims, Fed speech, and GDP rows as upcoming releases. Calendar coverage now combines ForexFactory current-week events with official Federal Reserve FOMC dates and official BLS CPI/Employment schedules, with source/status labels and honest missing-value handling.
- **Pine Script AI Configurator & Custom Strategy Engine:** Created a visual code uploader and paste editor inside the Backtest page, supported by a server-side AI parsing endpoint (`/api/backtest/parse-pine`). This parses raw TradingView Pine Script strategy files, maps logic triggers to structured `RuleCondition` objects (`crosses_above`, `crosses_below`, etc.), and updates the backtesting simulator settings dynamically.
- **AI Virtual Trade Desk & Paper Trading Engine (August 1, 2026):** Completed the primary phases of the AI Virtual Trade Desk:
  - Created `/api/ai-prediction` providing structured SMC scanning (Trend, OB, FVG, sweep, IDM) and fundamental analysis.
  - Implemented `/api/history` intraday resampling (3m, 5m, 15m, 1h, 4h, 1d).
  - Created `<PredictionChart />` wrapping TradingView `lightweight-charts` with real-time price updates (5s ticks), and canvas overlay lines for entry, target (TP), stop-loss (SL), FVG boundaries, and OB zones.
  - Rebuilt PageShell layout: removed left sidebar, expanded workspace to fullscreen width (`w-full px-4 md:px-8`), set chart height to 550px, and integrated a horizontal top header navigation rebranded to "FX" logo.
  - Created client-side virtual trade tracker synchronizing orders in `localStorage` (`macromind-virtual-trades`), monitoring tick prices to trigger automated SL/TP hit exits with alerts.
  - Stabilized dev environment against Next.js Turbopack HMR socket interruptions using fetch fallbacks.
  - Created `/api/trade-postmortem/route.ts` which performs post-trade structural root-cause analysis and outputs actionable trading lessons.
  - Integrated the **AI Trade Journal & Postmortem Desk** section at the dashboard bottom to display closed trades with dynamic lesson cards.
  - Added **"Show on Chart"** triggers drawing historical trade levels back onto the lightweight-charts canvas.
  - Added **Self-Calibration Feedback Loops** transmitting the last 5 trade lessons as inputs to the AI Predictor system prompt to eliminate repeat errors.
  - Integrated **Groq Lighter Fallback** (`llama-3.1-8b-instant`) at Priority 3 to guarantee sub-second prediction speeds and bypass 70B token limits.
  - **Rebrand to AI Trade Audit & Review (August 2, 2026)**: Rebranded all occurrences of "Postmortem" to "Trade Audit" and "Trade Review" across UI copy, page layouts, route directories, and API endpoints (replacing `/api/trade-postmortem` with `/api/trade-audit`).
  - **Mathematical SMC & ICT Engine**: Programmed calculation formulas in `/api/ai-prediction` for Dealing Range (20-candle high/low), Equilibrium (50% Fibonacci mark), Premium/Discount zone coordinates, and Change in State of Delivery (CISD) shifts. Passed these to the LLM context and manual dashboard setup checklist.
  - **Multi-Symbol Background Monitor**: Refactored the dashboard trade ticker into an all-symbols loop checking open positions against live prices in the background, preventing background symbol trades from getting stuck.
  - **Economic Calendar fetchSafe Utility**: Created `fetchSafe` wrapper with `AbortSignal.timeout` to handle slow third-party calendar connections (like `www.bls.gov` timeouts) gracefully and prevent Next.js HMR console warning dumps.
  - **Offline Printable SMC Playbook**: Generated `smc_trading_playbook.html` containing visual red/green candle bodies, wicks, and annotations (BOS, CHOCH, CISD, OB, FVG, Equilibrium) with print stylesheets to ensure browser-printed PDFs format correctly.
  - **Lightweight-Charts Localization & Custom Crosshair**: Configured 12-hour AM/PM formatting for trade execution timestamps globally; localized Lightweight Charts timeline ticks and crosshair hover tooltips to the browser's local timezone; switched chart crosshair to Normal mode (`mode: 0`) and styled custom dotted track lines to replicate pixel-smooth TradingView tracing.
  - **Responsive Trade Journal Mobile Layout**: Redesigned the Trade Journal section using responsive layout containers: wraps the desktop view in a standard tabular view, and renders stacked card summary grids on mobile screens.
  - **Market Session Clocks & Volatility Overlap Timezone Tracker**: Added a real-time card widget on the right column tracking Tokyo, London, and New York session status, local/UTC clocks, and active overlaps, automatically localized based on the user's timezone (e.g. IST).
  - **Dynamic Trade Lot Sizing**: Integrated mathematical calculations mapping stop-loss distance and dollar risk to standard contract sizing lots (100 oz for Gold, 100k units for EUR/USD, 1 BTC unit for Bitcoin). Lot sizes are calculated on order entry and displayed across the Active Trade Card, desktop journal table, mobile journal card list, and Manual Risk Planner output grid.
  - **SMC Overlays Type-Safety Fix**: Refactored the `drawLine` chart helper in [`src/app/prediction-chart.tsx`](file:///home/nisarg/Desktop/ideas/macromind-fx/src/app/prediction-chart.tsx) to dynamically parse numeric strings (e.g. `"$2020.50"`) and nested objects (e.g. `{ price: 2020.50 }`) produced by the LLM response. Prevents browser-side lightweight-charts runtime level assertions.
  - **Codebase Audit & Clean-up**: Conducted a thorough codebase audit and cleaned up dead files, removing the deprecated `/api/trade-postmortem` endpoint folder and legacy scrap note files (`19-07.text`, `context.text`, `hide.text`, `CLAUDE.md`). Standalone inactive components (`confluence-synthesizer.tsx`, `currency-strength-meter.tsx`, `correlation-matrix.tsx`, `position-size-calculator.tsx`) were preserved for future restoration reference.
  - **Automated Sentinel Geopolitical Feed & LLM Integration (August 3, 2026)**: Created a zero-cost public Telegram scraper utility ([`src/app/lib/sentiment-scraper.ts`](file:///home/nisarg/Desktop/ideas/macromind-fx/src/app/lib/sentiment-scraper.ts)) that fetches static HTML views from ZeroHedge and ForexLive channels. Created the `/api/sentinel` endpoint for live polling, integrated the feed directly into `/api/ai-prediction` to parse rumors, and rendered a live scrolling sentiment ticker widget in the right column of the dashboard.
  - **Serverless Localhost Fetch Fix**: Refactored the `/api/ai-prediction` route to import and execute `getHistoricalCandles` directly on the server side instead of firing dynamic HTTP requests targeting `http://localhost/api/history`, resolving serverless environment routing bugs.
  - **Top-Down Multi-Timeframe Analysis (MTA)**: Upgraded the predictive system to fetch both Lower Timeframe (LTF) and Higher Timeframe (HTF) candles concurrently (e.g. 15m and 1h), executing EMA-based trend structure analysis on the HTF and entry confirmations on the LTF. Integrated HTF trend checks inside the LLM prompt and the dashboard safety checklist.
  - **Autonomous Server-Side Trades DB & 24/7 Monitoring**: Migrated trades history, balance, and autopilot settings from client-side `localStorage` to a server-side JSON file database (`data/trades-db.json`) mediated by a new `/api/trades` endpoint. Configured `/api/prices` to check open trades against live feed prices, executing autonomous closures (TP/SL) and triggering audits even if the user's browser is offline.
  - **Auto-Pilot Risk Circuit Breaker**: Programmed safety safeguards (max 3% daily drawdown or 3 consecutive losses today) to disable Auto-Pilot dynamically to protect capital. Restructured the consecutive losses validation to check only trades closed *today* rather than entire history, resolving a bug where the circuit breaker locked the toggle indefinitely. Added a matching alert banner to the dashboard UI.
  - **Timeframe Selector Persistence**: Wrapped selector handlers to save selected timeframe values in `localStorage` to prevent resets on switches or reloads.
  - **Server-Side History Integration & Infinite Loop Re-render Fix (August 5, 2026)**: Decoupled the client-side `getAIPrediction` callback from the `tradesList` state dependency, removing the `history` query parameter from the client fetch request. Re-routed `/api/ai-prediction` to read closed trades context directly from the server database (`data/trades-db.json`), resolving an infinite React rendering loop that triggered hundreds of concurrent requests on load, flickered the loading indicator continuously, and hammered LLM provider API rate limits.
  - **AI Provider Router Cleanup**: Cleaned up `src/app/api/ai-provider.ts` by removing the retired Hugging Face DeepSeek AWS public endpoint.
  - **Hybrid Storage Fallback Support**: Added dual-mode hybrid fallback support (`fallbackToLocalStorage`) across all virtual trade actions. If the backend `/api/trades` database write fails in read-only hosting environments (like Vercel), it reverts to the browser's `localStorage` to guarantee 100% button and order execution uptime.
  - **Statistical Outlier Price Filter**: Integrated a mathematical outlier-cleansing filter inside the historical candles route (`/api/history`) that checks price change ratios, wick heights, and previous-close jumps to automatically discard corrupt outlier wicks (gaps/spikes) from Yahoo Finance, producing a smooth institutional chart.
  - **Auto-Pilot Checklist Unlocking (August 6, 2026)**: Restructured the dashboard `setupChecks` array to bypass manual/interactive gates when `autoPilot` is enabled (ON). It now automatically passes the manual confirmation checkbox and neutral daily trend constraints, allowing the bot to place virtual trades autonomously.

### 2.9 TradingView Logo URLs

```typescript
"XAU/USD": "https://s3-symbol-logo.tradingview.com/metal/gold.svg"
"XAG/USD": "https://s3-symbol-logo.tradingview.com/metal/silver.svg"
"EUR/USD": "https://s3-symbol-logo.tradingview.com/country/EU.svg" + "US.svg"
"GBP/USD": "https://s3-symbol-logo.tradingview.com/country/GB.svg" + "US.svg"
"USD/JPY": "https://s3-symbol-logo.tradingview.com/country/US.svg" + "JP.svg"
"USD/CHF": "https://s3-symbol-logo.tradingview.com/country/US.svg" + "CH.svg"
"AUD/USD": "https://s3-symbol-logo.tradingview.com/country/AU.svg" + "US.svg"
"USD/CAD": "https://s3-symbol-logo.tradingview.com/country/US.svg" + "CA.svg"
"BTC/USD": "https://s3-symbol-logo.tradingview.com/crypto/XTVCBTC.svg"
"ETH/USD": "https://s3-symbol-logo.tradingview.com/crypto/XTVCETH.svg"
```

### 2.10 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.10 | App Router, API routes, SSR |
| react | 19.2.4 | UI framework |
| react-dom | 19.2.4 | DOM rendering |
| tailwindcss | ^4 | Utility-first CSS (v4 with @import) |
| typescript | ^5 | Type safety |
| eslint | ^9 | Code linting |
| eslint-config-next | 16.2.10 | Next.js lint rules |

### 2.11 Environment Variables

```
GROQ_API_KEY         ← Required for News AI + Trade Journal features (Groq API)
GROQ_MODEL           ← Optional: defaults to "llama-3.3-70b-versatile"
OPENAI_API_KEY       ← Required for AI Daily Outlook + Pattern Detection (AgentRouter/OpenAI-compatible)
AGENTROUTER_API_KEY  ← Alternative to OPENAI_API_KEY (same purpose)
AGENTROUTER_BASE_URL ← Optional: defaults to "https://agentrouter.org/v1"
AGENTROUTER_MODEL    ← Optional: defaults to "gpt-5.5"
```

**AI Provider usage:**
- **Groq** (`/api/analyze`, `/api/journal-review`) — for news sentiment analysis and trade review
- **AgentRouter/OpenAI-compatible** (`/api/outlook`, `/api/patterns`) — for daily outlook and pattern educational notes (per user preference, AgentRouter is the preferred provider for new AI features)

### 2.12 How to Run

```bash
cd /home/nisarg/Desktop/ideas/macromind-fx
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint
```

---

## 3. Project 2: Fx Ultimate — Multi-Platform Trading Strategy

**Location:** `/home/nisarg/Desktop/ideas/Fx`  
**Status:** Backtested and running live checks via cron  
**Asset:** XAUUSD (Gold) primarily  
**Three implementations:** Python, TradingView Pine Script, MetaTrader 5 EA

### 3.1 Overview

Fx Ultimate is a **multi-mode trading strategy** for XAUUSD (Gold) with 6 modes:

| Mode | Description | Best For |
|------|-------------|----------|
| **Multi** | Automatically picks between Smart/Simple/Trend based on signal strength | All-around trading |
| **Smart** | Tightest SL (0.8 ATR), needs strongest signals, % equity position sizing | Conservative entries |
| **Trend** | Wide SL (1.5 ATR), trailing stop (3.0 ATR), captures large moves | Trend following |
| **Simple** | Medium SL (1.0 ATR), fixed TP (8.0 ATR), 3 entry patterns | Balanced approach |
| **Scoring** | Multi-factor scoring (trend + zones + RSI + MACD + ADX), needs score ≥ 3 | High-conviction trades |
| **Low TF** | Lower timeframe entries, tight SL (0.6 ATR), quick TP (1.2 ATR) | Scalping |
| **Session** | London/NY/Asia session breakout, range-based entries, pip-based SL/TP | Session trading |

### 3.2 Technical Indicators Used

All modes use some combination of:
- **EMA 9, 21, 50, 200** — Trend direction and pullback levels
- **RSI (7 or 14)** — Oversold/overbought conditions
- **MACD (12, 26, 9)** — Momentum and crossover signals
- **ATR (14)** — Volatility-based stop losses
- **ADX (14)** — Trend strength filter (Scoring mode, threshold 20)
- **Pivot High/Low (10, 10)** — Support/resistance zone detection (Scoring mode)

### 3.3 Entry Patterns (Simple/Trend/Smart modes share these)

1. **Deep Pullback (RSI Oversold Bounce):** Price above EMA200 + RSI crosses up from below 30
2. **Shallow Pullback (EMA21 Touch):** Uptrend (EMA9 > EMA21 > EMA50, price > EMA200) + price touches near EMA21 + RSI > 50
3. **Trend Continuation (Breakout):** Uptrend (EMA9 > EMA21, price > EMA200) + price breaks above 5-bar high + RSI > 55

The **Multi mode** cascades through these patterns with progressively looser thresholds:
- Smart: RSI < 25, near_21 with RSI > 55, breakout with RSI > 60
- Simple: RSI < 30, near_21 with RSI > 50, breakout with RSI > 55
- Trend: RSI < 35, near_21 with RSI > 45, breakout with RSI > 50

### 3.4 Python Implementation

**Location:** `/home/nisarg/Desktop/ideas/Fx/fx_ultimate_python/`

**Files:**
- `fx_ultimate.py` (631 lines) — Core strategy + backtest runner + Telegram alerts
- `fx_ultimate_dashboard.py` — Streamlit web UI for interactive backtesting
- `requirements.txt` — Dependencies
- `fx_*_result.json` — Backtest results for each mode
- `fx_*_equity.png.html` — Equity curve HTML plots
- `cron.log` — Live check cron job logs

**Dependencies:**
```
backtesting>=0.5.0    ← Backtesting framework
yfinance>=0.2.0       ← Yahoo Finance data (GC=F gold futures)
requests>=2.0.0       ← Telegram API
pandas>=1.0.0
numpy>=1.20.0
matplotlib>=3.0.0
```

**Data Source:** Yahoo Finance (`GC=F` — Gold Futures), auto-resampled to 4h from 1h data. Can also accept CSV files via `--file` flag.

**Backtest Results (XAUUSD 4h, ~2 years 2024-2026):**

| Mode | Return | Max DD | Trades | Win Rate | Profit Factor | Sharpe |
|------|--------|--------|--------|----------|---------------|--------|
| **Simple** | 36.71% | -12.36% | 63 | 25.40% | 2.04 | 1.20 |
| **Smart** | 15.11% | -5.66% | 120 | 29.17% | 1.59 | 0.96 |
| **Trend** | 5.27% | -16.46% | 136 | 38.97% | 1.12 | 0.19 |
| **Multi** | 23.77% | -9.61% | 105 | 30.48% | 1.71 | 1.10 |
| **Session** | 0.00% | 0.00% | 0 | N/A | N/A | N/A |

**Key observations:**
- Simple mode has the best risk-adjusted returns (Sharpe 1.20, PF 2.04) despite low win rate (25.4%) — large TP (8 ATR) catches big moves
- Smart mode has the lowest drawdown (-5.66%) — tight SL and selective entries
- Multi mode is the best all-rounder (Sharpe 1.10, DD -9.61%, PF 1.71)
- Session mode produced 0 trades in this period — likely needs parameter tuning or different market conditions
- Buy & Hold returned 74.7% in the same period — strategies are conservative/profitable but trail buy-and-hold

**CLI Usage:**
```bash
# Run single mode backtest
python3 fx_ultimate.py --mode Multi

# Compare all modes
python3 fx_ultimate.py --compare

# Live signal check (checks if a trade signal exists in last 5 bars)
python3 fx_ultimate.py --mode Multi --live --bot-token TOKEN --chat-id ID

# Use custom CSV data
python3 fx_ultimate.py --mode Simple --file data.csv --tf 4h

# Date range
python3 fx_ultimate.py --mode Multi --from 2024-06-28 --to 2026-06-26
```

**Streamlit Dashboard:**
```bash
streamlit run fx_ultimate_dashboard.py
```
Features:
- Sidebar with mode selector, timeframe, date range, strategy params (sliders)
- Candlestick chart with EMA overlays + buy/sell markers
- Volume bars
- Equity curve (Plotly)
- Trade table with CSV export
- Telegram test button
- Key metrics: Return, Drawdown, Trades, Win Rate, PF, Sharpe

**Telegram Integration:**
- Sends alerts on live trade signals: "FxUltimate | BUY Multi\n2026-05-12 12:00\nPrice: $2365.40"
- Configurable via `--bot-token` and `--chat-id` flags or `TG_BOT` / `TG_CHAT` env vars
- `--test-telegram` flag sends a test message

**Cron Job:**
The `cron.log` shows regular live checks running in Multi mode. Each run:
1. Loads ~3100 bars from Yahoo Finance
2. Runs full backtest
3. Checks if any trade signal exists in the last 5 bars
4. Reports results: "~100-105 trades, ~23-24% return, DD -9.6%, PF ~1.7"
5. Last signal was on 2026-05-12 12:00 — no recent signals as of July 2026

### 3.5 TradingView Pine Script Implementation

**Location:** `/home/nisarg/Desktop/ideas/Fx/FxTrader/Fx_Ultimate.pine`  
**Language:** Pine Script v6  
**Type:** Strategy (not indicator)

Implements 4 modes: Simple, Scoring, Low TF, Session.

**Key features:**
- Mode selector input
- All indicators computed: EMA 9/21/50/200, ADX, RSI, MACD, ATR
- Pivot-based support/resistance zones (Scoring mode)
- Session range tracking with breakout entries (Session mode)
- ATR-based or pip-based SL/TP depending on mode
- Trailing stop for Session mode (activates at 50 pips profit, 30-pip step)
- Visual: BUY/SELL labels, zone markers, session background highlights, session range lines
- Info table (top-right): mode, trend, score, RSI, ADX, trades, net profit
- Alert conditions: `{{ticker}}|BUY` and `{{ticker}}|SELL`
- Default params: 10% equity per trade, 0.04% commission, 2 slippage

### 3.6 MetaTrader 5 EA Implementation

**Location:** `/home/nisarg/Desktop/ideas/Fx/MQL5_Strategy/Fx_Ultimate_EA.mq5`  
**Language:** MQL5  
**Type:** Expert Advisor

**Key features:**
- 4 modes: Simple, Scoring, Low TF, Session (enum `ENUM_EA_MODE`)
- Uses standard MQL5 trade library (`CTrade`, `CPositionInfo`, etc.)
- All indicators created in `OnInit()`: iMA, iADX, iRSI, iMACD, iATR
- New-bar detection (only processes on bar close)
- Buffer copying for indicator values
- Pivot high/low detection functions
- Session tracking with range building and breakout entries
- Position management with trailing stops (Session mode)
- Built-in Telegram alerts via WebRequest
- URL encoding for Telegram API
- Input parameters for all strategy settings (lot size, SL/TP multipliers, session configs, Telegram credentials)

**Input groups:**
- Mode Selection
- Simple / Scoring params (TP/SL multipliers, ADX threshold, session filter, zone display)
- Low TF params (TP/SL multipliers)
- Session Trader params (pips, trailing, range hours, London/NY/Asia toggles)
- Money Management (lot size)
- Telegram (bot token, chat ID)

---

## 4. Project 3: Design Fetcher — Website Design Token Extractor

**Location:** `/home/nisarg/Desktop/ideas/Desing_Fetcher`  
**Status:** In Progress (Phase 2 complete, Phase 3-4 pending)  
**Tech Stack:** Node.js, Express, Puppeteer

### 4.1 What It Is

A tool that takes any website URL and generates a comprehensive `DESIGN.md` file containing:
- **Design tokens:** Colors (background, text, border), typography (font families, sizes, weights, line heights), spacing (padding, gap), border radius, box shadows, layout patterns (display types)
- **CSS custom properties:** All `--variable` values from stylesheets
- **Layout structure:** DOM tree hierarchy with component detection
- **Component detection:** Nav bars, sidebars, tables (native + div-based), cards, tabs, forms, lists, modals, footers
- **Grid detection:** CSS grid patterns with column counts, gaps, widths
- **Interactive element exploration:** Auto-clicks tabs, accordions, dropdowns (up to 60 elements) to reveal hidden content

### 4.2 Architecture

```
Desing_Fetcher/
├── extractor.js     ← Core engine (647 lines)
│   ├── exploreInteractions()  — Auto-clicks interactive elements
│   └── extractDesign()        — Main extraction function
│       ├── Design tokens      — Colors, fonts, spacing, shapes, shadows
│       ├── CSS vars           — Custom properties from stylesheets
│       ├── Structure          — DOM tree walker with component detection
│       └── Grid detection     — CSS grid patterns
├── server.js         ← Express API + Markdown generator (328 lines)
│   ├── POST /api/extract      — Takes { url }, returns { markdown, data }
│   └── generateMarkdown()     — Converts extracted data to formatted DESIGN.md
├── public/
│   └── index.html   ← Frontend UI (Claude-inspired design)
├── DESIGN.md         ← Sample output: Claude.com design system
├── MDL.md            ← Sample output: Beast Procure (MDLBEAST procurement platform)
├── work_done.md      ← Progress tracker
└── package.json      ← express ^4.18.2, puppeteer ^22.0.0
```

### 4.3 How It Works

1. **Launch Puppeteer** (headless Chrome) with `--no-sandbox` flags
2. **Navigate to URL**, wait for `load` event + 5s settle + network idle
3. **Explore interactions:** Auto-click up to 60 interactive elements (buttons, tabs, accordions, dropdowns) across 3 rounds, skipping dangerous actions (delete, logout, etc.)
4. **Extract design tokens:** Walk all DOM elements, compute styles, aggregate by frequency
5. **Extract CSS custom properties:** Iterate all stylesheet rules, collect `--variable` declarations
6. **Extract structure:** Walk DOM tree (max depth 6), detect components at each level
7. **Detect grids:** Find all CSS grid containers with column counts
8. **Generate markdown:** Format everything into a structured DESIGN.md

### 4.4 Component Detection Logic

| Component | Detection Method |
|-----------|-----------------|
| **Sidebar** | `<aside>`, `role="complementary"`, `role="navigation"`, class contains "sidebar" |
| **Nav bar** | `<nav>`, `<header>`, `role="navigation"`, class contains "navbar" |
| **Table** | `<table>`, `role="table"`, `role="grid"`, or div-based with repeating row patterns (≥3 cols, ≥2 rows) |
| **Card** | Width 80-900px, has border-radius ≥4px or shadow or border or distinct background |
| **Tabs** | Multiple `[role="tab"]` elements |
| **Form** | `<form>`, `<input>`, `role="search"`, class contains "form" |
| **List** | `<ul>`, `<ol>`, `role="list"` with >1 children |
| **Modal** | `role="dialog"`, `<dialog>`, class contains "modal"/"dialog" |
| **Footer** | `<footer>`, class contains "footer" |

### 4.5 Sample Output: Claude.com Design System (DESIGN.md)

The extracted Claude.com design system includes:
- **Version:** alpha
- **Primary color:** `#cc785c` (warm coral — Anthropic's signature)
- **Canvas:** `#faf9f5` (tinted cream)
- **Ink:** `#141413` (warm dark)
- **Typography:** Copernicus/Tiempos Headline (serif display) + StyreneB/Inter (sans body) + JetBrains Mono (code)
- **Display sizes:** 64px → 28px (serif, weight 400, negative letter-spacing)
- **Border radius scale:** 4px → 16px + pill (9999px)
- **Spacing system:** 4px base, up to 96px sections
- **19 component definitions:** button-primary, button-secondary, feature-card, code-window-card, pricing-tier-card, etc.
- **Three surface modes:** cream canvas, light cream cards, dark navy product surfaces

### 4.6 Sample Output: Beast Procure (MDL.md)

Extracted from `https://beastprocurev1.lovable.app/`:
- SAP-style procurement interface for MDLBEAST
- 1440×2025px layout
- Inter font (588 elements) + JetBrains Mono (159 elements)
- Dark theme with `oklch()` color values
- 36 CSS custom properties including `--radius`, `--background`, `--chart-1` through `--chart-5`
- Grid layouts: 2-7 columns with various gaps
- Title bar with MDLBEAST branding, navigation buttons, command input

### 4.7 Known Issues (from work_done.md)

**Fixed in v2.1:**
- Sidebar detection (`<aside>` now detected properly)
- Border-radius scientific notation (3.35544e+07px → 9999px)
- Card radius fallback (checks children if parent has 0px)
- Div-based table detection
- Section naming (uses aria-label, title, first heading)
- Page load reliability (switched from `networkidle0` to `load`)

**Remaining:**
- Text concatenation in parent containers still messy
- List detection too aggressive (flex containers flagged as lists)
- Approval Queue table not detected
- KPI cards grouped as single card instead of individual
- Some generic "div" labels remain
- Server memory issues (Puppeteer crashes after 1-2 extractions on low-memory machines)

### 4.8 How to Run

```bash
cd /home/nisarg/Desktop/ideas/Desing_Fetcher
npm install
npm start          # or: node server.js
# Open http://localhost:3000
# POST /api/extract with { "url": "https://example.com" }
```

---

## 5. Project 4: P2P File Share — Browser-Based File Transfer

**Location:** `/home/nisarg/Desktop/ideas/project-plan.md` (planning document only)  
**Status:** Planning phase — no code yet  

### 5.1 What It Is

A browser-based P2P (peer-to-peer) file sharing website where files transfer directly from one browser to another **without uploading to any server**. Uses WebRTC DataChannel for encrypted, direct browser-to-browser file transfer.

### 5.2 Problem It Solves

File transfer between devices currently requires WhatsApp (compresses quality), Google Drive (slow, size limits), or email (size limits). P2P sharing has none of these constraints — files go directly, encrypted, with no intermediary.

### 5.3 How It Works (WebRTC Flow)

```
Sender Browser                 Receiver Browser
     |                              |
     |  1. Room Create / Code      |
     |---------------------------->|
     |     (Signaling Server)       |
     |                              |
     |  2. WebRTC Handshake         |
     |<--------------------------->|
     |                              |
     |  3. Direct P2P Connection    |
     |    (STUN/TURN NAT Traversal) |
     |<===========================>|
     |                              |
     |  4. File Stream (64KB chunks)|
     |    encrypted via DTLS        |
     |=============================>|
```

### 5.4 Tech Stack (Planned)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + React + Tailwind CSS |
| Signaling | Metered.ca Realtime Messaging (free managed, no backend) |
| STUN | Google Public STUN (free): `stun:stun.l.google.com:19302` |
| TURN | Metered Open Relay / ExpressTURN / freeTURN (free tiers) |
| Hosting | Vercel (free `.vercel.app` subdomain) |
| Domain | GitHub Student Pack — `.me` / `.dev` / `.app` (1 year free) |

### 5.5 Free Resources Documented

**Hosting:** Vercel, Netlify, Cloudflare Pages, Render  
**Domains (GitHub Student Pack):**
- Namecheap: `.me` domain (1 year free, payment method required for ICANN, no charge)
- Name.com: `.dev`, `.app`, `.live`, `.studio`, `.codes`, `.ninja`, etc. (1 year free)
- .TECH Domain: `.tech` (1 year free)

**STUN/TURN (Free):**
| Service | Limit |
|---------|-------|
| Google STUN | Unlimited |
| freeTURN.net | 2 MBit/s, unlimited traffic |
| ExpressTURN | 1000 GB/month free |
| Metered Open Relay | 20 GB/month free |

### 5.6 Planned File Structure

```
p2p-share/
├── pages/
│   ├── index.js          → Home (file select + room create)
│   ├── room/[id].js      → Room (receiver joins)
├── components/
│   ├── FileDrop.js       → Drag & drop zone
│   ├── ProgressBar.js    → Transfer progress + speed
│   ├── QRCode.js         → QR code for easy sharing
│   └── Navbar.js
├── lib/
│   └── webrtc.js         → WebRTC + Metered setup
├── styles/
│   └── globals.css
└── public/
```

### 5.7 Implementation Phases

| Phase | Work | Status |
|-------|------|--------|
| Phase 1 | Next.js project setup + basic UI | Pending |
| Phase 2 | Metered.ca WebRTC integration + P2P connection | Pending |
| Phase 3 | File chunking + transfer + progress bar | Pending |
| Phase 4 | Polish UI + QR code + mobile responsive | Pending |
| Phase 5 | Deploy to Vercel | Pending |
| Phase 6 | Custom domain via GitHub Student Pack | Future |

---

## 6. Research: Free Financial/Forex News API Analysis

**Location:** `/home/nisarg/Desktop/ideas/news-api-analysis.md`  
**Date:** July 11, 2026

### 6.1 Summary

Tested 7+ news APIs and RSS feed combinations for the MacroMind FX forex dashboard. Results ranked by suitability:

### 6.2 Tier 1 — Best Options (Recommended)

**1. Yahoo Finance RSS + rss2json (BEST — No Key Required)**
- Cost: FREE unlimited
- Approach: Yahoo Finance symbol-specific RSS feeds → rss2json.com → JSON
- No API key needed for either Yahoo or rss2json
- 10K requests/day on rss2json free tier
- Available feeds: EURUSD=X, GBPUSD=X, USDJPY=X, USDCAD=X, GC=F (Gold), SI=F (Silver), ^DJI, ^GSPC, ^IXIC, etc.
- Fields per article: title, pubDate, link, guid, author, thumbnail, description, content, enclosure, categories
- ~10-20 items per feed, real-time updates

**2. Investing.com RSS + rss2json (No Key Required)**
- Feeds: `news_1.rss` (Forex), `news_25.rss` (Economic), `news_28.rss` (Crypto), `news_89.rss` (Commodities)
- Blocks CORS — must fetch server-side
- No description/summary in RSS (just title + link)

### 6.3 Tier 2 — Good Options (Free Key Required)

**3. Finnhub.io**
- Free tier: 60 API calls/minute
- Dedicated forex category (`category=forex`)
- Fields: category, datetime, headline, id, image, related (symbols), source, summary, url
- Summary field is great for AI analysis

**4. MarketAux**
- Free tier: 100 requests/day, 3 articles per request
- **Built-in sentiment scores** (-1 to +1) per entity
- Entity extraction, highlights with per-highlight sentiment
- Forex-specific filtering via symbols + entity_types
- Best for AI analysis but limited quota

**5. GNews.io**
- Free tier: 100 requests/day, 10 articles per request, **12-hour delay**
- Boolean search operators (forex OR "foreign exchange" OR currency)
- Full content field (not just summary)

### 6.4 Tier 3 — Limited / Not Recommended

**6. NewsAPI.org** — 24-hour delay, free tier explicitly prohibits production use  
**7. Newscatcher API** — Limited free tier, couldn't fully test  
**8. Reddit r/Forex JSON** — 403 blocked, requires OAuth

### 6.5 Recommended Architecture for MacroMind FX

1. **Primary (no key):** Yahoo Finance RSS + rss2json — fetch 10+ symbol feeds, merge, deduplicate, refresh every 5-10 minutes
2. **Enhancement (free key):** Finnhub forex news — clean summaries for AI analyzer input
3. **Sentiment (free key):** MarketAux — pre-computed sentiment scores (use sparingly, 100 req/day)

### 6.6 Comparison Table

| API | Key | Free Limit | Forex Filter | Summary | Sentiment | Real-time |
|-----|-----|-----------|-------------|---------|-----------|-----------|
| Yahoo RSS | NO | 10K/day | Per-symbol | Yes | No | Yes |
| Investing.com RSS | NO | Unlimited | Yes | No | No | Yes |
| Finnhub | YES | 60/min | Yes | Yes | No | Yes |
| MarketAux | YES | 100/day | Yes | Yes | YES | Yes |
| GNews | YES | 100/day | Keyword | Yes | No | 12h delay |
| NewsAPI | YES | 100/day | Business | Yes | No | 24h delay |

---

## 7. Qwen Configuration

**Location:** `/home/nisarg/Desktop/ideas/.qwen/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Skill(new-app)",
      "Bash(npx *)",
      "Bash(npm run *)",
      "Bash(do)",
      "Bash(curl *)",
      "Bash(python3 *)",
      "Bash(done)",
      "Agent(general-purpose)"
    ]
  },
  "$version": 4
}
```

### 7.1 Custom Skills

The workspace has 3 custom project skills:

1. **free-market-data-fallback** — Key-free, rate-limit-free forex/gold/silver price data, real TradingView logos, and Yahoo Finance RSS news for Next.js forex dashboards
2. **nextjs-mvp-scaffold** — Scaffold a Next.js MVP non-interactively, avoiding common create-next-app CLI stalls
3. **warm-minimal-ux-redesign** — Apply a warm, Claude.ai-inspired design system to a Next.js + Tailwind v4 app using CSS custom properties, animations, and clean dark mode overrides

---

## 8. Resume/Session Files

Several `resume.text` files exist across the workspace. These contain session tokens for resuming previous AI coding sessions (OpenCode/Qwen):

| File | Content |
|------|---------|
| `/home/nisarg/Desktop/ideas/resume.text` | `opencode -s ses_162aa5063ffeTKPNd7N1q7QUh4` |
| `/home/nisarg/Desktop/ideas/Desing_Fetcher/resume.text` | `opencode -s ses_0d9eee011ffewy7FbpE9VPbPx2` |
| `/home/nisarg/Desktop/ideas/Fx/FxTrader/resume.text` | `opencode -s ses_11b7f741cffeRj8rPJ2F4DnMdP` |
| `/home/nisarg/Desktop/ideas/macromind-fx/resume.text` | `qwen --resume 6880308f-b8a7-49e0-a9f4-61015b4384d9` |

---

## Summary: Project Status at a Glance

| Project | Type | Status | Key Achievement |
|---------|------|--------|-----------------|
| **MacroMind FX** | Next.js trade-safety assistant | 🟢 Active | Rebranded trade audits, mathematical Premium/Discount & CISD zone filters, safe calendar timeouts, local timezone charts & clocks overlap tracker, and responsive mobile trade journal cards |
| **Fx Ultimate** | Trading strategy (3 platforms) | 🟡 Running | Backtested 6 modes on Python, deployed Pine Script on TradingView, MQL5 EA for MT5 |
| **Design Fetcher** | Design extraction tool | 🟡 In Progress | Working extraction with Puppeteer, known issues being tracked |
| **P2P File Share** | WebRTC file transfer | 🔴 Planning | Full plan documented, no code yet |
| **News API Research** | Research document | ✅ Complete | 7+ APIs tested, recommended architecture documented |

---

*This document was compiled on August 2, 2026 by aggregating all files in the workspace. It serves as a living reference — update it as projects evolve.*
