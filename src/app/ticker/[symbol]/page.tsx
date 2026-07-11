import { FallbackProvider } from "@/lib/providers/fallback";
import { DataProvider } from "@/lib/providers";
import { HeaderSnapshot, LeadershipSnapshot } from "./components/HeaderSnapshot";
import { PriceChartWidget } from "./components/PriceChartWidget";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { Ownership } from "./components/Ownership";
import { MarketEvents } from "./components/MarketEvents";
import { Card } from "@/components/ledger/Card";
import { FinancialDeepDive } from "./components/FinancialDeepDive";
import { Suspense } from "react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase(), description: `Financial analysis for ${symbol.toUpperCase()}.` };
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const provider = new FallbackProvider();

  const [
    profileResult, quoteResult,
    priceHistoryResult, incomeResult, balanceResult,
    cashFlowResult, segmentsResult,
  ] = await Promise.allSettled([
    provider.getProfile(symbol),
    provider.getQuote(symbol),
    Promise.all([
      provider.getPriceHistory(symbol, "3M"),
      provider.getPriceHistory(symbol, "1Y"),
      provider.getPriceHistory(symbol, "5Y"),
    ]),
    provider.getIncomeStatementHistory(symbol),
    provider.getBalanceSheet(symbol),
    provider.getCashFlow(symbol),
    provider.getRevenueSegments(symbol),
  ]);

  const profile  = profileResult.status  === "fulfilled" ? profileResult.value  : null;
  const quote    = quoteResult.status    === "fulfilled" ? quoteResult.value    : null;
  const income   = incomeResult.status   === "fulfilled" ? incomeResult.value   : [];
  const balance  = balanceResult.status  === "fulfilled" ? balanceResult.value  : null;
  const cashFlow = cashFlowResult.status === "fulfilled" ? cashFlowResult.value : null;
  const segments = segmentsResult.status === "fulfilled" ? segmentsResult.value : [];

  // Metrics derived AFTER raw data — internal fetches hit React cache + TTL cache (zero new HTTP).
  let metrics = null;
  if (profile && quote) {
    try {
      metrics = await provider.getMetrics(symbol);
    } catch { /* graceful degradation */ }
  }

  const [ph3M, ph1Y, ph5Y] = priceHistoryResult.status === "fulfilled"
    ? priceHistoryResult.value : [[], [], []];

  const priceHistoryByRange = { "3M": ph3M, "1Y": ph1Y, "5Y": ph5Y };

  const CHART_COLORS = ["#4C6FE7", "#8B5CF6", "#E08E45", "#2E7D46", "#1A1A1A"];
  const revenueBreakdown = segments.map((s, i) => ({
    name: s.label, value: s.value, color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (!profile && !quote && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-2xl text-ink">No data found for &ldquo;{symbol}&rdquo;</h2>
          <p className="text-ink-muted text-sm">This ticker may not exist or data is temporarily unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 pb-8">
          {profile && quote && metrics ? (
            <>
              <HeaderSnapshot symbol={symbol} profile={profile} quote={quote} metrics={metrics} />
              <Suspense fallback={<div className="mt-5 h-24 bg-paper-alt border border-rule-dashed rounded-sm animate-pulse" />}>
                <LeadershipSnapshot symbol={symbol} ceoName={profile.ceoName} provider={provider} />
              </Suspense>
            </>
          ) : (
            <div className="border border-rule-dashed rounded-sm bg-paper-alt p-4 text-center text-ink-muted text-sm">
              <p className="font-serif text-lg text-ink mb-1">{symbol}</p>
              <p>Market data temporarily unavailable</p>
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-3 space-y-8">
        {quote && (
          <Card className="p-4 md:p-6" style={{ minHeight: "320px" }}>
            <PriceChartWidget
              data={priceHistoryByRange} symbol={symbol}
              currentPrice={quote.currentPrice} isPositive={quote.isPositive}
              changeAmount={quote.changeAmount} changePercentage={quote.changePercentage}
              week52High={quote.week52High} week52Low={quote.week52Low}
            />
          </Card>
        )}

        <Suspense fallback={
          <div className="space-y-8 animate-pulse">
            <div className="h-40 bg-paper-alt border border-rule-dashed rounded-sm" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-48 bg-paper-alt rounded-sm" />
                <div className="h-64 bg-paper-alt border border-rule-dashed rounded-sm" />
              </div>
            ))}
          </div>
        }>
          <FinancialDeepDive
            symbol={symbol}
            companyName={profile?.companyName ?? symbol}
            metrics={metrics}
            income={income}
            balance={balance}
            cashFlow={cashFlow}
            revenueBreakdown={revenueBreakdown}
            provider={provider}
          />
        </Suspense>

        <Suspense fallback={<div className="h-48 bg-paper-alt border border-rule-dashed rounded-sm animate-pulse" />}>
          <MarketIntelligenceSection symbol={symbol} provider={new FallbackProvider()} />
        </Suspense>

        <Suspense fallback={<div className="h-48 bg-paper-alt border border-rule-dashed rounded-sm animate-pulse" />}>
          <MarketEventsSection symbol={symbol} provider={new FallbackProvider()} />
        </Suspense>

        <Suspense fallback={<div className="h-48 bg-paper-alt border border-rule-dashed rounded-sm animate-pulse" />}>
          <OwnershipSection symbol={symbol} provider={new FallbackProvider()} />
        </Suspense>
      </div>
    </div>
  );
}

async function OwnershipSection({ symbol, provider }: { symbol: string; provider: DataProvider }) {
  let data;
  try {
    data = await provider.getOwnership(symbol);
  } catch {
    return null;
  }
  if (!data || (!data.institutionalHolders.length && !data.topETFs.length)) return null;
  return <Ownership data={data} />;
}

async function MarketEventsSection({ symbol, provider }: { symbol: string; provider: DataProvider }) {
  let upcomingEarnings: import("@/lib/providers").UpcomingEarnings | null = null;
  let stockSplits: import("@/lib/providers").StockSplit[] = [];
  try {
    const [earningsResult, splitsResult] = await Promise.allSettled([
      provider.getUpcomingEarnings(symbol),
      provider.getStockSplits(symbol),
    ]);
    if (earningsResult.status === "fulfilled") upcomingEarnings = earningsResult.value;
    if (splitsResult.status === "fulfilled") stockSplits = splitsResult.value;
  } catch {}
  return <MarketEvents upcomingEarnings={upcomingEarnings} stockSplits={stockSplits} />;
}

async function MarketIntelligenceSection({ symbol, provider }: { symbol: string; provider: DataProvider }) {
  let earnings: import("@/lib/providers").EarningsHistoryPeriod[] = [];
  let ratings: import("@/lib/providers").AnalystRatings | null = null;
  let insiderTrades: import("@/lib/providers").InsiderTrade[] = [];

  try {
    const [earningsResult, ratingsResult, tradesResult] = await Promise.allSettled([
      provider.getEarningsHistory(symbol),
      provider.getAnalystRatings(symbol),
      provider.getInsiderTrades(symbol),
    ]);
    if (earningsResult.status === "fulfilled") earnings = earningsResult.value;
    if (ratingsResult.status === "fulfilled") ratings = ratingsResult.value;
    if (tradesResult.status === "fulfilled") insiderTrades = tradesResult.value;
  } catch {}

  if (earnings.length === 0 && insiderTrades.length === 0 && !ratings) return null;

  return <MarketIntelligence earnings={earnings} ratings={ratings} insiderTrades={insiderTrades} />;
}
