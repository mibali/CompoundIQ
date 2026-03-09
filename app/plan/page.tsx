"use client";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { formatCurrency } from "@/lib/projection";
import ProjectionChart from "@/components/ProjectionChart";
import MonteCarloChart from "@/components/MonteCarloChart";
import GoalsPanel from "@/components/GoalsPanel";
import WhatIfPanel from "@/components/WhatIfPanel";

const glass = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: "rgba(255,255,255,0.05)" }} />
  );
}

export default function PlanPage() {
  const {
    portfolio, loading, error,
    projectionData, monteCarloResult,
    monthly, setMonthly,
    years, setYears,
    inflationAdjust, setInflationAdjust,
    customRate, setCustomRate,
    customRateInput, setCustomRateInput,
    showMonteCarlo, setShowMonteCarlo,
    hideValues, simpleMode, setSimpleMode,
  } = usePortfolio();

  const currency = portfolio?.currencyCode ?? "GBP";
  const currencySymbol = currency === "GBP" ? "£" : "$";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-2xl p-6 text-center" style={{ ...glass, border: "1px solid rgba(244,63,94,0.2)" }}>
          <p className="text-rose-400 font-semibold">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const moderateProjection = projectionData.find((p) => p.year === years);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Plan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Goals, growth projections &amp; scenario simulation</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {([{ label: "Simple", value: true }, { label: "Advanced", value: false }] as const).map((opt) => (
            <button key={opt.label} onClick={() => setSimpleMode(opt.value)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: simpleMode === opt.value ? "rgba(99,102,241,0.25)" : "transparent",
                color: simpleMode === opt.value ? "#a5b4fc" : "#475569",
                border: simpleMode === opt.value ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* ── Life Goals ───────────────────────────────────────────────────── */}
      <GoalsPanel
        currentValue={portfolio.totalValue}
        monthlyContribution={monthly}
        currency={currency}
      />

      {/* ── Growth Projection ────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 space-y-5" style={glass}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Growth Projection</h2>
            <p className="text-xs text-slate-500 mt-0.5">Compound growth from {formatCurrency(portfolio.totalValue, currency)}</p>
          </div>
          {/* Monte Carlo toggle — advanced only */}
          {!simpleMode && (
            <button
              onClick={() => setShowMonteCarlo(!showMonteCarlo)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: showMonteCarlo ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                border: showMonteCarlo ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: showMonteCarlo ? "#a5b4fc" : "#64748b",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16s2-4 4-4 4 4 6 4 4-4 6-4 4 4 4 4" />
                <path d="M2 8s2-4 4-4 4 4 6 4 4-4 6-4 4 4 4 4" />
              </svg>
              Monte Carlo
            </button>
          )}
        </div>

        {/* Controls */}
        <div className={`grid gap-3 ${simpleMode ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monthly</label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="px-3 text-slate-400 text-sm">{currencySymbol}</span>
              <input type="number" value={monthly} min={0} step={50}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white focus:outline-none w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Horizon</label>
            <select value={years} onChange={(e) => setYears(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[0.5, 1, 2, 3, 5, 10, 15, 20].map((y) => (
                <option key={y} value={y}>{y === 0.5 ? "6 months" : `${y} ${y === 1 ? "year" : "years"}`}</option>
              ))}
            </select>
          </div>
          {!simpleMode && (<div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" title="Annual return rate used for projections. Leave blank to use the default 8% moderate estimate. Enter your own value to override — e.g. 6% conservative, 10% optimistic.">Expected Return %</label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input
                type="number"
                value={customRateInput}
                min={1} max={30} step={0.5}
                placeholder="e.g. 10"
                onChange={(e) => {
                  setCustomRateInput(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
                    setCustomRate(parsed / 100);
                  } else if (e.target.value === "") {
                    setCustomRate(null);
                  }
                }}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none w-full placeholder:text-slate-600"
              />
              <span className="px-3 text-slate-400 text-sm">%</span>
              {customRate !== null && (
                <button
                  onClick={() => { setCustomRate(null); setCustomRateInput(""); }}
                  className="px-2 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
                  title="Clear custom rate"
                >×</button>
              )}
            </div>
          </div>)}
          {!simpleMode && (<div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Inflation adj.</label>
            <button
              onClick={() => setInflationAdjust(!inflationAdjust)}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                background: inflationAdjust ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
                border: inflationAdjust ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: inflationAdjust ? "#a5b4fc" : "#64748b",
              }}
            >
              {inflationAdjust ? "On (2.5%)" : "Off"}
            </button>
          </div>)}
        </div>

        {/* Scenario summary pills */}
        {moderateProjection && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[
              { label: "Conservative", value: moderateProjection.conservative, color: "#6366f1", rate: "5%" },
              { label: "Moderate",     value: moderateProjection.moderate,     color: "#8b5cf6", rate: "8%" },
              { label: "Aggressive",   value: moderateProjection.aggressive,   color: "#10b981", rate: "12%" },
              ...(customRate && moderateProjection.custom !== undefined
                ? [{ label: "Custom", value: moderateProjection.custom, color: "#f59e0b", rate: `${(customRate * 100).toFixed(1)}%` }]
                : []),
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center space-y-1"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}>
                <p className="text-xs font-medium" style={{ color: s.color }}>
                  {s.label} <span className="opacity-60">({s.rate})</span>
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                  {formatCurrency(s.value, currency)}
                </p>
              </div>
            ))}
          </div>
        )}

        <ProjectionChart data={projectionData} currency={currency} customRate={customRate ?? undefined} />

        <p className="text-xs text-slate-600 text-center">
          Projections are estimates and not financial advice.
        </p>
      </div>

      {/* ── Monte Carlo ──────────────────────────────────────────────────── */}
      {showMonteCarlo && monteCarloResult && (
        <div className="rounded-2xl p-5 space-y-4" style={glass}>
          <div>
            <h2 className="text-sm font-bold text-white">Monte Carlo Simulation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              1,000 simulations · 8% mean · 15% volatility · {years === 0.5 ? "6 month" : `${years} year`} horizon
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "10th Percentile", value: monteCarloResult.finalP10, color: "#f43f5e", note: "Pessimistic" },
              { label: "Median",          value: monteCarloResult.finalP50, color: "#8b5cf6", note: "Most likely" },
              { label: "90th Percentile", value: monteCarloResult.finalP90, color: "#10b981", note: "Optimistic" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center space-y-1"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
                <p className="text-sm font-bold text-white"
                  style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                  {formatCurrency(s.value, currency)}
                </p>
                <p className="text-xs text-slate-600">{s.note}</p>
              </div>
            ))}
          </div>
          <MonteCarloChart result={monteCarloResult} currency={currency} years={years} />
        </div>
      )}

      {/* ── What If Simulator ────────────────────────────────────────────── */}
      <WhatIfPanel
        currentValue={portfolio.totalValue}
        monthlyContribution={monthly}
        years={years}
        currency={currency}
        annualRate={customRate ?? 0.08}
      />

    </div>
  );
}
