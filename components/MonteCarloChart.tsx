"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonteCarloPoint, MonteCarloResult } from "@/lib/montecarlo";
import { formatCurrency } from "@/lib/projection";

interface MonteCarloChartProps {
  result: MonteCarloResult;
  currency: string;
  years: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: MonteCarloPoint }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs"
      style={{
        background: "rgba(15,23,42,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        minWidth: 180,
      }}
    >
      <p className="font-semibold text-white mb-2">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span style={{ color: "#10b981" }}>Optimistic (90th)</span>
          <span className="font-semibold text-white">{formatCurrency(d.p90, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: "#a78bfa" }}>Above average (75th)</span>
          <span className="font-semibold text-white">{formatCurrency(d.p75, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: "#e879f9" }}>Median (50th)</span>
          <span className="font-semibold text-white">{formatCurrency(d.p50, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: "#a78bfa" }}>Below average (25th)</span>
          <span className="font-semibold text-white">{formatCurrency(d.p25, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: "#f87171" }}>Pessimistic (10th)</span>
          <span className="font-semibold text-white">{formatCurrency(d.p10, currency)}</span>
        </div>
        <div
          className="flex justify-between gap-4 mt-1 pt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-slate-500">Contributions</span>
          <span className="text-slate-400">{formatCurrency(d.contributions, currency)}</span>
        </div>
      </div>
    </div>
  );
}

function formatYAxis(value: number, currency: string): string {
  const sym = currency === "GBP" ? "£" : "$";
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}k`;
  return `${sym}${value}`;
}

export default function MonteCarloChart({ result, currency, years }: MonteCarloChartProps) {
  const { points, finalP10, finalP50, finalP90 } = result;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Pessimistic (10th %ile)", value: formatCurrency(finalP10, currency), color: "#f87171" },
          { label: "Median (50th %ile)", value: formatCurrency(finalP50, currency), color: "#e879f9" },
          { label: "Optimistic (90th %ile)", value: formatCurrency(finalP90, currency), color: "#10b981" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.ceil(years / 8) - 1}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatYAxis(v, currency)}
              width={52}
            />
            <RechartsTooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
            />

            {/* Outer band: p10 base (transparent) + p90-p10 visible */}
            <Area
              type="monotone"
              dataKey="bandOuterBottom"
              stackId="outer"
              stroke="none"
              fill="transparent"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="bandOuter"
              stackId="outer"
              stroke="none"
              fill="rgba(139,92,246,0.12)"
              legendType="none"
            />

            {/* Inner band: p25 base (transparent) + p75-p25 visible */}
            <Area
              type="monotone"
              dataKey="bandInnerBottom"
              stackId="inner"
              stroke="none"
              fill="transparent"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="bandInner"
              stackId="inner"
              stroke="none"
              fill="rgba(139,92,246,0.22)"
              legendType="none"
            />

            {/* Median line */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#e879f9"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#e879f9", strokeWidth: 0 }}
            />

            {/* Contributions baseline */}
            <Line
              type="monotone"
              dataKey="contributions"
              stroke="rgba(100,116,139,0.5)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[
          { color: "#10b981", label: "90th percentile (optimistic)" },
          { color: "#e879f9", label: "50th percentile (median)", line: true },
          { color: "#f87171", label: "10th percentile (pessimistic)" },
          { color: "rgba(100,116,139,0.5)", label: "Contributions", dash: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            {l.line || l.dash ? (
              <div
                className="w-5 h-0.5"
                style={{
                  background: l.color,
                  borderTop: l.dash ? `2px dashed ${l.color}` : undefined,
                  height: l.dash ? 0 : undefined,
                }}
              />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            )}
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-3 rounded"
            style={{ background: "rgba(139,92,246,0.22)" }}
          />
          <span className="text-xs text-slate-500">25th–75th percentile range</span>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Based on 1,000 simulated paths using 8% mean annual return and 15% volatility. Not financial advice.
      </p>
    </div>
  );
}
