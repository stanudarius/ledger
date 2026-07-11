"use client"

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

const COLORS = {
  ink:       "#1A1A1A",
  muted:     "#6B6558",
  positive:  "#2E7D46",
  negative:  "#C0392B",
  blue:      "#4C6FE7",
  orange:    "#E08E45",
  ruleDash:  "#C9C2AE",
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (Math.abs(value) >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`
  if (Math.abs(value) >= 1e6)  return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

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
            {entry.dataKey === "margin" ? formatPercent(entry.value) : formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ComboChart({ data }: { data: Record<string, unknown>[] }) {
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
            tickFormatter={formatCompact}
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

interface DonutEntry { name: string; value: number; color: string }

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
      <div className="text-ink-muted">{formatCompact(entry.value)}</div>
    </div>
  )
}

export function DonutChart({ data }: { data: DonutEntry[] }) {
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 px-2 pb-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
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
}

interface PriceChartProps {
  data: PricePoint[]
  isPositive?: boolean
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

export function PriceAreaChart({ data, isPositive = true }: PriceChartProps) {
  const color    = isPositive ? COLORS.positive : COLORS.negative
  const gradId   = `priceGrad-${isPositive ? "pos" : "neg"}`
  const prices   = data.map(d => d.close)
  const minPrice = Math.min(...prices) * 0.998
  const maxPrice = Math.max(...prices) * 1.002

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
            tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "var(--font-inter)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
            tickFormatter={(val: string) => {
              const d = new Date(val)
              return `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`
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

export function EarningsSurpriseChart({ data }: { data: EarningsBarData[] }) {
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
