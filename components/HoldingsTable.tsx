"use client";

import { useState, Fragment } from "react";
import type { PositionRisk } from "@/lib/risk";
import { formatCurrency } from "@/lib/projection";
import { getCompanyName, cleanTicker } from "@/lib/tickerNames";
import { SECTOR_COLORS } from "@/lib/sectors";
import Tooltip from "@/components/Tooltip";

const riskConfig: Record<string, { label: string; color: string; bg: string; tooltip: string }> = {
  Low: {
    label: "Low Risk",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    tooltip: "P&L movement under 15%. Relatively stable position with lower volatility.",
  },
  Medium: {
    label: "Med Risk",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    tooltip: "P&L movement between 15–35%. Moderate volatility — typical for growth stocks.",
  },
  High: {
    label: "High Risk",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.12)",
    tooltip: "P&L movement over 35%. High volatility — large swings in either direction.",
  },
};

const columnTooltips: Record<string, string> = {
  Value: "Current market value of this position (quantity × current price)",
  Weight: "Percentage of your total portfolio this holding represents",
  "P&L": "Unrealised profit or loss — based on your average buy price vs current price",
  Risk: "Risk level based on how much this position has moved vs your cost basis",
};

interface DividendEntry {
  ticker: string;
  total: number;
  payments: number;
}

interface Props {
  positions: PositionRisk[];
  currency?: string;
  hideValues?: boolean;
  dividendsByTicker?: DividendEntry[];
}

export default function HoldingsTable({
  positions,
  currency = "GBP",
  hideValues = false,
  dividendsByTicker,
}: Props) {
  const sorted = [...positions].sort((a, b) => b.value - a.value);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const mask = (val: string) => (hideValues ? "••••••" : val);
  const blurStyle: React.CSSProperties = hideValues
    ? { filter: "blur(6px)", userSelect: "none", transition: "filter 0.2s" }
    : { transition: "filter 0.2s" };

  const divMap = new Map<string, number>(
    (dividendsByTicker ?? []).map((d) => [d.ticker, d.total])
  );

  function riskScoreColor(score: number) {
    if (score <= 3) return "#10b981";
    if (score <= 6) return "#f59e0b";
    return "#f43f5e";
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Asset", "Value", "Weight", "P&L", "Risk"].map((h) => (
              <th
                key={h}
                className={`py-3 px-4 text-xs font-semibold uppercase tracking-widest text-slate-500 ${
                  h === "Asset" ? "text-left" : "text-right"
                } ${h === "Risk" ? "text-center" : ""}`}
              >
                {columnTooltips[h] ? (
                  <Tooltip content={columnTooltips[h]} position="bottom">
                    <span className="border-b border-dashed border-slate-600 cursor-help pb-0.5">
                      {h}
                    </span>
                  </Tooltip>
                ) : (
                  h
                )}
              </th>
            ))}
            {/* Expand column */}
            <th className="py-3 px-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const risk = riskConfig[p.riskLevel];
            const ticker = cleanTicker(p.ticker);
            const company = getCompanyName(p.ticker);
            const isExpanded = expandedTicker === p.ticker;
            const sectorColor =
              (SECTOR_COLORS as Record<string, string>)[p.sector] ?? "#475569";
            const divTotal = divMap.get(cleanTicker(p.ticker));

            return (
              <Fragment key={p.ticker}>
              <tr
                className="transition-colors cursor-pointer"
                style={{
                  borderBottom:
                    !isExpanded && i < sorted.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
                onClick={() =>
                  setExpandedTicker(isExpanded ? null : p.ticker)
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                    >
                      {ticker.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 leading-none">{ticker}</p>
                      {company && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-none">{company}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                  <span style={blurStyle}>{mask(formatCurrency(p.value, currency))}</span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(p.weight, 100)}%`,
                          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                        }}
                      />
                    </div>
                    <span className="text-slate-400 text-xs w-10 text-right">
                      {p.weight.toFixed(1)}%
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <Tooltip
                    content={`${p.pnlPercent >= 0 ? "+" : ""}${p.pnlPercent.toFixed(2)}% return on your invested amount in this position`}
                    position="left"
                  >
                    <div className="cursor-default" style={blurStyle}>
                      <span
                        className="font-semibold text-sm"
                        style={{ color: p.pnl >= 0 ? "#10b981" : "#f43f5e" }}
                      >
                        {p.pnl >= 0 ? "+" : ""}
                        {mask(formatCurrency(p.pnl, currency))}
                      </span>
                      <span
                        className="block text-xs"
                        style={{
                          color: p.pnl >= 0 ? "#34d399" : "#fb7185",
                          opacity: 0.7,
                        }}
                      >
                        {p.pnlPercent >= 0 ? "+" : ""}
                        {p.pnlPercent.toFixed(1)}%
                      </span>
                    </div>
                  </Tooltip>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <Tooltip content={risk.tooltip} position="left" maxWidth={240}>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full cursor-help"
                      style={{ color: risk.color, background: risk.bg }}
                    >
                      {risk.label}
                    </span>
                  </Tooltip>
                </td>

                {/* Chevron */}
                <td className="py-3.5 px-2 text-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="inline-block transition-transform"
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      color: "#64748b",
                    }}
                  >
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </td>
              </tr>

              {/* Expansion row */}
              {isExpanded && (
                <tr
                  style={{
                    borderBottom:
                      i < sorted.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <td colSpan={6} className="px-4 pb-3 pt-0">
                    <div
                      className="rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Sector */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Sector</p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${sectorColor}22`,
                            color: sectorColor,
                          }}
                        >
                          {p.sector}
                        </span>
                      </div>

                      {/* Risk Score */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: riskScoreColor(p.riskScore) }}
                        >
                          {p.riskScore}
                          <span className="text-xs text-slate-500 font-normal">/10</span>
                        </p>
                      </div>

                      {/* Drawdown from entry */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Drawdown from Entry</p>
                        <p
                          className="text-sm font-bold"
                          style={{
                            color:
                              p.drawdownFromEntry < 0 ? "#f43f5e" : "#10b981",
                          }}
                        >
                          {p.drawdownFromEntry === 0
                            ? "—"
                            : `${p.drawdownFromEntry.toFixed(1)}%`}
                        </p>
                      </div>

                      {/* Dividends received */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Dividends Received</p>
                        <p className="text-sm font-bold text-emerald-400" style={blurStyle}>
                          {divTotal != null && divTotal > 0
                            ? mask(formatCurrency(divTotal, currency))
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
