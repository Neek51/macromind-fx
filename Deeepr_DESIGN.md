---
version: alpha
name: Deeepr.ai — Crypto Trading Intelligence
description: Extracted design system from https://deeepr.ai/
colors:
  primary: "#e5e7eb"
  secondary: "#d4d4d8"
  canvas: "#06b6d4"
  surface-card: "#0a1424"
  ink: "#d4d4d8"
  body: "#f4f4f5"
  border: "#e5e7eb"
typography:
  fontFamily: "Geist Mono"
  fontSizes:
    - "13px"
    - "16px"
    - "12px"
    - "9px"
    - "11px"
rounded:
  r-6: "6px"
  r-12: "12px"
  r-9999: "9999px"
  r-16: "16px"
spacing-gap:
  gap-8: "8px"
  gap-12: "12px"
  gap-10: "10px"
  gap-4: "4px"
---

# Design System — Deeepr.ai — Crypto Trading Intelligence

> Extracted from [https://deeepr.ai/](https://deeepr.ai/)
> Real-time market intelligence. Detect signals before the market reacts.

## Interaction & Navigation Flows

This site operates as a Single Page Application (SPA). Below is the mapping of navigation routes to their loaded view structures:

| Route / URL | View Title | Key Visual Components Loaded |
| --- | --- | --- |
| `/` | Deeepr.ai — Crypto Trading Intelligence | Info Card, Table with columns (T Technical Lane, BULL · tier HIGH, Above EMA200 · RSI 58 · MACD b...), Table with columns (T, Technical Lane), Table with columns (F, Flow Lane), Table with columns (N, Narrative Lane), Table with columns (M, Macro Lane), Table with columns (Feature, Free ₹0, Trader ₹999/mo, Pro ₹1,499/mo, Quant ₹2,499/mo), Table with columns (DEEEPR .AI Crypto trading inte..., Legal Terms Privacy Refund pol...), Table with columns (DEEEPR .AI, Crypto trading intelligence. N...) |
| `/auth/login` | Deeepr.ai — Crypto Trading Intelligence | Info Card, Form with fields (email, password), Form with fields (inputs) |
| `/auth/signup` | Deeepr.ai — Crypto Trading Intelligence | Info Card, Form with fields (How should we greet you?, you@example.com, 12+ chars with letters, numbers & symbols, e.g. 9YTPU5, checkbox), Form with fields (inputs) |
| `/terms` | Terms of Use · Deeepr.ai | Menu Navigation Bar, Table with columns (Introduction, Please read these Terms of Use...) |
| `/privacy` | Privacy Policy · Deeepr.ai | Menu Navigation Bar, Table with columns (Introduction, Please read this privacy polic...) |
| `/refund` | Refund & Cancellation Policy · Deeepr.ai | Menu Navigation Bar, Table with columns (Introduction, Please read this Refund and Ca...) |

---

## Interaction Map (Deep Crawl)

This section documents what happens when each interactive element is clicked.
Interactions are grouped by depth level. Click paths show the exact sequence of
clicks from the homepage needed to reach each view.

### Level 0 — Main Navigation (Sidebar / Navbar)

#### Click: "DEEEPR.AI" (navbar a)
- **Navigation**: Content updates in-place (no URL change)
- **View Title**: The market runs deep.
- **Sub-headings**: Live news, geolocated., Four lanes read the market., Then they argue, and agree., Signal sent the moment your setup fires., Ask. Get answers, not noise., Whale moves, ETF flows, liquidations., What if BTC drops 5% in an hour?
- **Table**: Columns: `Feature` | `Free₹0` | `Trader₹999/mo` | `Pro₹1,499/mo` | `Quant₹2,499/mo` (12 data rows)
- **Content Links**: Start free→, Sign in, Start free →, Choose Trader →, Go Pro →, Choose Quant →, Create your account→, Already have an account

#### Click: "Sign in" (navbar a)
- **Navigation**: Route changes to `/auth/login`
- **View Title**: Welcome back
- **Form Fields**: Email, Password
- **Available Buttons**: Log in

#### Click: "Start free" (navbar a)
- **Navigation**: Route changes to `/auth/signup`
- **View Title**: Create your account
- **Checkboxes**: [ ] I agree to the Terms of Use and Privacy ...
- **Form Fields**: Name, Email, Password, Referral code (optional), I agree to the Terms of Use and Privacy ...
- **Available Buttons**: Create account

#### Click: "$82,014" (content div)
- **Navigation**: Content updates in-place (no URL change)
- **View Title**: The market runs deep.
- **Sub-headings**: Live news, geolocated., Four lanes read the market., Then they argue, and agree., Signal sent the moment your setup fires., Ask. Get answers, not noise., Whale moves, ETF flows, liquidations., What if BTC drops 5% in an hour?
- **Table**: Columns: `Feature` | `Free₹0` | `Trader₹999/mo` | `Pro₹1,499/mo` | `Quant₹2,499/mo` (12 data rows)
- **Content Links**: Start free→, Sign in, Start free →, Choose Trader →, Go Pro →, Choose Quant →, Create your account→, Already have an account

#### Click: "Start free →" (content a)
- **Navigation**: Content updates in-place (no URL change)
- **View Title**: The market runs deep.
- **Sub-headings**: Live news, geolocated., Four lanes read the market., Then they argue, and agree., Signal sent the moment your setup fires., Ask. Get answers, not noise., Whale moves, ETF flows, liquidations., What if BTC drops 5% in an hour?
- **Table**: Columns: `Feature` | `Free₹0` | `Trader₹999/mo` | `Pro₹1,499/mo` | `Quant₹2,499/mo` (12 data rows)
- **Content Links**: Start free→, Sign in, Start free →, Choose Trader →, Go Pro →, Choose Quant →, Create your account→, Already have an account

### Level 1 — Sub-Views (Tabs, Wizard Steps, Panels)

#### Click Path: "Sign in" → "Forgot password?"
- **Navigation**: Route changes to `/auth/forgot-password`
- **View Title**: Forgot password?
- **Form Fields**: Email
- **Available Buttons**: Send reset link

#### Click Path: "Sign in" → "Refund"
- **Navigation**: Route changes to `/refund`
- **View Title**: Refund & Cancellation Policy
- **Sub-headings**: Introduction, 1. General Policy, 2. Subscription Plans and Billing, 3. Cancellation of Subscription, 4. Free Trials, Promotional Access, and Beta Features, 5. Payment Failures and Chargebacks, 6. Service Modifications and Availability
- **Content Links**: Terms of Use, Privacy Policy, info@deeepr.ai, Back to app

### Level 2 — Deep Content (Records, Forms, Details)

#### Click Path: "Sign in" → "Refund" → "Terms of Use"
- **Navigation**: Route changes to `/terms`
- **View Title**: Terms of Use
- **Sub-headings**: Introduction, 3. The Present Agreement, 4. Definitions, 5. Nature of the Platform, 6. No Financial Advice / No Investment Advisory Relationship, 7. No Guaranteed Returns / No Claim of Performance, 8. Risk Disclosure and Crypto-Asset Volatility Disclaimer
- **Content Links**: Privacy Policy, Refund/Cancellation Policy, info@deeepr.ai, Back to app

#### Click Path: "Sign in" → "Refund" → "Privacy Policy"
- **Navigation**: Route changes to `/privacy`
- **View Title**: Privacy Policy
- **Sub-headings**: Introduction, 4. Definitions, 5. Information We Collect, 6. Cookies, 7. How We Use and Share the Information Collected, 8. Your Choices, 9. Your Rights
- **Content Links**: Terms of Use, account settings, info@deeepr.ai, Back to app

---

## Layout Structure (Multi-Page Crawl)

### Page: Deeepr.ai — Crypto Trading Intelligence
> URL: [https://deeepr.ai/](https://deeepr.ai/)

  ### scroll-smooth
  - **Tag:** `<div>`
  - **Size:** 1440 × 13476px
  - **Background:** `#03060f`

    ### The market runs deep. Every market move has a caus…
    - **Tag:** `<main>`
    - **Size:** 1440 × 13168px
    - **Text:** "The market runs deep. Every market move has a cause. Most tr..."

      ### The market runs deep. Every market move has a caus…
      - **Tag:** `<section>`
      - **Size:** 1440 × 10800px
      - **Text:** "The market runs deep. Every market move has a cause. Most tr..."

        ### div
        - **Tag:** `<div>`
        - **Size:** 1440 × 900px
        - **Repeats:** 13× (div)
        - **(13x repeated)**

          ### div
          - **Tag:** `<div>`
          - **Size:** 1440 × 900px

            ### div
            - **Tag:** `<div>`
            - **Size:** 1440 × 900px

            ### div
            - **Tag:** `<div>`
            - **Size:** 1440 × 900px

          ### canvas
          - **Tag:** `<canvas>`
          - **Size:** 1440 × 900px

          ### The market runs deep.
          - **Tag:** `<div>`
          - **Size:** 1440 × 900px

            ### The market runs
            - **Tag:** `<h1>`
            - **Size:** 1392 × 76px

            ### deep.
            - **Tag:** `<span>`
            - **Size:** 229 × 93px

            ### Every market move has a cause. Most traders only s…
            - **Tag:** `<p>`
            - **Size:** 672 × 55px
            - **Text:** "Every market move has a cause. Most traders only see the effect. You'll see both."

          ### div
          - **Tag:** `<div>`
          - **Layout:** display: flex, flex-direction: row
          - **Size:** 152 × 28px

            ### animate-bounce
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: column

            ### from-cyan-400/50
            - **Tag:** `<div>`

            ### svg
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### scroll to descend
            - **Tag:** `<span>`

          ### Live news, geolocated.
          - **Tag:** `<div>`
          - **Size:** 1440 × 900px

            ### Live news, geolocated.
            - **Tag:** `<div>`
            - **Size:** 1440 × 87px

            ### mb-3
            - **Tag:** `<div>`
            - **Layout:** display: inline-flex
            - **Size:** 128 × 25px
            - **Background:** `#06b6d4`

            ### animate-pulse
            - **Tag:** `<span>`
            - **Background:** `#22d3ee`

            ### Earth Radar
            - **Tag:** `<span>`

            ### Live news,
            - **Tag:** `<h2>`
            - **Size:** 1392 × 48px

            ### geolocated.
            - **Tag:** `<span>`
            - **Size:** 307 × 56px

            ### Card: Mumbai · India 12m ago RBI cla...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 300 × 133px
            - **Content:** Mumbai · India 12m ago RBI cla...
            - **Border radius:** 12px
            - **Text:** "Mumbai · India 12m ago RBI clarifies crypto tax treatment — ..."

            ### Card: Mumbai · India 12m ago · RBI clarifies crypto tax treat... · bullish · INR markets 5 connec...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 300 × 133px
            - **Background:** `#0a1424`
            - **Content:** Mumbai · India 12m ago | RBI clarifies crypto tax treat... | bullish · INR markets 5 connec...
            - **Border radius:** 12px

            ### mb-2.5
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### animate-pulse
            - **Tag:** `<span>`
            - **Background:** `#34d399`

            ### Mumbai · India
            - **Tag:** `<span>`

            ### 12m ago
            - **Tag:** `<span>`

            ### mb-3
            - **Tag:** `<div>`
            - **Size:** 266 × 50px
            - **Text:** "RBI clarifies crypto tax treatment — flat 30% on capital gains stays, TDS deduction simplified."

            ### bullish · INR markets
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### · INR markets
            - **Tag:** `<span>`

            ### bullish
            - **Tag:** `<span>`

            ### 5 connected
            - **Tag:** `<span>`

          ### Four lanes read the market.
          - **Tag:** `<div>`
          - **Size:** 835 × 474px

            ### The pipeline
            - **Tag:** `<div>`

            ### Four lanes read
            - **Tag:** `<h2>`
            - **Size:** 696 × 101px

            ### the market.
            - **Tag:** `<span>`
            - **Size:** 531 × 106px

            ### mb-7
            - **Tag:** `<p>`
            - **Size:** 448 × 46px
            - **Text:** "Each lane forms its own bias independently. No echo chamber."

            ### Table: T Technical Lane | BULL · tier HIGH | Above EMA200 · RSI 58 · MACD b... …
            - **Tag:** `<div>` | **Type:** `table`
            - **Layout:** display: grid, grid: 218px 218px, gap: 12px
            - **Size:** 448 × 249px
            - **Columns:** `T Technical Lane` | `BULL · tier HIGH` | `Above EMA200 · RSI 58 · MACD b...`
            - **Rows:** ~4
            - **Text:** "T Technical Lane BULL · tier HIGH Above EMA200 · RSI 58 · MA..."

            ### Table: T | Technical Lane …
            - **Tag:** `<div>` | **Type:** `table`
            - **Size:** 218 × 119px
            - **Background:** `#0a1424`
            - **Columns:** `T` | `Technical Lane`
            - **Rows:** ~3
            - **Text:** "T Technical Lane"

            ### mb-2
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 28px
            - **Text:** "T"

            ### T…
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### Technical
            - **Tag:** `<div>`
            - **Size:** 57 × 26px

            ### Technical
            - **Tag:** `<div>`

            ### Lane
            - **Tag:** `<div>`

            ### BULL
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 21px

            ### BULL
            - **Tag:** `<span>`

            ### · tier HIGH
            - **Tag:** `<span>`

            ### Above EMA200 · RSI 58 · MACD bull
            - **Tag:** `<div>`
            - **Size:** 188 × 28px

            ### Table: F | Flow Lane …
            - **Tag:** `<div>` | **Type:** `table`
            - **Size:** 218 × 119px
            - **Background:** `#0a1424`
            - **Columns:** `F` | `Flow Lane`
            - **Rows:** ~3
            - **Text:** "F Flow Lane"

            ### mb-2
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 28px
            - **Text:** "F"

            ### F…
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### Flow
            - **Tag:** `<div>`

            ### Flow
            - **Tag:** `<div>`

            ### Lane
            - **Tag:** `<div>`

            ### BULL
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 21px

            ### BULL
            - **Tag:** `<span>`

            ### · tier MOD
            - **Tag:** `<span>`

            ### OI +12% · funding neutral · longs +
            - **Tag:** `<div>`
            - **Size:** 188 × 28px

            ### Table: N | Narrative Lane …
            - **Tag:** `<div>` | **Type:** `table`
            - **Size:** 218 × 119px
            - **Background:** `#0a1424`
            - **Columns:** `N` | `Narrative Lane`
            - **Rows:** ~3
            - **Text:** "N Narrative Lane"

            ### mb-2
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 28px
            - **Text:** "N"

            ### N…
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### Narrative
            - **Tag:** `<div>`
            - **Size:** 57 × 26px

            ### Narrative
            - **Tag:** `<div>`

            ### Lane
            - **Tag:** `<div>`

            ### MIXED
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 21px

            ### MIXED
            - **Tag:** `<span>`

            ### · tier LOW
            - **Tag:** `<span>`

            ### ETF inflows + dovish Fed signal
            - **Tag:** `<div>`

            ### Table: M | Macro Lane …
            - **Tag:** `<div>` | **Type:** `table`
            - **Size:** 218 × 119px
            - **Background:** `#0a1424`
            - **Columns:** `M` | `Macro Lane`
            - **Rows:** ~3
            - **Text:** "M Macro Lane"

            ### mb-2
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 28px
            - **Text:** "M"

            ### M…
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row

            ### Macro
            - **Tag:** `<div>`

            ### Macro
            - **Tag:** `<div>`

            ### Lane
            - **Tag:** `<div>`

            ### BULL
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 188 × 21px

            ### BULL
            - **Tag:** `<span>`

            ### · tier HIGH
            - **Tag:** `<span>`

            ### DXY weak · gold strong · risk on
            - **Tag:** `<div>`
            - **Size:** 188 × 28px

      ### #pricing
      - **Tag:** `<section>` | **ID:** `#pricing`
      - **Size:** 1440 × 1766px
      - **Text:** "Pricing Start free. Upgrade when it pays for itself. Every p..."

        ### Start free. Upgrade when it pays for itself.
        - **Tag:** `<div>`
        - **Size:** 1152 × 1510px

          ### Start free. Upgrade when it pays for itself.
          - **Tag:** `<div>`
          - **Size:** 1152 × 198px

            ### Pricing
            - **Tag:** `<div>`

            ### Start free.
            - **Tag:** `<h2>`
            - **Size:** 1152 × 101px

            ### Upgrade when it pays for itself.
            - **Tag:** `<span>`
            - **Size:** 894 × 56px

            ### Every paid plan is one pool of tokens you spend ac…
            - **Tag:** `<p>`
            - **Size:** 448 × 54px
            - **Text:** "Every paid plan is one pool of tokens you spend across any tool — Analyze, Strategy Builder, briefs,..."

          ### Free See the engine. Try every tool. ₹ 0 forever 7…
          - **Tag:** `<div>`
          - **Layout:** display: grid, grid: 276px 276px 276px 276px, gap: 16px
          - **Size:** 1152 × 489px
          - **Text:** "Free See the engine. Try every tool. ₹ 0 forever 75 trial to..."

            ### Card: Free See the engine. Try every...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 276 × 489px
            - **Content:** Free See the engine. Try every...
            - **Actions:** Start free →
            - **Border radius:** 16px
            - **Text:** "Free See the engine. Try every tool. ₹ 0 forever 75 trial to..."

            ### Card: Free See the engine. Try every... · ₹ 0 forever · 75 trial tokens · first 7 days
            - **Tag:** `<div>` | **Type:** `card`
            - **Layout:** display: flex, flex-direction: column
            - **Size:** 276 × 489px
            - **Content:** Free See the engine. Try every... | ₹ 0 forever | 75 trial tokens · first 7 days | ▸ 75 trial tokens to spend on ... | Start free →
            - **Actions:** Start free →
            - **Border radius:** 16px
            - **Text:** "Free See the engine. Try every tool."

            ### Free
            - **Tag:** `<div>`
            - **Size:** 226 × 42px

            ### Free
            - **Tag:** `<div>`
            - **Size:** 226 × 21px

            ### See the engine. Try every tool.
            - **Tag:** `<div>`

            ### ₹ 0 forever
            - **Tag:** `<div>`
            - **Size:** 226 × 48px

            ### ₹ 0
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 48px

            ### ₹0…
            - **Tag:** `<span>`

            ### forever
            - **Tag:** `<span>`

            ### 75 trial tokens · first 7 days
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 199 × 25px
            - **Background:** `#06b6d4`

            ### ▸ 75 trial tokens to spend on anything · ▸ Live globe + news feed · ▸ Analyze & daily briefs on your trial t... · ▸ No card required …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 226 × 208px
            - **Items:** `▸ 75 trial tokens to spend on anything`, `▸ Live globe + news feed`, `▸ Analyze & daily briefs on your trial t...`, `▸ No card required`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 36px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### 75 trial tokens to spend on anything
            - **Tag:** `<span>`
            - **Size:** 211 × 36px

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Live globe + news feed
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 36px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Analyze & daily briefs on your trial tokens
            - **Tag:** `<span>`
            - **Size:** 211 × 36px

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### No card required
            - **Tag:** `<span>`

            ### Start free →
            - **Tag:** `<a>`
            - **Size:** 226 × 40px

            ### Card: Trader Daily verdicts + Copilo...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 276 × 489px
            - **Content:** Trader Daily verdicts + Copilo...
            - **Actions:** Choose Trader →
            - **Border radius:** 16px
            - **Text:** "Trader Daily verdicts + Copilot. ₹ 999 /month 1,000 tokens /..."

            ### Card: Trader Daily verdicts + Copilo... · ₹ 999 /month · 1,000 tokens / month
            - **Tag:** `<div>` | **Type:** `card`
            - **Layout:** display: flex, flex-direction: column
            - **Size:** 276 × 489px
            - **Content:** Trader Daily verdicts + Copilo... | ₹ 999 /month | 1,000 tokens / month | ▸ All Capital Flows dashboards... | Choose Trader →
            - **Actions:** Choose Trader →
            - **Border radius:** 16px
            - **Text:** "Trader Daily verdicts + Copilot."

            ### Trader
            - **Tag:** `<div>`
            - **Size:** 226 × 42px

            ### Trader
            - **Tag:** `<div>`
            - **Size:** 226 × 21px

            ### Daily verdicts + Copilot.
            - **Tag:** `<div>`

            ### ₹ 999 /month
            - **Tag:** `<div>`
            - **Size:** 226 × 48px

            ### ₹ 999
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 48px

            ### ₹999
            - **Tag:** `<span>`
            - **Size:** 74 × 48px

            ### /month
            - **Tag:** `<span>`

            ### 1,000 tokens / month
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 138 × 25px
            - **Background:** `#06b6d4`

            ### ▸ All Capital Flows dashboards · ▸ Copilot chat — fair-use, up to 30/day · ▸ Daily pre-market brief · ▸ Community support …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 226 × 208px
            - **Items:** `▸ All Capital Flows dashboards`, `▸ Copilot chat — fair-use, up to 30/day`, `▸ Daily pre-market brief`, `▸ Community support`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### All Capital Flows dashboards
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 36px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Copilot chat — fair-use, up to 30/day
            - **Tag:** `<span>`
            - **Size:** 211 × 36px

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Daily pre-market brief
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Community support
            - **Tag:** `<span>`

            ### Choose Trader →
            - **Tag:** `<a>`
            - **Size:** 226 × 40px

            ### Card: Most popular Pro Strategies, a...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 276 × 489px
            - **Content:** Most popular Pro Strategies, a...
            - **Actions:** Go Pro →
            - **Border radius:** 16px
            - **Text:** "Most popular Pro Strategies, alerts, premium flow. ₹ 1,499 /..."

            ### Card: Most popular · Pro Strategies, alerts, premiu... · ₹ 1,499 /month
            - **Tag:** `<div>` | **Type:** `card`
            - **Layout:** display: flex, flex-direction: column
            - **Size:** 276 × 489px
            - **Content:** Most popular | Pro Strategies, alerts, premiu... | ₹ 1,499 /month | 3,000 tokens / month | ▸ Everything in Trader, plus: ...
            - **Actions:** Go Pro →
            - **Border radius:** 16px

            ### Most popular
            - **Tag:** `<div>`
            - **Size:** 100 × 22px
            - **Background:** `#06b6d4`

            ### Pro
            - **Tag:** `<div>`
            - **Size:** 224 × 42px

            ### Pro
            - **Tag:** `<div>`
            - **Size:** 224 × 21px

            ### Strategies, alerts, premium flow.
            - **Tag:** `<div>`

            ### ₹ 1,499 /month
            - **Tag:** `<div>`
            - **Size:** 224 × 48px

            ### ₹ 1,499
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 224 × 48px

            ### ₹1,499
            - **Tag:** `<span>`
            - **Size:** 111 × 48px

            ### /month
            - **Tag:** `<span>`

            ### 3,000 tokens / month
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 138 × 25px
            - **Background:** `#06b6d4`

            ### ▸ Everything in Trader, plus: · ▸ All Institutional & Derivatives dashbo... · ▸ Scenario simulator · ▸ 2 live strategies + paper trading · ▸ Telegram signal alerts …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 224 × 208px
            - **Items:** `▸ Everything in Trader, plus:`, `▸ All Institutional & Derivatives dashbo...`, `▸ Scenario simulator`, `▸ 2 live strategies + paper trading`, `▸ Telegram signal alerts`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Everything in Trader, plus:
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 224 × 72px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### All Institutional & Derivatives dashboards — ETF, …
            - **Tag:** `<span>`
            - **Size:** 209 × 72px
            - **Text:** "All Institutional & Derivatives dashboards — ETF, liquidations, whales, funding, options"

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Scenario simulator
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 224 × 36px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### 2 live strategies + paper trading
            - **Tag:** `<span>`
            - **Size:** 209 × 36px

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Telegram signal alerts
            - **Tag:** `<span>`

            ### Go Pro →
            - **Tag:** `<a>`
            - **Size:** 224 × 38px
            - **Background:** `#06b6d4`

            ### Card: Quant Pipeline-scale automatio...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 276 × 489px
            - **Content:** Quant Pipeline-scale automatio...
            - **Actions:** Choose Quant →
            - **Border radius:** 16px
            - **Text:** "Quant Pipeline-scale automation. ₹ 2,499 /month 5,000 tokens..."

            ### Card: Quant Pipeline-scale automatio... · ₹ 2,499 /month · 5,000 tokens / month
            - **Tag:** `<div>` | **Type:** `card`
            - **Layout:** display: flex, flex-direction: column
            - **Size:** 276 × 489px
            - **Content:** Quant Pipeline-scale automatio... | ₹ 2,499 /month | 5,000 tokens / month | ▸ Everything in Pro, plus: ▸ 1... | Choose Quant →
            - **Actions:** Choose Quant →
            - **Border radius:** 16px
            - **Text:** "Quant Pipeline-scale automation."

            ### Quant
            - **Tag:** `<div>`
            - **Size:** 226 × 42px

            ### Quant
            - **Tag:** `<div>`
            - **Size:** 226 × 21px

            ### Pipeline-scale automation.
            - **Tag:** `<div>`

            ### ₹ 2,499 /month
            - **Tag:** `<div>`
            - **Size:** 226 × 48px

            ### ₹ 2,499
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 48px

            ### ₹2,499
            - **Tag:** `<span>`
            - **Size:** 111 × 48px

            ### /month
            - **Tag:** `<span>`

            ### 5,000 tokens / month
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 138 × 25px
            - **Background:** `#06b6d4`

            ### ▸ Everything in Pro, plus: · ▸ 10 live strategies · ▸ Highest monthly token allowance · ▸ Priority support …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 226 × 208px
            - **Items:** `▸ Everything in Pro, plus:`, `▸ 10 live strategies`, `▸ Highest monthly token allowance`, `▸ Priority support`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Everything in Pro, plus:
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### 10 live strategies
            - **Tag:** `<span>`

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 226 × 36px

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Highest monthly token allowance
            - **Tag:** `<span>`
            - **Size:** 211 × 36px

            ### ▸…
            - **Tag:** `<li>`
            - **Layout:** display: flex, flex-direction: row

            ### mt-[2px]
            - **Tag:** `<span>`
            - **Text:** "▸"

            ### Priority support
            - **Tag:** `<span>`

            ### Choose Quant →
            - **Tag:** `<a>`
            - **Size:** 226 × 40px

          ### Card: Compare plans · Feature Free ₹0 Trader ₹999/mo...
          - **Tag:** `<div>` | **Type:** `card`
          - **Size:** 1152 × 640px
          - **Content:** Compare plans | Feature Free ₹0 Trader ₹999/mo...
          - **Border radius:** 16px

            ### Compare plans
            - **Tag:** `<div>`

            ### Card: Feature Free ₹0 Trader ₹999/mo...
            - **Tag:** `<div>` | **Type:** `card`
            - **Size:** 1152 × 605px
            - **Content:** Feature Free ₹0 Trader ₹999/mo...
            - **Border radius:** 16px
            - **Text:** "Feature Free ₹0 Trader ₹999/mo Pro ₹1,499/mo Quant ₹2,499/mo..."

            ### Table: Feature | Free ₹0 | Trader ₹999/mo | Pro ₹1,499/mo …
            - **Tag:** `<table>` | **Type:** `table`
            - **Layout:** display: table
            - **Size:** 1150 × 603px
            - **Columns:** `Feature` | `Free ₹0` | `Trader ₹999/mo` | `Pro ₹1,499/mo` | `Quant ₹2,499/mo`
            - **Rows:** ~13
            - **Text:** "Feature Free ₹0 Trader ₹999/mo Pro ₹1,499/mo Quant ₹2,499/mo"

            ### Feature Free ₹0 Trader ₹999/mo Pro ₹1,499/mo Quant…
            - **Tag:** `<thead>`
            - **Layout:** display: table-header-group
            - **Size:** 1150 × 62px
            - **Text:** "Feature Free ₹0 Trader ₹999/mo Pro ₹1,499/mo Quant ₹2,499/mo"

            ### Feature
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 62px

            ### Feature
            - **Tag:** `<th>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 62px

            ### Free
            - **Tag:** `<th>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 62px

            ### Free
            - **Tag:** `<div>`

            ### mt-0.5
            - **Tag:** `<div>`
            - **Text:** "₹0"

            ### Trader
            - **Tag:** `<th>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 62px

            ### Trader
            - **Tag:** `<div>`

            ### ₹999/mo
            - **Tag:** `<div>`

            ### Pro
            - **Tag:** `<th>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 62px
            - **Background:** `#06b6d4`

            ### Pro
            - **Tag:** `<div>`

            ### ₹1,499/mo
            - **Tag:** `<div>`

            ### Quant
            - **Tag:** `<th>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 62px

            ### Quant
            - **Tag:** `<div>`

            ### ₹2,499/mo
            - **Tag:** `<div>`

            ### Monthly tokens 75 trial 1,000 3,000 5,000
            - **Tag:** `<tbody>`
            - **Layout:** display: table-row-group
            - **Size:** 1150 × 540px
            - **Repeats:** 12× (tr)
            - **(12x repeated)**

            ### Monthly tokens
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Monthly tokens
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### 75 trial
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### 75 trial
            - **Tag:** `<span>`

            ### 1,000
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### 1,000
            - **Tag:** `<span>`

            ### 3,000
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### 3,000
            - **Tag:** `<span>`

            ### 5,000
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### 5,000
            - **Tag:** `<span>`

            ### Live globe + news feed
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Live globe + news feed
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### Analyze — AI trade verdicts
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Analyze — AI trade verdicts
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### Daily pre-market brief
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Daily pre-market brief
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### Capital Flows dashboards
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Capital Flows dashboards
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### —…
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### —…
            - **Tag:** `<span>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### Copilot chat
            - **Tag:** `<tr>`
            - **Layout:** display: table-row
            - **Size:** 1150 × 45px

            ### Copilot chat
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 686 × 45px

            ### —…
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 123 × 45px

            ### —…
            - **Tag:** `<span>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 108 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px
            - **Background:** `#06b6d4`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### td
            - **Tag:** `<td>`
            - **Layout:** display: table-cell
            - **Size:** 116 × 45px

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

          ### mt-10
          - **Tag:** `<div>`
          - **Text:** "Cancel anytime from your account. Top-up token packs available on any paid plan."

      ### Stop guessing. Start trading smarter.
      - **Tag:** `<section>`
      - **Size:** 1440 × 602px

        ### -translate-x-1/2
        - **Tag:** `<div>`
        - **Size:** 700 × 700px
        - **Background:** `#06b6d4`

        ### Stop guessing. Start trading smarter.
        - **Tag:** `<div>`
        - **Size:** 768 × 346px

          ### Stop guessing.
          - **Tag:** `<h2>`
          - **Size:** 768 × 182px

            ### Start trading smarter.
            - **Tag:** `<span>`
            - **Size:** 476 × 135px

          ### mb-10
          - **Tag:** `<p>`
          - **Size:** 576 × 49px
          - **Text:** "Free to start, no card needed. Upgrade when the verdicts and signals start paying for themselves."

          ### Card: Create your account → · Already have an account
          - **Tag:** `<div>` | **Type:** `card`
          - **Layout:** display: flex, flex-direction: row
          - **Size:** 768 × 51px
          - **Content:** Create your account → | Already have an account
          - **Actions:** Create your account ..., Already have an acco...
          - **Border radius:** 6px

            ### Create your account
            - **Tag:** `<a>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 240 × 49px
            - **Background:** `#06b6d4`

            ### →…
            - **Tag:** `<span>`

            ### Already have an account
            - **Tag:** `<a>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 260 × 51px

    ### Footer
    - **Tag:** `<footer>` | **Type:** `footer`
    - **Size:** 1440 × 308px
    - **Background:** `#03060f`
    - **Links:** Terms, Privacy, Refund policy, info@deeepr.ai
    - **Text:** "DEEEPR .AI Crypto trading intelligence. Not financial advice..."

      ### Table: DEEEPR .AI Crypto trading inte... | Legal Terms Privacy Refund pol... …
      - **Tag:** `<div>` | **Type:** `table`
      - **Size:** 1152 × 195px
      - **Columns:** `DEEEPR .AI Crypto trading inte...` | `Legal Terms Privacy Refund pol...`
      - **Rows:** ~2
      - **Text:** "DEEEPR .AI Crypto trading intelligence. Not financial advice..."

        ### Table: DEEEPR .AI | Crypto trading intelligence. N... …
        - **Tag:** `<div>` | **Type:** `table`
        - **Layout:** display: flex, flex-direction: row
        - **Size:** 1152 × 115px
        - **Columns:** `DEEEPR .AI` | `Crypto trading intelligence. N...`
        - **Rows:** ~2
        - **Text:** "DEEEPR .AI Crypto trading intelligence. Not financial advice..."

          ### DEEEPR .AI
          - **Tag:** `<div>`
          - **Size:** 320 × 72px

            ### DEEEPR
            - **Tag:** `<div>`
            - **Layout:** display: flex, flex-direction: row
            - **Size:** 320 × 24px

            ### DEEEPR
            - **Tag:** `<span>`
            - **Size:** 56 × 24px

            ### .AI
            - **Tag:** `<span>`

            ### Crypto trading intelligence. Not financial advice.
            - **Tag:** `<p>`
            - **Size:** 320 × 36px

          ### Table: DEEEPR .AI | Crypto trading intelligence. N... …
          - **Tag:** `<div>` | **Type:** `table`
          - **Layout:** display: flex, flex-direction: row
          - **Size:** 243 × 115px
          - **Columns:** `DEEEPR .AI` | `Crypto trading intelligence. N...`
          - **Rows:** ~2
          - **Text:** "Legal Terms Privacy Refund policy"

            ### Legal
            - **Tag:** `<div>`
            - **Size:** 94 × 115px

            ### Legal
            - **Tag:** `<div>`

            ### Terms · Privacy · Refund policy …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 94 × 88px
            - **Items:** `Terms`, `Privacy`, `Refund policy`

            ### Terms
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 94 × 24px

            ### Terms
            - **Tag:** `<a>`

            ### Privacy
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 94 × 24px

            ### Privacy
            - **Tag:** `<a>`

            ### Refund policy
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 94 × 24px

            ### Refund policy
            - **Tag:** `<a>`

            ### Support
            - **Tag:** `<div>`
            - **Size:** 101 × 115px

            ### Support
            - **Tag:** `<div>`

            ### info@deeepr.ai
            - **Tag:** `<ul>`
            - **Size:** 101 × 24px

            ### info@deeepr.ai
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 101 × 24px

            ### info@deeepr.ai
            - **Tag:** `<a>`

        ### © 2026 Deeepr.ai
        - **Tag:** `<div>`
        - **Layout:** display: flex, flex-direction: row
        - **Size:** 1152 × 40px

          ### © 2026 Deeepr.ai
          - **Tag:** `<div>`

          ### Markets are risky. Trade with what you can afford to lose.
          - **Tag:** `<div>`


### Page: Deeepr.ai — Crypto Trading Intelligence
> URL: [https://deeepr.ai/auth/login](https://deeepr.ai/auth/login)

  ### Card: Welcome back Examine · Evaluat... · Public signups are paused. Lea... · Terms · Privacy · Refund
  - **Tag:** `<div>` | **Type:** `card`
  - **Size:** 420 × 444px
  - **Content:** Welcome back Examine · Evaluat... | Public signups are paused. Lea... | Terms · Privacy · Refund | © 2026 Deeepr.ai. All rights r... | Examine · Evaluate · Execute.
  - **Actions:** Forgot password?, Log in
  - **Border radius:** 12px

    ### Card: Welcome back · Examine · Evaluate · Execute. · Email Password Forgot password...
    - **Tag:** `<div>` | **Type:** `card`
    - **Size:** 420 × 336px
    - **Background:** `#07091a`
    - **Content:** Welcome back | Examine · Evaluate · Execute. | Email Password Forgot password...
    - **Actions:** Forgot password?, Log in
    - **Border radius:** 12px

      ### Welcome back
      - **Tag:** `<h1>`
      - **Size:** 370 × 27px

      ### Examine · Evaluate · Execute.
      - **Tag:** `<p>`

      ### Email Password Forgot password? Log in
      - **Tag:** `<div>`
      - **Size:** 370 × 218px

        ### Form
        - **Tag:** `<form>` | **Type:** `form`
        - **Size:** 370 × 218px
        - **Fields:** email, password
        - **Submit buttons:** 2
        - **Text:** "Email"

          ### Email
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Email
            - **Tag:** `<span>`

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

          ### Password
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Password
            - **Tag:** `<span>`

            ### div
            - **Tag:** `<div>`
            - **Size:** 370 × 40px

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

            ### Show password
            - **Tag:** `<button>`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### circle
            - **Tag:** `<circle>`

          ### Forgot password?
          - **Tag:** `<div>`
          - **Size:** 370 × 24px

            ### Forgot password?
            - **Tag:** `<a>`

          ### Log in
          - **Tag:** `<button>`
          - **Layout:** display: inline-block
          - **Size:** 370 × 39px
          - **Background:** `#06b6d4`

    ### Public signups are paused. Learn more
    - **Tag:** `<div>`

      ### Learn more
      - **Tag:** `<a>`

    ### Terms
    - **Tag:** `<div>`

      ### Terms
      - **Tag:** `<a>`

      ### ·…
      - **Tag:** `<span>`

      ### Privacy
      - **Tag:** `<a>`

      ### ·…
      - **Tag:** `<span>`

      ### Refund
      - **Tag:** `<a>`

    ### © 2026 Deeepr.ai. All rights reserved.
    - **Tag:** `<div>`

    ### Examine · Evaluate · Execute.
    - **Tag:** `<div>`


### Page: Deeepr.ai — Crypto Trading Intelligence
> URL: [https://deeepr.ai/auth/signup](https://deeepr.ai/auth/signup)

  ### Card: Create your account Choose you... · Already have an account? Log i... · Terms · Privacy · Refund
  - **Tag:** `<div>` | **Type:** `card`
  - **Size:** 420 × 632px
  - **Content:** Create your account Choose you... | Already have an account? Log i... | Terms · Privacy · Refund | © 2026 Deeepr.ai. All rights r... | Examine · Evaluate · Execute.
  - **Actions:** Terms of Use, Privacy Policy
  - **Border radius:** 12px

    ### Card: Create your account · Choose your plan after signup ... · Name Email Password Referral c...
    - **Tag:** `<div>` | **Type:** `card`
    - **Size:** 420 × 524px
    - **Background:** `#07091a`
    - **Content:** Create your account | Choose your plan after signup ... | Name Email Password Referral c...
    - **Actions:** Terms of Use, Privacy Policy
    - **Border radius:** 12px

      ### Create your account
      - **Tag:** `<h1>`
      - **Size:** 370 × 27px

      ### mt-1
      - **Tag:** `<p>`
      - **Size:** 370 × 36px
      - **Text:** "Choose your plan after signup — start with 75 free trial tokens."

      ### mt-5
      - **Tag:** `<div>`
      - **Size:** 370 × 387px
      - **Text:** "Name Email Password Referral code (optional) I agree to the ..."

        ### Form
        - **Tag:** `<form>` | **Type:** `form`
        - **Size:** 370 × 357px
        - **Fields:** How should we greet you?, you@example.com, 12+ chars with letters, numbers & symbols, e.g. 9YTPU5, checkbox
        - **Submit buttons:** 2
        - **Text:** "Name"

          ### Name
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Name
            - **Tag:** `<span>`

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

          ### Email
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Email
            - **Tag:** `<span>`

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

          ### Password
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Password
            - **Tag:** `<span>`

            ### div
            - **Tag:** `<div>`
            - **Size:** 370 × 40px

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

            ### Show password
            - **Tag:** `<button>`

            ### lucide
            - **Tag:** `<svg>`

            ### path
            - **Tag:** `<path>`

            ### circle
            - **Tag:** `<circle>`

          ### Referral code (optional)
          - **Tag:** `<label>`
          - **Size:** 370 × 60px

            ### Referral code (optional)
            - **Tag:** `<span>`

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Layout:** display: inline-block
            - **Size:** 370 × 40px
            - **Background:** `#000000`

          ### mt-1
          - **Tag:** `<label>`
          - **Layout:** display: flex, flex-direction: row

            ### Form
            - **Tag:** `<input>` | **Type:** `form`
            - **Text:** "Agree to Terms and Privacy Policy"

            ### I agree to the  and .
            - **Tag:** `<span>`

            ### Terms of Use
            - **Tag:** `<a>`

            ### Privacy Policy
            - **Tag:** `<a>`

          ### Create account
          - **Tag:** `<button>`
          - **Layout:** display: inline-block
          - **Size:** 370 × 39px
          - **Background:** `#06b6d4`

        ### We'll send a verification email to unlock all features.
        - **Tag:** `<p>`

    ### Already have an account? Log in
    - **Tag:** `<div>`

      ### Log in
      - **Tag:** `<a>`

    ### Terms
    - **Tag:** `<div>`

      ### Terms
      - **Tag:** `<a>`

      ### ·…
      - **Tag:** `<span>`

      ### Privacy
      - **Tag:** `<a>`

      ### ·…
      - **Tag:** `<span>`

      ### Refund
      - **Tag:** `<a>`

    ### © 2026 Deeepr.ai. All rights reserved.
    - **Tag:** `<div>`

    ### Examine · Evaluate · Execute.
    - **Tag:** `<div>`


### Page: Terms of Use · Deeepr.ai
> URL: [https://deeepr.ai/terms](https://deeepr.ai/terms)

  ### Terms of Use
  - **Tag:** `<div>`
  - **Size:** 1440 × 900px
  - **Background:** `#03060f`

    ### DEEEPR.AI · Terms · Privacy · Refund …
    - **Tag:** `<header>` | **Type:** `nav-bar`
    - **Size:** 1440 × 65px
    - **Background:** `#03060f`
    - **Links:** `DEEEPR.AI`, `Terms`, `Privacy`, `Refund`
    - **Text:** "DEEEPR.AI Terms Privacy Refund"

      ### DEEEPR.AI
      - **Tag:** `<div>`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 768 × 64px

        ### group
        - **Tag:** `<a>`
        - **Layout:** display: flex, flex-direction: row
        - **Size:** 117 × 32px

          ### deeepr.ai
          - **Tag:** `<svg>`

            ### g
            - **Tag:** `<g>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

          ### DEEEPR.AI
          - **Tag:** `<div>`

        ### Terms · Privacy · Refund …
        - **Tag:** `<nav>` | **Type:** `nav-bar`
        - **Layout:** display: flex, flex-direction: row
        - **Links:** `Terms`, `Privacy`, `Refund`

          ### Terms
          - **Tag:** `<a>`

          ### Privacy
          - **Tag:** `<a>`

          ### Refund
          - **Tag:** `<a>`

    ### Terms of Use
    - **Tag:** `<main>`
    - **Size:** 768 × 8622px

      ### Terms of Use
      - **Tag:** `<h1>`
      - **Size:** 720 × 42px

      ### Last updated: June 4, 2026
      - **Tag:** `<p>`

      ### Table: Introduction | Please read these Terms of Use... …
      - **Tag:** `<div>` | **Type:** `table`
      - **Size:** 720 × 8344px
      - **Columns:** `Introduction` | `Please read these Terms of Use...`
      - **Rows:** ~30

      ### Footer
      - **Tag:** `<footer>` | **Type:** `footer`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 720 × 40px
      - **Links:** Back to app
      - **Text:** "© 2026 Deeepr.ai."

        ### © 2026 Deeepr.ai.
        - **Tag:** `<span>`

        ### Examine · Evaluate · Execute.
        - **Tag:** `<span>`

        ### Back to app
        - **Tag:** `<a>`


### Page: Privacy Policy · Deeepr.ai
> URL: [https://deeepr.ai/privacy](https://deeepr.ai/privacy)

  ### Privacy Policy
  - **Tag:** `<div>`
  - **Size:** 1440 × 900px
  - **Background:** `#03060f`

    ### DEEEPR.AI · Terms · Privacy · Refund …
    - **Tag:** `<header>` | **Type:** `nav-bar`
    - **Size:** 1440 × 65px
    - **Background:** `#03060f`
    - **Links:** `DEEEPR.AI`, `Terms`, `Privacy`, `Refund`
    - **Text:** "DEEEPR.AI Terms Privacy Refund"

      ### DEEEPR.AI
      - **Tag:** `<div>`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 768 × 64px

        ### group
        - **Tag:** `<a>`
        - **Layout:** display: flex, flex-direction: row
        - **Size:** 117 × 32px

          ### deeepr.ai
          - **Tag:** `<svg>`

            ### g
            - **Tag:** `<g>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

          ### DEEEPR.AI
          - **Tag:** `<div>`

        ### Terms · Privacy · Refund …
        - **Tag:** `<nav>` | **Type:** `nav-bar`
        - **Layout:** display: flex, flex-direction: row
        - **Links:** `Terms`, `Privacy`, `Refund`

          ### Terms
          - **Tag:** `<a>`

          ### Privacy
          - **Tag:** `<a>`

          ### Refund
          - **Tag:** `<a>`

    ### Privacy Policy
    - **Tag:** `<main>`
    - **Size:** 768 × 4744px

      ### Privacy Policy
      - **Tag:** `<h1>`
      - **Size:** 720 × 42px

      ### Last updated: June 4, 2026
      - **Tag:** `<p>`

      ### Table: Introduction | Please read this privacy polic... …
      - **Tag:** `<div>` | **Type:** `table`
      - **Size:** 720 × 4465px
      - **Columns:** `Introduction` | `Please read this privacy polic...`
      - **Rows:** ~15
      - **Repeats:** 15× (section)
      - **(15x repeated)**

        ### Introduction
        - **Tag:** `<section>`
        - **Size:** 720 × 373px

          ### Introduction
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### Please read this privacy policy (“Policy”) careful…
          - **Tag:** `<div>`
          - **Size:** 720 × 341px
          - **Text:** "Please read this privacy policy (“Policy”) carefully before ..."

            ### Please read this privacy policy (“Policy”) careful…
            - **Tag:** `<p>`
            - **Size:** 720 × 148px
            - **Text:** "Please read this privacy policy (“Policy”) carefully before accessing, browsing, registering on, sub..."

            ### This Policy applies to all users of the Platform, …
            - **Tag:** `<p>`
            - **Size:** 720 × 127px
            - **Text:** "This Policy applies to all users of the Platform, including visitors, registered users, subscribers,..."

            ### Terms of Use
            - **Tag:** `<a>`
            - **Size:** 712 × 36px

            ### If you do not agree with this Policy in its entire…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "If you do not agree with this Policy in its entirety, you must immediately discontinue access to and..."

        ### 4. Definitions
        - **Tag:** `<section>`
        - **Size:** 720 × 319px

          ### 4. Definitions
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### For the purposes of this Policy:
          - **Tag:** `<div>`
          - **Size:** 720 × 287px

            ### For the purposes of this Policy:
            - **Tag:** `<p>`
            - **Size:** 720 × 21px

            ### “Personal Information” means information... · “Sensitive Personal Information” include... · “Usage Information” means technical, beh... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 254px
            - **Items:** `“Personal Information” means information...`, `“Sensitive Personal Information” include...`, `“Usage Information” means technical, beh...`

            ### “Personal Information”
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 85px

            ### “Personal Information”
            - **Tag:** `<strong>`

            ### “Sensitive Personal Information”
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 85px

            ### “Sensitive Personal Information”
            - **Tag:** `<strong>`

            ### “Usage Information”
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 85px

            ### “Usage Information”
            - **Tag:** `<strong>`

        ### 5. Information We Collect
        - **Tag:** `<section>`
        - **Size:** 720 × 458px

          ### 5. Information We Collect
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### The Company may collect Personal Information and n…
          - **Tag:** `<div>`
          - **Size:** 720 × 425px
          - **Text:** "The Company may collect Personal Information and non-persona..."

            ### The Company may collect Personal Information and n…
            - **Tag:** `<p>`
            - **Size:** 720 × 63px
            - **Text:** "The Company may collect Personal Information and non-personal information from you in connection wit..."

            ### Registration Information: including your... · Subscription and Billing Information: in... · Usage Information: including browser det... · Communications and Support Information: ... · Cookies and Tracking Information: includ... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 296px
            - **Items:** `Registration Information: including your...`, `Subscription and Billing Information: in...`, `Usage Information: including browser det...`, `Communications and Support Information: ...`, `Cookies and Tracking Information: includ...`

            ### Registration Information:
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px

            ### Registration Information:
            - **Tag:** `<strong>`

            ### Subscription and Billing Information:
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px

            ### Subscription and Billing Information:
            - **Tag:** `<strong>`

            ### Usage Information:
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px

            ### Usage Information:
            - **Tag:** `<strong>`

            ### Communications and Support Information:
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px

            ### Communications and Support Information:
            - **Tag:** `<strong>`

            ### Cookies and Tracking Information:
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px

            ### Cookies and Tracking Information:
            - **Tag:** `<strong>`

            ### You acknowledge that certain information may be co…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "You acknowledge that certain information may be collected automatically through your use of the Plat..."

        ### 6. Cookies
        - **Tag:** `<section>`
        - **Size:** 720 × 159px

          ### 6. Cookies
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### The Platform may use cookies and similar... · You may modify your browser settings to ... …
          - **Tag:** `<ul>` | **Type:** `list`
          - **Size:** 720 × 127px
          - **Items:** `The Platform may use cookies and similar...`, `You may modify your browser settings to ...`
          - **Text:** "The Platform may use cookies and similar technologies for au..."

            ### The Platform may use cookies and similar technolog…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "The Platform may use cookies and similar technologies for authentication, analytics, functionality, ..."

            ### You may modify your browser settings to reject, di…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "You may modify your browser settings to reject, disable, or remove cookies. However, certain portion..."

        ### 7. How We Use and Share the Information Collected
        - **Tag:** `<section>`
        - **Size:** 720 × 799px

          ### 7. How We Use and Share the Information Collected
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### The Company may collect, use, process, disclose, t…
          - **Tag:** `<div>`
          - **Size:** 720 × 766px
          - **Text:** "The Company may collect, use, process, disclose, transfer, o..."

            ### The Company may collect, use, process, disclose, t…
            - **Tag:** `<p>`
            - **Size:** 720 × 63px
            - **Text:** "The Company may collect, use, process, disclose, transfer, or otherwise handle your information for ..."

            ### to provide, operate, maintain, personali... · to create, manage, authenticate, and adm... · to process subscriptions, invoices, rene... · to communicate with you regarding your a... · to monitor, analyse, audit, and improve ... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 401px
            - **Items:** `to provide, operate, maintain, personali...`, `to create, manage, authenticate, and adm...`, `to process subscriptions, invoices, rene...`, `to communicate with you regarding your a...`, `to monitor, analyse, audit, and improve ...`, `to detect, investigate, prevent, or addr...`, `to develop, improve, optimise, test, mai...`, `to comply with legal obligations, court ...`, `to enforce the Terms of Use, this Policy...`, `to conduct analytics, research, statisti...`
            - **Repeats:** 10× (li)
            - **(10x repeated)**
            - **Text:** "to provide, operate, maintain, personalise, and improve the ..."

            ### to provide, operate, maintain, personalise, and im…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "to provide, operate, maintain, personalise, and improve the Platform and its services;"

            ### to create, manage, authenticate, and administer us…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "to create, manage, authenticate, and administer user accounts and subscriptions;"

            ### to process subscriptions, invoices, renewals, bill…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "to process subscriptions, invoices, renewals, billing functions, and payment-related activities;"

            ### to communicate with you regarding your account, su…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "to communicate with you regarding your account, subscriptions, technical notices, security alerts, l..."

            ### to monitor, analyse, audit, and improve Platform p…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "to monitor, analyse, audit, and improve Platform performance, reliability, functionality, and user e..."

            ### to detect, investigate, prevent, or address fraud,…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "to detect, investigate, prevent, or address fraud, abuse, misuse, unauthorised access, unlawful cond..."

            ### The Company does not sell your Personal Informatio…
            - **Tag:** `<p>`
            - **Size:** 720 × 21px
            - **Text:** "The Company does not sell your Personal Information in exchange for monetary consideration."

            ### The Company may disclose, share, transfer, or make…
            - **Tag:** `<p>`
            - **Size:** 720 × 21px
            - **Text:** "The Company may disclose, share, transfer, or make available your information to:"

            ### service providers, infrastructure provid... · affiliates, contractors, consultants, au... · government authorities, regulators, law ... · third parties involved in mergers, acqui... · other entities where disclosure is reaso... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 211px
            - **Items:** `service providers, infrastructure provid...`, `affiliates, contractors, consultants, au...`, `government authorities, regulators, law ...`, `third parties involved in mergers, acqui...`, `other entities where disclosure is reaso...`
            - **Text:** "service providers, infrastructure providers, analytics provi..."

            ### service providers, infrastructure providers, analy…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "service providers, infrastructure providers, analytics providers, payment processors, hosting provid..."

            ### affiliates, contractors, consultants, auditors, le…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "affiliates, contractors, consultants, auditors, legal advisers, and professional advisers;"

            ### government authorities, regulators, law enforcemen…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "government authorities, regulators, law enforcement agencies, courts, tribunals, or statutory bodies..."

            ### third parties involved in mergers, acquisitions, r…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "third parties involved in mergers, acquisitions, restructuring, financing, insolvency proceedings, o..."

            ### other entities where disclosure is reasonably nece…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "other entities where disclosure is reasonably necessary to protect the rights, property, security, i..."

        ### 8. Your Choices
        - **Tag:** `<section>`
        - **Size:** 720 × 201px

          ### 8. Your Choices
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### You may choose the information you provi... · You may update, modify, or remove certai... · You may opt out of certain promotional o... · You may reject or remove cookies through... …
          - **Tag:** `<ul>` | **Type:** `list`
          - **Size:** 720 × 169px
          - **Items:** `You may choose the information you provi...`, `You may update, modify, or remove certai...`, `You may opt out of certain promotional o...`, `You may reject or remove cookies through...`
          - **Text:** "You may choose the information you provide to the Company, s..."

            ### You may choose the information you provide to the …
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "You may choose the information you provide to the Company, subject to operational requirements neces..."

            ### You may update, modify, or remove certain informat…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "You may update, modify, or remove certain information through the options made available on the Plat..."

            ### You may opt out of certain promotional or marketin…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "You may opt out of certain promotional or marketing communications, subject to applicable law."

            ### You may reject or remove cookies through your brow…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "You may reject or remove cookies through your browser settings, although certain Platform functional..."

      ### Footer
      - **Tag:** `<footer>` | **Type:** `footer`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 720 × 40px
      - **Links:** Back to app
      - **Text:** "© 2026 Deeepr.ai."

        ### © 2026 Deeepr.ai.
        - **Tag:** `<span>`

        ### Examine · Evaluate · Execute.
        - **Tag:** `<span>`

        ### Back to app
        - **Tag:** `<a>`


### Page: Refund & Cancellation Policy · Deeepr.ai
> URL: [https://deeepr.ai/refund](https://deeepr.ai/refund)

  ### Refund & Cancellation Policy
  - **Tag:** `<div>`
  - **Size:** 1440 × 900px
  - **Background:** `#03060f`

    ### DEEEPR.AI · Terms · Privacy · Refund …
    - **Tag:** `<header>` | **Type:** `nav-bar`
    - **Size:** 1440 × 65px
    - **Background:** `#03060f`
    - **Links:** `DEEEPR.AI`, `Terms`, `Privacy`, `Refund`
    - **Text:** "DEEEPR.AI Terms Privacy Refund"

      ### DEEEPR.AI
      - **Tag:** `<div>`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 768 × 64px

        ### group
        - **Tag:** `<a>`
        - **Layout:** display: flex, flex-direction: row
        - **Size:** 117 × 32px

          ### deeepr.ai
          - **Tag:** `<svg>`

            ### g
            - **Tag:** `<g>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

            ### rect
            - **Tag:** `<rect>`

          ### DEEEPR.AI
          - **Tag:** `<div>`

        ### Terms · Privacy · Refund …
        - **Tag:** `<nav>` | **Type:** `nav-bar`
        - **Layout:** display: flex, flex-direction: row
        - **Links:** `Terms`, `Privacy`, `Refund`

          ### Terms
          - **Tag:** `<a>`

          ### Privacy
          - **Tag:** `<a>`

          ### Refund
          - **Tag:** `<a>`

    ### Refund & Cancellation Policy
    - **Tag:** `<main>`
    - **Size:** 768 × 2601px

      ### Refund & Cancellation Policy
      - **Tag:** `<h1>`
      - **Size:** 720 × 42px

      ### Last updated: June 4, 2026
      - **Tag:** `<p>`

      ### Table: Introduction | Please read this Refund and Ca... …
      - **Tag:** `<div>` | **Type:** `table`
      - **Size:** 720 × 2323px
      - **Columns:** `Introduction` | `Please read this Refund and Ca...`
      - **Rows:** ~9
      - **Repeats:** 9× (section)
      - **(9x repeated)**

        ### Introduction
        - **Tag:** `<section>`
        - **Size:** 720 × 256px

          ### Introduction
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### Please read this Refund and Cancellation Policy (“…
          - **Tag:** `<div>`
          - **Size:** 720 × 223px
          - **Text:** "Please read this Refund and Cancellation Policy (“Policy”) c..."

            ### Please read this Refund and Cancellation Policy (“…
            - **Tag:** `<p>`
            - **Size:** 720 × 169px
            - **Text:** "Please read this Refund and Cancellation Policy (“Policy”) carefully before purchasing, subscribing ..."

            ### Terms of Use
            - **Tag:** `<a>`

            ### Privacy Policy
            - **Tag:** `<a>`

            ### By purchasing or subscribing to any paid service o…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "By purchasing or subscribing to any paid service on the Platform, you acknowledge and agree to be bo..."

        ### 1. General Policy
        - **Tag:** `<section>`
        - **Size:** 720 × 470px

          ### 1. General Policy
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### final and non-refundable
          - **Tag:** `<div>`
          - **Size:** 720 × 437px

            ### final and non-refundable
            - **Tag:** `<p>`
            - **Size:** 720 × 85px

            ### final and non-refundable
            - **Tag:** `<strong>`

            ### You acknowledge and agree that the Platform primar…
            - **Tag:** `<p>`
            - **Size:** 720 × 127px
            - **Text:** "You acknowledge and agree that the Platform primarily provides access to digital, software-based, AI..."

            ### No refund, whether full or partial, shall be due m…
            - **Tag:** `<p>`
            - **Size:** 720 × 21px
            - **Text:** "No refund, whether full or partial, shall be due merely because:"

            ### you did not use the Platform; · you used the Platform only partially; · you were dissatisfied with any feature, ... · any AI-generated or AI-assisted output d... · market conditions, trading outcomes, or ... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 169px
            - **Items:** `you did not use the Platform;`, `you used the Platform only partially;`, `you were dissatisfied with any feature, ...`, `any AI-generated or AI-assisted output d...`, `market conditions, trading outcomes, or ...`, `you failed to cancel a recurring subscri...`, `you subsequently decided not to continue...`
            - **Repeats:** 7× (li)
            - **(7x repeated)**

            ### you did not use the Platform;
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px

            ### you used the Platform only partially;
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px

            ### you were dissatisfied with any feature, output, in…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "you were dissatisfied with any feature, output, interface, or functionality;"

            ### any AI-generated or AI-assisted output did not mee…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "any AI-generated or AI-assisted output did not meet your expectations;"

            ### market conditions, trading outcomes, or investment…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "market conditions, trading outcomes, or investment decisions did not produce anticipated results;"

            ### you failed to cancel a recurring subscription prio…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "you failed to cancel a recurring subscription prior to renewal; or"

        ### 2. Subscription Plans and Billing
        - **Tag:** `<section>`
        - **Size:** 720 × 244px

          ### 2. Subscription Plans and Billing
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### The Platform may offer free and paid sub... · By subscribing to any paid plan, you aut... · Subscription fees may be billed automati... · The Company reserves the right to modify... …
          - **Tag:** `<ul>` | **Type:** `list`
          - **Size:** 720 × 211px
          - **Items:** `The Platform may offer free and paid sub...`, `By subscribing to any paid plan, you aut...`, `Subscription fees may be billed automati...`, `The Company reserves the right to modify...`
          - **Text:** "The Platform may offer free and paid subscription plans, inc..."

            ### The Platform may offer free and paid subscription …
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "The Platform may offer free and paid subscription plans, including recurring monthly, quarterly, ann..."

            ### By subscribing to any paid plan, you authorise the…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "By subscribing to any paid plan, you authorise the Company and its designated payment processor to c..."

            ### Subscription fees may be billed automatically on a…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "Subscription fees may be billed automatically on a recurring basis unless the subscription is cancel..."

            ### The Company reserves the right to modify pricing, …
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "The Company reserves the right to modify pricing, plan inclusions, quotas, usage limits, feature ava..."

        ### 3. Cancellation of Subscription
        - **Tag:** `<section>`
        - **Size:** 720 × 265px

          ### 3. Cancellation of Subscription
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### You may cancel your subscription at any ... · Cancellation of a subscription shall pre... · Unless otherwise stated by the Company, ... · The Company may require cancellation req... …
          - **Tag:** `<ul>` | **Type:** `list`
          - **Size:** 720 × 232px
          - **Items:** `You may cancel your subscription at any ...`, `Cancellation of a subscription shall pre...`, `Unless otherwise stated by the Company, ...`, `The Company may require cancellation req...`
          - **Text:** "You may cancel your subscription at any time through your ac..."

            ### You may cancel your subscription at any time throu…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "You may cancel your subscription at any time through your account settings, billing interface, or by..."

            ### Cancellation of a subscription shall prevent futur…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "Cancellation of a subscription shall prevent future renewals only and shall not entitle you to any r..."

            ### Unless otherwise stated by the Company, if you can…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "Unless otherwise stated by the Company, if you cancel a subscription, access to paid features may co..."

            ### The Company may require cancellation requests to b…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "The Company may require cancellation requests to be initiated prior to the next billing date in orde..."

        ### 4. Free Trials, Promotional Access, and Beta Features
        - **Tag:** `<section>`
        - **Size:** 720 × 201px

          ### 4. Free Trials, Promotional Access, and Beta Features
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### The Company may, from time to time, offe... · Unless expressly stated otherwise in wri... · The Company reserves the right to withdr... …
          - **Tag:** `<ul>` | **Type:** `list`
          - **Size:** 720 × 169px
          - **Items:** `The Company may, from time to time, offe...`, `Unless expressly stated otherwise in wri...`, `The Company reserves the right to withdr...`
          - **Text:** "The Company may, from time to time, offer free trials, promo..."

            ### The Company may, from time to time, offer free tri…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "The Company may, from time to time, offer free trials, promotional pricing, discounted subscriptions..."

            ### Unless expressly stated otherwise in writing by th…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 63px
            - **Text:** "Unless expressly stated otherwise in writing by the Company, conversion from any free trial or promo..."

            ### The Company reserves the right to withdraw, suspen…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 42px
            - **Text:** "The Company reserves the right to withdraw, suspend, modify, or discontinue any trial, promotional o..."

        ### 5. Payment Failures and Chargebacks
        - **Tag:** `<section>`
        - **Size:** 720 × 280px

          ### 5. Payment Failures and Chargebacks
          - **Tag:** `<h2>`
          - **Size:** 720 × 24px

          ### You agree not to initiate unwarranted chargebacks,…
          - **Tag:** `<div>`
          - **Size:** 720 × 247px
          - **Text:** "You agree not to initiate unwarranted chargebacks, payment r..."

            ### You agree not to initiate unwarranted chargebacks,…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "You agree not to initiate unwarranted chargebacks, payment reversals, or banking disputes in relatio..."

            ### In the event of any unauthorised or bad-faith char…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "In the event of any unauthorised or bad-faith chargeback attempt, the Company reserves the right to:"

            ### suspend or terminate your account; · revoke access to paid services; · recover outstanding dues and associated ... · take such legal or contractual action as... …
            - **Tag:** `<ul>` | **Type:** `list`
            - **Size:** 720 × 85px
            - **Items:** `suspend or terminate your account;`, `revoke access to paid services;`, `recover outstanding dues and associated ...`, `take such legal or contractual action as...`

            ### suspend or terminate your account;
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px

            ### revoke access to paid services;
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px

            ### recover outstanding dues and associated costs; and/or
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px

            ### take such legal or contractual action as may be pe…
            - **Tag:** `<li>`
            - **Layout:** display: list-item
            - **Size:** 720 × 21px
            - **Text:** "take such legal or contractual action as may be permissible under applicable law."

            ### Nothing contained herein shall restrict your right…
            - **Tag:** `<p>`
            - **Size:** 720 × 42px
            - **Text:** "Nothing contained herein shall restrict your rights under applicable law in cases involving genuine ..."

      ### Footer
      - **Tag:** `<footer>` | **Type:** `footer`
      - **Layout:** display: flex, flex-direction: row
      - **Size:** 720 × 40px
      - **Links:** Back to app
      - **Text:** "© 2026 Deeepr.ai."

        ### © 2026 Deeepr.ai.
        - **Tag:** `<span>`

        ### Examine · Evaluate · Execute.
        - **Tag:** `<span>`

        ### Back to app
        - **Tag:** `<a>`


### Grid Layouts

| Columns | Gap | Width | Child Count |
| --- | --- | --- | --- |
| 2 columns | 12px | 448px | 4 |
| 4 columns | 8px | 404px | 4 |
| 4 columns | 16px | 1152px | 4 |

## Colors

### Brand Colors (most frequent)
- `#e5e7eb`
- `#d4d4d8`
- `#f4f4f5`
- `#e4e4e7`
- `#71717a`
- `#e2e8f0`
- `#22d3ee`
- `#a1a1aa`

### Background Colors
- `#06b6d4` — used 29 times
- `#0a1424` — used 10 times
- `#03060f` — used 8 times
- `#3f3f46` — used 4 times
- `#34d399` — used 2 times
- `#07091a` — used 2 times
- `#22d3ee` — used 1 times
- `#10b981` — used 1 times
- `#fbbf24` — used 1 times

### Text Colors
- `#d4d4d8` — used 330 times
- `#f4f4f5` — used 241 times
- `#e4e4e7` — used 106 times
- `#71717a` — used 66 times
- `#e2e8f0` — used 59 times
- `#a1a1aa` — used 42 times
- `#22d3ee` — used 37 times
- `#52525b` — used 37 times
- `#3f3f46` — used 19 times
- `#fafafa` — used 17 times

### Border Colors
- `#e5e7eb` — used 1012 times
- `#06b6d4` — used 7 times
- `#22d3ee` — used 7 times
- `#34d399` — used 2 times
- `#c084fc` — used 2 times
- `#fbbf24` — used 2 times
- `#fb7185` — used 2 times
- `#e2e8f0` — used 1 times

## Typography

### Font Families
- **Geist Mono** — used on 1040 elements
- **Geist Mono** — used on 49 elements

### Font Sizes
| Size | Frequency |
| --- | --- |
| 13px | 354 elements |
| 16px | 326 elements |
| 12px | 101 elements |
| 9px | 71 elements |
| 11px | 61 elements |
| 10px | 57 elements |
| 15px | 55 elements |
| 48px | 17 elements |
| 14px | 17 elements |
| 8px | 10 elements |
| 18px | 4 elements |
| 32px | 4 elements |
| 64px | 3 elements |
| 28px | 3 elements |
| 80px | 2 elements |
| 68px | 2 elements |
| 17px | 1 elements |
| 52px | 1 elements |

### Font Weights
| Weight | Frequency |
| --- | --- |
| 400 | 870 elements |
| 700 | 174 elements |
| 900 | 37 elements |
| 600 | 7 elements |
| 500 | 1 elements |

### Line Heights
| Value | Frequency |
| --- | --- |
| 21.125px | 351 elements |
| 24px | 325 elements |
| 18px | 94 elements |
| 13.5px | 65 elements |
| 24.375px | 55 elements |
| 15px | 47 elements |
| 16.5px | 45 elements |
| 50.4px | 15 elements |
| 17.875px | 14 elements |
| 12px | 12 elements |

## Spacing

### Padding
| Value (top right bottom left) | Frequency |
| --- | --- |
| `24px 24px 24px 24px` | 6 elements |
| `14px 14px 14px 14px` | 5 elements |
| `8px 14px 8px 14px` | 4 elements |
| `14px 28px 14px 28px` | 4 elements |
| `4px 8px 4px 8px` | 4 elements |
| `14px 12px 14px 12px` | 4 elements |
| `16px 16px 16px 16px` | 3 elements |
| `16px 24px 16px 24px` | 3 elements |
| `4px 12px 4px 12px` | 2 elements |
| `128px 24px 128px 24px` | 2 elements |
| `6px 6px 6px 6px` | 2 elements |
| `6px 12px 6px 12px` | 1 elements |

### Gap
- `8px` — used 39 times
- `12px` — used 7 times
- `10px` — used 5 times
- `4px` — used 4 times
- `20px` — used 3 times
- `2px` — used 1 times
- `16px` — used 1 times
- `32px` — used 1 times
- `48px` — used 1 times

## Border Radius

| Value | Frequency |
| --- | --- |
| 6px | 25 elements |
| 12px | 14 elements |
| 9999px | 13 elements |
| 16px | 7 elements |
| 8px | 5 elements |
| 4px | 2 elements |

## Box Shadows

- `rgb(255, 255, 255) 0px 0px 0px 0px, rgba(255, 255, 255, 0.03) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 20px 60px -20px` — used 2 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 255, 136, 0.18) 0px 0px 40px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 255, 136, 0.7) 0px 0px 14px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 212, 255, 0.18) 0px 0px 22px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(168, 85, 247, 0.18) 0px 0px 22px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 170, 0, 0.18) 0px 0px 22px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 51, 102, 0.18) 0px 0px 22px 0px` — used 1 times
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(16, 185, 129, 0.25) 0px 0px 60px 0px` — used 1 times

