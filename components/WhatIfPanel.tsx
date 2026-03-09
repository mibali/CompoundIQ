"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/projection";

interface WhatIfPanelProps {
  currentValue: number;
  monthlyContribution: number;
  years: number;
  currency: string;
  annualRate?: number;  // decimal, e.g. 0.08 — defaults to 8% moderate
}

function project(pv: number, monthly: number, years: number, annualRate: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  const fvCurrent = pv * Math.pow(1 + r, n);
  const fvContrib = r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
  return fvCurrent + fvContrib;
}

/** Build a series of {label, value} points — one per year from 0 to years */
function projectSeries(
  pv: number,
  monthly: number,
  years: number,
  annualRate: number
): { label: string; value: number }[] {
  const points: { label: string; value: number }[] = [];
  // For sub-year horizons use monthly steps; otherwise one step per year (max 20)
  const steps = years < 1 ? Math.round(years * 12) : Math.min(Math.round(years), 20);
  for (let i = 0; i <= steps; i++) {
    const y = (years / steps) * i;
    points.push({
      label: y === 0 ? "Now" : y < 1 ? `${Math.round(y * 12)}mo` : `${Math.round(y)}yr`,
      value: Math.round(project(pv, monthly, y, annualRate)),
    });
  }
  return points;
}

function formatYAxis(value: number, currency: string): string {
  const sym = currency === "GBP" ? "£" : "$";
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}k`;
  return `${sym}${value}`;
}

type ScenarioType = "lumpsum" | "monthly";

export default function WhatIfPanel({
  currentValue,
  monthlyContribution,
  years,
  currency,
  annualRate = 0.08,
}: WhatIfPanelProps) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>("lumpsum");
  const [lumpSum, setLumpSum] = useState<string>("1000");
  const [newMonthly, setNewMonthly] = useState<string>(
    String(Math.round(monthlyContribution * 1.5))
  );

  const baseline = useMemo(
    () => project(currentValue, monthlyContribution, years, annualRate),
    [currentValue, monthlyContribution, years, annualRate]
  );

  const whatIfValue = useMemo(() => {
    if (scenarioType === "lumpsum") {
      const extra = parseFloat(lumpSum) || 0;
      return project(currentValue + extra, monthlyContribution, years, annualRate);
    } else {
      const nm = parseFloat(newMonthly) || 0;
      return project(currentValue, nm, years, annualRate);
    }
  }, [scenarioType, lumpSum, newMonthly, currentValue, monthlyContribution, years, annualRate]);

  const delta = whatIfValue - baseline;
  const deltaPositive = delta >= 0;

  // Chart data — baseline vs scenario series merged by index
  const chartData = useMemo(() => {
    const baseSeries = projectSeries(currentValue, monthlyContribution, years, annualRate);
    const scenarioPV =
      scenarioType === "lumpsum"
        ? currentValue + (parseFloat(lumpSum) || 0)
        : currentValue;
    const scenarioMonthly =
      scenarioType === "monthly" ? parseFloat(newMonthly) || 0 : monthlyContribution;
    const scenSeries = projectSeries(scenarioPV, scenarioMonthly, years, annualRate);
    return baseSeries.map((b, i) => ({
      label: b.label,
      baseline: b.value,
      scenario: scenSeries[i]?.value ?? b.value,
    }));
  }, [scenarioType, lumpSum, newMonthly, currentValue, monthlyContribution, years, annualRate]);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div>
        <p className="text-xs font-bold text-white uppercase tracking-widest">
          What If?
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          See how changes impact your {years === 0.5 ? "6-month" : `${years}-year`} projection · {(annualRate * 100).toFixed(1)}% return
        </p>
      </div>

      {/* Toggle */}
      <div
        className="flex rounded-lg p-0.5 gap-0.5"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {(["lumpsum", "monthly"] as ScenarioType[]).map((type) => (
          <button
            key={type}
            onClick={() => setScenarioType(type)}
            className="flex-1 rounded-md py-1.5 text-xs font-semibold transition-all"
            style={{
              background:
                scenarioType === type
                  ? "rgba(139,92,246,0.3)"
                  : "transparent",
              color: scenarioType === type ? "#c4b5fd" : "#64748b",
              border:
                scenarioType === type
                  ? "1px solid rgba(139,92,246,0.4)"
                  : "1px solid transparent",
            }}
          >
            {type === "lumpsum" ? "Lump Sum" : "Monthly Change"}
          </button>
        ))}
      </div>

      {/* Input */}
      {scenarioType === "lumpsum" ? (
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Add a one-time lump sum today
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center rounded-lg px-3 py-2 flex-1"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-slate-400 text-sm mr-2">
                {currency === "GBP" ? "£" : "$"}
              </span>
              <input
                type="number"
                value={lumpSum}
                onChange={(e) => setLumpSum(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 outline-none"
                min={0}
                step={500}
              />
            </div>
            {/* Quick presets */}
            <div className="flex gap-1">
              {[500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setLumpSum(String(amt))}
                  className="text-xs px-2 py-1.5 rounded-lg"
                  style={{
                    background:
                      lumpSum === String(amt)
                        ? "rgba(139,92,246,0.3)"
                        : "rgba(255,255,255,0.05)",
                    color: lumpSum === String(amt) ? "#c4b5fd" : "#64748b",
                    border:
                      lumpSum === String(amt)
                        ? "1px solid rgba(139,92,246,0.3)"
                        : "1px solid transparent",
                  }}
                >
                  {currency === "GBP" ? "£" : "$"}
                  {amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Change monthly contribution
            <span className="text-slate-600 ml-1">
              (currently {formatCurrency(monthlyContribution, currency)}/mo)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center rounded-lg px-3 py-2 flex-1"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-slate-400 text-sm mr-2">
                {currency === "GBP" ? "£" : "$"}
              </span>
              <input
                type="number"
                value={newMonthly}
                onChange={(e) => setNewMonthly(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 outline-none"
                min={0}
                step={50}
              />
              <span className="text-slate-500 text-xs">/mo</span>
            </div>
            {/* Quick multipliers */}
            <div className="flex gap-1">
              {[1.25, 1.5, 2].map((mult) => {
                const active = newMonthly === String(Math.round(monthlyContribution * mult));
                return (
                  <button
                    key={mult}
                    onClick={() =>
                      setNewMonthly(
                        String(Math.round(monthlyContribution * mult))
                      )
                    }
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{
                      background: active ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                      color: active ? "#c4b5fd" : "#64748b",
                      border: active ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                    }}
                  >
                    ×{mult}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Result comparison */}
      <div
        className="rounded-xl p-4 grid grid-cols-3 gap-3 sm:flex sm:gap-4"
        style={{
          background: deltaPositive
            ? "rgba(16,185,129,0.06)"
            : "rgba(239,68,68,0.06)",
          border: `1px solid ${deltaPositive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}
      >
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-0.5">Baseline</p>
          <p className="text-sm sm:text-lg font-bold text-slate-300">
            {formatCurrency(Math.round(baseline), currency)}
          </p>
        </div>
        <div
          className="hidden sm:block w-px self-stretch"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-0.5">With change</p>
          <p
            className="text-sm sm:text-lg font-bold"
            style={{ color: deltaPositive ? "#10b981" : "#f87171" }}
          >
            {formatCurrency(Math.round(whatIfValue), currency)}
          </p>
        </div>
        <div
          className="hidden sm:block w-px self-stretch"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-0.5">Extra gain</p>
          <p
            className="text-sm sm:text-lg font-bold"
            style={{ color: deltaPositive ? "#10b981" : "#f87171" }}
          >
            {deltaPositive ? "+" : ""}
            {formatCurrency(Math.round(delta), currency)}
          </p>
        </div>
      </div>

      {/* Simulation chart */}
      <div>
        <p className="text-xs text-slate-500 mb-2">
          Growth comparison over {years === 0.5 ? "6 months" : `${years} ${years === 1 ? "year" : "years"}`}
        </p>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatYAxis(v, currency)}
                width={48}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.98)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  fontSize: 11,
                }}
                itemStyle={{ color: "#e2e8f0" }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [
                  formatCurrency(value ?? 0, currency),
                  name === "baseline" ? "Baseline" : "With change",
                ]}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="rgba(100,116,139,0.7)"
                strokeWidth={1.5}
                fill="rgba(100,116,139,0.08)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="scenario"
                stroke={deltaPositive ? "#8b5cf6" : "#f87171"}
                strokeWidth={2}
                fill={
                  deltaPositive
                    ? "rgba(139,92,246,0.15)"
                    : "rgba(248,113,113,0.1)"
                }
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5" style={{ background: "rgba(100,116,139,0.7)" }} />
            <span className="text-xs text-slate-500">Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5"
              style={{ background: deltaPositive ? "#8b5cf6" : "#f87171" }}
            />
            <span className="text-xs text-slate-500">With change</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Assumes {(annualRate * 100).toFixed(1)}% annual return
        {annualRate === 0.08 ? " (moderate default)" : " (your custom rate)"}
        . Not financial advice.
      </p>
    </div>
  );
}
