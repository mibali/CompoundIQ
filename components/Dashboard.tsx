"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import ProjectionChart from "@/components/ProjectionChart";
import HoldingsTable from "@/components/HoldingsTable";
import Tooltip from "@/components/Tooltip";
import { cleanTicker, getCompanyName } from "@/lib/tickerNames";
import { generateProjection } from "@/lib/projection";
import { analyzePortfolioRisk } from "@/lib/risk";
import { formatCurrency } from "@/lib/projection";
import { analyzeInvestorBehaviour } from "@/lib/behaviour";
import { analyzeSectors } from "@/lib/sectors";
import { analyzeDividends } from "@/lib/dividends";
import BehaviourProfile from "@/components/BehaviourProfile";
import GoalsPanel from "@/components/GoalsPanel";
import AIDigest from "@/components/AIDigest";
import SettingsPanel from "@/components/SettingsPanel";
import SectorChart from "@/components/SectorChart";
import DividendTracker from "@/components/DividendTracker";
import MonteCarloChart from "@/components/MonteCarloChart";
import WhatIfPanel from "@/components/WhatIfPanel";
import SectorAlerts from "@/components/SectorAlerts";
import RealizedPnL from "@/components/RealizedPnL";
import BenchmarkComparison from "@/components/BenchmarkComparison";
import RegretMinimizer from "@/components/RegretMinimizer";
import { runMonteCarlo } from "@/lib/montecarlo";
import { analyzeRealizedPnL } from "@/lib/realizedpnl";
import { analyzeBenchmark } from "@/lib/benchmark";
import GlobalIndices from "@/components/GlobalIndices";
import { STORAGE_KEYS, getStoredKey } from "@/lib/apikeys";
import type { IndexQuote } from "@/app/api/indices/route";
import type { PortfolioSummary, OrdersPage, DividendsPage } from "@/types/trading212";
import type { PortfolioRisk } from "@/lib/risk";
import type { ProjectionPoint } from "@/lib/projection";
import type { InvestorProfile } from "@/lib/behaviour";
import type { SectorAllocation } from "@/lib/sectors";
import type { DividendSummary } from "@/lib/dividends";
import type { MonteCarloResult } from "@/lib/montecarlo";
import type { RealizedPnLSummary } from "@/lib/realizedpnl";
import type { BenchmarkResult } from "@/lib/benchmark";

