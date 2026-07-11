import * as React from "react"
import { cn } from "@/lib/utils"

interface SketchAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  size?: "sm" | "md" | "lg";
}

export function SketchAvatar({ initials, size = "md", className, ...props }: SketchAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-border shadow-sm select-none",
        "font-serif text-ink tracking-tighter",
        "bg-gradient-to-br from-paper to-paper-alt",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initials.toUpperCase()}
    </div>
  )
}
