import { Metadata } from "next";
import { YahooProvider } from "@/lib/providers/yahoo";
import type { Metrics } from "@/lib/providers";
import { DISCOVER_UNIVERSE, type ScoredStock } from "@/lib/discover";
import { computeValue, computeGrowth, computeQuality, computeComposite } from "@/lib/scoring";
import { DiscoverTable } from "./components/DiscoverTable";

export const metadata: Metadata = {
  title: "Discover Opportunities",
  description: "Find undervalued stocks and new investment opportunities.",
};

export const revalidate = 300;

const BATCH_SIZE = 5;

async function fetchBatch(
  provider: YahooProvider,
  symbols: string[],
): Promise<ScoredStock[]> {
  const settled = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const [profile, quote, m, ratings] = await Promise.all([
        provider.getProfile(symbol),
        provider.getQuote(symbol),
        provider.getMetrics(symbol).catch((): Metrics | null => null),
        provider.getAnalystRatings(symbol).catch(() => null),
      ]);

      if (!m) return null;
      const metrics = m;

      const valueScore = computeValue(metrics, ratings, quote.currentPrice);
      const growthScore = computeGrowth(metrics);
      const qualityScore = computeQuality(metrics);
      const composite = computeComposite(valueScore, growthScore, qualityScore);

      // Analyst upside to mean target
      const upside =
        ratings && ratings.targetMean > 0 && quote.currentPrice > 0
          ? ((ratings.targetMean - quote.currentPrice) / quote.currentPrice) * 100
          : null;

      return {
        symbol,
        companyName: profile.companyName,
        sector: profile.sector || "Other",
        quote,
        metrics,
        ratings,
        scores: { value: valueScore, growth: growthScore, quality: qualityScore, composite },
        upside,
      } as ScoredStock;
    })
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<ScoredStock> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

export default async function DiscoverPage() {
  const provider = new YahooProvider();

  const stocks: ScoredStock[] = [];
  for (let i = 0; i < DISCOVER_UNIVERSE.length; i += BATCH_SIZE) {
    stocks.push(...await fetchBatch(provider, DISCOVER_UNIVERSE.slice(i, i + BATCH_SIZE)));
  }

  // Sort by composite score descending
  stocks.sort((a, b) => b.scores.composite - a.scores.composite);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="border-b border-rule pb-4">
        <h1 className="font-serif text-4xl tracking-tighter text-ink">
          Discover Opportunities
        </h1>
        <p className="text-ink-muted font-sans text-sm mt-2 max-w-xl">
          Scored by fundamentals: P/E & P/B for value, revenue growth & ROE for momentum, profitability & dividends for quality.
        </p>
      </div>

      {stocks.length === 0 ? (
        <div className="p-12 text-center text-ink-muted border border-rule-dashed rounded-sm bg-paper-alt">
          Unable to load stock data. Please try again later.
        </div>
      ) : (
        <>
          <div className="text-xs text-ink-muted">
            Showing {stocks.length} of {DISCOVER_UNIVERSE.length} stocks
          </div>
          <DiscoverTable stocks={stocks} />
        </>
      )}
    </div>
  );
}
