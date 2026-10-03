import * as React from "react"
import { cn } from "@/lib/utils"

interface StatBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | React.ReactNode;
  implication?: string;
  delta?: { value: string; isPositive: boolean };
}

export function StatBlock({ label, value, implication, delta, className, ...props }: StatBlockProps) {
  return (
    <div className={cn("flex flex-col gap-1 py-3", className)} {...props}>
      <div className="flex justify-between items-end">
        <span className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
          {label}
        </span>
        {delta && (
          <span className={cn("text-xs font-medium", delta.isPositive ? "text-positive" : "text-negative")}>
            {delta.isPositive ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      <div className="font-serif text-2xl tracking-tight text-ink">
        {value}
      </div>
      {implication && (
        <div className="mt-1 text-sm text-ink-muted leading-snug">
          {implication}
        </div>
      )}
    </div>
  )
}
