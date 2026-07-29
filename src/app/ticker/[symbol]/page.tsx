import { YahooProvider } from "@/lib/providers/yahoo";
import type { Dividend, EarningsHistoryPeriod, AnalystRatings, InsiderTrade, Ownership as OwnershipData, UpcomingEarnings, StockSplit } from "@/lib/providers";
import { LeadershipSnapshot } from "./components/HeaderSnapshot";
import { ClientHeaderSnapshot } from "./components/ClientHeaderSnapshot";
import { PriceChartWidget } from "./components/PriceChartWidget";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { Ownership } from "./components/Ownership";
import { MarketEvents } from "./components/MarketEvents";
import { Card } from "@/components/ledger/Card";
import { FinancialDeepDive } from "./components/FinancialDeepDive";
import { AnalysisWidget } from "./components/AnalysisWidget";
import { ScoreCard } from "./components/ScoreCard";
import { computeValue, computeGrowth, computeQuality, computeComposite, type StockScores } from "@/lib/scoring";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase(), description: `Financial analysis for ${symbol.toUpperCase()}.` };
}

export default async function TickerPage({
  params,
}: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const provider = new YahooProvider();

  const [
    profileResult, quoteResult, priceHistoryResult, incomeResult, balanceResult,
    cashFlowResult, dividendsResult,
    ownershipResult, upcomingEarningsResult, stockSplitsResult,
    earningsHistoryResult, ratingsResult, insiderTradesResult, metricsResult,
  ] = await Promise.allSettled([
    provider.getProfile(symbol), provider.getQuote(symbol),
    Promise.all([provider.getPriceHistory(symbol, "3M"), provider.getPriceHistory(symbol, "1Y"), provider.getPriceHistory(symbol, "5Y")]),
    provider.getIncomeStatementHistory(symbol), provider.getBalanceSheet(symbol),
    provider.getCashFlow(symbol), provider.getDividends(symbol),
    provider.getOwnership(symbol), provider.getUpcomingEarnings(symbol),
    provider.getStockSplits(symbol), provider.getEarningsHistory(symbol),
    provider.getAnalystRatings(symbol), provider.getInsiderTrades(symbol),
    provider.getMetrics(symbol),
  ]);

  const profile         = profileResult.status         === "fulfilled" ? profileResult.value         : null;
  const quote           = quoteResult.status           === "fulfilled" ? quoteResult.value           : null;
  const income          = incomeResult.status          === "fulfilled" ? incomeResult.value          : [];
  const balance         = balanceResult.status         === "fulfilled" ? balanceResult.value         : null;
  const cashFlow        = cashFlowResult.status        === "fulfilled" ? cashFlowResult.value        : null;
  const dividends       = dividendsResult.status       === "fulfilled" ? dividendsResult.value       : [] as Dividend[];
  const ownership       = ownershipResult.status       === "fulfilled" ? ownershipResult.value       : null as OwnershipData | null;
  const upcomingEarnings = upcomingEarningsResult.status === "fulfilled" ? upcomingEarningsResult.value : null as UpcomingEarnings | null;
  const stockSplits     = stockSplitsResult.status     === "fulfilled" ? stockSplitsResult.value     : [] as StockSplit[];
  const earningsHistory = earningsHistoryResult.status === "fulfilled" ? earningsHistoryResult.value : [] as EarningsHistoryPeriod[];
  const ratings         = ratingsResult.status         === "fulfilled" ? ratingsResult.value         : null as AnalystRatings | null;
  const insiderTrades   = insiderTradesResult.status   === "fulfilled" ? insiderTradesResult.value   : [] as InsiderTrade[];
  const metrics         = metricsResult.status         === "fulfilled" ? metricsResult.value         : null;

  // Compute fundamental scores for ScoreCard
  const scores: StockScores | null = metrics && quote
    ? (() => {
        const v = computeValue(metrics, ratings, quote.currentPrice);
        const g = computeGrowth(metrics);
        const q = computeQuality(metrics);
        return { value: v, growth: g, quality: q, composite: computeComposite(v, g, q) };
      })()
    : null;

  const [ph3M, ph1Y, ph5Y] = priceHistoryResult.status === "fulfilled" ? priceHistoryResult.value : [[], [], []];
  const priceHistoryByRange = { "3M": ph3M, "1Y": ph1Y, "5Y": ph5Y };

  if (!profile && !quote && !metrics) {
    return (<div className="flex items-center justify-center min-h-[400px] p-8"><div className="text-center space-y-3"><h2 className="font-serif text-2xl text-ink">No data found for &ldquo;{symbol}&rdquo;</h2><p className="text-ink-muted text-sm">This ticker may not exist or data is temporarily unavailable.</p></div></div>);
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 pb-8">
          {profile && quote && metrics ? (<><ClientHeaderSnapshot symbol={symbol} profile={profile} quote={quote} metrics={metrics} /><LeadershipSnapshot ceoName={profile.ceoName} />{scores && <div className="mt-5"><ScoreCard scores={scores} /></div>}</>) : (<div className="border border-rule-dashed rounded-sm bg-paper-alt p-4 text-center text-ink-muted text-sm"><p className="font-serif text-lg text-ink mb-1">{symbol}</p><p>Market data temporarily unavailable</p></div>)}
        </div>
      </div>
      <div className="md:col-span-3 space-y-8">
        {quote && (<Card className="p-4 md:p-6" style={{ minHeight: "320px" }}><PriceChartWidget data={priceHistoryByRange} symbol={symbol} currentPrice={quote.currentPrice} isPositive={quote.isPositive} changeAmount={quote.changeAmount} changePercentage={quote.changePercentage} week52High={quote.week52High} week52Low={quote.week52Low} /></Card>)}
        {metrics && (<AnalysisWidget symbol={symbol} companyName={profile?.companyName ?? symbol} metrics={{ marketCap: metrics.marketCap, peRatio: metrics.peRatio, pbRatio: metrics.pbRatio, roe: metrics.roe, dividendYield: metrics.dividendYield, revenueGrowthYoy: metrics.revenueGrowthYoy }} income={income.map(d => ({ period: d.period, revenue: d.revenue, netIncome: d.netIncome, netMargin: d.netMargin, eps: d.eps }))} balance={balance ? { cash: balance.cash, totalAssets: balance.totalAssets, totalLiabilities: balance.totalLiabilities, equity: balance.equity, debt: balance.debt } : null} cashFlow={cashFlow ? { operating: cashFlow.operating, freeCashFlow: cashFlow.freeCashFlow, investing: cashFlow.investing, financing: cashFlow.financing } : null} />)}
        <FinancialDeepDive symbol={symbol} metrics={metrics} income={income} balance={balance} cashFlow={cashFlow} dividends={dividends} currentPrice={quote?.currentPrice} />
        {(ownership && (ownership.institutionalHolders.length > 0 || ownership.topETFs.length > 0)) && <Ownership data={ownership} />}
        {(upcomingEarnings || stockSplits.length > 0) && <MarketEvents upcomingEarnings={upcomingEarnings} stockSplits={stockSplits} />}
        {(earningsHistory.length > 0 || insiderTrades.length > 0 || ratings) && <MarketIntelligence earnings={earningsHistory} ratings={ratings} insiderTrades={insiderTrades} currentPrice={quote?.currentPrice} />}
      </div>
    </div>
  );
}
