"use client"

import * as React from "react"
import { PriceAreaChart, PricePoint } from "@/components/ledger/Charts"

type Range = "3M" | "1Y" | "5Y"

const RANGES: { label: string; value: Range }[] = [
  { label: "3M", value: "3M" },
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
]

interface PriceChartWidgetProps {
  data: Record<Range, PricePoint[]>
  symbol: string
  currentPrice: number
  isPositive: boolean
  changeAmount: number
  changePercentage: number
  week52High: number
  week52Low: number
}

function Week52Range({ current, low, high }: { current: number; low: number; high: number }) {
  const range = high - low
  const pos = range > 0 ? ((current - low) / range) * 100 : 50
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
      <p className="text-xs text-ink-muted">Intraday chart data is unavailable on the current API plan.</p>
    </div>
  )
}

export function PriceChartWidget({
  data,
  currentPrice,
  isPositive,
  changeAmount,
  changePercentage,
  week52High,
  week52Low,
}: PriceChartWidgetProps) {
  const [range, setRange] = React.useState<Range>("1Y")
  const chartData = data[range] ?? []
  const hasAnyData = Object.values(data).some(arr => arr.length > 0)

  let displayChangeAmount = changeAmount
  let displayChangePercentage = changePercentage
  let displayIsPositive = isPositive

  if (chartData.length > 0) {
    const firstPrice = chartData[0].close
    const diff = currentPrice - firstPrice
    displayChangeAmount = Math.abs(diff)
    displayChangePercentage = firstPrice > 0 ? Math.abs((diff / firstPrice) * 100) : 0
    displayIsPositive = diff >= 0
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted">
            Price History
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-serif text-2xl text-ink">
              ${currentPrice.toFixed(2)}
            </span>
            <span className={`text-xs font-sans font-bold ${displayIsPositive ? "text-positive" : "text-negative"}`}>
              {displayIsPositive ? "▲" : "▼"} ${displayChangeAmount.toFixed(2)} ({displayChangePercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-paper-alt border border-rule-dashed rounded-sm p-0.5">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm transition-all ${
                range === value
                  ? "bg-ink text-paper"
                  : "text-ink-muted hover:text-ink hover:bg-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow min-h-0" style={{ height: "220px" }}>
        {chartData.length > 0 ? (
          <PriceAreaChart data={chartData} isPositive={displayIsPositive} />
        ) : hasAnyData ? (
          <div className="h-full flex items-center justify-center text-ink-muted text-sm">
            No data for this range
          </div>
        ) : (
          <Week52Range current={currentPrice} low={week52Low} high={week52High} />
        )}
      </div>
    </div>
  )
}
