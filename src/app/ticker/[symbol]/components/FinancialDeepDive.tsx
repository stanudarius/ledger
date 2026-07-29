import { IncomeStatement } from "./IncomeStatement";
import { BalanceSheet } from "./BalanceSheet";
import { CashFlow } from "./CashFlow";
import { FinancialRatios } from "./FinancialRatios";
import { HistoricalTrends } from "./HistoricalTrends";
import { DividendHistory } from "./DividendHistory";
import type { Metrics, IncomeStatementPeriod, BalanceSheet as BalanceSheetData, CashFlow as CashFlowData, Dividend } from "@/lib/providers";

interface FinancialDeepDiveProps {
  symbol: string;
  metrics: Metrics | null;
  income: IncomeStatementPeriod[];
  balance: BalanceSheetData | null;
  cashFlow: CashFlowData | null;
  dividends: Dividend[];
  currentPrice?: number;
}

export function FinancialDeepDive({ symbol, metrics, income, balance, cashFlow, dividends, currentPrice }: FinancialDeepDiveProps) {
  const latestIncome = income.at(-1) ?? null;
  const currentAssets = balance?.assetsBreakdown.find((a) => a.label.includes("Current"))?.value ?? balance?.cash ?? 0;
  const currentLiabilities = balance?.liabilitiesBreakdown.find((l) => l.label.includes("Current"))?.value ?? 0;

  return (
    <>
      <IncomeStatement chartData={income.map((item) => ({ ...item, margin: item.netMargin }))} />
      {balance && (
        <BalanceSheet
          data={{
            period: "Current",
            cashAndEquivalents: balance.cash,
            totalDebt: balance.debt,
            currentAssets,
            currentLiabilities,
            totalAssets: balance.totalAssets,
            totalLiabilities: balance.totalLiabilities,
            shareholdersEquity: balance.equity,
          }}
        />
      )}
      {cashFlow && <CashFlow data={cashFlow} />}
      {metrics && <FinancialRatios metrics={metrics} latestIncome={latestIncome} balance={balance} />}
      <HistoricalTrends income={income} />
      {metrics && <DividendHistory metrics={metrics} symbol={symbol} dividends={dividends} currentPrice={currentPrice} />}
    </>
  );
}
