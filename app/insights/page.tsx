"use client";

import { usePortfolio } from "@/contexts/PortfolioContext";
import BehaviourProfile from "@/components/BehaviourProfile";
import BenchmarkComparison from "@/components/BenchmarkComparison";
import RealizedPnL from "@/components/RealizedPnL";
import RegretMinimizer from "@/components/RegretMinimizer";

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

export default function InsightsPage() {
  const {
    portfolio, loading, error,
    behaviourProfile, realizedPnL, benchmarkResult,
    monthly,
  } = usePortfolio();

  const currency = portfolio?.currencyCode ?? "GBP";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
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

  const firstTradeDate = benchmarkResult?.firstTradeDate ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white">Insights</h1>
        <p className="text-xs text-slate-500 mt-0.5">Your investor profile, performance vs the market &amp; realised gains</p>
      </div>

      {/* ── Investor DNA ─────────────────────────────────────────────────── */}
      {behaviourProfile ? (
        <BehaviourProfile profile={behaviourProfile} />
      ) : (
        <div className="rounded-2xl p-6 text-center space-y-2" style={glass}>
          <p className="text-2xl">🧬</p>
          <p className="text-sm font-semibold text-white">Investor DNA</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your investor profile is computed from your order history.<br />
            Make sure your Trading 212 API key is configured so order data can be fetched.
          </p>
        </div>
      )}

      {/* ── Benchmark ────────────────────────────────────────────────────── */}
      {benchmarkResult ? (
        <BenchmarkComparison result={benchmarkResult} currency={currency} />
      ) : (
        <div className="rounded-2xl p-6 text-center space-y-2" style={glass}>
          <p className="text-2xl">📊</p>
          <p className="text-sm font-semibold text-white">Benchmark Comparison</p>
          <p className="text-xs text-slate-500">
            Benchmark data will appear once your order history is loaded.
          </p>
        </div>
      )}

      {/* ── Realized P&L ─────────────────────────────────────────────────── */}
      {realizedPnL ? (
        <RealizedPnL summary={realizedPnL} currency={currency} />
      ) : (
        <div className="rounded-2xl p-6 text-center space-y-2" style={glass}>
          <p className="text-2xl">💰</p>
          <p className="text-sm font-semibold text-white">Realised P&amp;L</p>
          <p className="text-xs text-slate-500">
            No closed positions found. Realised gains appear after you sell holdings.
          </p>
        </div>
      )}

      {/* ── Regret Minimizer ─────────────────────────────────────────────── */}
      <RegretMinimizer
        currentValue={portfolio.totalValue}
        totalInvested={portfolio.totalInvested}
        monthlyContribution={monthly}
        firstTradeDate={firstTradeDate}
        currency={currency}
      />

    </div>
  );
}