## Layout Patterns

| Display | Frequency |
| --- | --- |
| `block` | 638 elements |
| `list-item` | 131 elements |
| `inline` | 116 elements |
| `flex` | 111 elements |
| `table-cell` | 65 elements |
| `table-row` | 13 elements |
| `inline-block` | 8 elements |
| `grid` | 3 elements |
| `inline-flex` | 1 elements |
| `table` | 1 elements |
| `table-header-group` | 1 elements |
| `table-row-group` | 1 elements |

## CSS Custom Properties (Design Tokens)

| Variable | Value |
| --- | --- |
| `--bg-deep` | `#03060f` |
| `--bg-card` | `#07091a` |
| `--bg-elevated` | `#0a0f1e` |
| `--accent-cyan` | `#00d4ff` |
| `--accent-green` | `#0f8` |
| `--accent-red` | `#f36` |
| `--accent-amber` | `#fa0` |
| `--accent-purple` | `#a855f7` |
| `--tw-border-spacing-x` | `0` |
| `--tw-border-spacing-y` | `0` |
| `--tw-translate-x` | `0.25rem` |
| `--tw-translate-y` | `-0.25rem` |
| `--tw-rotate` | `90deg` |
| `--tw-skew-x` | `0` |
| `--tw-skew-y` | `0` |
| `--tw-scale-x` | `1` |
| `--tw-scale-y` | `1` |
| `--tw-pan-x` | `` |
| `--tw-pan-y` | `` |
| `--tw-pinch-zoom` | `` |
| `--tw-scroll-snap-strictness` | `proximity` |
| `--tw-gradient-from-position` | `` |
| `--tw-gradient-via-position` | `` |
| `--tw-gradient-to-position` | `` |
| `--tw-ordinal` | `` |
| `--tw-slashed-zero` | `` |
| `--tw-numeric-figure` | `` |
| `--tw-numeric-spacing` | `tabular-nums` |
| `--tw-numeric-fraction` | `` |
| `--tw-ring-inset` | `` |
| `--tw-ring-offset-width` | `0px` |
| `--tw-ring-offset-color` | `#fff` |
| `--tw-ring-color` | `hsla(0,0%,100%,.03)` |
| `--tw-ring-offset-shadow` | `var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)` |
| `--tw-ring-shadow` | `var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color)` |
| `--tw-shadow` | `0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)` |
| `--tw-shadow-colored` | `0 20px 25px -5px var(--tw-shadow-color),0 8px 10px -6px var(--tw-shadow-color)` |
| `--tw-blur` | `blur(60px)` |
| `--tw-brightness` | `` |
| `--tw-contrast` | `` |

*...and 29 more*

---
*Generated by Design Extractor on 2026-07-18*
