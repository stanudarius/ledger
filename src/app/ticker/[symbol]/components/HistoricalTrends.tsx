"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { IncomeStatementPeriod } from "@/lib/providers";

const COLORS = {
  ink: "#1A1A1A",
  blue: "#4C6FE7",
  positive: "#2E7D46",
  muted: "#6B6558",
  ruleDash: "#C9C2AE",
};

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-paper border border-ink/20 rounded-sm p-3 shadow-lg text-xs font-sans">
      <div className="font-bold text-ink mb-1.5 uppercase tracking-widest text-[10px]">
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-ink-muted">{entry.name}:</span>
          <span className="text-ink font-medium">
            {entry.name === "EPS"
              ? `$${entry.value.toFixed(2)}`
              : formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface HistoricalTrendsProps {
  income: IncomeStatementPeriod[];
}

export function HistoricalTrends({ income }: HistoricalTrendsProps) {
  if (!income || income.length < 2) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-ink mb-6 border-b border-rule pb-2">
          Historical Trends
        </h2>
        <p className="text-ink-muted text-sm">
          Insufficient historical data available.
        </p>
      </section>
    );
  }

  const sortedIncome = [...income].sort((a, b) => a.period.localeCompare(b.period));

  const cagr = (start: number, end: number, periods: number) => {
    if (start <= 0 || periods <= 0) return null;
    const ratio = end / start;
    if (ratio <= 0) return null;
    return (Math.pow(ratio, 1 / periods) - 1) * 100;
  };

  const periods = sortedIncome.length - 1;
  const revenueCAGR = cagr(sortedIncome[0].revenue, sortedIncome[sortedIncome.length - 1].revenue, periods);
  const netIncomeCAGR = cagr(
    sortedIncome[0].netIncome,
    sortedIncome[sortedIncome.length - 1].netIncome,
    periods
  );
  const epsCAGR = cagr(
    sortedIncome[0].eps,
    sortedIncome[sortedIncome.length - 1].eps,
    periods
  );

  const chartData = sortedIncome.map((d) => ({
    period: d.period,
    Revenue: d.revenue,
    "Net Income": d.netIncome,
    EPS: d.eps,
  }));



  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-ink mb-6 border-b border-rule pb-2">
        Historical Trends
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendChart
          title="Revenue"
          dataKey="Revenue"
          color={COLORS.ink}
          cagrValue={revenueCAGR}
          chartData={chartData}
        />
        <TrendChart
          title="Net Income"
          dataKey="Net Income"
          color={COLORS.blue}
          cagrValue={netIncomeCAGR}
          chartData={chartData}
        />
        <TrendChart
          title="EPS"
          dataKey="EPS"
          color={COLORS.positive}
          cagrValue={epsCAGR}
          chartData={chartData}
        />
      </div>
    </section>
  );
}

function TrendChart({
  title,
  dataKey,
  color,
  cagrValue,
  chartData,
}: {
  title: string;
  dataKey: string;
  color: string;
  cagrValue: number | null;
  chartData: Array<Record<string, string | number>>;
}) {
  return (
    <div className="border border-rule-dashed bg-paper-alt rounded-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-sans uppercase tracking-widest text-[10px] text-ink-muted font-bold">
          {title}
        </h3>
        {cagrValue !== null && (
          <span
            className={`text-[10px] font-sans font-bold uppercase tracking-widest ${
              cagrValue >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {cagrValue >= 0 ? "+" : ""}
            {cagrValue.toFixed(1)}% CAGR
          </span>
        )}
      </div>
      <div className="flex-grow" style={{ minHeight: "140px" }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={COLORS.ruleDash}
            />
            <XAxis
              dataKey="period"
              tick={{
                fontSize: 9,
                fill: COLORS.muted,
                fontFamily: "var(--font-inter)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 9,
                fill: COLORS.muted,
                fontFamily: "var(--font-inter)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={
                dataKey === "EPS"
                  ? (v: number) => `$${v.toFixed(1)}`
                  : formatCompact
              }
              width={48}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
