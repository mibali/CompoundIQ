"use client";

import { useEffect, useState } from "react";
import type { SectorAllocation } from "@/lib/sectors";
import { getStoredKey, STORAGE_KEYS } from "@/lib/apikeys";

interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const INDEX_LABELS: Record<string, { label: string; desc: string }> = {
  SPY: { label: "US Market (S&P 500)", desc: "Tracks 500 biggest US companies" },
  QQQ: { label: "US Tech (NASDAQ 100)", desc: "Apple, Microsoft, Google & more" },
  EWU: { label: "UK Market (FTSE 100)", desc: "Biggest UK-listed companies" },
};

interface SectorPerformance {
  sector: string;
  changePercent: number;
}

interface SectorAlertsProps {
  allocations: SectorAllocation[];
  avKey?: string;
  indices?: IndexQuote[] | null;
  onOpenSettings?: () => void;
}

interface Alert {
  sector: string;
  weight: number;
  changePercent: number;
  severity: "high" | "medium" | "positive";
  message: string;
}

interface TrackedSector {
  sector: string;
  weight: number;
  changePercent: number;
}

function buildAlerts(
  allocations: SectorAllocation[],
  performance: SectorPerformance[]
): { alerts: Alert[]; tracked: TrackedSector[] } {
  const perfMap = new Map(performance.map((p) => [p.sector, p.changePercent]));
  const alerts: Alert[] = [];
  const tracked: TrackedSector[] = [];

  for (const alloc of allocations) {
    const change = perfMap.get(alloc.sector);
    if (change === undefined) continue; // sector not in AV data (e.g. Index Funds & ETFs)

    tracked.push({ sector: alloc.sector, weight: alloc.weight, changePercent: change });

    if (change === 0) continue;

    // Alert thresholds — weight >= 2% to catch smaller positions
    if (change <= -2 && alloc.weight >= 2) {
      alerts.push({
        sector: alloc.sector,
        weight: alloc.weight,
        changePercent: change,
        severity: "high",
        message: `${alloc.weight.toFixed(1)}% of your portfolio is in ${alloc.sector}, which is down ${Math.abs(change).toFixed(2)}% today.`,
      });
    } else if (change <= -0.75 && alloc.weight >= 2) {
      alerts.push({
        sector: alloc.sector,
        weight: alloc.weight,
        changePercent: change,
        severity: "medium",
        message: `${alloc.sector} is down ${Math.abs(change).toFixed(2)}% today. You hold ${alloc.weight.toFixed(1)}% here.`,
      });
    } else if (change >= 1 && alloc.weight >= 2) {
      alerts.push({
        sector: alloc.sector,
        weight: alloc.weight,
        changePercent: change,
        severity: "positive",
        message: `${alloc.sector} is up ${change.toFixed(2)}% today — ${alloc.weight.toFixed(1)}% of your portfolio is benefiting.`,
      });
    }
  }

  return {
    alerts: alerts.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    tracked,
  };
}

const SEVERITY_STYLES = {
  high: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    badge: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    dot: "#ef4444",
  },
  medium: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    badge: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    dot: "#f59e0b",
  },
  positive: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    badge: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    dot: "#10b981",
  },
};

