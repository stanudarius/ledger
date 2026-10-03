import { Card, CardContent } from "@/components/ledger/Card";
import { StatBlock } from "@/components/ledger/StatBlock";
import { MetaLine } from "@/components/ledger/MetaLine";
import { SketchAvatar } from "@/components/ledger/SketchAvatar";
import { Week52Range } from "@/components/ledger/Week52Range";
import { CompanyProfile, Quote, Metrics } from "@/lib/providers";
import { ExternalLink, Globe } from "lucide-react";
import { UserActionButtons } from "./UserActionButtons";
import { formatCurrency, formatMarketCap, formatCompact } from "@/lib/format";

function truncateToSentences(text: string, max: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, max).join(" ").trim();
}

interface HeaderSnapshotProps {
  symbol: string;
  profile: CompanyProfile;
  quote: Quote;
  metrics: Metrics;
  initialWatchlist: boolean;
  initialCompare: boolean;
}

export function HeaderSnapshot({ symbol, profile, quote, metrics, initialWatchlist, initialCompare }: HeaderSnapshotProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-serif text-ink tracking-tighter leading-tight">
          {profile.companyName}
        </h1>
        <MetaLine className="mt-1.5">
          <span>{symbol}</span>
          <span>·</span>
          <span>{profile.sector}</span>
        </MetaLine>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-[10px] font-sans font-bold uppercase tracking-widest text-accent-blue hover:underline"
          >
            <Globe className="w-3 h-3" />
            {profile.website.replace("https://", "").replace("http://", "")}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      <UserActionButtons 
        symbol={symbol} 
        initialWatchlist={initialWatchlist} 
        initialCompare={initialCompare} 
      />

      {profile.description && (
        <p className="text-xs text-ink-muted leading-relaxed">
          {truncateToSentences(profile.description, 2)}
        </p>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
            <div>
              <div className="font-serif text-3xl text-ink tracking-tight">
                {formatCurrency(quote.currentPrice)}
              </div>
              <div className={`flex items-center gap-1 text-xs font-sans font-bold mt-0.5 ${quote.isPositive ? "text-positive" : "text-negative"}`}>
                {quote.isPositive ? "▲" : "▼"} {formatCurrency(quote.changeAmount)} ({quote.changePercentage.toFixed(2)}%)
                <span className="text-[10px] text-ink-muted ml-1 uppercase tracking-widest font-normal">Today</span>
              </div>
            </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rule-dashed">
            {[
              { label: "Open", value: formatCurrency(quote.open) },
              { label: "High", value: formatCurrency(quote.high) },
              { label: "Low",  value: formatCurrency(quote.low) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">{label}</div>
                <div className="font-serif text-xs text-ink mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-rule-dashed pt-2">
            <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">Volume</div>
            <div className="font-serif text-sm text-ink mt-0.5">{quote.volume > 0 ? formatCompact(quote.volume) : "—"}</div>
          </div>

          <div className="border-t border-rule-dashed pt-3">
            <Week52Range
              current={quote.currentPrice}
              low={quote.week52Low}
              high={quote.week52High}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-col gap-0 divide-y divide-rule-dashed">
          <StatBlock label="MARKET CAP"     value={Number.isFinite(metrics.marketCap) && metrics.marketCap > 0 ? formatMarketCap(metrics.marketCap) : "—"} className="py-2" />
          <StatBlock label="P/E (TTM)"       value={metrics.peRatio > 0 ? `${metrics.peRatio.toFixed(1)}x` : "—"} className="py-2" />
          <StatBlock label="P/B RATIO"       value={metrics.pbRatio > 0 ? `${metrics.pbRatio.toFixed(1)}x` : "—"} className="py-2" />
          <StatBlock label="ROE"             value={metrics.roe !== 0 ? `${metrics.roe.toFixed(1)}%` : "—"} className="py-2" />
          <StatBlock
            label="EPS (TTM)"
            value={metrics.eps !== 0 ? `$${metrics.eps.toFixed(2)}` : "—"}
            delta={
              metrics.revenueGrowthYoy !== 0
                ? { value: `${Math.abs(metrics.revenueGrowthYoy).toFixed(1)}% Rev YoY`, isPositive: metrics.revenueGrowthYoy >= 0 }
                : undefined
            }
            className="py-2"
          />
          <StatBlock label="DIVIDEND YIELD" value={metrics.dividendYield > 0 ? `${(metrics.dividendYield * 100).toFixed(2)}%` : "N/A"} className="py-2" />
          <StatBlock label="BETA"           value={metrics.beta !== 0 ? metrics.beta.toFixed(2) : "—"} implication={metrics.beta > 1.5 ? "High volatility vs. market" : metrics.beta < 0.8 ? "Defensive / low-beta" : "Market-correlated"} className="py-2" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold border-b border-rule pb-2">Company Info</h3>
        <div className="grid grid-cols-2 gap-y-3">
          {profile.industry && <div><div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">Industry</div><div className="text-xs font-sans text-ink mt-0.5">{profile.industry}</div></div>}
          {profile.country && <div><div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">Country</div><div className="text-xs font-sans text-ink mt-0.5">{profile.country}</div></div>}
        </div>
      </div>
    </div>
  );
}

export function LeadershipSnapshot({ ceoName }: { ceoName: string }) {
  const displayName = (ceoName && ceoName !== "N/A" && ceoName.trim()) ? ceoName : "";
  if (!displayName) return null;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "XX";

  return (
    <div className="space-y-3 mt-5">
      <h3 className="font-sans uppercase tracking-widest text-xs text-ink-muted font-bold border-b border-rule pb-2">
        Leadership
      </h3>
      <div className="flex items-center gap-3">
        <SketchAvatar initials={getInitials(displayName)} size="md" />
        <div>
          <div className="font-serif text-ink text-sm font-semibold">{displayName}</div>
          <div className="text-xs text-ink-muted font-sans uppercase tracking-widest">
            Chief Executive Officer
          </div>
        </div>
      </div>
    </div>
  );
}
