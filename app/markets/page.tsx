"use client";

import { useEffect, useState } from "react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import GlobalIndices from "@/components/GlobalIndices";
import SectorAlerts from "@/components/SectorAlerts";
import AIDigest from "@/components/AIDigest";
import type { IndexQuote } from "@/app/api/indices/route";

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

export default function MarketsPage() {
  const {
    portfolio, risk, sectorAllocations, dividendSummary,
    loading, error, monthly,
    avKey, settingsVersion, bumpSettingsVersion,
  } = usePortfolio();

  const [indices, setIndices] = useState<IndexQuote[] | null>(null);

  // Fetch indices once here; pass to both GlobalIndices and SectorAlerts
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

  const currency = portfolio?.currencyCode ?? "GBP";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white">Markets</h1>
        <p className="text-xs text-slate-500 mt-0.5">Global indices, sector performance &amp; AI-powered market digest</p>
      </div>

      {/* ── Global Indices ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">Global Indices</h2>
        <GlobalIndices indices={indices} avKey={avKey || undefined} />
        {!avKey && (
          <p className="text-xs text-slate-600 px-1">
            Add your Alpha Vantage key in Settings to see live market data.
          </p>
        )}
      </div>

      {/* ── Sector Alerts ────────────────────────────────────────────────── */}
      {sectorAllocations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Sector Performance vs Your Portfolio</h2>
          <SectorAlerts
            allocations={sectorAllocations}
            avKey={avKey || undefined}
            indices={indices}
            onOpenSettings={bumpSettingsVersion}
          />
        </div>
      )}

      {/* ── AI Digest ────────────────────────────────────────────────────── */}
      <AIDigest
        portfolio={portfolio}
        risk={risk}
        sectorAllocations={sectorAllocations}
        dividendSummary={dividendSummary}
        monthlyContribution={monthly}
        onOpenSettings={bumpSettingsVersion}
        settingsVersion={settingsVersion}
      />

    </div>
  );
}
