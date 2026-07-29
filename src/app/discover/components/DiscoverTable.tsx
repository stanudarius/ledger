"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ScoredStock } from "@/lib/discover";
import { formatCurrency } from "@/lib/format";

type SortKey = "composite" | "value" | "growth" | "quality" | "pe" | "roe" | "revGrowth";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "value", label: "Undervalued" },
  { key: "growth", label: "High Growth" },
  { key: "quality", label: "Quality" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "composite", label: "Highest Score" },
  { key: "value", label: "Best Value" },
  { key: "growth", label: "Fastest Growth" },
  { key: "quality", label: "Highest Quality" },
  { key: "pe", label: "Lowest P/E" },
  { key: "roe", label: "Highest ROE" },
  { key: "revGrowth", label: "Revenue Growth" },
];

function ScoreBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted w-7">
        {label}
      </span>
      <div className="flex-1 h-1 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-sans font-bold text-ink w-6 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

function StockCard({ stock }: { stock: ScoredStock }) {
  const { scores, quote } = stock;
  const topScore = Math.max(scores.value, scores.growth, scores.quality);
  const accentBorder =
    topScore === scores.value ? "border-l-positive" :
    topScore === scores.growth ? "border-l-accent-blue" :
    "border-l-accent-purple";

  return (
    <Link
      href={`/ticker/${stock.symbol}`}
      className={cn(
        "block bg-paper-alt/60 border border-rule-dashed border-l-2 rounded-sm p-4",
        "hover:-translate-y-1 hover:shadow-md hover:border-ink/30 transition-all duration-200 group",
        accentBorder,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-ink font-bold group-hover:underline">
            {stock.symbol}
          </h3>
          <p className="text-[10px] text-ink-muted truncate max-w-[160px]">
            {stock.companyName}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-serif text-sm text-ink">
            {formatCurrency(quote.currentPrice)}
          </div>
          <div
            className={cn(
              "text-[10px] font-sans font-bold",
              quote.isPositive ? "text-positive" : "text-negative",
            )}
          >
            {quote.isPositive ? "▲" : "▼"} {quote.changePercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Composite Score */}
      <div className="mb-3">
        <div className="flex items-end gap-2 mb-1">
          <span className="font-serif text-3xl text-ink font-black leading-none">
            {scores.composite}
          </span>
          <span className="text-[9px] font-sans uppercase tracking-widest text-ink-muted mb-0.5">
            / 100
          </span>
        </div>
        <div className="h-2 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all"
            style={{ width: `${scores.composite}%` }}
          />
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-1.5 mb-3">
        <ScoreBadge value={scores.value} label="Val" color="bg-positive" />
        <ScoreBadge value={scores.growth} label="Grw" color="bg-accent-blue" />
        <ScoreBadge value={scores.quality} label="Qly" color="bg-accent-purple" />
      </div>

      {/* Divider */}
      <div className="border-t border-rule-dashed pt-3">
        <div className="flex items-center justify-between text-[10px] font-sans">
          <span className="text-ink-muted">
            P/E{" "}
            <span className="text-ink font-bold">
              {stock.metrics.peRatio > 0 ? stock.metrics.peRatio.toFixed(1) : "—"}
            </span>
          </span>
          <span className="text-ink-muted">
            ROE{" "}
            <span className="text-ink font-bold">
              {stock.metrics.roe !== 0 ? `${stock.metrics.roe.toFixed(1)}%` : "—"}
            </span>
          </span>
          <span className="text-ink-muted">
            Rev{" "}
            <span
              className={cn(
                "font-bold",
                stock.metrics.revenueGrowthYoy > 0 ? "text-positive" :
                stock.metrics.revenueGrowthYoy < 0 ? "text-negative" :
                "text-ink",
              )}
            >
              {stock.metrics.revenueGrowthYoy !== 0
                ? `${stock.metrics.revenueGrowthYoy >= 0 ? "+" : ""}${stock.metrics.revenueGrowthYoy.toFixed(1)}%`
                : "—"}
            </span>
          </span>
        </div>
        {stock.upside !== null && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[9px] font-sans text-ink-muted uppercase tracking-widest">
              Target
            </span>
            <span className={cn(
              "text-[10px] font-sans font-bold",
              stock.upside >= 0 ? "text-positive" : "text-negative"
            )}>
              {stock.upside >= 0 ? "+" : ""}{stock.upside.toFixed(1)}%
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] font-sans text-ink-muted uppercase tracking-widest">
            {stock.sector}
          </span>
          <span className="text-[10px] text-ink group-hover:underline ml-auto">
            View analysis →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function DiscoverTable({ stocks }: { stocks: ScoredStock[] }) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [sortBy, setSortBy] = React.useState<SortKey>("composite");

  const filtered = React.useMemo(() => {
    let s = [...stocks];
    if (filter === "value") s = s.filter((x) => x.scores.value >= 70);
    if (filter === "growth") s = s.filter((x) => x.scores.growth >= 70);
    if (filter === "quality") s = s.filter((x) => x.scores.quality >= 70);
    return s;
  }, [stocks, filter]);

  const sorted = React.useMemo(() => {
    // Helper: zero means missing — always sort to the end
    const pushZero = (v: number) => v === 0 ? Infinity : v;
    return [...filtered].sort((a, b) => {
      if (sortBy === "composite") return b.scores.composite - a.scores.composite;
      if (sortBy === "value") return b.scores.value - a.scores.value;
      if (sortBy === "growth") return b.scores.growth - a.scores.growth;
      if (sortBy === "quality") return b.scores.quality - a.scores.quality;
      if (sortBy === "pe") return pushZero(a.metrics.peRatio) - pushZero(b.metrics.peRatio);
      if (sortBy === "roe") return pushZero(b.metrics.roe) - pushZero(a.metrics.roe);
      if (sortBy === "revGrowth") return pushZero(b.metrics.revenueGrowthYoy) - pushZero(a.metrics.revenueGrowthYoy);
      return 0;
    });
  }, [filtered, sortBy]);

  // Summary stats
  const avgScore = sorted.length > 0
    ? Math.round(sorted.reduce((s, x) => s + x.scores.composite, 0) / sorted.length)
    : 0;
  const undervaluedCount = sorted.filter((x) => x.scores.value >= 70).length;
  const growthCount = sorted.filter((x) => x.scores.growth >= 70).length;

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="border border-rule-dashed rounded-sm bg-paper-alt p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
            Stocks
          </div>
          <div className="font-serif text-xl text-ink">{sorted.length}</div>
        </div>
        <div className="border border-rule-dashed rounded-sm bg-paper-alt p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
            Avg Score
          </div>
          <div className="font-serif text-xl text-ink">{avgScore}</div>
        </div>
        <div className="border border-rule-dashed rounded-sm bg-paper-alt p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
            Undervalued
          </div>
          <div className="font-serif text-xl text-positive">{undervaluedCount}</div>
        </div>
        <div className="border border-rule-dashed rounded-sm bg-paper-alt p-3 text-center">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted mb-0.5">
            High Growth
          </div>
          <div className="font-serif text-xl text-accent-blue">{growthCount}</div>
        </div>
      </div>

      {/* Filter + Sort bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted mr-1">
          Filter
        </span>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm border transition-all",
              filter === key
                ? "bg-ink text-paper border-ink"
                : "text-ink-muted border-rule-dashed hover:border-ink/30",
            )}
          >
            {label}
          </button>
        ))}

        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted ml-4 mr-1">
          Sort
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm border border-rule-dashed bg-paper text-ink-muted cursor-pointer outline-none focus:border-ink"
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="p-12 text-center text-ink-muted text-sm border border-rule-dashed rounded-sm bg-paper-alt">
          No stocks match the current filter. Try selecting a different category.
        </div>
      )}
    </div>
  );
}
