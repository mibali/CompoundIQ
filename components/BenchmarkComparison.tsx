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
import type { BenchmarkResult } from "@/lib/benchmark";
import { formatCurrency } from "@/lib/projection";

interface BenchmarkComparisonProps {
  result: BenchmarkResult;
  currency: string;
}

function formatYAxis(value: number, currency: string): string {
  const sym = currency === "GBP" ? "£" : "$";
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}k`;
  return `${sym}${value}`;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
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
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-white">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BenchmarkComparison({ result, currency }: BenchmarkComparisonProps) {
  const { points, currentValue, sp500FinalValue, ftse100FinalValue, portfolioCAGR, sp500CAGR, yearsInvested, beatingMarket, firstTradeDate } = result;

  if (points.length < 2) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Portfolio vs Benchmark
        </h2>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ height: 120, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-slate-600">Not enough order history to compute benchmark</p>
        </div>
      </div>
    );
  }

  // Add current portfolio value as the last point for comparison
  const chartData = points.map((p, i) =>
    i === points.length - 1
      ? { ...p, portfolio: currentValue }
      : { ...p, portfolio: undefined }
  );

  const gap = currentValue - sp500FinalValue;
  const gapPositive = gap >= 0;
  const startYear = firstTradeDate ? new Date(firstTradeDate).getFullYear() : "—";

  // X-axis: show every 6th label to avoid clutter
  const tickInterval = Math.max(1, Math.floor(points.length / 8));

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Portfolio vs Benchmark
            </h2>
            {/* Beginner tooltip */}
            <div className="relative group flex-shrink-0">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs cursor-help select-none"
                style={{ background: "rgba(255,255,255,0.08)", color: "#64748b" }}
              >
                ?
              </div>
              <div
                className="absolute left-0 top-6 z-50 w-72 rounded-xl p-3 text-xs leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "rgba(15,23,42,0.98)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                }}
              >
                <p className="font-semibold text-white mb-1.5">What does this mean?</p>
                <p className="text-slate-300 mb-2">
                  We took every pound you invested, on the exact same dates, and asked:
                  <span className="text-indigo-400 font-medium"> "What if you&apos;d just put it all into a simple index fund instead?"</span>
                </p>
                <p className="text-slate-400 mb-2">
                  <span className="text-indigo-300 font-medium">S&amp;P 500</span> tracks America&apos;s 500 biggest companies (Apple, Google, Amazon…).{" "}
                  <span className="text-sky-300 font-medium">FTSE 100</span> tracks the UK&apos;s top 100 companies.
                </p>
                <p className="text-slate-400">
                  If your portfolio value is higher than what the index would have given you — you&apos;re{" "}
                  <span className="text-emerald-400 font-medium">beating the market</span>. Most professional fund managers don&apos;t!
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Same cash flows invested in the market since {startYear} ({yearsInvested} yrs)
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0"
          style={{
            background: beatingMarket ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
            color: beatingMarket ? "#10b981" : "#f87171",
          }}
        >
          {beatingMarket ? "Beating market" : "Lagging market"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Your Portfolio",
            value: formatCurrency(currentValue, currency),
            sub: `${portfolioCAGR >= 0 ? "+" : ""}${portfolioCAGR.toFixed(1)}% CAGR`,
            color: beatingMarket ? "#10b981" : "#f87171",
            tooltip: `Your portfolio's current value. CAGR (Compound Annual Growth Rate) is your average yearly return — like an average speed for your money's growth.`,
          },
          {
            label: "S&P 500",
            value: formatCurrency(sp500FinalValue, currency),
            sub: `${sp500CAGR.toFixed(1)}% CAGR`,
            color: "#6366f1",
            tooltip: `If you'd invested the same money on the same dates into an S&P 500 index fund (which tracks Apple, Google, Amazon and 497 other US giants), this is what you'd have today.`,
          },
          {
            label: gapPositive ? "You're ahead by" : "You're behind by",
            value: `${gapPositive ? "+" : ""}${formatCurrency(Math.abs(gap), currency)}`,
            sub: "vs S&P 500",
            color: gapPositive ? "#10b981" : "#f87171",
            tooltip: gapPositive
              ? `Your stock picks have grown more than a simple S&P 500 index fund would have. That's a real achievement — most professional fund managers don't beat the index!`
              : `An S&P 500 index fund would have grown more than your current portfolio over the same period. This doesn't mean you've lost money — just that the index grew faster.`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="relative group rounded-xl p-3 flex flex-col gap-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
            <p className="text-sm font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-slate-600">{s.sub}</p>
            {/* Hover tooltip */}
            <div
              className="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-xl p-2.5 text-xs leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "rgba(15,23,42,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              <p className="text-slate-300">{s.tooltip}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
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

            {/* Contributions */}
            <Area
              type="monotone"
              dataKey="contributions"
              name="Contributions"
              stroke="rgba(100,116,139,0.5)"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="rgba(100,116,139,0.06)"
            />

            {/* FTSE 100 */}
            <Line
              type="monotone"
              dataKey="ftse100"
              name="FTSE 100"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }}
            />

            {/* S&P 500 */}
            <Line
              type="monotone"
              dataKey="sp500"
              name="S&P 500"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            />

            {/* Your portfolio — single dot at the end */}
            <Line
              type="monotone"
              dataKey="portfolio"
              name="Your Portfolio"
              stroke={beatingMarket ? "#10b981" : "#f87171"}
              strokeWidth={0}
              dot={{ r: 6, fill: beatingMarket ? "#10b981" : "#f87171", strokeWidth: 2, stroke: "#080d1a" }}
              activeDot={{ r: 7 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[
          { color: beatingMarket ? "#10b981" : "#f87171", label: "Your portfolio (today)" },
          { color: "#6366f1", label: "S&P 500 (same cash flows)" },
          { color: "#0ea5e9", label: "FTSE 100 (same cash flows)" },
          { color: "rgba(100,116,139,0.5)", label: "Contributions", dash: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-5 h-0.5"
              style={{
                background: l.color,
                borderTop: l.dash ? `2px dashed ${l.color}` : undefined,
                height: l.dash ? 0 : undefined,
              }}
            />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        Benchmark assumes {(sp500CAGR * 100).toFixed(1)}% annual S&P 500 return and {(7.5).toFixed(1)}% FTSE 100 return with same cash flow timing. Not financial advice.
      </p>
    </div>
  );
}
