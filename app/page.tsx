"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { formatCurrency } from "@/lib/projection";
import { loadGoals, analyzeAllGoals, type GoalAnalysis } from "@/lib/goals";
import ProjectionChart from "@/components/ProjectionChart";
import StatCard from "@/components/StatCard";
import Tooltip from "@/components/Tooltip";

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

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <Skeleton className="h-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-12" />
      <Skeleton className="h-48" />
      <Skeleton className="h-72" />
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-2xl p-6 max-w-md mx-auto text-center space-y-3"
        style={{ ...glass, border: "1px solid rgba(244,63,94,0.2)" }}>
        <p className="text-3xl">⚠️</p>
        <p className="text-rose-400 font-semibold text-sm">Connection Error</p>
        <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        <a href="/connect" className="text-indigo-400 text-xs hover:underline">Reconnect your broker →</a>
      </div>
    </div>
  );
}

export default function HomePage() {
  const {
    portfolio, risk,
    loading, error, hideValues,
    projectionData, monthly, setMonthly, years, setYears,
  } = usePortfolio();

  const [goalsAnalysis, setGoalsAnalysis] = useState<GoalAnalysis[]>([]);

  useEffect(() => {
    if (!portfolio) return;
    const goals = loadGoals();
    setGoalsAnalysis(analyzeAllGoals(goals, portfolio.totalValue, monthly));
  }, [portfolio, monthly]);

  if (loading) return <LoadingSkeleton />;
  if (error)   return <ErrorCard message={error} />;
  if (!portfolio) return null;

  const currency       = portfolio.currencyCode ?? "GBP";
  const currencySymbol = currency === "GBP" ? "£" : "$";
  const mask    = (v: string) => (hideValues ? "••••••" : v);
  const maskPct = (v: string) => (hideValues ? "••••" : v);
  const pnlPositive = portfolio.totalPnL >= 0;
  const returnPct   = portfolio.totalInvested > 0
    ? ((portfolio.totalValue - portfolio.totalInvested) / portfolio.totalInvested) * 100 : 0;
  const moderateProjection = projectionData.find((p) => p.year === years);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 70%)",
      }} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-5 sm:p-7 overflow-hidden" style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.05) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
      }}>
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #10b981, transparent 70%)" }} />

        <div className="relative">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Total Portfolio Value</p>
          <p className="text-3xl sm:text-5xl font-black tracking-tight" style={{
            background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: hideValues ? "blur(12px)" : "none",
            userSelect: hideValues ? "none" : "auto",
          }}>
            {formatCurrency(portfolio.totalValue, currency)}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold" style={{
              background: pnlPositive ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
              color: pnlPositive ? "#10b981" : "#f43f5e",
              filter: hideValues ? "blur(6px)" : "none",
              userSelect: hideValues ? "none" : "auto",
            }}>
              <span>{pnlPositive ? "▲" : "▼"}</span>
              <span>{formatCurrency(portfolio.totalPnL, currency)}</span>
              <span className="opacity-70">({pnlPositive ? "+" : ""}{portfolio.totalPnLPercent.toFixed(2)}%)</span>
            </div>
            <p className="text-slate-500 text-sm">
              Invested:{" "}
              <span className="text-slate-300 font-semibold"
                style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                {formatCurrency(portfolio.totalInvested, currency)}
              </span>
            </p>
            <p className="text-slate-500 text-sm">
              Free cash:{" "}
              <span className="text-slate-300 font-semibold"
                style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                {formatCurrency(portfolio.cash.free, currency)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat tiles ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Return"
          value={maskPct(`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`)}
          subValue={mask(formatCurrency(portfolio.totalPnL, currency))}
          positive={returnPct >= 0}
          accent={returnPct >= 0 ? "emerald" : "rose"}
          hint="All-time unrealised gain/loss on open positions"
        />
        <StatCard
          label="Dividend Income"
          value={mask(formatCurrency(portfolio.dividendIncome, currency))}
          hint="Sum of last 50 dividend payments"
          accent="violet"
        />
        <StatCard
          label="Holdings"
          value={String(portfolio.positions.length)}
          hint="Number of open positions"
          accent="indigo"
        />
        {risk ? (
          <StatCard
            label="Diversification"
            value={`${risk.concentrationScore}/100`}
            subValue={risk.concentrationScore > 30 ? "Concentrated" : "Well spread"}
            positive={risk.concentrationScore <= 30}
            accent={risk.concentrationScore > 30 ? "amber" : "emerald"}
            hint="Lower is better. Think eggs in different baskets — aim for under 30."
          />
        ) : <Skeleton className="h-24" />}
      </div>

      {/* ── Health strip ─────────────────────────────────────────────────── */}
      {risk && (
        <div>
          {risk.overweightWarnings.length === 0 ? (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm text-emerald-400 font-medium">
                Portfolio looks healthy — no concentration issues detected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {risk.overweightWarnings.map((w, i) => (
                <div key={i} className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <span className="text-amber-500 flex-shrink-0 text-sm mt-0.5">⚠</span>
                  <p className="text-sm text-amber-400 leading-relaxed">{w}</p>
                </div>
              ))}
              <p className="text-xs text-slate-600 px-1">
                See full risk breakdown in{" "}
                <Link href="/portfolio" className="text-indigo-400 hover:underline">Portfolio</Link>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Life Goals ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 space-y-4" style={glass}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Life Goals</h2>
          {goalsAnalysis.length > 0 && (
            <Link href="/plan" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Manage goals →
            </Link>
          )}
        </div>

        {goalsAnalysis.length === 0 ? (
          <div className="rounded-xl p-6 text-center space-y-3"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <p className="text-3xl">🎯</p>
            <div>
              <p className="text-sm font-semibold text-white">What are you investing towards?</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Every investor needs a destination. Set a goal and we&apos;ll track your progress toward it.
              </p>
            </div>
            <Link href="/plan"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Set your first goal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goalsAnalysis.slice(0, 3).map(({ goal, progressPercent, status, requiredMonthly }) => {
              const statusColor = status === "Ahead" ? "#6366f1" : status === "Behind" ? "#f43f5e" : "#10b981";
              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg flex-shrink-0">{goal.emoji}</span>
                      <span className="text-sm font-medium text-white truncate">{goal.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold" style={{ color: statusColor }}>{status}</span>
                      <span className="text-xs text-slate-500">{progressPercent}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, #6366f1, ${statusColor})` }} />
                  </div>
                  {status === "Behind" && requiredMonthly > 0 && (
                    <p className="text-xs text-slate-600">
                      Needs {currencySymbol}{requiredMonthly.toLocaleString()}/mo to stay on track
                    </p>
                  )}
                </div>
              );
            })}
            {goalsAnalysis.length > 3 && (
              <Link href="/plan" className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1">
                +{goalsAnalysis.length - 3} more goals — view all →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Growth Projection ────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 space-y-5" style={glass}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Growth Projection</h2>
            <p className="text-xs text-slate-500 mt-0.5">Compound growth from your current portfolio value</p>
          </div>
          <Tooltip
            content="Go to Plan for Monte Carlo simulation, custom return rate, inflation adjustment, and the What If simulator"
            position="left" maxWidth={240}>
            <Link href="/plan" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Full analysis + tools →
            </Link>
          </Tooltip>
        </div>

        {/* Monthly + Horizon — full controls live on Plan page */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monthly contribution</label>
            <div className="flex items-center rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="px-3 text-slate-400 text-sm font-medium">{currencySymbol}</span>
              <input type="number" value={monthly} min={0} step={50}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Time horizon</label>
            <select value={years} onChange={(e) => setYears(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[0.5, 1, 2, 3, 5, 10, 15, 20].map((y) => (
                <option key={y} value={y}>{y === 0.5 ? "6 months" : `${y} ${y === 1 ? "year" : "years"}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scenario summary pills */}
        {moderateProjection && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Conservative", value: moderateProjection.conservative, color: "#6366f1", rate: "5%" },
              { label: "Moderate",     value: moderateProjection.moderate,     color: "#8b5cf6", rate: "8%" },
              { label: "Aggressive",   value: moderateProjection.aggressive,   color: "#10b981", rate: "12%" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center space-y-1"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}>
                <p className="text-xs font-medium" style={{ color: s.color }}>
                  {s.label} <span className="opacity-60">({s.rate})</span>
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                  {mask(formatCurrency(s.value, currency))}
                </p>
              </div>
            ))}
          </div>
        )}

        <ProjectionChart data={projectionData} currency={currency} height={210} />

        <p className="text-xs text-slate-600 text-center -mt-2">
          Projections are estimates and not financial advice.{" "}
          <Link href="/plan" className="text-indigo-500 hover:text-indigo-400 transition-colors">Open full analysis →</Link>
        </p>
      </div>

    </div>
  );
}
