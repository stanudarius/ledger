import { TwinBoxes, ImplicationCallout, QuickSummary, TrendTriangle } from "@/components/ledger/Narrative"
import { ComboChart, DonutChart } from "@/components/ledger/Charts"

interface IncomeStatementData {
  period: string;
  revenue: number;
  operatingExpense: number;
  netIncome: number;
  eps: number;
  ebitda: number;
  margin: number;
}

interface IncomeStatementProps {
  chartData: IncomeStatementData[];
  revenueBreakdown: { name: string; value: number; color: string }[];
  summaryText: string;
  implication: { question: string; answer: string; implication: string };
  highlights: {
    positiveTitle: string;
    positiveText: string;
    negativeTitle: string;
    negativeText: string;
  };
}

export function IncomeStatement({ chartData, revenueBreakdown, summaryText, implication, highlights }: IncomeStatementProps) {
  const sortedChartData = [...chartData].sort((a, b) => a.period.localeCompare(b.period));
  const fmtB = (v: number) => v !== 0 ? `$${(v / 1e9).toFixed(2)}B` : "N/A";
  const fmtEps = (v: number) => v !== 0 ? `$${v.toFixed(2)}` : "N/A";
  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ink mb-6 border-b border-rule pb-2">Income Statement</h2>
      
      <QuickSummary text={summaryText} />
      
      <div className={`grid grid-cols-1 ${revenueBreakdown.length > 0 ? 'lg:grid-cols-3' : ''} gap-6 mb-8`}>
        <div className={`${revenueBreakdown.length > 0 ? 'lg:col-span-2' : ''} bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col`}>
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">Revenue &amp; Margin Trend</h3>
          <div className="flex-grow">
            <ComboChart data={sortedChartData.map(d => ({ name: d.period, revenue: d.revenue, netIncome: d.netIncome, margin: d.margin }))} />
          </div>
        </div>
        {revenueBreakdown.length > 0 && (
          <div className="bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col">
            <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">Revenue Breakdown</h3>
            <div className="flex-grow flex items-center justify-center">
              <DonutChart data={revenueBreakdown} />
            </div>
          </div>
        )}
      </div>

      <TwinBoxes 
        positiveTitle={highlights.positiveTitle}
        positiveText={highlights.positiveText}
        negativeTitle={highlights.negativeTitle}
        negativeText={highlights.negativeText}
      />

      <ImplicationCallout 
        question={implication.question}
        answer={implication.answer}
        implication={implication.implication}
      />

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2">Period</th>
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2 text-right">Revenue</th>
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2 text-right">OpEx</th>
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2 text-right">EBITDA</th>
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2 text-right">Net Income</th>
              <th scope="col" className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold py-2 text-right">EPS</th>
            </tr>
          </thead>
          <tbody>
            {sortedChartData.map((row, i) => {
              const prevRow = i > 0 ? sortedChartData[i - 1] : null;
              const revGrowth = (prevRow && prevRow.revenue !== 0) ? ((row.revenue - prevRow.revenue) / prevRow.revenue) * 100 : 0;
              const niGrowth = (prevRow && prevRow.netIncome !== 0) ? ((row.netIncome - prevRow.netIncome) / Math.abs(prevRow.netIncome)) * 100 : 0;
              
              return (
                <tr key={row.period} className="border-b border-rule-dashed hover:bg-paper-alt transition-colors">
                  <td className="py-3 font-serif text-ink">{row.period}</td>
                  <td className="py-3 text-right text-ink">
                    {fmtB(row.revenue)}
                    {prevRow && <TrendTriangle isPositive={revGrowth > 0} />}
                  </td>
                  <td className="py-3 text-right text-ink">{fmtB(row.operatingExpense)}</td>
                  <td className="py-3 text-right text-ink">{fmtB(row.ebitda)}</td>
                  <td className="py-3 text-right text-ink">
                    {fmtB(row.netIncome)}
                    {prevRow && <TrendTriangle isPositive={niGrowth > 0} />}
                  </td>
                  <td className="py-3 text-right text-ink font-serif">{fmtEps(row.eps)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
