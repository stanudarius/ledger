import { formatCurrency } from "@/lib/format";

interface Week52RangeProps {
  current: number;
  low: number;
  high: number;
  /** Render a compact inline variant vs. the full card variant. */
  variant?: "compact" | "full";
}

export function Week52Range({ current, low, high, variant = "compact" }: Week52RangeProps) {
  if (high <= 0 || low <= 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">
          <span>52-Week Range</span>
        </div>
        <div className="text-center text-xs text-ink-muted py-1">Data unavailable</div>
      </div>
    );
  }

  const range = high - low;
  // Clamp position to [3, 97] so the dot never overflows the container edges.
  // Also handles case where current is outside the 52-week range (new ATH/ATL).
  const rawPos = range > 0 ? ((current - low) / range) * 100 : 50;
  const pos = Math.max(3, Math.min(97, rawPos));

  if (variant === "full") {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 px-8">
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted">
          52-Week Range
        </span>
        <div className="w-full max-w-md">
          <div className="flex justify-between text-[10px] font-sans text-ink-muted mb-1.5">
            <span>${low.toFixed(0)}</span>
            <span>${high.toFixed(0)}</span>
          </div>
          <div className="relative h-2 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-ink-muted/30 rounded-full"
              style={{ width: `${pos}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-ink rounded-full border-2 border-paper shadow-sm"
              style={{ left: `calc(${pos}% - 6px)` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="font-serif text-lg text-ink">${current.toFixed(2)}</span>
            <span className="text-[10px] font-sans text-ink-muted ml-2">
              {pos >= 75 ? "Near high" : pos <= 25 ? "Near low" : "Mid-range"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-sans font-bold uppercase tracking-widest text-ink-muted">
        <span>{formatCurrency(low)}</span>
        <span>52-Week Range</span>
        <span>{formatCurrency(high)}</span>
      </div>
      <div className="relative h-1.5 bg-paper-alt border border-rule-dashed rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-ink-muted/40 rounded-full"
          style={{ width: `${pos}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-ink rounded-full border-2 border-paper shadow-sm"
          style={{ left: `calc(${pos}% - 5px)` }}
        />
      </div>
      <div className="text-center text-[9px] font-sans text-ink-muted">
        Current: <span className="font-bold text-ink">{formatCurrency(current)}</span>
        &nbsp;·&nbsp;
        {pos >= 75 ? "Near 52W High" : pos <= 25 ? "Near 52W Low" : "Mid Range"}
      </div>
    </div>
  );
}
