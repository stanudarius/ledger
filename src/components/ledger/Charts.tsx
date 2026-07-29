"use client"
import { formatCompactCurrency, formatPercent, niceTicks } from "@/lib/format";
import { useChartColors } from "@/lib/ThemeContext";
import type { ChartColorKey } from "@/lib/chartColors";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-3 shadow-lg text-xs font-sans">
      <div className="font-bold text-ink mb-2 uppercase tracking-widest text-[10px]">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-ink-muted">{entry.name}:</span>
          <span className="text-ink font-medium">
            {entry.dataKey === "margin" ? formatPercent(entry.value) : formatCompactCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ComboChart({ data }: { data: Record<string, unknown>[] }) {
  const COLORS = useChartColors();
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCompactCurrency}
            width={52}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatPercent}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="revenue"   fill={COLORS.ink}  radius={[2,2,0,0]} name="Revenue"    />
          <Bar yAxisId="left" dataKey="netIncome" fill={COLORS.blue} radius={[2,2,0,0]} name="Net Income" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="margin"
            stroke={COLORS.orange}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.orange, strokeWidth: 0 }}
            name="Margin %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CashFlowBarEntry { name: string; value: number; color: ChartColorKey }

function CashFlowTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: CashFlowBarEntry }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-2 shadow-lg text-xs font-sans">
      <div className="text-ink font-medium">{entry.name}</div>
      <div className={entry.value >= 0 ? "text-positive" : "text-negative"}>
        {formatCompactCurrency(entry.value)}
      </div>
    </div>
  );
}

export function CashFlowBarChart({ data }: { data: CashFlowBarEntry[] }) {
  const COLORS = useChartColors();
  const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const [niceMin, niceMax] = niceTicks(-maxAbs, maxAbs, 5);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.ruleDash} />
          <XAxis
            type="number"
            domain={[niceMin, niceMax]}
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCompactCurrency}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            width={78}
          />
          <Tooltip content={<CashFlowTooltip />} />
          <ReferenceLine x={0} stroke={COLORS.muted} strokeWidth={0.5} />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.color]} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutEntry { name: string; value: number; color: ChartColorKey }

interface DonutTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: DonutEntry }>
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-2 shadow-lg text-xs font-sans">
      <div className="text-ink font-medium">{entry.name}</div>
      <div className="text-ink-muted">{formatCompactCurrency(entry.value)}</div>
    </div>
  )
}

export function DonutChart({ data }: { data: DonutEntry[] }) {
  const COLORS = useChartColors();
  return (
    <div className="w-full flex flex-col">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.color]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 px-2 pb-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[entry.color] }} />
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-muted">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface PricePoint {
  date: string
  close: number
  sma20?: number | null
  sma50?: number | null
  bollUpper?: number | null
  bollLower?: number | null
  rsi?: number | null
  macdLine?: number | null
  signalLine?: number | null
  macdHist?: number | null
  atr?: number | null
}

type ChartRange = "3M" | "1Y" | "5Y"

interface PriceChartProps {
  data: PricePoint[]
  range: ChartRange
  isPositive?: boolean
  showSMA20?: boolean
  showSMA50?: boolean
  showBollinger?: boolean
}

