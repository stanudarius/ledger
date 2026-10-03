import { ComboChart } from "@/components/ledger/Charts"
import { SectionHeading } from "@/components/ledger/SectionHeading"
import { TrendTriangle } from "@/components/ledger/Narrative"

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
}

export function IncomeStatement({ chartData }: IncomeStatementProps) {
  const sortedChartData = chartData;
  const fmtB = (v: number) => v !== 0 ? `$${(v / 1e9).toFixed(2)}B` : "N/A";
  const fmtEps = (v: number) => v !== 0 ? `$${v.toFixed(2)}` : "N/A";
  return (
    <section className="mb-12">
      <SectionHeading number="01 / Income Statement" title="Income Statement" />
      
      <div className="bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col mb-8">
        <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">Revenue &amp; Margin Trend</h3>
          <div className="flex-grow">
            <ComboChart data={sortedChartData.map(d => ({ name: d.period, revenue: d.revenue, netIncome: d.netIncome, margin: d.margin }))} />
          </div>
        </div>

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
