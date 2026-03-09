"use client";

import type { IndexQuote } from "@/app/api/indices/route";

// Plain-English labels for beginners
const PLAIN_LABELS: Record<string, { heading: string; sub: string }> = {
  SPY:  { heading: "US Market",   sub: "S&P 500 — 500 biggest US companies" },
  QQQ:  { heading: "US Tech",     sub: "NASDAQ 100 — Apple, Microsoft, Google…" },
  EWU:  { heading: "UK Market",   sub: "FTSE 100 — biggest UK companies" },
  VIXY: { heading: "Market Fear", sub: "VIX — how nervous investors are" },
};

// Plain-English status line
function vixStatus(price: number): { label: string; color: string } {
  if (price >= 30) return { label: "Very high fear — markets very nervous", color: "#f87171" };
  if (price >= 20) return { label: "Elevated fear — some concern in markets", color: "#f59e0b" };
  return { label: "Calm — markets relatively relaxed", color: "#10b981" };
}

function marketStatus(changePercent: number): { label: string; color: string } {
  if (changePercent <= -2) return { label: "Falling sharply today", color: "#f87171" };
  if (changePercent < 0)   return { label: "Down slightly today",   color: "#f87171" };
  if (changePercent === 0) return { label: "Flat today",            color: "#94a3b8" };
  if (changePercent < 2)   return { label: "Up slightly today",     color: "#10b981" };
  return { label: "Rising strongly today", color: "#10b981" };
}

interface GlobalIndicesProps {
  avKey?: string;
  indices?: IndexQuote[] | null;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 animate-pulse"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="h-4 w-14 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}

export default function GlobalIndices({ avKey, indices }: GlobalIndicesProps) {
  const hasLiveData = indices != null && indices.some((i) => i.price > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white uppercase tracking-widest">Global Markets</p>
        {indices !== null && !avKey && (
          <p className="text-xs text-slate-600">Add Alpha Vantage key for live data</p>
        )}
        {hasLiveData && (
          <p className="text-xs text-slate-600">Live · updates hourly</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {!indices
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : indices.map((idx) => {
              const isVix = idx.symbol === "VIXY";
              const noData = idx.price === 0;
              const label = PLAIN_LABELS[idx.symbol];
              const positive = idx.changePercent >= 0;

              const status = noData
                ? null
                : isVix
                ? vixStatus(idx.price)
                : marketStatus(idx.changePercent);

              const changeColor = isVix
                ? vixStatus(idx.price).color
                : positive ? "#10b981" : "#f87171";

              return (
                <div
                  key={idx.symbol}
                  className="rounded-xl p-4 flex flex-col gap-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Heading */}
                  <p className="text-xs font-bold text-white">{label?.heading ?? idx.name}</p>

                  {/* % change — the number that matters */}
                  {noData ? (
                    <p className="text-lg font-black text-slate-600">—</p>
                  ) : (
                    <p className="text-lg font-black" style={{ color: changeColor }}>
                      {isVix
                        ? idx.price.toFixed(1)
                        : `${positive ? "+" : ""}${idx.changePercent.toFixed(2)}%`}
                    </p>
                  )}

                  {/* Plain-English status */}
                  {status && (
                    <p className="text-xs font-medium leading-snug" style={{ color: status.color }}>
                      {status.label}
                    </p>
                  )}
                  {noData && <p className="text-xs text-slate-600">Data unavailable</p>}

                  {/* Sub-label */}
                  <p className="text-xs text-slate-600 leading-snug mt-0.5">
                    {label?.sub ?? idx.symbol}
                  </p>
                </div>
              );
            })}
      </div>
    </div>
  );
}
