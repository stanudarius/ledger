"use client"

import * as React from "react"
import { PriceAreaChart, PricePoint, RSIChart, MACDChart, ATRChart } from "@/components/ledger/Charts"
import { sma, bollinger, rsi, macd, atr } from "@/lib/indicators"

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
  if (high <= 0 || low <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-2 px-8">
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted">
          52-Week Range
        </span>
        <span className="text-xs text-ink-muted">Data unavailable</span>
      </div>
    );
  }
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
  const [showSMA20, setShowSMA20] = React.useState(false)
  const [showSMA50, setShowSMA50] = React.useState(false)
  const [showBollinger, setShowBollinger] = React.useState(false)
  const [showRSI, setShowRSI] = React.useState(false)
  const [showMACD, setShowMACD] = React.useState(false)
  const [showATR, setShowATR] = React.useState(false)
  const chartData = data[range] ?? []
  const hasAnyData = Object.values(data).some(arr => arr.length > 0)

  // Compute indicators from close prices
  const enrichedData: PricePoint[] = React.useMemo(() => {
    if (chartData.length < 50) return chartData;
    const closes = chartData.map(d => d.close);
    const sma20Vals = showSMA20 ? sma(closes, 20) : null;
    const sma50Vals = showSMA50 ? sma(closes, 50) : null;
    const bb = showBollinger ? bollinger(closes, 20, 2) : null;
    const rsiVals = showRSI ? rsi(closes, 14) : null;
    const macdVals = showMACD ? macd(closes) : null;
    const atrVals = showATR ? atr(chartData as unknown as { close: number; high?: number; low?: number }[], 14) : null;
    return chartData.map((d, i) => ({
      ...d,
      sma20: sma20Vals?.[i],
      sma50: sma50Vals?.[i],
      bollUpper: bb?.upper[i],
      bollLower: bb?.lower[i],
      rsi: rsiVals?.[i],
      macdLine: macdVals?.macdLine[i],
      signalLine: macdVals?.signalLine[i],
      macdHist: macdVals?.histogram[i],
      atr: atrVals?.[i],
    }));
  }, [chartData, showSMA20, showSMA50, showBollinger, showRSI, showMACD, showATR]);

  // Slice to visible window — indicators computed on full buffered dataset
  const displayData = React.useMemo(() => {
    const windows: Record<Range, number> = { "3M": 3, "1Y": 12, "5Y": 60 };
    const months = windows[range];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const sliced = enrichedData.filter(d => d.date >= cutoffStr);
    return sliced.length > 0 ? sliced : enrichedData;
  }, [enrichedData, range]);

  let displayChangeAmount = changeAmount
  let displayChangePercentage = changePercentage
  let displayIsPositive = isPositive

  if (displayData.length > 0) {
    const firstPrice = displayData[0].close
    const diff = currentPrice - firstPrice
    displayChangeAmount = diff
    displayChangePercentage = firstPrice > 0 ? (diff / firstPrice) * 100 : 0
    displayIsPositive = diff >= 0
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
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

      {/* Indicator toggles */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-sans uppercase tracking-widest text-ink-muted">Indicators</span>
        {([
          { label: "SMA 20", show: showSMA20, set: setShowSMA20 },
          { label: "SMA 50", show: showSMA50, set: setShowSMA50 },
          { label: "Bollinger", show: showBollinger, set: setShowBollinger },
          { label: "RSI", show: showRSI, set: setShowRSI },
          { label: "MACD", show: showMACD, set: setShowMACD },
          { label: "ATR", show: showATR, set: setShowATR },
        ] as const).map(({ label, show, set }) => (
          <button
            key={label}
            onClick={() => set(!show)}
            className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-widest rounded-sm border transition-all ${
              show
                ? "bg-ink text-paper border-ink"
                : "text-ink-muted border-rule-dashed hover:border-ink/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-grow min-h-0" style={{ minHeight: "220px" }}>
        {displayData.length > 0 ? (
          <>
            <div style={{ height: "220px" }}>
              <PriceAreaChart
                data={displayData}
                range={range}
                isPositive={displayIsPositive}
                showSMA20={showSMA20}
                showSMA50={showSMA50}
                showBollinger={showBollinger}
              />
            </div>
            {showRSI && <RSIChart data={displayData} />}
            {showMACD && <MACDChart data={displayData} />}
            {showATR && <ATRChart data={displayData} />}
          </>
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
