# Ledger

> A stock research companion that brings fundamentals, price history, and market context into one clean interface.

**Live:** https://ledge.website

> **Disclaimer:** Ledger is a research and learning project. Nothing in it is financial advice.

## What it does

Ledger helps you inspect a company's financial health, compare tickers side by side, and maintain a lightweight watchlist.

## Highlights

- **Ticker pages** — price charts, income statement, balance sheet, cash flow, ratios, historical trends, dividends, ownership, and upcoming events
- **Scorecards** — transparent 0–100 scores based on fundamentals and analyst ratings; see src/lib/scoring.ts
- **AI analysis** — optional written company analysis through OpenRouter
- **Compare** — evaluate multiple tickers side by side
- **Discover** — browse and filter a stock universe
- **Watchlist** — browser-persistent watchlist with no account required
- **Market pulse** — sector heatmap refreshed every five minutes

## Tech stack

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · shadcn/ui · Recharts · OpenAI SDK pointed at OpenRouter

Market data is isolated behind a DataProvider interface under src/lib/providers, so the UI is not tightly coupled to a single market-data source.

## Getting started

    npm install

Optional: create a .env file in the project root to enable AI analysis:

    OPENROUTER_API_KEY=your_key_here

Start the development server:

    npm run dev

Then open http://localhost:3000.

## Scripts

| Command | Purpose |
| --- | --- |
| npm run dev | Start the development server |
| npm run build | Create the production build |
| npm start | Serve the production build |
| npm run lint | Run ESLint |

## Project structure

    src/
      app/          home, ticker, compare, discover, watchlist, market pulse
      actions/      server actions for analysis and preferences
      components/   reusable UI building blocks
      lib/          data providers, scoring, indicators, formatting
