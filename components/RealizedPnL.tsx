"use client";

import type { RealizedPnLSummary } from "@/lib/realizedpnl";
import { formatCurrency } from "@/lib/projection";

interface RealizedPnLProps {
  summary: RealizedPnLSummary;
  currency: string;
}

export default function RealizedPnL({ summary, currency }: RealizedPnLProps) {
  const positive = summary.totalGain >= 0;

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
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">
              Realised P&amp;L
            </h2>
            <div className="relative group flex-shrink-0">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs cursor-help select-none"
                style={{ background: "rgba(255,255,255,0.08)", color: "#64748b" }}
              >
                ?
              </div>
              <div
                className="absolute left-0 top-6 z-50 w-72 rounded-xl p-3 text-xs leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "rgba(15,23,42,0.98)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                }}
              >
                <p className="font-semibold text-white mb-1.5">What is Realised P&L?</p>
                <p className="text-slate-300 mb-2">
                  P&L = <span className="text-white font-medium">Profit &amp; Loss</span>. &quot;Realised&quot; means profit or loss you have actually <span className="text-emerald-400 font-medium">locked in</span> by selling a stock.
                </p>
                <p className="text-slate-400 mb-2">
                  For example: you bought a stock for £100 and sold it for £130 — that&apos;s a <span className="text-emerald-400 font-medium">+£30 realised gain</span>. The money is in your account.
                </p>
                <p className="text-slate-400">
                  If you still hold a stock that&apos;s gone up, that&apos;s <span className="text-indigo-300 font-medium">unrealised</span> — it only counts when you sell.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.hasData
              ? `${summary.trades} closed trade${summary.trades !== 1 ? "s" : ""}`
              : "No closed positions yet"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="relative group rounded-xl p-3 flex flex-col gap-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-slate-500">Total Realised Gain</p>
          <p
            className="text-base font-bold"
            style={{ color: positive ? "#10b981" : "#f87171" }}
          >
            {positive ? "+" : ""}
            {formatCurrency(summary.totalGain, currency)}
          </p>
          <div
            className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl p-2.5 text-xs leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <p className="text-slate-300">The total profit (or loss) you&apos;ve made from all the stocks you&apos;ve sold. This money has already landed in your account.</p>
          </div>
        </div>
        <div
          className="relative group rounded-xl p-3 flex flex-col gap-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-slate-500">Total Proceeds</p>
          <p className="text-base font-bold text-slate-200">
            {formatCurrency(summary.totalProceeds, currency)}
          </p>
          <div
            className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl p-2.5 text-xs leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <p className="text-slate-300">The total cash you received from all your sells — i.e. what actually hit your account. Includes both your original investment and any profit.</p>
          </div>
        </div>
      </div>

      {/* Per-ticker breakdown */}
      {summary.byTicker.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            By holding
          </p>
          <div className="flex flex-col gap-1.5">
            {summary.byTicker.map((t) => {
              const pos = t.gain >= 0;
              return (
                <div key={t.ticker} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: pos ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
                      color: pos ? "#10b981" : "#f87171",
                    }}
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
                    <p
                      className="text-xs font-semibold"
                      style={{ color: pos ? "#10b981" : "#f87171" }}
                    >
                      {pos ? "+" : ""}
                      {formatCurrency(t.gain, currency)}
                    </p>
                    <p className="text-xs text-slate-600">
                      {t.trades} trade{t.trades !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            height: 72,
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-xs text-slate-600">No sells found in order history</p>
        </div>
      )}
    </div>
  );
}
