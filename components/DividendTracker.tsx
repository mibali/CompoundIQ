"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DividendSummary } from "@/lib/dividends";
import { formatCurrency } from "@/lib/projection";

interface DividendTrackerProps {
  summary: DividendSummary;
  currency: string;
}

function CustomBarTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length || !payload[0].value) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: "rgba(15,23,42,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-emerald-400">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DividendTracker({ summary, currency }: DividendTrackerProps) {
  const hasData = summary.totalReceived > 0;
  const maxMonthly = Math.max(...summary.byMonth.map((m) => m.amount), 0.01);

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
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            Dividend Income
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasData
              ? `${summary.payingTickers} holding${summary.payingTickers !== 1 ? "s" : ""} paying dividends`
              : "No dividends received yet"}
          </p>
        </div>
        {summary.lastPaymentDate && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            Last: {formatShortDate(summary.lastPaymentDate)}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total Received",
            value: formatCurrency(summary.totalReceived, currency),
            color: "#10b981",
          },
          {
            label: "Last 12 Months",
            value: formatCurrency(summary.ttmIncome, currency),
            color: "#6366f1",
          },
          {
            label: "Portfolio Yield",
            value: `${summary.projectedAnnualYield.toFixed(2)}%`,
            color: "#f59e0b",
          },
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

      {/* Monthly bar chart */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Monthly income — last 12 months
        </p>
        {hasData ? (
          <div style={{ height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.byMonth} barSize={14} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v === 0 ? "" : `${currency === "GBP" ? "£" : "$"}${v}`)}
                />
                <RechartsTooltip
                  content={<CustomBarTooltip currency={currency} />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                  {summary.byMonth.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.amount > 0
                          ? entry.amount === maxMonthly
                            ? "#10b981"
                            : "rgba(16,185,129,0.45)"
                          : "rgba(255,255,255,0.05)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ height: 110, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs text-slate-600">No dividend history in last 12 months</p>
          </div>
        )}
      </div>

      {/* Per-ticker breakdown */}
      {summary.byTicker.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            By holding
          </p>
          <div className="flex flex-col gap-1.5">
            {summary.byTicker.map((t) => (
              <div key={t.ticker} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  {t.ticker.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 leading-none">
                    {t.ticker}
                  </p>
                  {t.companyName && (
                    <p className="text-xs text-slate-600 leading-none mt-0.5 truncate">
                      {t.companyName}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-200">
                    {formatCurrency(t.total, currency)}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t.payments} payment{t.payments !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
