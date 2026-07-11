import { StockSplit, UpcomingEarnings } from "@/lib/providers";

interface MarketEventsProps {
  stockSplits: StockSplit[];
  upcomingEarnings: UpcomingEarnings | null;
}

function formatDate(dateStr: string): { day: string; month: string; dateNum: string; dayOfWeek: string } {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    dateNum: d.getDate().toString(),
    dayOfWeek: d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

function formatCurrency(value: number): string {
  if (value === 0) return "N/A";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function MarketEvents({ stockSplits, upcomingEarnings }: MarketEventsProps) {
  if (!upcomingEarnings && stockSplits.length === 0) return null;

  return (
    <section className="mb-12">


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingEarnings && (
          <div className="border border-rule-dashed bg-paper-alt rounded-sm p-5 flex flex-col justify-center">
            <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold mb-4">
              Upcoming Earnings
            </h3>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 flex justify-center">
                <div className="inline-flex flex-col w-20 sm:w-24 rounded-lg overflow-hidden border border-rule-dashed shadow-sm">
                  <div className="bg-ink text-paper text-xs py-1 font-bold text-center tracking-wider">
                    {formatDate(upcomingEarnings.date).month}
                  </div>
                  <div className="bg-paper flex flex-col items-center py-2">
                    <span className="text-3xl font-black text-ink leading-none">
                      {formatDate(upcomingEarnings.date).dateNum}
                    </span>
                    <span className="text-[10px] font-semibold text-ink-muted mt-1">
                      {formatDate(upcomingEarnings.date).day}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 text-left space-y-2 text-sm">
                <div className="flex justify-between border-b border-rule-dashed pb-1.5">
                  <span className="text-ink-muted">Date</span>
                  <span className="font-serif font-bold text-right">
                    {new Date(upcomingEarnings.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-rule-dashed pb-1.5">
                  <span className="text-ink-muted">Day</span>
                  <span className="font-serif font-bold text-right">{formatDate(upcomingEarnings.date).dayOfWeek}</span>
                </div>
                <div className="flex justify-between border-b border-rule-dashed pb-1.5">
                  <span className="text-ink-muted">Revenue Est.</span>
                  <span className="font-serif font-bold text-right">{formatCurrency(upcomingEarnings.revenueEstimate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">EPS Est.</span>
                  <span className="font-serif font-bold text-right">${upcomingEarnings.epsEstimate.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {stockSplits.length > 0 && (
          <div className="border border-rule-dashed bg-paper-alt rounded-sm p-5">
            <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold mb-4">
              Split Record
            </h3>
            <div className="relative w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-rule-dashed text-xs uppercase text-ink-muted tracking-widest">
                  <tr>
                    <th className="px-2 py-2 font-bold">Date</th>
                    <th className="px-2 py-2 font-bold">Type</th>
                    <th className="px-2 py-2 font-bold">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {stockSplits.map((split, i) => {
                    const isForward = split.numerator > split.denominator;
                    return (
                      <tr key={i} className="border-b border-rule-dashed last:border-0 hover:bg-paper transition-colors">
                        <td className="px-2 py-3 whitespace-nowrap font-serif text-ink">{split.date}</td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${isForward ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                            {isForward ? "Forward" : "Reverse"}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap font-serif font-bold text-ink">
                          {split.numerator}:{split.denominator}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
