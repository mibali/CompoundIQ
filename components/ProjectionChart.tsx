"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProjectionPoint } from "@/lib/projection";
import { formatCurrency } from "@/lib/projection";

interface Props {
  data: ProjectionPoint[];
  currency?: string;
  customRate?: number; // e.g. 0.10 for 10% — shows amber line when defined
  height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-4 text-sm space-y-2"
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
        minWidth: 200,
      }}
    >
      <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <div key={entry.dataKey} className="flex justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: entry.color }}
              />
              <span className="text-slate-400 text-xs">{entry.name}</span>
            </div>
            <span className="font-bold text-white text-xs">
              {formatCurrency(Number(entry.value))}
            </span>
          </div>
        )
      )}
    </div>
  );
}

export default function ProjectionChart({ data, currency = "GBP", customRate, height = 340 }: Props) {
  const sym = currency === "GBP" ? "£" : "$";
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(0)}k`;
    return formatCurrency(v, currency);
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradContrib" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradConservative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradModerate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAggressive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCustom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#64748b", paddingTop: 16 }}
          iconType="circle"
          iconSize={8}
        />

        <Area
          type="monotone"
          dataKey="contributions"
          name="Contributions"
          stroke="#475569"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          fill="url(#gradContrib)"
        />
        <Area
          type="monotone"
          dataKey="conservative"
          name="Conservative (5%)"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#gradConservative)"
        />
        <Area
          type="monotone"
          dataKey="moderate"
          name="Moderate (8%)"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#gradModerate)"
        />
        <Area
          type="monotone"
          dataKey="aggressive"
          name="Aggressive (12%)"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#gradAggressive)"
        />
        {customRate !== undefined && (
          <Area
            type="monotone"
            dataKey="custom"
            name={`Custom (${(customRate * 100).toFixed(1)}%)`}
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#gradCustom)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
