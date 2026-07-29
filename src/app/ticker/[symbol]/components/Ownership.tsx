import { Card, CardHeader, CardTitle, CardContent } from "@/components/ledger/Card";
import { Ownership as OwnershipData } from "@/lib/providers";
import { TwinBoxes } from "@/components/ledger/Narrative";

interface OwnershipProps {
  data: OwnershipData;
}

export function Ownership({ data }: OwnershipProps) {
  const formatPercent = (val: number) => `${(val * 100).toFixed(2)}%`;
  const formatShares  = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(val);

  const topHolderPct = data.institutionalHolders
    .slice(0, 3)
    .reduce((sum, h) => sum + h.percentage, 0);

  let positiveTitle = "Institutional Support";
  let positiveText = "";
  let negativeTitle = "Concentration Risk";
  let negativeText = "";

  if (topHolderPct > 0.4) {
    positiveTitle = "Strong Institutional Conviction";
    positiveText = `Top 3 institutional holders control ${(topHolderPct * 100).toFixed(1)}% of shares, indicating strong conviction among large asset managers.`;
    negativeTitle = "Concentration Risk";
    negativeText = "High concentration among top holders could lead to outsized volatility if any major position is unwound.";
  } else if (topHolderPct > 0.15) {
    positiveTitle = "Moderate Institutional Support";
    positiveText = `Top 3 institutional holders control ${(topHolderPct * 100).toFixed(1)}% of shares, providing a stable foundation of institutional capital.`;
    negativeTitle = "Retail Influence";
    negativeText = "Lower institutional concentration means retail sentiment and broader market trends may drive price action more noticeably.";
  } else {
    positiveTitle = "Retail Driven";
    positiveText = `Top 3 institutional holders control only ${(topHolderPct * 100).toFixed(1)}% of shares, offering potential for outsized retail-driven momentum.`;
    negativeTitle = "Low Institutional Conviction";
    negativeText = "Minimal institutional backing suggests large asset managers may not yet see a compelling long-term thesis.";
  }

  return (
    <Card>
      <CardHeader className="border-b border-rule-dashed pb-3">
        <CardTitle>Institutional Ownership</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 md:pt-4 space-y-6">
        <TwinBoxes
          positiveTitle={positiveTitle}
          positiveText={positiveText}
          negativeTitle={negativeTitle}
          negativeText={negativeText}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold border-b border-rule pb-2 mb-4">
              Top Institutional Holders
            </h3>
            <div className="space-y-4">
              {data.institutionalHolders.map((holder, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-serif text-ink leading-tight pr-2">{holder.name}</span>
                    <span className="text-sm font-bold text-ink flex-shrink-0">{formatPercent(holder.percentage)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow h-1 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-blue rounded-full"
                        style={{ width: `${Math.min(holder.percentage * 100 * 4, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-muted flex-shrink-0">
                      {formatShares(holder.shares)} shares
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold border-b border-rule pb-2 mb-4">
              Top ETFs Holding
            </h3>
            <div className="space-y-4">
              {data.topETFs.map((etf, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-serif text-ink leading-tight pr-2">{etf.name}</span>
                    <span className="text-sm font-bold text-ink flex-shrink-0">{formatPercent(etf.percentage)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow h-1 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-purple rounded-full"
                        style={{ width: `${Math.min(etf.percentage * 100 * 30, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-muted flex-shrink-0">
                      {formatShares(etf.shares)} shares
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