const glass = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
};

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [risk, setRisk] = useState<PortfolioRisk | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]);
  const [monthly, setMonthly] = useState(200);
  const [years, setYears] = useState(10);
  const [inflationAdjust, setInflationAdjust] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [behaviourProfile, setBehaviourProfile] = useState<InvestorProfile | null>(null);
  const [sectorAllocations, setSectorAllocations] = useState<SectorAllocation[]>([]);
  const [dividendSummary, setDividendSummary] = useState<DividendSummary | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [realizedPnL, setRealizedPnL] = useState<RealizedPnLSummary | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [customRateInput, setCustomRateInput] = useState<string>("");
  const [avKey, setAvKey] = useState<string>("");
  const [indices, setIndices] = useState<IndexQuote[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/portfolio", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPortfolio(data);
        setRisk(analyzePortfolioRisk(data.positions, data.totalValue));
        setSectorAllocations(analyzeSectors(data.positions, data.totalValue));
      })
      .catch((e) => { if (e?.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Fetch order history for Investor DNA + realized P&L + benchmark (non-blocking)
  useEffect(() => {
    if (!portfolio) return;
    const controller = new AbortController();
    fetch("/api/orders", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: OrdersPage & { error?: string }) => {
        if (data.error || !Array.isArray(data.items)) return;
        setBehaviourProfile(analyzeInvestorBehaviour(data.items, portfolio.positions));
        setRealizedPnL(analyzeRealizedPnL(data.items));
        // Exclude free cash so benchmark compares invested capital only (not idle cash)
        const investedPortfolioValue = portfolio.totalValue - portfolio.cash.free;
        setBenchmarkResult(analyzeBenchmark(data.items, portfolio.positions, investedPortfolioValue));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [portfolio]);

  // Fetch dividends for tracker (non-blocking)
  useEffect(() => {
    if (!portfolio) return;
    const controller = new AbortController();
    fetch("/api/dividends", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: DividendsPage) => {
        setDividendSummary(analyzeDividends(data.items, portfolio.totalValue));
      })
      .catch(() => {}); // non-critical — silently fail
    return () => controller.abort();
  }, [portfolio]);

  // Read AV key from localStorage on settings change
  useEffect(() => {
    setAvKey(getStoredKey(STORAGE_KEYS.ALPHA_VANTAGE));
  }, [settingsVersion]);

  // Fetch global indices whenever AV key is available
  useEffect(() => {
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    if (avKey) headers["X-Alpha-Vantage-Key"] = avKey;
    fetch("/api/indices", { headers, signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setIndices(data.indices ?? null))
      .catch(() => {});
    return () => controller.abort();
  }, [avKey]);

  useEffect(() => {
    if (!portfolio) return;
    setProjectionData(generateProjection({
      currentValue: portfolio.totalValue,
      monthlyContribution: monthly,
      years,
      inflationAdjust,
      customRate: customRate ?? undefined,
    }));
  }, [portfolio, monthly, years, inflationAdjust, customRate]);

  // Monte Carlo — rerun when value/monthly/years change (runs synchronously, ~80ms)
  useEffect(() => {
    if (!portfolio) return;
    setMonteCarloResult(runMonteCarlo(portfolio.totalValue, monthly, years));
  }, [portfolio, monthly, years]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Syncing with Trading 212...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="rounded-2xl p-6 max-w-md text-center space-y-2"
          style={{ ...glass, border: "1px solid rgba(244,63,94,0.2)" }}
        >
          <div className="text-2xl">⚠️</div>
          <p className="text-rose-400 font-semibold">Connection Error</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-3">Check your API credentials in .env.local</p>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const currency = portfolio.currencyCode ?? "GBP";
  const currencySymbol = currency === "GBP" ? "£" : "$";
  const mask = (val: string) => hideValues ? "••••••" : val;
  const maskPct = (val: string) => hideValues ? "••••" : val;
  const pnlPositive = portfolio.totalPnL >= 0;
  const moderateProjection = projectionData.find((p) => p.year === years);
  const returnPct = portfolio.totalInvested > 0
    ? ((portfolio.totalValue - portfolio.totalInvested) / portfolio.totalInvested) * 100
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "#080d1a" }}>
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            >
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">CompoundIQ</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Wealth Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
            <Tooltip content={hideValues ? "Show values" : "Hide values"} position="bottom">
              <button
                onClick={() => setHideValues((v) => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
                style={{
                  background: hideValues ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  border: hideValues ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: hideValues ? "#818cf8" : "#64748b",
                }}
              >
                {hideValues ? (
                  // Eye-off icon
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </Tooltip>
            <Tooltip content="Settings" position="bottom">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </Tooltip>
            <div
              className="hidden sm:block text-xs text-slate-400 px-3 py-1.5 rounded-xl"
              style={glass}
            >
              Trading 212
            </div>
          </div>
        </header>

        {/* ── Hero: Portfolio Value ── */}
        <div
          className="rounded-3xl p-5 sm:p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.05) 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          {/* Background orbs */}
          <div
            className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
          />

          <div className="relative">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Total Portfolio Value
            </p>
            <p
              className="text-3xl sm:text-5xl font-black tracking-tight transition-all"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: hideValues ? "blur(12px)" : "none",
                userSelect: hideValues ? "none" : "auto",
              }}
            >
              {formatCurrency(portfolio.totalValue, currency)}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: pnlPositive ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
                  color: pnlPositive ? "#10b981" : "#f43f5e",
                  filter: hideValues ? "blur(6px)" : "none",
                  userSelect: hideValues ? "none" : "auto",
                }}
              >
                <span>{pnlPositive ? "▲" : "▼"}</span>
                <span>{formatCurrency(portfolio.totalPnL, currency)}</span>
                <span className="opacity-70">({pnlPositive ? "+" : ""}{portfolio.totalPnLPercent.toFixed(2)}%)</span>
              </div>
              <p className="text-slate-500 text-sm">
                Invested:{" "}
                <span
                  className="text-slate-300 font-semibold transition-all"
                  style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}
                >
                  {formatCurrency(portfolio.totalInvested, currency)}
                </span>
              </p>
              <p className="text-slate-500 text-sm">
                Free cash:{" "}
                <span
                  className="text-slate-300 font-semibold transition-all"
                  style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}
                >
                  {formatCurrency(portfolio.cash.free, currency)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Return"
            value={maskPct(`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`)}
            subValue={mask(formatCurrency(portfolio.totalPnL, currency))}
            positive={returnPct >= 0}
            accent={returnPct >= 0 ? "emerald" : "rose"}
            hint={returnPct >= 0
              ? `Your investments have grown ${returnPct.toFixed(1)}% above what you paid. This is "unrealised" — you haven't sold yet, so it only becomes real cash when you do. Great start!`
              : `Your portfolio is currently ${Math.abs(returnPct).toFixed(1)}% below what you paid. This is normal — these are "paper losses" that only become real if you sell. Staying invested through dips is how long-term wealth is built.`
            }
          />
          <StatCard
            label="Dividend Income"
            value={mask(formatCurrency(portfolio.dividendIncome, currency))}
            hint="Cash paid to you by companies you own — like a bonus for being a shareholder. This shows your last 50 dividend payments. Reinvesting dividends is one of the most powerful ways to grow wealth over time."
            accent="violet"
          />
          <StatCard
            label="Positions"
            value={String(portfolio.positions.length)}
            hint={portfolio.positions.length < 5
              ? `You hold ${portfolio.positions.length} investment${portfolio.positions.length === 1 ? "" : "s"}. Most advisors suggest holding at least 10–15 different assets to reduce the impact if any one drops.`
              : portfolio.positions.length <= 20
              ? `You hold ${portfolio.positions.length} investments. This is a healthy range — enough to be diversified without becoming hard to track.`
              : `You hold ${portfolio.positions.length} investments. A broad portfolio like this spreads risk well, though it can be harder to monitor closely.`
            }
            accent="indigo"
          />
          {risk && (
            <StatCard
              label="Concentration"
              value={`${risk.concentrationScore}/100`}
              subValue={risk.concentrationScore > 30 ? "High" : "Diversified"}
              positive={risk.concentrationScore <= 30}
              accent={risk.concentrationScore > 30 ? "amber" : "emerald"}
              hint={risk.concentrationScore <= 20
                ? "Excellent spread — your money is well distributed. Like having eggs in many baskets, a single bad stock won't hurt much. Score: lower is better, aim for under 30."
                : risk.concentrationScore <= 30
                ? "Good diversification — your portfolio is well spread. A score under 30 is the target and you're there. Lower = more baskets = less risk from any one stock."
                : `Your score of ${risk.concentrationScore} means a few holdings dominate your portfolio. If one drops sharply, it could noticeably hurt your overall returns. Aim for under 30 by spreading across more assets.`
              }
            />
          )}
        </div>

        {/* ── Life Goals ── */}
        <GoalsPanel
          currentValue={portfolio.totalValue}
          monthlyContribution={monthly}
          currency={currency}
        />

        {/* ── Investor DNA ── */}
        {behaviourProfile && (
          <BehaviourProfile profile={behaviourProfile} />
        )}

        {/* ── Holdings + Risk ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings table — 2/3 width */}
          {risk && portfolio.positions.length > 0 && (
            <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={glass}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-sm font-bold text-white">Holdings</h2>
                <p className="text-xs text-slate-500 mt-0.5">{portfolio.positions.length} open positions</p>
              </div>
              <HoldingsTable
                positions={risk.positions}
                currency={currency}
                hideValues={hideValues}
                dividendsByTicker={dividendSummary?.byTicker}
              />
            </div>
          )}

          {/* Risk panel — 1/3 width */}
          {risk && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5 space-y-5" style={glass}>
                <h2 className="text-sm font-bold text-white">Risk Summary</h2>

                {/* ── Portfolio health at a glance ── */}
                {(() => {
                  const beta = risk.portfolioBeta;
                  const conc = risk.concentrationScore;
                  const drawdown = risk.portfolioDrawdown;

                  // Derive an overall risk level from beta + concentration
                  const isHighRisk = beta > 1.3 || conc > 50;
                  const isLowRisk = beta < 0.9 && conc <= 25;
                  const riskLabel = isHighRisk ? "Higher-risk portfolio" : isLowRisk ? "Lower-risk portfolio" : "Moderate-risk portfolio";
                  const riskColor = isHighRisk ? "#f87171" : isLowRisk ? "#10b981" : "#f59e0b";

                  const betaLine = beta > 1
                    ? `Your portfolio moves roughly ${beta.toFixed(1)}× as much as the market — so if markets fall 10%, expect around a ${(beta * 10).toFixed(0)}% drop.`
                    : beta < 1
                    ? `Your portfolio is more stable than the market — it tends to move about ${(beta * 100).toFixed(0)}% as much, so big market swings hit you less hard.`
                    : `Your portfolio tracks the market closely — expect similar ups and downs to the overall market.`;

                  const drawdownLine = drawdown >= 0
                    ? `Overall you're up ${(drawdown * 100).toFixed(1)}% on your invested capital.`
                    : `You're currently ${(Math.abs(drawdown) * 100).toFixed(1)}% below your invested total — stay patient, long-term investing rewards those who hold through dips.`;

                  return (
                    <div
                      className="rounded-xl p-3 space-y-1.5"
                      style={{ background: `${riskColor}0d`, border: `1px solid ${riskColor}28` }}
                    >
                      <p className="text-xs font-bold" style={{ color: riskColor }}>{riskLabel}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{betaLine}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{drawdownLine}</p>
                    </div>
                  );
                })()}

                {/* Concentration score — plain English first */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Tooltip
                      content="This score measures how spread out your investments are. Think of it like eggs in a basket — the lower the score, the more baskets you're using. Aim for under 30."
                      position="right"
                      maxWidth={280}
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-600 cursor-help pb-0.5">
                        Diversification score
                      </span>
                    </Tooltip>
                    <span
                      className="text-sm font-black"
                      style={{
                        color: risk.concentrationScore > 50 ? "#f43f5e" : risk.concentrationScore > 30 ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {risk.concentrationScore}/100
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${risk.concentrationScore}%`,
                        background:
                          risk.concentrationScore > 50
                            ? "linear-gradient(90deg,#f59e0b,#f43f5e)"
                            : risk.concentrationScore > 30
                            ? "linear-gradient(90deg,#6366f1,#f59e0b)"
                            : "linear-gradient(90deg,#6366f1,#10b981)",
                      }}
                    />
                  </div>

                  {/* Plain-English callout */}
                  <div
                    className="rounded-xl p-3 space-y-1"
                    style={{
                      background: risk.concentrationScore > 30 ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.07)",
                      border: `1px solid ${risk.concentrationScore > 30 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)"}`,
                    }}
                  >
                    <p
                      className="text-xs font-bold"
                      style={{ color: risk.concentrationScore > 30 ? "#f59e0b" : "#10b981" }}
                    >
                      {risk.concentrationScore <= 20
                        ? "Excellent diversification"
                        : risk.concentrationScore <= 30
                        ? "Good diversification"
                        : risk.concentrationScore <= 50
                        ? "Moderately concentrated"
                        : "Highly concentrated"}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {risk.concentrationScore <= 30
                        ? `Your money is spread well across ${risk.positions.length} holdings. No single stock dominates your portfolio, which reduces the impact if one investment drops.`
                        : `A score above 30 suggests a few holdings make up most of your portfolio. If one drops sharply, it could significantly hurt your overall returns.`}
                    </p>
                  </div>
                </div>

                {/* Top holding */}
                {risk.topHolding && (() => {
                  const ticker = cleanTicker(risk.topHolding.ticker);
                  const company = getCompanyName(risk.topHolding.ticker) ?? ticker;
                  const isOverweight = risk.topHolding.weight > 20;
                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Largest position</p>
                      <div
                        className="rounded-xl p-3 space-y-1"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{ticker}</p>
                            <p className="text-xs text-slate-500">{company}</p>
                          </div>
                          <span
                            className="text-sm font-black"
                            style={{ color: isOverweight ? "#f59e0b" : "#10b981" }}
                          >
                            {risk.topHolding.weight.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          {isOverweight
                            ? `${ticker} is your biggest bet. At over 20%, a bad quarter for this stock will noticeably affect your whole portfolio.`
                            : `${ticker} is well-sized at under 20%. You have meaningful exposure without over-relying on a single company.`}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Risk breakdown */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Holdings by risk level</p>
                  {(
                    [
                      {
                        level: "Low" as const,
                        color: "#10b981",
                        tooltip: "These holdings have moved less than 15% from your buy price. They behave predictably — good for stability.",
                        plain: "Stable",
                      },
                      {
                        level: "Medium" as const,
                        color: "#f59e0b",
                        tooltip: "These have moved 15–35% from your cost. Typical for growth stocks like big tech — can swing either way.",
                        plain: "Moderate",
                      },
                      {
                        level: "High" as const,
                        color: "#f43f5e",
                        tooltip: "These have moved over 35% from your buy price. Higher reward potential but also higher chance of large losses.",
                        plain: "Volatile",
                      },
                    ]
                  ).map(({ level, color, tooltip, plain }) => {
                    const count = risk.positions.filter((p) => p.riskLevel === level).length;
                    const pct = risk.positions.length > 0 ? (count / risk.positions.length) * 100 : 0;
                    return (
                      <div key={level}>
                        <Tooltip content={tooltip} position="left" maxWidth={260}>
                          <div className="flex items-center gap-3 cursor-help">
                            <div className="flex items-center gap-2 w-24 flex-shrink-0">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="text-xs font-medium text-slate-400">{plain}</span>
                            </div>
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                            </div>
                            <span className="text-xs font-semibold w-10 text-right" style={{ color }}>
                              {count}/{risk.positions.length}
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                    );
                  })}

                  {/* Summary sentence */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {(() => {
                      const low = risk.positions.filter(p => p.riskLevel === "Low").length;
                      const high = risk.positions.filter(p => p.riskLevel === "High").length;
                      const total = risk.positions.length;
                      if (high === 0) return `All ${total} of your holdings are considered stable or moderate. Good foundation.`;
                      if (low >= high * 2) return `Most of your holdings are stable. The ${high} volatile position${high > 1 ? "s" : ""} add growth potential.`;
                      return `You have ${high} high-volatility holding${high > 1 ? "s" : ""}. These carry more risk of large swings.`;
                    })()}
                  </p>
                </div>

                {/* Advanced metrics */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Advanced metrics</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        label: "Portfolio Beta",
                        value: risk.portfolioBeta.toFixed(2),
                        sub: risk.portfolioBeta > 1 ? "More volatile than market" : "Less volatile than market",
                        tooltip: `Beta measures how much your portfolio moves relative to the market. Beta of ${risk.portfolioBeta.toFixed(2)} means your portfolio tends to move ${risk.portfolioBeta > 1 ? `${((risk.portfolioBeta - 1) * 100).toFixed(0)}% more aggressively` : `${((1 - risk.portfolioBeta) * 100).toFixed(0)}% less aggressively`} than the broader market. A beta above 1 amplifies both gains and losses.`,
                        color: risk.portfolioBeta > 1.2 ? "#f59e0b" : risk.portfolioBeta < 0.8 ? "#0ea5e9" : "#10b981",
                      },
                      {
                        label: "Return Dispersion",
                        value: `${risk.portfolioVolatility.toFixed(1)}%`,
                        sub: "Spread of individual returns",
                        tooltip: `Measures how spread out your individual stock returns are (standard deviation of P&L%). A lower number means your holdings are performing more similarly. High dispersion means a few big winners and losers. Current: ${risk.portfolioVolatility.toFixed(1)}%.`,
                        color: risk.portfolioVolatility > 40 ? "#f59e0b" : "#6366f1",
                      },
                      ...(risk.sharpeRatio !== null ? [{
                        label: "Sharpe Ratio",
                        value: risk.sharpeRatio.toFixed(2),
                        sub: risk.sharpeRatio > 1 ? "Good risk-adjusted return" : risk.sharpeRatio > 0 ? "Modest risk-adjusted return" : "Below risk-free rate",
                        tooltip: `Sharpe ratio measures return per unit of risk taken. Above 1.0 is good, above 2.0 is excellent, below 0 means you'd be better off in a risk-free account. Calculated as (portfolio return − 4.5% risk-free rate) ÷ return spread. Current: ${risk.sharpeRatio.toFixed(2)}.`,
                        color: risk.sharpeRatio > 1 ? "#10b981" : risk.sharpeRatio > 0 ? "#f59e0b" : "#f87171",
                      }] : []),
                      {
                        label: "Max Position Drawdown",
                        value: `${risk.maxPositionDrawdown.toFixed(1)}%`,
                        sub: risk.maxPositionDrawdown < 0 ? "Worst single position loss from entry" : "No positions in loss",
                        tooltip: `The deepest current loss from average entry price across all positions. ${risk.maxPositionDrawdown < 0 ? `Your most underwater position has fallen ${Math.abs(risk.maxPositionDrawdown).toFixed(1)}% from its average buy price.` : "All positions are currently above their average entry price — great!"}`,
                        color: risk.maxPositionDrawdown < 0 ? "#f87171" : "#10b981",
                      },
                      {
                        label: "Portfolio Drawdown",
                        value: `${(risk.portfolioDrawdown * 100).toFixed(1)}%`,
                        sub: risk.portfolioDrawdown < 0 ? "Overall loss from invested capital" : "In net profit",
                        tooltip: `Overall portfolio gain/loss relative to your total amount invested. ${risk.portfolioDrawdown >= 0 ? `You are currently up ${(risk.portfolioDrawdown * 100).toFixed(1)}% overall.` : `Your total portfolio is ${(Math.abs(risk.portfolioDrawdown) * 100).toFixed(1)}% below what you have invested in total.`}`,
                        color: risk.portfolioDrawdown < 0 ? "#f87171" : "#10b981",
                      },
                    ].map((m) => (
                      <Tooltip key={m.label} content={m.tooltip} position="left" maxWidth={280}>
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 cursor-help"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 border-b border-dashed border-slate-700 inline pb-px">
                              {m.label}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">{m.sub}</p>
                          </div>
                          <span className="text-sm font-bold flex-shrink-0" style={{ color: m.color }}>
                            {m.value}
                          </span>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {risk.overweightWarnings.length > 0 && (
                <div className="space-y-2">
                  {risk.overweightWarnings.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-4 py-3 flex items-start gap-2.5"
                      style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}
                    >
                      <span className="text-amber-500 flex-shrink-0 mt-0.5 text-sm">⚠</span>
                      <p className="text-xs text-amber-400 leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sector + Dividends ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectorChart allocations={sectorAllocations} currency={currency} />
          {dividendSummary && (
            <DividendTracker summary={dividendSummary} currency={currency} />
          )}
        </div>

        {/* ── Sector Rotation Alerts ── */}
        {sectorAllocations.length > 0 && (
          <SectorAlerts allocations={sectorAllocations} onOpenSettings={() => setShowSettings(true)} />
        )}

        {/* ── Global Markets ── */}
        <div className="rounded-2xl p-5 sm:p-6" style={glass}>
          <GlobalIndices avKey={avKey} indices={indices} />
        </div>

        {/* ── Portfolio vs Benchmark ── */}
        {benchmarkResult && (
          <BenchmarkComparison result={benchmarkResult} currency={currency} />
        )}

        {/* ── Realized P&L + Regret Minimizer ── */}
        {(realizedPnL || benchmarkResult) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {realizedPnL && (
              <RealizedPnL summary={realizedPnL} currency={currency} />
            )}
            {benchmarkResult && (
              <RegretMinimizer
                currentValue={portfolio.totalValue}
                totalInvested={portfolio.totalInvested}
                monthlyContribution={monthly}
                firstTradeDate={benchmarkResult.firstTradeDate}
                currency={currency}
              />
            )}
          </div>
        )}

        {/* ── Growth Projection ── */}
        <div className="rounded-2xl p-4 sm:p-6 space-y-6" style={glass}>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">Growth Projection</h2>
                <p className="text-xs text-slate-500 mt-0.5">Compound growth scenarios based on your portfolio</p>
              </div>
              {/* Scenarios / Monte Carlo toggle */}
              <div
                className="flex rounded-lg p-0.5 gap-0.5 flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {([
                  { mc: false, label: "Scenarios", tooltip: "Shows 3 fixed projections at 5%, 8% and 12% annual return. Simple and easy to read, but assumes markets grow at the exact same rate every year — which never happens in reality." },
                  { mc: true, label: "Monte Carlo", tooltip: "Runs 1,000 simulations where each month gets a random return — some up, some down — mimicking how markets actually behave. The shaded band shows the realistic spread: most investors will land somewhere between the 10th and 90th percentile lines." },
                ] as const).map(({ mc, label, tooltip }) => (
                  <Tooltip key={String(mc)} content={tooltip} position="bottom" maxWidth={260}>
                    <button
                      onClick={() => setShowMonteCarlo(mc)}
                      className="rounded-md px-3 py-1 text-xs font-semibold transition-all"
                      style={{
                        background: showMonteCarlo === mc ? "rgba(139,92,246,0.3)" : "transparent",
                        color: showMonteCarlo === mc ? "#c4b5fd" : "#64748b",
                        border: showMonteCarlo === mc ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                      }}
                    >
                      {label}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
            {/* Scenario summary pills */}
            {moderateProjection && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "You put in", value: moderateProjection.contributions, color: "#94a3b8", tooltip: `Total money you will have invested over ${years} ${years === 1 ? "year" : "years"} — your current portfolio value plus ${years * 12} months of contributions. Everything above this is pure growth.` },
                  { label: "Conservative", value: moderateProjection.conservative, color: "#6366f1", tooltip: "5% average annual return — reflects a cautious mix of bonds and blue-chip equities" },
                  { label: "Moderate", value: moderateProjection.moderate, color: "#8b5cf6", tooltip: "8% average annual return — historically close to long-term S&P 500 average after inflation" },
                  { label: "Aggressive", value: moderateProjection.aggressive, color: "#10b981", tooltip: "12% average annual return — high-growth portfolio, tech-heavy. Higher risk of drawdowns." },
                ].map((s) => (
                  <Tooltip key={s.label} content={s.tooltip} position="bottom" maxWidth={240}>
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-help"
                      style={{
                        background: `${s.color}18`,
                        border: `1px solid ${s.color}30`,
                        color: s.color,
                      }}
                    >
                      {s.label}: {mask(formatCurrency(s.value, currency))}
                    </div>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Monthly Contribution
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="px-3 text-slate-400 text-sm font-medium">{currencySymbol}</span>
                <input
                  type="number"
                  value={monthly}
                  min={0}
                  step={50}
                  onChange={(e) => setMonthly(Number(e.target.value))}
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Time Horizon
              </label>
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {[0.5, 1, 2, 3, 5, 10, 15, 20].map((y) => (
                  <option key={y} value={y}>
                    {y === 0.5 ? "6 months" : `${y} ${y === 1 ? "year" : "years"}`}
                  </option>
                ))}
              </select>
            </div>
            {/* Expected Return */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Tooltip
                  content="The annual return rate used for all projections and What If simulations. Leave blank to use the default 8% moderate estimate (based on long-term global stock market averages). Enter your own value — e.g. 6% for conservative, 10% for optimistic — to override it."
                  position="top"
                  maxWidth={280}
                >
                  <span className="border-b border-dashed border-slate-600 cursor-help">Expected Return %</span>
                </Tooltip>
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <input
                  type="number"
                  value={customRateInput}
                  min={1}
                  max={30}
                  step={0.5}
                  placeholder="8 (default)"
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomRateInput(val);
                    const parsed = parseFloat(val);
                    setCustomRate(parsed >= 1 && parsed <= 30 ? parsed / 100 : null);
                  }}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none min-w-0"
                />
                <span className="pr-2 text-slate-400 text-sm">%</span>
                {customRate !== null && (
                  <button
                    onClick={() => { setCustomRate(null); setCustomRateInput(""); }}
                    className="pr-3 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <label
                className="flex items-center gap-3 cursor-pointer select-none w-full rounded-xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={inflationAdjust}
                    onChange={(e) => setInflationAdjust(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-colors"
                    style={{ background: inflationAdjust ? "#6366f1" : "rgba(255,255,255,0.12)" }}
                  />
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ left: inflationAdjust ? "20px" : "2px" }}
                  />
                </div>
                <Tooltip
                  content="Inflation erodes purchasing power over time. At 2.5% annual inflation, £100 today buys less in 10 years. Toggle ON to subtract 2.5% from each return rate — so you see what your future value is worth in today's money, not just nominally."
                  position="top"
                  maxWidth={280}
                >
                  <span className="text-sm text-slate-300 border-b border-dashed border-slate-600 cursor-help">
                    Inflation adjusted (2.5%)
                  </span>
                </Tooltip>
              </label>
            </div>
          </div>

          {/* Chart — Scenarios or Monte Carlo */}
          {showMonteCarlo && monteCarloResult ? (
            <MonteCarloChart result={monteCarloResult} currency={currency} years={years} />
          ) : (
            <>
              <ProjectionChart data={projectionData} currency={currency} customRate={customRate ?? undefined} />
              <p className="text-xs text-slate-600 text-center">
                Projections are estimates and not financial advice.
              </p>
            </>
          )}

          {/* What If simulator */}
          <WhatIfPanel
            currentValue={portfolio.totalValue}
            monthlyContribution={monthly}
            years={years}
            currency={currency}
            annualRate={customRate ?? 0.08}
          />
        </div>

        {/* ── AI Digest ── */}
        {portfolio && risk && (
          <AIDigest
            portfolio={portfolio}
            risk={risk}
            sectorAllocations={sectorAllocations}
            dividendSummary={dividendSummary}
            monthlyContribution={monthly}
            onOpenSettings={() => setShowSettings(true)}
            settingsVersion={settingsVersion}
          />
        )}

      </div>

      <SettingsPanel open={showSettings} onClose={() => { setShowSettings(false); setSettingsVersion((v) => v + 1); }} />
    </div>
  );
}
