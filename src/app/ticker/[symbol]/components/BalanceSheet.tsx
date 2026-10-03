import { DonutChart } from "@/components/ledger/Charts"
import { formatBillions } from "@/lib/format"
import { SectionHeading } from "@/components/ledger/SectionHeading"
import type { ChartColorKey } from "@/lib/chartColors";

interface BalanceSheetData {
  period: string;
  cashAndEquivalents: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
}

interface BalanceSheetProps {
  data: BalanceSheetData;
}

export function BalanceSheet({ data }: BalanceSheetProps) {
  const hasData = data.totalAssets !== 0 || data.totalLiabilities !== 0 || data.shareholdersEquity !== 0;
  if (!hasData) return null;

  const assetsBreakdown: { name: string; value: number; color: ChartColorKey }[] = [
    { name: "Current Assets", value: data.currentAssets, color: "positive" },
    { name: "Non-Current Assets", value: Math.max(0, data.totalAssets - data.currentAssets), color: "purple" },
  ];

  const liabilitiesBreakdown: { name: string; value: number; color: ChartColorKey }[] = [
    { name: "Current Liabilities", value: data.currentLiabilities, color: "negative" },
    { name: "Non-Current Liabilities", value: Math.max(0, data.totalLiabilities - data.currentLiabilities), color: "orange" },
    { name: "Equity", value: data.shareholdersEquity, color: "blue" }
  ];

  return (
    <section className="mb-12">
      <SectionHeading number="02 / Balance Sheet" title="Balance Sheet" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Cash & Equivalents</div>
          <div className="font-serif text-2xl text-ink">
            {formatBillions(data.cashAndEquivalents)}
          </div>
        </div>
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Total Debt</div>
          <div className="font-serif text-2xl text-ink">
            {formatBillions(data.totalDebt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col">
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">Assets Distribution</h3>
          <div className="flex-grow flex items-center justify-center">
            <DonutChart data={assetsBreakdown} />
          </div>
        </div>
        <div className="bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col">
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">Liabilities & Equity</h3>
          <div className="flex-grow flex items-center justify-center">
            <DonutChart data={liabilitiesBreakdown} />
          </div>
        </div>
      </div>
    </section>
  )
}
