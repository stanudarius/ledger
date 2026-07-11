import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ledger/Card";
import { Pill } from "@/components/ledger/Pill";
import { MetaLine } from "@/components/ledger/MetaLine";
import { FallbackProvider } from "@/lib/providers/fallback";
import { getCompareList } from "@/actions/userPreferences";
import { CompareManager } from "./components/CompareManager";
import { RemoveFromCompareButton } from "./components/RemoveFromCompareButton";

export default async function ComparePage() {
  const provider = new FallbackProvider();
  const compareList = await getCompareList();

  const results = await Promise.allSettled(
    compareList.map(async (symbol) => {
      const [profileResult, metricsResult] = await Promise.allSettled([
        provider.getProfile(symbol),
        provider.getMetrics(symbol),
      ]);
      return {
        symbol,
        profile: profileResult.status === "fulfilled" ? profileResult.value : null,
        metrics: metricsResult.status === "fulfilled" ? metricsResult.value : null,
      };
    })
  );

  const tickersData = results
    .filter(
      (r): r is PromiseFulfilledResult<{
        symbol: string;
        profile: ReturnType<typeof provider.getProfile> extends Promise<infer T> ? T : never;
        metrics: ReturnType<typeof provider.getMetrics> extends Promise<infer T> ? T : never;
      }> => r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter((t) => t.profile !== null && t.metrics !== null);

  const formatNum = (v: number) =>
    Number.isFinite(v) && v !== 0 ? v.toFixed(2) : "—";
  const formatPct = (v: number) =>
    Number.isFinite(v) && v !== 0 ? `${v.toFixed(2)}%` : "—";

  const getWinner = (values: number[], lowerIsBetter: boolean) => {
    const valid = values.filter((v) => Number.isFinite(v) && v !== 0);
    if (valid.length <= 1) return -1;
    const winningVal = lowerIsBetter ? Math.min(...valid) : Math.max(...valid);
    return values.indexOf(winningVal);
  };

  const peVals = tickersData.map((t) => t.metrics.peRatio);
  const pbVals = tickersData.map((t) => t.metrics.pbRatio);
  const roeVals = tickersData.map((t) => t.metrics.roe);
  const roaVals = tickersData.map((t) => t.metrics.roa);
  const revGrowthVals = tickersData.map((t) => t.metrics.revenueGrowthYoy);
  const divYieldVals = tickersData.map((t) => t.metrics.dividendYield * 100);

  const metricsRows = [
    {
      category: "Valuation",
      items: [
        { label: "P/E Ratio", values: peVals.map(formatNum), winnerIndex: getWinner(peVals, true), lowerIsBetter: true },
        { label: "P/B Ratio", values: pbVals.map(formatNum), winnerIndex: getWinner(pbVals, true), lowerIsBetter: true },
      ],
    },
    {
      category: "Growth & Profitability",
      items: [
        { label: "Revenue Growth YoY", values: revGrowthVals.map(formatPct), winnerIndex: getWinner(revGrowthVals, false), lowerIsBetter: false },
        { label: "Return on Equity", values: roeVals.map(formatPct), winnerIndex: getWinner(roeVals, false), lowerIsBetter: false },
        { label: "Return on Assets", values: roaVals.map(formatPct), winnerIndex: getWinner(roaVals, false), lowerIsBetter: false },
        { label: "Dividend Yield", values: divYieldVals.map(formatPct), winnerIndex: getWinner(divYieldVals, false), lowerIsBetter: false },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-rule pb-4">
        <div>
          <MetaLine className="mb-2">
            <span>Market Analysis</span>
            <span>&bull;</span>
            <span>Comparative View</span>
          </MetaLine>
          <h1 className="font-serif text-4xl tracking-tighter text-ink">Peer Comparison</h1>
          <p className="text-ink-muted font-sans text-sm mt-1 max-w-xl">
            Side-by-side fundamental analysis of multiple equities. Maximum of 4 allowed.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CompareManager />
        </div>
      </div>

      {tickersData.length === 0 ? (
        <div className="p-12 text-center text-ink-muted border border-rule-dashed rounded-sm bg-paper-alt">
          You aren&apos;t comparing any tickers. Add some using the search bar above.
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b border-rule pb-4">
            <div
              className="grid gap-4 items-center"
              style={{ gridTemplateColumns: `repeat(${tickersData.length + 1}, minmax(0, 1fr))` }}
            >
              <div className="col-span-1">
                <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
                  Metrics
                </span>
              </div>
              {tickersData.map((ticker) => (
                <div key={ticker.symbol} className="col-span-1 text-center relative group">
                  <Link href={`/ticker/${ticker.symbol}`} className="hover:underline">
                    <h3 className="font-serif text-2xl text-ink">{ticker.symbol}</h3>
                  </Link>
                  <p className="text-xs text-ink-muted line-clamp-1">{ticker.profile.companyName}</p>
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RemoveFromCompareButton symbol={ticker.symbol} />
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {metricsRows.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h4 className="font-sans uppercase tracking-widest text-xs font-bold text-ink border-b border-rule-dashed pb-1">
                  {section.category}
                </h4>
                <div className="space-y-4">
                  {section.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="grid gap-4 items-center py-2 hover:bg-paper transition-colors rounded-sm px-2 -mx-2"
                      style={{ gridTemplateColumns: `repeat(${tickersData.length + 1}, minmax(0, 1fr))` }}
                    >
                      <div className="col-span-1">
                        <span className="text-sm font-medium text-ink-muted">{item.label}</span>
                      </div>
                      {item.values.map((val, vIdx) => {
                        const isWinner = item.winnerIndex === vIdx;
                        return (
                          <div key={vIdx} className="col-span-1 text-center flex flex-col items-center justify-center">
                            <span className="font-serif text-lg text-ink">{val}</span>
                            {isWinner && (
                              <Pill variant="bullish" className="mt-1 transform scale-75">
                                Winner
                              </Pill>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
