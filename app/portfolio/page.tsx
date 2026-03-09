"use client";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { formatCurrency } from "@/lib/projection";
import HoldingsTable from "@/components/HoldingsTable";
import SectorChart from "@/components/SectorChart";
import DividendTracker from "@/components/DividendTracker";
import DividendDiscovery from "@/components/DividendDiscovery";
import StatCard from "@/components/StatCard";

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

export default function PortfolioPage() {
  const {
    portfolio, risk, sectorAllocations, dividendSummary,
    loading, error, hideValues, simpleMode, setSimpleMode,
  } = usePortfolio();

  const currency = portfolio?.currencyCode ?? "GBP";
  const currencySymbol = currency === "GBP" ? "£" : "$";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
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

  if (!portfolio || !risk) return null;

  const portfolioDrawdownPct = risk.portfolioDrawdown * 100;
  const maxPositionDrawdownPct = risk.maxPositionDrawdown * 100;
  const overallRisk = risk.portfolioBeta >= 1.3 ? "High" : risk.portfolioBeta >= 1.0 ? "Medium" : "Low";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Portfolio</h1>
          <p className="text-xs text-slate-500 mt-0.5">Holdings, risk, sector allocation &amp; dividends</p>
        </div>
        {/* Simple / Advanced toggle */}
        <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {([
            { label: "Simple", value: true },
            { label: "Advanced", value: false },
          ] as const).map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSimpleMode(opt.value)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: simpleMode === opt.value ? "rgba(99,102,241,0.25)" : "transparent",
                color: simpleMode === opt.value ? "#a5b4fc" : "#475569",
                border: simpleMode === opt.value ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Risk metrics ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Risk Level"
          value={overallRisk}
          accent={overallRisk === "Low" ? "emerald" : overallRisk === "Medium" ? "amber" : "rose"}
          hint={overallRisk === "Low"
            ? `Your portfolio is lower-risk than the market (beta ${risk.portfolioBeta.toFixed(2)}). It tends to rise and fall less sharply than the overall market — good for stability.`
            : overallRisk === "Medium"
            ? `Your portfolio moves roughly in line with the market (beta ${risk.portfolioBeta.toFixed(2)}). Expect similar ups and downs to the overall stock market.`
            : `Your portfolio is higher-risk than the market (beta ${risk.portfolioBeta.toFixed(2)}). It can grow faster in bull markets but drop harder in downturns.`
          }
        />
        <StatCard
          label="Diversification"
          value={`${risk.concentrationScore}/100`}
          subValue={risk.concentrationScore > 50 ? "Too concentrated" : risk.concentrationScore > 30 ? "Moderate" : "Well spread"}
          positive={risk.concentrationScore <= 30}
          accent={risk.concentrationScore > 50 ? "rose" : risk.concentrationScore > 30 ? "amber" : "emerald"}
          hint={risk.concentrationScore <= 30
            ? `Score ${risk.concentrationScore}/100 — excellent. Your money is well spread. Lower is better (aim under 30), like spreading eggs across many baskets.`
            : `Score ${risk.concentrationScore}/100 — aim for under 30. A few holdings dominate your portfolio right now. Spreading into more sectors or stocks would reduce this.`
          }
        />
        <StatCard
          label="Overall Return"
          value={`${portfolioDrawdownPct >= 0 ? "+" : ""}${portfolioDrawdownPct.toFixed(1)}%`}
          positive={portfolioDrawdownPct >= 0}
          accent={portfolioDrawdownPct >= 0 ? "emerald" : "rose"}
          hint={portfolioDrawdownPct >= 0
            ? `You're up ${portfolioDrawdownPct.toFixed(1)}% overall on your invested capital. These are unrealised gains — they become real cash when you sell.`
            : `Your portfolio is ${Math.abs(portfolioDrawdownPct).toFixed(1)}% below what you've invested so far. These are paper losses — they only become real if you sell. Stay patient.`
          }
        />
        {!simpleMode && (
          <StatCard
            label="Worst Position"
            value={`${maxPositionDrawdownPct.toFixed(1)}%`}
            positive={maxPositionDrawdownPct >= 0}
            accent={maxPositionDrawdownPct >= -10 ? "amber" : "rose"}
            hint={maxPositionDrawdownPct >= 0
              ? "All your positions are currently above their average buy price — everything is in profit."
              : `Your most underwater position is ${Math.abs(maxPositionDrawdownPct).toFixed(1)}% below its average buy price. This is the biggest unrealised loss from a single holding.`
            }
          />
        )}
      </div>

      {/* ── Risk warnings ────────────────────────────────────────────────── */}
      {risk.overweightWarnings.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Risk Alerts</p>
          {risk.overweightWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-amber-500 flex-shrink-0 text-sm mt-0.5">⚠</span>
              <p className="text-sm text-amber-300 leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Holdings Table ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Holdings
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({portfolio.positions.length} positions)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Total:{" "}
            <span className="text-slate-300 font-semibold"
              style={{ filter: hideValues ? "blur(6px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
              {formatCurrency(portfolio.totalValue, currency)}
            </span>
          </p>
        </div>
        <HoldingsTable
          positions={risk.positions}
          currency={currency}
          hideValues={hideValues}
          dividendsByTicker={dividendSummary?.byTicker}
        />
      </div>

      {/* ── Sector + Dividends ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sectorAllocations.length > 0 && (
          <div className="rounded-2xl p-5 space-y-3" style={glass}>
            <h2 className="text-sm font-bold text-white">Sector Allocation</h2>
            <SectorChart allocations={sectorAllocations} currency={currency} />
            {/* Sector breakdown list */}
            <div className="space-y-2 pt-1">
              {sectorAllocations.slice(0, 6).map((s) => (
                <div key={s.sector} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.color ?? "#6366f1" }} />
                  <span className="text-xs text-slate-400 flex-1">{s.sector}</span>
                  <span className="text-xs font-semibold text-slate-300">{s.weight.toFixed(1)}%</span>
                  <span className="text-xs text-slate-600 w-20 text-right"
                    style={{ filter: hideValues ? "blur(5px)" : "none", userSelect: hideValues ? "none" : "auto" }}>
                    {formatCurrency(s.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dividendSummary && (
          <DividendTracker summary={dividendSummary} currency={currency} />
        )}
      </div>

      {/* ── Dividend Discovery ────────────────────────────────────────────── */}
      <div id="dividend-discovery" style={{ scrollMarginTop: "80px" }}>
        <DividendDiscovery
          currency={currency}
          existingTickers={portfolio.positions.map((p) => p.ticker)}
        />
      </div>

      {/* ── Cash positions ───────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={glass}>
        <h2 className="text-sm font-bold text-white mb-4">Account Cash</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Free Cash", value: portfolio.cash.free, hint: "Available to invest" },
            { label: "Invested", value: portfolio.totalInvested, hint: "Total cost basis of open positions" },
            { label: "P&L", value: portfolio.totalPnL, hint: "Unrealised gain/loss" },
            { label: "Total Value", value: portfolio.totalValue, hint: "Invested + free cash + P&L" },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-bold"
                style={{
                  color: item.label === "P&L" ? (item.value >= 0 ? "#10b981" : "#f43f5e") : "#fff",
                  filter: hideValues ? "blur(6px)" : "none",
                  userSelect: hideValues ? "none" : "auto",
                }}>
                {item.label === "P&L" && item.value >= 0 ? "+" : ""}
                {formatCurrency(item.value, currency)}
              </p>
              <p className="text-xs text-slate-600">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-700 text-center pb-2">
        Data synced from Trading 212 · {currencySymbol} values are approximate
      </p>
    </div>
  );
}
