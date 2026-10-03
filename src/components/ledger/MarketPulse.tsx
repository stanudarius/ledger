"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PulseTicker {
  symbol: string;
  change: number;
  isPositive: boolean;
}

interface PulseSector {
  label: string;
  avgChange: number;
  tickers: PulseTicker[];
}

export function SectorHeatmap() {
  const [sectors, setSectors] = useState<PulseSector[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market-pulse")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSectors(data.sectors ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (error) return null;
  if (!sectors) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-pulse" />
          <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
            Market Overview
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-paper-alt/60 border border-rule-dashed rounded-sm p-4 animate-pulse"
            >
              <div className="h-3 bg-paper-alt rounded w-16 mb-3" />
              <div className="h-2 bg-paper-alt rounded w-10 mb-3" />
              <div className="space-y-1.5">
                <div className="h-3 bg-paper-alt rounded w-24" />
                <div className="h-3 bg-paper-alt rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (sectors.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
        <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
          Market Overview
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectors.map((sector) => {
          const isPositive = sector.avgChange >= 0;
          return (
            <div
              key={sector.label}
              className="bg-paper-alt/60 border border-rule-dashed rounded-sm p-4 hover:border-ink/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
                  {sector.label}
                </span>
                <span
                  className={`text-xs font-sans font-bold ${
                    isPositive ? "text-positive" : "text-negative"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {sector.avgChange.toFixed(1)}%
                </span>
              </div>

              {/* Mini bar chart for sector performance */}
              <div className="relative h-1.5 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden mb-3">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full ${
                    isPositive ? "bg-positive" : "bg-negative"
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(sector.avgChange) * 8, 100)}%`,
                  }}
                />
              </div>

              <div className="space-y-1.5">
                {sector.tickers.slice(0, 3).map((t) => (
                  <Link
                    key={t.symbol}
                    href={`/ticker/${t.symbol}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="font-serif text-xs text-ink font-bold group-hover:underline">
                      {t.symbol}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-bold ${
                        t.isPositive ? "text-positive" : "text-negative"
                      }`}
                    >
                      {t.isPositive ? "▲" : "▼"} {t.change.toFixed(1)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
