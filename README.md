# Ledger

A stock research companion that brings fundamentals, price history, and market context into one clean interface. Ledger helps you assess a company's financial health, compare tickers side by side, and keep a watchlist.

**Live:** [ledge.website](https://ledge.website)

> **Disclaimer:** Ledger is a research and learning project. Nothing in it is financial advice.

## Features

- **Ticker pages** – price chart, income statement, balance sheet, cash flow, financial ratios, historical trends, dividend history, ownership, and upcoming market events
- **Scorecards** – transparent 0–100 scores computed from fundamentals and analyst ratings (see [`src/lib/scoring.ts`](src/lib/scoring.ts))
- **AI analysis** – an optional written analysis of each company, generated through OpenRouter
- **Compare** – put multiple tickers next to each other
- **Discover** – browse and filter a universe of stocks
- **Watchlist** – saved per browser using cookies, no account needed
- **Market pulse** – a sector heatmap on the home page, refreshed every five minutes

## Tech stack

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · shadcn/ui · Recharts · OpenAI SDK pointed at OpenRouter

Market data comes from a Yahoo Finance provider behind a `DataProvider` interface (`src/lib/providers`), so another source can be swapped in without touching the UI.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```bash
   # Optional. Enables the AI analysis widget; without it the rest of the app still works.
   OPENROUTER_API_KEY=your_key_here
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
  app/          routes: home, ticker/[symbol], compare, discover, watchlist, api/market-pulse
  actions/      server actions (analysis, ticker validation, user preferences)
  components/   UI building blocks
  lib/          data providers, scoring, indicators, formatting
```
