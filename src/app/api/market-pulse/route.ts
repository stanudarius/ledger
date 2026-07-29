import { YahooProvider } from "@/lib/providers/yahoo";
import { DISCOVER_UNIVERSE, TICKER_SECTORS } from "@/lib/discover";
import type { Quote } from "@/lib/providers";

interface PulseTicker {
  symbol: string;
  change: number;
  isPositive: boolean;
}

interface PulseSector {
  label: string;
  avgChange: number;
  tickers: PulseTicker[];
}

export const revalidate = 300;

export async function GET() {
  const provider = new YahooProvider();
  const results: Array<{ symbol: string; quote: Quote; sector: string }> = [];

  for (let i = 0; i < DISCOVER_UNIVERSE.length; i += 5) {
    const batch = await Promise.allSettled(
      DISCOVER_UNIVERSE.slice(i, i + 5).map(async (symbol) => ({
        symbol,
        quote: await provider.getQuote(symbol),
        sector: TICKER_SECTORS[symbol] ?? "Other",
      })),
    );
    results.push(
      ...batch
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value),
    );
  }

  if (results.length === 0) {
    return Response.json({ sectors: [], error: "No data available" }, { status: 502 });
  }

  const groups = new Map<string, PulseSector>();
  for (const { symbol, quote, sector } of results) {
    if (!groups.has(sector)) groups.set(sector, { label: sector, avgChange: 0, tickers: [] });
    groups.get(sector)!.tickers.push({
      symbol,
      change: quote.changePercentage,
      isPositive: quote.isPositive,
    });
  }

  const sectors = Array.from(groups.values()).map((sector) => {
    sector.avgChange = sector.tickers.reduce((sum, ticker) => sum + ticker.change, 0) / sector.tickers.length;
    return sector;
  });
  sectors.sort((a, b) => b.avgChange - a.avgChange);

  return Response.json({ sectors });
}
