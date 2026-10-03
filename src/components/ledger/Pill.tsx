import * as React from "react"
import { cn } from "@/lib/utils"

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "bullish" | "bearish";
}

export function Pill({ variant = "neutral", className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest border",
        {
          "border-border text-ink": variant === "neutral",
          "border-positive text-positive bg-positive/10": variant === "bullish",
          "border-negative text-negative bg-negative/10": variant === "bearish",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
