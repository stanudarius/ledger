import type { Metrics, Dividend } from "@/lib/providers";

interface DividendHistoryProps {
  metrics: Metrics;
  symbol: string;
  dividends?: Dividend[];
}

export function DividendHistory({ metrics, symbol, dividends = [] }: DividendHistoryProps) {
  const divs = dividends ?? [];
  const dividendYield = metrics.dividendYield ?? 0;
  const hasDividend = dividendYield > 0 || divs.length > 0;

  if (!hasDividend) {
    return null;
  }

  const price = metrics.peRatio > 0 && metrics.eps > 0 ? metrics.peRatio * metrics.eps : 0;
  const annualDividend = price > 0 ? dividendYield * price : 0;
  const payoutRatio =
    metrics.eps > 0 && annualDividend > 0 ? (annualDividend / metrics.eps) * 100 : null;

  const dividendGrowthEstimate =
    metrics.revenueGrowthYoy > 0 ? metrics.revenueGrowthYoy * 0.4 : 0;

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ink mb-6 border-b border-rule pb-2">
        Dividends &amp; Yield
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Dividend Yield
          </div>
          <div className="font-serif text-xl text-ink">
            {(dividendYield * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-sans">
            Annual
          </div>
        </div>

        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Annual Dividend
          </div>
          <div className="font-serif text-xl text-ink">
            ${annualDividend.toFixed(2)}
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-sans">
            Per Share
          </div>
        </div>

        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Payout Ratio
          </div>
          <div className="font-serif text-xl text-ink">
            {payoutRatio !== null ? `${payoutRatio.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-sans">
            Div / EPS
          </div>
        </div>

        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Est. Div Growth
          </div>
          <div className="font-serif text-xl text-ink">
            {dividendGrowthEstimate > 0
              ? `+${dividendGrowthEstimate.toFixed(1)}%`
              : "—"}
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-sans">
            Approx. YoY
          </div>
        </div>
      </div>

      <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4">
        <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-3">
          Dividend Safety Assessment
        </h3>
        <div className="space-y-2 text-sm text-ink-muted leading-relaxed">
          {payoutRatio !== null && payoutRatio < 50 ? (
            <p>
              The payout ratio of{" "}
              <span className="text-positive font-bold">
                {payoutRatio.toFixed(0)}%
              </span>{" "}
              suggests ample room for dividend growth and sustainability. The
              company retains over half of its earnings for reinvestment.
            </p>
          ) : payoutRatio !== null && payoutRatio < 80 ? (
            <p>
              The payout ratio of{" "}
              <span className="text-ink font-bold">
                {payoutRatio.toFixed(0)}%
              </span>{" "}
              is moderate. The dividend appears sustainable but leaves limited
              room for increases without earnings growth.
            </p>
          ) : payoutRatio !== null ? (
            <p>
              The payout ratio of{" "}
              <span className="text-negative font-bold">
                {payoutRatio.toFixed(0)}%
              </span>{" "}
              is elevated and may be at risk if earnings decline.
            </p>
          ) : (
            <p>
              {symbol} pays a dividend yield of{" "}
              <span className="text-ink font-bold">
                {(dividendYield * 100).toFixed(2)}%
              </span>
              . Monitor earnings trends to assess long-term sustainability.
            </p>
          )}
        </div>
      </div>

      {divs.length > 0 && (
        <div className="mt-6 border border-rule-dashed bg-paper-alt rounded-sm p-4">
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-3">
            Recent Dividend Payments
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rule-dashed">
                  <th className="pb-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted">Date</th>
                  <th className="pb-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {divs.slice(0, 10).map((div, i) => (
                  <tr key={i} className="border-b border-rule-dashed last:border-0 hover:bg-paper transition-colors">
                    <td className="py-2 font-serif text-sm text-ink">{div.date}</td>
                    <td className="py-2 text-right font-serif text-sm font-bold text-brand">${div.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
