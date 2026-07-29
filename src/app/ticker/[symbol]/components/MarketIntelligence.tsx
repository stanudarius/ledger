"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ledger/Card"
import { EarningsHistoryPeriod, AnalystRatings, InsiderTrade } from "@/lib/providers"
import { EarningsSurpriseChart } from "@/components/ledger/Charts"
import { useChartColors } from "@/lib/ThemeContext"
import { SectionHeading } from "@/components/ledger/SectionHeading"
import { formatCurrency } from "@/lib/format"

interface RatingsProps {
  data: AnalystRatings | null;
  insiderTrades: InsiderTrade[];
  currentPrice?: number;
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

function getConsensusLabel(mean: number, key: string): string {
  if (mean >= 1 && mean <= 5) {
    if (mean <= 1.5) return "Strong Buy";
    if (mean <= 2.5) return "Buy";
    if (mean <= 3.5) return "Hold";
    if (mean <= 4.5) return "Sell";
    return "Strong Sell";
  }

  const labels: Record<string, string> = {
    strong_buy: "Strong Buy",
    buy: "Buy",
    hold: "Hold",
    sell: "Sell",
    strong_sell: "Strong Sell",
  };
  return labels[key.toLowerCase()] ?? "N/A";
}

function AnalystRatingsCard({ data, insiderTrades, currentPrice }: RatingsProps) {
  const COLORS = useChartColors();
  const total = data ? data.buy + data.hold + data.sell + data.strongBuy + data.strongSell : 0;
  const hasTargets = data && data.targetMean > 0 && currentPrice && currentPrice > 0;

  let consensus = "N/A";
  if (data) {
    const meanConsensus = getConsensusLabel(data.recommendationMean, data.recommendationKey);
    if (meanConsensus !== "N/A") {
      consensus = meanConsensus;
    } else if (total > 0) {
      const score = (data.strongBuy * 1 + data.buy * 2 + data.hold * 3 + data.sell * 4 + data.strongSell * 5) / total;
      consensus = getConsensusLabel(score, "");
    }
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
              <RatingBar label="Strong Buy" count={data.strongBuy} total={total} color={COLORS.positive} />
              <RatingBar label="Buy"        count={data.buy}       total={total} color={COLORS.positiveLight} />
              <RatingBar label="Hold"       count={data.hold}      total={total} color={COLORS.muted} />
              <RatingBar label="Sell"       count={data.sell}      total={total} color={COLORS.negative} />
              <RatingBar label="Strong Sell"count={data.strongSell}total={total} color={COLORS.negativeStrong} />
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
                        <div className={`w-1.5 h-1.5 rounded-full ${isBuy ? "bg-positive" : "bg-negative"}`} />
                        <div>
                          <div className="font-serif text-ink text-sm font-bold group-hover:text-ink transition-colors">{trade.officerName}</div>
                          <div className="text-[9px] uppercase tracking-widest text-ink-muted mt-0.5 max-w-[140px] truncate">
                            {trade.officerTitle}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[9px] font-bold uppercase tracking-widest ${isBuy ? "text-positive" : "text-negative"}`}>
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
        {hasTargets && <PriceTargetCard ratings={data!} currentPrice={currentPrice!} />}
      </CardContent>
    </Card>
  )
}

function PriceTargetCard({ ratings, currentPrice }: { ratings: AnalystRatings; currentPrice: number }) {
  const upside = ((ratings.targetMean - currentPrice) / currentPrice) * 100;
  const range = ratings.targetHigh - ratings.targetLow;
  const pos = range > 0 ? ((currentPrice - ratings.targetLow) / range) * 100 : 50;
  const upsidePositive = upside >= 0;

  return (
    <div className="border-t border-rule-dashed pt-5 mt-2">
      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-3 block">
        Price Targets
      </span>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted block mb-0.5">
            Upside to Mean
          </span>
          <span className={`font-serif text-3xl font-black ${upsidePositive ? "text-positive" : "text-negative"}`}>
            {upsidePositive ? "+" : ""}{upside.toFixed(1)}%
          </span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[9px] font-sans text-ink-muted mb-1">
            <span>${ratings.targetLow.toFixed(0)}</span>
            <span className="font-bold text-ink">${ratings.targetMean.toFixed(0)}</span>
            <span>${ratings.targetHigh.toFixed(0)}</span>
          </div>
          <div className="relative h-2 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-positive/20 rounded-full" style={{ width: `${pos}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-ink rounded-full border-2 border-paper shadow-sm"
              style={{ left: `calc(${Math.min(Math.max(pos, 0), 100)}% - 6px)` }}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-paper-alt border border-rule-dashed rounded-sm p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-1">Low</div>
          <div className="font-serif text-sm text-ink">{formatCurrency(ratings.targetLow)}</div>
        </div>
        <div className="bg-paper-alt border border-rule-dashed rounded-sm p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-1">Mean</div>
          <div className="font-serif text-sm text-ink font-bold">{formatCurrency(ratings.targetMean)}</div>
        </div>
        <div className="bg-paper-alt border border-rule-dashed rounded-sm p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-1">Median</div>
          <div className="font-serif text-sm text-ink">{formatCurrency(ratings.targetMedian)}</div>
        </div>
        <div className="bg-paper-alt border border-rule-dashed rounded-sm p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-1">High</div>
          <div className="font-serif text-sm text-ink">{formatCurrency(ratings.targetHigh)}</div>
        </div>
      </div>
    </div>
  );
}

interface EarningsProps {
  data: EarningsHistoryPeriod[]
}

function parsePeriod(p: string): { year: number; quarter: number } {
  // "Q1 2024" / "Q3 2023"
  const qMatch = p.match(/Q([1-4])\s*(\d{4})/i);
  if (qMatch) return { year: +qMatch[2], quarter: +qMatch[1] };
  // "2024-03" or "2024-03-31"
  const dMatch = p.match(/^(\d{4})-(\d{2})/);
  if (dMatch) return { year: +dMatch[1], quarter: Math.ceil(+dMatch[2] / 3) };
  return { year: 0, quarter: 0 };
}

function comparePeriod(a: string, b: string): number {
  const pa = parsePeriod(a);
  const pb = parsePeriod(b);
  return pa.year - pb.year || pa.quarter - pb.quarter;
}

function EarningsHistoryCard({ data }: EarningsProps) {
  const sorted = [...data].sort((a, b) => comparePeriod(a.period, b.period));
  const chartData = sorted.map((d) => ({
    period: d.period,
    estimated: d.estimatedEPS,
    actual: d.actualEPS,
    surprise: d.surprise,
  }))

  const avgSurprise = sorted.length > 0 ? sorted.reduce((sum, d) => sum + d.surprise, 0) / sorted.length : 0
  const beatCount   = sorted.filter((d) => d.surprise > 0).length

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
              {beatCount}/{sorted.length}
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
              {sorted.map((row) => (
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
  currentPrice?: number;
}

export function MarketIntelligence({ earnings, ratings, insiderTrades, currentPrice }: MarketIntelProps) {
  const hasRatingsOrTrades = ratings || insiderTrades.length > 0;
  return (
    <div className="space-y-6">
      <SectionHeading number="08 / Market Intelligence" title="Market Intelligence" />
      {hasRatingsOrTrades && <AnalystRatingsCard data={ratings} insiderTrades={insiderTrades} currentPrice={currentPrice} />}
      {earnings.length > 0 && <EarningsHistoryCard data={earnings} />}
    </div>
  )
}
