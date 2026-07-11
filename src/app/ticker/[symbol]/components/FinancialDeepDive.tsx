import { generateStockAnalysis } from "@/lib/generate";
import { IncomeStatement } from "./IncomeStatement";
import { BalanceSheet } from "./BalanceSheet";
import { CashFlow } from "./CashFlow";
import { FinancialRatios } from "./FinancialRatios";
import { HistoricalTrends } from "./HistoricalTrends";
import { DividendHistory } from "./DividendHistory";
import { FallbackProvider } from "@/lib/providers/fallback";
import type { DataProvider } from "@/lib/providers";
import type {
  Metrics,
  IncomeStatementPeriod,
  BalanceSheet as BalanceSheetData,
  CashFlow as CashFlowData,
  Dividend,
} from "@/lib/providers";

interface FinancialDeepDiveProps {
  symbol: string;
  companyName: string;
  metrics: Metrics | null;
  income: IncomeStatementPeriod[];
  balance: BalanceSheetData | null;
  cashFlow: CashFlowData | null;
  revenueBreakdown: { name: string; value: number; color: string }[];
  provider?: DataProvider | null;
}

export async function FinancialDeepDive({
  symbol,
  companyName,
  metrics,
  income,
  balance,
  cashFlow,
  revenueBreakdown,
  provider,
}: FinancialDeepDiveProps) {
  const p = provider ?? new FallbackProvider();
  const [dividends, aiAnalysis] = await Promise.all([
    p.getDividends(symbol).catch(() => [] as Dividend[]),
    generateStockAnalysis(
      symbol,
      companyName,
      metrics ? {
        marketCap: metrics.marketCap,
        peRatio: metrics.peRatio,
        pbRatio: metrics.pbRatio,
        roe: metrics.roe,
        dividendYield: metrics.dividendYield,
        revenueGrowthYoy: metrics.revenueGrowthYoy,
      } : {},
      income.map((d) => ({
        period: d.period,
        revenue: d.revenue,
        netIncome: d.netIncome,
        netMargin: d.netMargin,
        eps: d.eps,
      })),
      balance ? {
        cash: balance.cash,
        totalAssets: balance.totalAssets,
        totalLiabilities: balance.totalLiabilities,
        equity: balance.equity,
        debt: balance.debt,
      } : {},
      cashFlow ? {
        operating: cashFlow.operating,
        freeCashFlow: cashFlow.freeCashFlow,
        investing: cashFlow.investing,
        financing: cashFlow.financing,
      } : {}
    ),
  ]);

  const fallback = {
    summary: "Automated analysis is unavailable at this time.",
    positiveTitle: "N/A",
    positiveText: "Analysis unavailable.",
    negativeTitle: "N/A",
    negativeText: "Analysis unavailable.",
    question: "N/A",
    answer: "Analysis unavailable.",
    implication: "Check back later.",
  };

  const inc = aiAnalysis?.incomeStatement ?? fallback;
  const bal = aiAnalysis?.balanceSheet ?? fallback;

  return (
    <>
      {aiAnalysis?.overall ? (
        <div className="border border-rule rounded-sm bg-paper-alt text-ink p-6 flex flex-col md:flex-row gap-6 md:items-start">
          <div className="flex-1">

            <p className="font-serif text-xl text-ink leading-snug mb-4">
              {aiAnalysis.overall.headline}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-2 border-positive/50 pl-3">
                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-positive mb-1">Bull Case</div>
                <p className="text-sm text-ink-muted leading-relaxed">{aiAnalysis.overall.bull}</p>
              </div>
              <div className="border-l-2 border-negative/50 pl-3">
                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-negative mb-1">Bear Case</div>
                <p className="text-sm text-ink-muted leading-relaxed">{aiAnalysis.overall.bear}</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-center md:text-right">
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-2">Rating</div>
            <div className={`font-serif text-2xl font-bold ${
              aiAnalysis.overall.rating?.includes("buy") ? "text-positive" :
              aiAnalysis.overall.rating?.includes("sell") ? "text-negative" :
              "text-ink"
            }`}>
              {aiAnalysis.overall.rating?.replace(/_/g, " ").toUpperCase() ?? "HOLD"}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-rule-dashed rounded-sm bg-paper-alt p-4 text-center">
          <p className="text-sm text-ink-muted">Automated analysis is currently unavailable. Financial data is still displayed below.</p>
        </div>
      )}

      <IncomeStatement
        chartData={income.map((item) => ({ ...item, margin: item.netMargin }))}
        revenueBreakdown={revenueBreakdown}
        summaryText={inc.summary}
        implication={{
          question: inc.question,
          answer: inc.answer,
          implication: inc.implication,
        }}
        highlights={{
          positiveTitle: inc.positiveTitle,
          positiveText: inc.positiveText,
          negativeTitle: inc.negativeTitle,
          negativeText: inc.negativeText,
        }}
      />

      {balance && (
        <BalanceSheet
          data={{
            period: "Current",
            cashAndEquivalents: balance.cash,
            totalDebt: balance.debt,
            currentAssets: balance.assetsBreakdown.find((a) =>
              a.label.includes("Current")
            )?.value ?? balance.cash,
            currentLiabilities: balance.liabilitiesBreakdown.find((l) =>
              l.label.includes("Current")
            )?.value ?? 0,
            totalAssets: balance.totalAssets,
            totalLiabilities: balance.totalLiabilities,
            shareholdersEquity: balance.equity,
          }}
          summaryText={bal.summary}
          implication={{
            question: bal.question,
            answer: bal.answer,
            implication: bal.implication,
          }}
          highlights={{
            positiveTitle: bal.positiveTitle,
            positiveText: bal.positiveText,
            negativeTitle: bal.negativeTitle,
            negativeText: bal.negativeText,
          }}
        />
      )}

      {cashFlow && <CashFlow data={cashFlow} />}

      {metrics && (
        <FinancialRatios
          metrics={metrics}
          latestIncome={income.length > 0 ? income[income.length - 1] : null}
          balance={balance}
        />
      )}

      <HistoricalTrends income={income} />

      {metrics && (
        <DividendHistory metrics={metrics} symbol={symbol} dividends={dividends} />
      )}
    </>
  );
}
