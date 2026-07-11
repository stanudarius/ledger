import * as React from "react"
import { cn } from "@/lib/utils"

export function MetaLine({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold flex items-center gap-2 flex-wrap", className)} 
      {...props}
    >
      {children}
    </div>
  )
}
