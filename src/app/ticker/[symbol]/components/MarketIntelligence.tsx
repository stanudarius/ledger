import { Card, CardHeader, CardTitle, CardContent } from "@/components/ledger/Card"
import { EarningsHistoryPeriod, AnalystRatings, InsiderTrade } from "@/lib/providers"
import { EarningsSurpriseChart } from "@/components/ledger/Charts"

interface RatingsProps {
  data: AnalystRatings | null;
  insiderTrades: InsiderTrade[];
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-20 text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted flex-shrink-0 group-hover:text-ink transition-colors">
        {label}
      </span>
      <div className="flex-grow h-2 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ 
            width: `${pct}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}80`
          }} 
        />
      </div>
      <span className="w-8 text-right text-xs font-serif font-bold text-ink flex-shrink-0">{count}</span>
    </div>
  )
}

function AnalystRatingsCard({ data, insiderTrades }: RatingsProps) {
  const total = data ? data.buy + data.hold + data.sell + data.strongBuy + data.strongSell : 0;

  let consensus = "N/A";
  if (data && total > 0) {
    const score = (data.strongBuy * 1 + data.buy * 2 + data.hold * 3 + data.sell * 4 + data.strongSell * 5) / total;
    if (score <= 1.5) consensus = "Strong Buy";
    else if (score <= 2.5) consensus = "Buy";
    else if (score <= 3.5) consensus = "Hold";
    else if (score <= 4.5) consensus = "Sell";
    else consensus = "Strong Sell";
  }

  const consensusVariant =
    consensus.includes("Buy")  ? "bullish"
    : consensus.includes("Sell") ? "bearish"
    : "neutral"

  const colorClass =
    consensusVariant === "bullish" ? "text-positive"
    : consensusVariant === "bearish" ? "text-negative"
    : "text-ink"

  return (
    <Card>
      <CardHeader className="border-b border-rule-dashed pb-3 mb-3">
        <CardTitle>Analyst Consensus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`grid grid-cols-1 ${data ? "md:grid-cols-2" : ""} gap-8`}>
          {data && (
          <div className="space-y-6 flex flex-col justify-center">
            <div className="flex flex-col items-start mb-2 border-b border-rule-dashed pb-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-1">
                Consensus ({total} Ratings)
              </span>
              <div className={`text-3xl font-serif font-black tracking-tight ${colorClass}`}>
                {consensus}
              </div>
            </div>
            <div className="space-y-3">
              <RatingBar label="Strong Buy" count={data.strongBuy} total={total} color="#2E7D46" />
              <RatingBar label="Buy"        count={data.buy}       total={total} color="#4CAF72" />
              <RatingBar label="Hold"       count={data.hold}      total={total} color="#C9C2AE" />
              <RatingBar label="Sell"       count={data.sell}      total={total} color="#E05C4B" />
              <RatingBar label="Strong Sell"count={data.strongSell}total={total} color="#C0392B" />
            </div>
          </div>
          )}

            <div className={`flex flex-col h-full justify-center ${data ? "md:border-l md:border-rule-dashed md:pl-8" : ""}`}>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-4 block">
                Recent Insider Trades
              </span>
              <div className="space-y-4">
                {insiderTrades.slice(0, 4).map((trade, i) => {
                  const isBuy = trade.transactionType === "Purchase";
                  return (
                    <div key={i} className="flex justify-between items-center pb-3 border-b border-rule-dashed last:border-0 last:pb-0 group hover:bg-paper transition-colors rounded-sm -mx-2 px-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${isBuy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"}`} />
                        <div>
                          <div className="font-serif text-ink text-sm font-bold group-hover:text-brand transition-colors">{trade.officerName}</div>
                          <div className="text-[9px] uppercase tracking-widest text-ink-muted mt-0.5 max-w-[140px] truncate">
                            {trade.officerTitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[9px] font-bold uppercase tracking-widest ${isBuy ? "text-emerald-600" : "text-rose-600"}`}>
                          {trade.transactionType}
                        </div>
                        <div className="font-serif text-sm font-bold text-ink mt-0.5">
                          {trade.shares.toLocaleString()} <span className="text-ink-muted text-xs font-normal">shs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {insiderTrades.length === 0 && (
                  <div className="text-xs text-ink-muted text-center py-4">No recent insider trades found.</div>
                )}
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EarningsProps {
  data: EarningsHistoryPeriod[]
}

function EarningsHistoryCard({ data }: EarningsProps) {
  const chartData = data.map((d) => ({
    period: d.period,
    estimated: d.estimatedEPS,
    actual: d.actualEPS,
    surprise: d.surprise,
  }))

  const avgSurprise = data.length > 0 ? data.reduce((sum, d) => sum + d.surprise, 0) / data.length : 0
  const beatCount   = data.filter((d) => d.surprise > 0).length

  return (
    <Card>
      <CardHeader className="border-b border-rule-dashed pb-3 mb-3">
        <CardTitle>Earnings History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
              Beat Rate
            </div>
            <div className="font-serif text-xl text-ink">
              {beatCount}/{data.length}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
              Avg Surprise
            </div>
            <div className={`font-serif text-xl ${avgSurprise >= 0 ? "text-positive" : "text-negative"}`}>
              {avgSurprise >= 0 ? "+" : ""}{avgSurprise.toFixed(1)}%
            </div>
          </div>
        </div>

        <EarningsSurpriseChart data={chartData} />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-rule">
                {["Period", "Est. EPS", "Act. EPS", "Surprise"].map((h) => (
                  <th scope="col" key={h} className="py-2 pr-4 font-sans uppercase tracking-widest text-[9px] text-ink-muted font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.period} className="border-b border-rule-dashed hover:bg-paper-alt transition-colors">
                  <td className="py-2 pr-4 font-serif text-ink text-sm">{row.period}</td>
                  <td className="py-2 pr-4 text-sm text-ink">${row.estimatedEPS.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-sm font-bold text-ink">${row.actualEPS.toFixed(2)}</td>
                  <td className={`py-2 pr-4 text-sm font-bold ${row.surprise >= 0 ? "text-positive" : "text-negative"}`}>
                    {row.surprise >= 0 ? "+" : ""}{row.surprise.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

interface MarketIntelProps {
  earnings: EarningsHistoryPeriod[];
  ratings: AnalystRatings | null;
  insiderTrades: InsiderTrade[];
}

export function MarketIntelligence({ earnings, ratings, insiderTrades }: MarketIntelProps) {
  const hasRatingsOrTrades = ratings || insiderTrades.length > 0;
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl text-ink mb-4 border-b border-rule pb-2">
        Market Intelligence
      </h2>
      {hasRatingsOrTrades && <AnalystRatingsCard data={ratings} insiderTrades={insiderTrades} />}
      <EarningsHistoryCard data={earnings} />
    </div>
  )
}
