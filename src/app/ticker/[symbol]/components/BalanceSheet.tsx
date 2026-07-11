import { TwinBoxes, ImplicationCallout, QuickSummary, TrendTriangle } from "@/components/ledger/Narrative"
import { DonutChart } from "@/components/ledger/Charts"

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
  previousData?: BalanceSheetData;
  summaryText: string;
  implication: { question: string; answer: string; implication: string };
  highlights: {
    positiveTitle: string;
    positiveText: string;
    negativeTitle: string;
    negativeText: string;
  };
}

export function BalanceSheet({ data, previousData, summaryText, implication, highlights }: BalanceSheetProps) {
  const hasData = data.totalAssets !== 0 || data.totalLiabilities !== 0 || data.shareholdersEquity !== 0;
  if (!hasData) return null;

  const currentRatio = data.currentLiabilities ? data.currentAssets / data.currentLiabilities : 0;
  const debtToEquity = data.shareholdersEquity ? data.totalDebt / data.shareholdersEquity : 0;
  
  const prevCurrentRatio = (previousData && previousData.currentLiabilities) ? previousData.currentAssets / previousData.currentLiabilities : null;
  const prevDebtToEquity = previousData?.shareholdersEquity ? previousData.totalDebt / previousData.shareholdersEquity : null;

  const assetsBreakdown = [
    { name: "Current Assets", value: data.currentAssets, color: "#2E7D46" },
    { name: "Non-Current Assets", value: Math.max(0, data.totalAssets - data.currentAssets), color: "#8B5CF6" }
  ];

  const liabilitiesBreakdown = [
    { name: "Current Liabilities", value: data.currentLiabilities, color: "#C0392B" },
    { name: "Non-Current Liabilities", value: Math.max(0, data.totalLiabilities - data.currentLiabilities), color: "#E08E45" },
    { name: "Equity", value: data.shareholdersEquity, color: "#4C6FE7" }
  ];

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ink mb-6 border-b border-rule pb-2">Balance Sheet</h2>
      
      <QuickSummary text={summaryText} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Cash & Equivalents</div>
          <div className="font-serif text-2xl text-ink flex items-center">
            ${(data.cashAndEquivalents / 1e9).toFixed(2)}B
            {previousData && (
              <TrendTriangle isPositive={data.cashAndEquivalents >= previousData.cashAndEquivalents} className="text-sm ml-2" />
            )}
          </div>
        </div>
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Total Debt</div>
          <div className="font-serif text-2xl text-ink flex items-center">
            ${(data.totalDebt / 1e9).toFixed(2)}B
            {previousData && (
              <TrendTriangle isPositive={data.totalDebt <= previousData.totalDebt} className="text-sm ml-2" />
            )}
          </div>
        </div>
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Current Ratio</div>
          <div className="font-serif text-2xl text-ink flex items-center">
            {currentRatio.toFixed(2)}x
            {prevCurrentRatio !== null && (
              <TrendTriangle isPositive={currentRatio >= prevCurrentRatio} className="text-sm ml-2" />
            )}
          </div>
        </div>
        <div className="border border-rule bg-paper-alt p-4 rounded-sm flex flex-col justify-between">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-2">Debt-to-Equity</div>
          <div className="font-serif text-2xl text-ink flex items-center">
            {debtToEquity.toFixed(2)}
            {prevDebtToEquity !== null && (
              <TrendTriangle isPositive={debtToEquity <= prevDebtToEquity} className="text-sm ml-2" />
            )}
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
    </section>
  )
}
