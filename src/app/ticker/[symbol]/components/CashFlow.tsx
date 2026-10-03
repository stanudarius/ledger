import { CashFlow as CashFlowData } from "@/lib/providers";
import { ImplicationCallout, QuickSummary, TwinBoxes } from "@/components/ledger/Narrative";
import { CashFlowBarChart } from "@/components/ledger/Charts";
import { formatCompactCurrency } from "@/lib/format";
import { SectionHeading } from "@/components/ledger/SectionHeading";
import type { ChartColorKey } from "@/lib/chartColors";

interface CashFlowProps {
  data: CashFlowData;
}

export function CashFlow({ data }: CashFlowProps) {
  const hasData = data.operating !== 0 || data.investing !== 0 || data.financing !== 0 || data.freeCashFlow !== 0;
  if (!hasData) return null;

  const valueClass = (value: number) => {
    if (value > 0) return "text-positive";
    if (value < 0) return "text-negative";
    return "text-ink";
  };

  const chartData: { name: string; value: number; color: ChartColorKey }[] = [
    { name: "Operating",  value: data.operating,  color: data.operating >= 0 ? "positive" : "negative" },
    { name: "Investing",  value: data.investing,  color: data.investing >= 0 ? "positive" : "negative" },
    { name: "Financing",  value: data.financing,  color: data.financing >= 0 ? "positive" : "negative" },
  ];

  const fcfPctOfOperating =
    data.operating !== 0
      ? (data.freeCashFlow / Math.abs(data.operating)) * 100
      : 0;

  const fcfSummary =
    data.freeCashFlow > 0
      ? `Positive free cash flow of ${formatCompactCurrency(data.freeCashFlow)} — ${fcfPctOfOperating.toFixed(0)}% of operating cash flow.`
      : `Negative free cash flow of ${formatCompactCurrency(data.freeCashFlow)} — the company is burning cash.`;

  return (
    <section className="mb-12">
      <SectionHeading number="03 / Cash Flow" title="Cash Flow" />

      <QuickSummary text={fcfSummary} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between hover:border-ink/30 transition-colors">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Operating CF
          </div>
          <div className={`font-serif text-xl ${valueClass(data.operating)}`}>
            {formatCompactCurrency(data.operating)}
          </div>
        </div>
        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between hover:border-ink/30 transition-colors">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Free Cash Flow
          </div>
          <div
            className={`font-serif text-xl ${
              data.freeCashFlow >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {formatCompactCurrency(data.freeCashFlow)}
          </div>
        </div>
        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between hover:border-ink/30 transition-colors">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Investing CF
          </div>
          <div className={`font-serif text-xl ${valueClass(data.investing)}`}>
            {formatCompactCurrency(data.investing)}
          </div>
        </div>
        <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col justify-between hover:border-ink/30 transition-colors">
          <div className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-1.5">
            Financing CF
          </div>
          <div
            className={`font-serif text-xl ${
              data.financing > 0
                ? "text-positive"
                : data.financing < 0
                  ? "text-negative"
                  : "text-ink"
            }`}
          >
            {formatCompactCurrency(data.financing)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-paper-alt p-4 border border-rule-dashed rounded-sm flex flex-col">
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold mb-4">
            Cash Flow Mix
          </h3>
          <div className="flex-grow flex items-center justify-center">
            <CashFlowBarChart data={chartData} />
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <div className="flex justify-between items-center border-b border-rule-dashed pb-2">
            <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
              Operating Cash
            </span>
            <span className={`font-serif ${valueClass(data.operating)}`}>
              {formatCompactCurrency(data.operating)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-rule-dashed pb-2">
            <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
              Investing Cash
            </span>
            <span className={`font-serif ${valueClass(data.investing)}`}>
              {formatCompactCurrency(data.investing)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-rule-dashed pb-2">
            <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
              Financing Cash
            </span>
            <span className={`font-serif ${valueClass(data.financing)}`}>
              {formatCompactCurrency(data.financing)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="font-sans uppercase tracking-widest text-[10px] text-ink font-bold">
              Net Change
            </span>
            <span
              className={`font-serif font-bold ${
                data.netChange > 0
                  ? "text-positive"
                  : data.netChange < 0
                    ? "text-negative"
                    : "text-ink"
              }`}
            >
              {formatCompactCurrency(data.netChange)}
            </span>
          </div>
        </div>
      </div>

      <TwinBoxes
        positiveTitle={data.freeCashFlow >= 0 ? "FCF Generation" : "Operating Strength"}
        positiveText={
          data.freeCashFlow >= 0
            ? `The company converts ${fcfPctOfOperating.toFixed(0)}% of operating cash flow into free cash flow, providing ample flexibility for capital allocation.`
            : `Despite negative free cash flow, operating cash flow of ${formatCompactCurrency(data.operating)} indicates the core business is generating cash.`
        }
        negativeTitle={data.freeCashFlow >= 0 ? "CapEx Burden" : "Cash Burn Concern"}
        negativeText={
          data.freeCashFlow >= 0
            ? `Capital expenditures consume ${formatCompactCurrency(Math.abs(data.investing))} of operating cash. Monitor for maintenance vs. growth CapEx split.`
            : `Cash burn rate of ${formatCompactCurrency(Math.abs(data.freeCashFlow))} requires monitoring. The company may need external financing if this persists.`
        }
      />

      <ImplicationCallout
        question="Is the cash flow sustainable?"
        answer={
          data.freeCashFlow > 0
            ? "Positive Free Cash Flow"
            : "Negative Free Cash Flow"
        }
        implication={
          data.freeCashFlow > 0
            ? "The company has flexibility for dividends, buybacks, debt reduction, or reinvestment in growth opportunities."
            : "Negative free cash flow indicates the company is burning cash and may need to raise capital or cut spending."
        }
      />
    </section>
  );
}
