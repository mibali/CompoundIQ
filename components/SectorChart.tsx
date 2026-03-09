"use client";

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import type { SectorAllocation } from "@/lib/sectors";
import { formatCurrency } from "@/lib/projection";

interface SectorChartProps {
  allocations: SectorAllocation[];
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: SectorAllocation }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: "rgba(15,23,42,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p className="font-semibold text-white mb-1">{d.sector}</p>
      <p className="text-slate-400">{d.weight.toFixed(1)}% of portfolio</p>
      <p className="text-slate-400">{formatCurrency(d.value, currency)}</p>
      {d.tickers.length > 0 && (
        <p className="text-slate-500 mt-1">{d.tickers.join(", ")}</p>
      )}
    </div>
  );
}

export default function SectorChart({ allocations, currency }: SectorChartProps) {
  if (allocations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-xs text-slate-500">No position data</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Sector Allocation
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          How your money is spread across industries
        </p>
      </div>

      {/* Chart + legend */}
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="flex-shrink-0" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                dataKey="weight"
                stroke="none"
              >
                {allocations.map((entry) => (
                  <Cell key={entry.sector} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                content={<CustomTooltip currency={currency} />}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {allocations.map((a) => (
            <div key={a.sector} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: a.color }}
              />
              <span className="text-xs text-slate-400 flex-1 truncate">{a.sector}</span>
              <span
                className="text-xs font-semibold flex-shrink-0 w-10 text-right"
                style={{ color: a.color }}
              >
                {a.weight.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