export default function SectorAlerts({ allocations, avKey, indices, onOpenSettings }: SectorAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tracked, setTracked] = useState<TrackedSector[]>([]);
  const [source, setSource] = useState<string>("loading");
  const [apiMessage, setApiMessage] = useState<string>("");

  const isEtfPortfolio = allocations.length > 0 && allocations.every(
    (a) => a.sector === "Index Funds & ETFs" || a.sector === "Other"
  );

  useEffect(() => {
    const controller = new AbortController();
    const key = avKey ?? getStoredKey(STORAGE_KEYS.ALPHA_VANTAGE);
    const headers: HeadersInit = key ? { "X-Alpha-Vantage-Key": key } : {};
    fetch("/api/market", { headers, signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setSource(data.source ?? "none");
        if (data.message) setApiMessage(data.message);
        const result = buildAlerts(allocations, data.sectors ?? []);
        setAlerts(result.alerts);
        setTracked(result.tracked);
      })
      .catch((err) => { if (err?.name !== "AbortError") setSource("error"); });
    return () => controller.abort();
  }, [allocations, avKey]);

  if (source === "loading") {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          minHeight: 80,
        }}
      >
        <p className="text-xs text-slate-600 animate-pulse">Loading market data…</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-white uppercase tracking-widest">
            Sector Alerts
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Today's market moves vs your holdings
          </p>
        </div>
        {source === "alphavantage" && (
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
          >
            Live
          </span>
        )}
        {source === "none" && (
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
          >
            No key
          </span>
        )}
      </div>

      {source === "none" ? (
        <div
          className="rounded-xl p-3 flex flex-col gap-1"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px dashed rgba(245,158,11,0.2)",
          }}
        >
          <p className="text-xs font-semibold text-amber-400">
            Alpha Vantage key not configured
          </p>
          <p className="text-xs text-slate-500">Add a free key to see live sector moves affecting your portfolio.</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Free at{" "}
            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400 transition-colors">alphavantage.co</a>
            {" "}— 25 req/day is enough.
          </p>
          <button
            onClick={onOpenSettings}
            className="text-xs text-amber-400 font-semibold mt-1 text-left hover:text-amber-300 transition-colors"
          >
            → Open Settings to add your Alpha Vantage key
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col gap-2">
          {tracked.length === 0 ? (
            <div className="flex flex-col gap-2">
              <div
                className="rounded-xl p-3 flex flex-col gap-1"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <p className="text-xs font-semibold text-indigo-300">ETF / Index Fund Portfolio</p>
                <p className="text-xs text-slate-400 leading-snug">
                  Your portfolio holds broad market ETFs (like VUSA, VWRP, VWRL). These track the whole market rather than individual sectors, so sector-level alerts don&apos;t apply.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instead, here&apos;s how the markets your ETFs track are performing today:
                </p>
              </div>
              {indices && indices.filter(idx => INDEX_LABELS[idx.symbol]).map((idx) => {
                const lbl = INDEX_LABELS[idx.symbol]!;
                const pos = idx.changePercent >= 0;
                const noData = idx.price === 0;
                const color = noData ? "#475569" : pos ? "#10b981" : "#f87171";
                return (
                  <div
                    key={idx.symbol}
                    className="rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-300">{lbl.label}</p>
                      <p className="text-xs text-slate-600">{lbl.desc}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                      {noData ? "—" : `${pos ? "+" : ""}${idx.changePercent.toFixed(2)}%`}
                    </span>
                  </div>
                );
              })}
              {indices === null && (
                <p className="text-xs text-slate-600 animate-pulse">Loading index data…</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">Markets are calm today — no significant moves in your sectors.</p>
              <div className="flex flex-col gap-1.5">
                {tracked.map((t) => {
                  const pos = t.changePercent > 0;
                  const color = t.changePercent === 0 ? "#475569" : pos ? "#10b981" : "#f87171";
                  return (
                    <div
                      key={t.sector}
                      className="rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-400 truncate">{t.sector}</span>
                        <span className="text-xs text-slate-600">{t.weight.toFixed(1)}% of portfolio</span>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>
                        {t.changePercent === 0 ? "—" : `${pos ? "+" : ""}${t.changePercent.toFixed(2)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {allocations.some(a => a.sector === "Index Funds & ETFs") && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Note: ETF/index fund holdings aren&apos;t tracked by sector performance data.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={`${alert.sector}-${i}`}
                className="rounded-xl p-3 flex items-start gap-3"
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                  style={{ background: style.dot }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {alert.sector}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                      style={style.badge}
                    >
                      {alert.changePercent > 0 ? "+" : ""}
                      {alert.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