interface PriceTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function PriceTooltip({ active, payload, label }: PriceTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-3 shadow-lg text-xs font-sans">
      <div className="text-ink-muted text-[10px] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-ink font-bold text-base">${payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export function PriceAreaChart({ data, range, isPositive = true, showSMA20, showSMA50, showBollinger }: PriceChartProps) {
  const COLORS = useChartColors();
  const color    = isPositive ? COLORS.positive : COLORS.negative
  const gradId   = `priceGrad-${isPositive ? "pos" : "neg"}`
  const prices   = data.map(d => d.close)
  let dataMin = Math.min(...prices)
  let dataMax = Math.max(...prices)

  // Expand domain to include Bollinger bands when visible
  if (showBollinger) {
    const bollValues = data
      .flatMap(d => [d.bollUpper, d.bollLower])
      .filter((v): v is number => v != null)
    if (bollValues.length > 0) {
      dataMin = Math.min(dataMin, Math.min(...bollValues))
      dataMax = Math.max(dataMax, Math.max(...bollValues))
    }
  }

  const [minPrice, maxPrice] = niceTicks(dataMin, dataMax);

  // For 5Y, compute evenly-spaced date ticks to avoid trailing gap
  let xTicks: string[] | undefined;
  if (range === "5Y" && data.length >= 3) {
    const count = 7;
    xTicks = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (data.length - 1));
      xTicks.push(data[idx].date);
    }
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            interval={xTicks ? 0 : "preserveStartEnd"}
            minTickGap={xTicks ? 0 : 60}
            tickFormatter={(val: string) => {
              const d = new Date(val)
              if (range === "3M") {
                // DD MMM — avoids duplicate month labels with daily granularity
                const day = d.getDate()
                const mon = d.toLocaleString("en-US", { month: "short" })
                return `${day} ${mon}`
              }
              // MMM YYYY for 1Y / 5Y
              return `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`
            }}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            width={48}
          />
          <Tooltip content={<PriceTooltip />} />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
          {showSMA20 && (
            <Line type="monotone" dataKey="sma20" stroke={COLORS.blue} strokeWidth={1} strokeDasharray="4 3" dot={false} />
          )}
          {showSMA50 && (
            <Line type="monotone" dataKey="sma50" stroke={COLORS.orange} strokeWidth={1} strokeDasharray="4 3" dot={false} />
          )}
          {showBollinger && (
            <>
              <Line type="monotone" dataKey="bollUpper" stroke={COLORS.muted} strokeWidth={0.5} dot={false} />
              <Line type="monotone" dataKey="bollLower" stroke={COLORS.muted} strokeWidth={0.5} dot={false} />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface EarningsBarData {
  period: string
  estimated: number
  actual: number
}

interface EarningsTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function EarningsTooltip({ active, payload, label }: EarningsTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-3 shadow-lg text-xs font-sans">
      <div className="font-bold text-ink mb-2 uppercase tracking-widest text-[10px]">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-ink-muted">{entry.name}:</span>
          <span className="text-ink font-medium">${entry.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export function RSIChart({ data }: { data: Array<{ date: string; rsi?: number | null }> }) {
  const COLORS = useChartColors();
  return (
    <div className="w-full">
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
            <XAxis dataKey="date" hide />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 30, 50, 70, 100]}
              tick={{ fontSize: 8, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <ReferenceLine y={70} stroke={COLORS.negative} strokeDasharray="2 2" strokeWidth={0.5} />
            <ReferenceLine y={30} stroke={COLORS.positive} strokeDasharray="2 2" strokeWidth={0.5} />
            <ReferenceLine y={50} stroke={COLORS.muted} strokeDasharray="1 1" strokeWidth={0.3} />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke={COLORS.blue}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function MACDChart({ data }: { data: Array<{ date: string; macdLine?: number | null; signalLine?: number | null; macdHist?: number | null }> }) {
  const COLORS = useChartColors();
  // Compute nice domain from actual MACD values so negative labels appear
  const macdVals = data.flatMap(d => [d.macdLine, d.signalLine, d.macdHist]).filter((v): v is number => v != null);
  const [niceMin, niceMax] = macdVals.length > 0 ? niceTicks(Math.min(...macdVals), Math.max(...macdVals), 5) : [0, 1];

  return (
    <div className="w-full">
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
            <XAxis dataKey="date" hide />
            <YAxis
              domain={[niceMin, niceMax]}
              tick={{ fontSize: 8, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickCount={5}
            />
            <ReferenceLine y={0} stroke={COLORS.muted} strokeDasharray="1 1" strokeWidth={0.5} />
            <Bar dataKey="macdHist" radius={[1, 1, 0, 0]} opacity={0.6}>
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={(entry.macdHist ?? 0) >= 0 ? COLORS.positive : COLORS.negative} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="macdLine" stroke={COLORS.blue} strokeWidth={1} dot={false} connectNulls />
            <Line type="monotone" dataKey="signalLine" stroke={COLORS.orange} strokeWidth={1} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ATRChart({ data }: { data: Array<{ date: string; atr?: number | null }> }) {
  const COLORS = useChartColors();
  return (
    <div className="w-full">
      <div className="h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
            <XAxis dataKey="date" hide />
            <YAxis
              domain={[0, "auto"]}
              tick={{ fontSize: 8, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickCount={5}
              tickFormatter={(v: number) => `$${v.toFixed(1)}`}
            />
            <Line type="monotone" dataKey="atr" stroke={COLORS.orange} strokeWidth={1.5} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function EarningsSurpriseChart({ data }: { data: EarningsBarData[] }) {
  const COLORS = useChartColors();
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.ruleDash} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            width={40}
          />
          <Tooltip content={<EarningsTooltip />} />
          <ReferenceLine y={0} stroke={COLORS.muted} strokeDasharray="3 3" />
          <Bar dataKey="estimated" name="Est. EPS" fill={COLORS.ruleDash} radius={[2,2,0,0]} />
          <Bar dataKey="actual"    name="Act. EPS"
            radius={[2,2,0,0]}
            fill={COLORS.ink}
          >
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.actual >= entry.estimated ? COLORS.positive : COLORS.negative}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
