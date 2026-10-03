import type { Metrics, IncomeStatementPeriod, BalanceSheet } from "@/lib/providers";
import { TrendTriangle } from "@/components/ledger/Narrative";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ledger/Card";
import { SectionHeading } from "@/components/ledger/SectionHeading";

interface FinancialRatiosProps {
  metrics: Metrics;
  latestIncome: IncomeStatementPeriod | null;
  balance: BalanceSheet | null;
}

function RatioCard({
  label,
  value,
  sublabel,
  trend,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { isPositive: boolean } | null;
}) {
  return (
    <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between hover:border-ink/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
      <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
        {label}
      </div>
      <div className="font-serif text-xl text-ink flex items-center gap-1.5">
        {value}
        {trend && <TrendTriangle isPositive={trend.isPositive} />}
      </div>
      {sublabel && (
        <div className="text-[10px] text-ink-muted mt-1 font-sans">{sublabel}</div>
      )}
    </div>
  );
}

export function FinancialRatios({ metrics, latestIncome, balance }: FinancialRatiosProps) {

  const grossMargin =
    latestIncome && latestIncome.revenue > 0 && typeof latestIncome.grossProfit === 'number'
      ? (latestIncome.grossProfit / latestIncome.revenue) * 100
      : null;
  const operatingMargin =
    latestIncome && latestIncome.revenue > 0 && typeof latestIncome.operatingIncome === 'number'
      ? (latestIncome.operatingIncome / latestIncome.revenue) * 100
      : null;
  const netMargin = latestIncome?.netMargin ?? null;

  const currentAssets =
    balance?.assetsBreakdown.find((a) => a.label.includes("Current"))?.value ?? 0;
  const currentLiabilities = Math.abs(
    balance?.liabilitiesBreakdown.find((l) => l.label.includes("Current"))?.value ?? 0
  );
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
  const quickRatio =
    currentLiabilities > 0 && balance
      ? balance.cash / currentLiabilities
      : null;

  const debtToEquity =
    balance && balance.equity > 0 ? Math.abs(balance.debt) / balance.equity : null;

  const roe = (metrics.roe !== 0) ? metrics.roe : null;
  const roa = (metrics.roa !== 0) ? metrics.roa : null;
  
  const investedCapital = balance ? balance.equity + Math.abs(balance.debt) : 0;
  const roic =
    latestIncome && investedCapital > 0
      ? (latestIncome.netIncome / investedCapital) * 100
      : null;

  const assetTurnover =
    balance && latestIncome && balance.totalAssets > 0
      ? latestIncome.revenue / balance.totalAssets
      : null;

  return (
    <section className="mb-12">
      <SectionHeading number="04 / Financial Ratios" title="Financial Ratios" />

      <div className="space-y-6">
        {/* Profitability */}
        <Card>
          <CardHeader className="border-b border-rule-dashed pb-3">
            <CardTitle>Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <RatioCard
                label="Gross Margin"
                value={grossMargin !== null ? `${grossMargin.toFixed(1)}%` : "N/A"}
                sublabel="Gross Profit / Revenue"
              />
              <RatioCard
                label="Operating Margin"
                value={operatingMargin !== null ? `${operatingMargin.toFixed(1)}%` : "N/A"}
                sublabel="Op. Income / Revenue"
              />
              <RatioCard
                label="Net Margin"
                value={netMargin !== null ? `${netMargin.toFixed(1)}%` : "N/A"}
                sublabel="Net Income / Revenue"
              />
              <RatioCard
                label="ROIC"
                value={roic !== null ? `${roic.toFixed(1)}%` : "N/A"}
                sublabel="Return on Invested Capital"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liquidity & Leverage */}
        <Card>
          <CardHeader className="border-b border-rule-dashed pb-3">
            <CardTitle>Liquidity &amp; Leverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <RatioCard
                label="Current Ratio"
                value={currentRatio !== null ? `${currentRatio.toFixed(2)}x` : "N/A"}
                sublabel="Current Assets / Current Liab."
              />
              <RatioCard
                label="Cash Ratio"
                value={quickRatio !== null ? `${quickRatio.toFixed(2)}x` : "N/A"}
                sublabel="Cash / Current Liab."
              />
              <RatioCard
                label="Debt-to-Equity"
                value={debtToEquity !== null ? debtToEquity.toFixed(2) : "N/A"}
                sublabel="Total Debt / Equity"
              />
              <RatioCard
                label="Asset Turnover"
                value={assetTurnover !== null ? assetTurnover.toFixed(2) : "N/A"}
                sublabel="Revenue / Total Assets"
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns */}
        <Card>
          <CardHeader className="border-b border-rule-dashed pb-3">
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <RatioCard
                label="ROE"
                value={roe !== null ? `${roe.toFixed(1)}%` : "N/A"}
                sublabel="Return on Equity"
              />
              <RatioCard
                label="ROA"
                value={roa !== null ? `${roa.toFixed(1)}%` : "N/A"}
                sublabel="Return on Assets"
              />
              <RatioCard
                label="EPS (TTM)"
                value={metrics.eps !== null && metrics.eps !== undefined ? (metrics.eps < 0 ? `-$${Math.abs(metrics.eps).toFixed(2)}` : `$${metrics.eps.toFixed(2)}`) : "N/A"}
                sublabel="Earnings Per Share"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
