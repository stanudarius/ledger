"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StockScores } from "@/lib/scoring";
import { Card, CardContent } from "@/components/ledger/Card";
import { Info, ChevronDown } from "lucide-react";

/** Compact score bar: label + filled bar + numeric value. */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted w-5">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-sans font-bold text-ink w-5 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function ScoreCard({ scores }: { scores: StockScores }) {
  const [showMethodology, setShowMethodology] = useState(false);
  const topScore = Math.max(scores.value, scores.growth, scores.quality);
  const accentLabel =
    topScore === scores.value ? "Best Value" :
    topScore === scores.growth ? "Strong Growth" :
    "High Quality";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">
            Stock Score
          </div>
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-accent-purple">
            {accentLabel}
          </span>
        </div>

        {/* Composite */}
        <div>
          <div className="flex items-end gap-2">
            <span className="font-serif text-4xl text-ink font-black leading-none">
              {scores.composite}
            </span>
            <span className="text-[9px] font-sans uppercase tracking-widest text-ink-muted mb-0.5">
              / 100
            </span>
          </div>
          <div className="mt-2 h-2.5 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full transition-all"
              style={{ width: `${scores.composite}%` }}
            />
          </div>
        </div>

        {/* Sub-scores */}
        <div className="space-y-2 pt-1">
          <ScoreBar label="Val" value={scores.value} color="bg-positive" />
          <ScoreBar label="Grw" value={scores.growth} color="bg-accent-blue" />
          <ScoreBar label="Qly" value={scores.quality} color="bg-accent-purple" />
        </div>

        {/* Legend */}
        <div className="border-t border-rule-dashed pt-2 flex gap-3 text-[9px] font-sans text-ink-muted">
          <span>Value 40%</span>
          <span>·</span>
          <span>Growth 35%</span>
          <span>·</span>
          <span>Quality 25%</span>
        </div>

        {/* Methodology disclosure */}
        <div className="border-t border-rule-dashed pt-2">
          <button
            onClick={() => setShowMethodology((p) => !p)}
            className="flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted hover:text-ink transition-colors w-full"
          >
            <Info className="size-3" />
            <span>How is this scored?</span>
            <ChevronDown
              className={cn(
                "size-3 ml-auto transition-transform",
                showMethodology && "rotate-180",
              )}
            />
          </button>
          {showMethodology && (
            <div className="mt-2 space-y-1.5 text-[10px] font-sans text-ink-muted leading-relaxed">
              <p className="font-bold text-ink text-[9px] uppercase tracking-widest mb-1">
                Composite = Value&times;40% + Growth&times;35% + Quality&times;25%
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li><span className="text-positive font-semibold">Value</span> — lower P/E &amp; P/B = more undervalued:</li>
                <ul className="list-disc list-inside ml-3">
                  <li>P/E ratio → <code className="text-[9px] bg-paper-alt px-0.5">100 − PE×2.5</code> (40% of value)</li>
                  <li>P/B ratio → <code className="text-[9px] bg-paper-alt px-0.5">100 − PB×8</code> (35%)</li>
                  <li>Analyst upside to mean target → <code className="text-[9px] bg-paper-alt px-0.5">upside×3</code> (25%; 30%+ upside = full marks)</li>
                </ul>
                <li className="mt-1"><span className="text-accent-blue font-semibold">Growth</span>:</li>
                <ul className="list-disc list-inside ml-3">
                  <li>Revenue growth YoY → <code className="text-[9px] bg-paper-alt px-0.5">growth×2.5</code> (55%)</li>
                  <li>ROE → <code className="text-[9px] bg-paper-alt px-0.5">ROE×2</code> (45%)</li>
                </ul>
                <li className="mt-1"><span className="text-accent-purple font-semibold">Quality</span>:</li>
                <ul className="list-disc list-inside ml-3">
                  <li>ROE → <code className="text-[9px] bg-paper-alt px-0.5">ROE×1.5</code> (30%)</li>
                  <li>ROA → <code className="text-[9px] bg-paper-alt px-0.5">ROA×5</code> (25%)</li>
                  <li>Dividend yield → <code className="text-[9px] bg-paper-alt px-0.5">yield×100×4</code> (25%)</li>
                  <li>Profitable-company bonus: flat 60 (20%) when P/E is positive</li>
                </ul>
              </ul>
              <p className="text-[9px] text-ink-muted mt-1">
                Each sub-score falls back to 50 only when all its inputs are missing.
                Negative fundamentals (e.g. negative ROE/ROA/EPS) score 0 and count
                against the weighted average; unavailable metrics are omitted and the
                remaining weights are normalized. All values clamped 0–100.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
