"use client";

import Link from "next/link";
import { useState } from "react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { buildItems, type ActionItem } from "@/components/ActionItems";

const TYPE_STYLE = {
  warning: { color: "#fbbf24", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)", dot: "#f59e0b", label: "Warning" },
  tip:     { color: "#60a5fa", bg: "rgba(99,162,241,0.07)", border: "rgba(99,162,241,0.18)", dot: "#3b82f6", label: "Tip" },
  good:    { color: "#34d399", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.18)", dot: "#10b981", label: "Good news" },
};

const TYPE_ICON = {
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  tip: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  good: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: "rgba(255,255,255,0.05)" }} />
  );
}

export default function ActionsPage() {
  const {
    portfolio, risk, dividendSummary, sectorAllocations, monthly, loading,
    seenActionTitles, dismissActionItem, restoreActionItem, dismissAllActions,
  } = usePortfolio();
  const [filter, setFilter] = useState<"all" | "warning" | "tip" | "good">("all");

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (!portfolio || !risk) return null;

  // Build all items (no slice — show everything)
  const order = { warning: 0, tip: 1, good: 2 } as const;
  const items: ActionItem[] = buildItems(portfolio, risk, dividendSummary, sectorAllocations, monthly)
    .sort((a, b) => order[a.type] - order[b.type]);

  const unseenCount = items.filter((i) => !seenActionTitles.has(i.title)).length;
  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "all",     label: `All (${items.length})` },
    { key: "warning", label: `Warnings (${items.filter((i) => i.type === "warning").length})` },
    { key: "tip",     label: `Tips (${items.filter((i) => i.type === "tip").length})` },
    { key: "good",    label: `Good news (${items.filter((i) => i.type === "good").length})` },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.08) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Action Items</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {unseenCount > 0
              ? `${unseenCount} new item${unseenCount !== 1 ? "s" : ""} based on your portfolio right now`
              : "You're all caught up — check back after your next sync"}
          </p>
        </div>
        {unseenCount > 0 && (
          <button
            onClick={() => dismissAllActions(items.map((i) => i.title))}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-white/10"
            style={{ color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === key ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === key ? "#fbbf24" : "#64748b",
              border: filter === key ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-2xl">✓</p>
          <p className="text-sm font-semibold text-white">Nothing here</p>
          <p className="text-xs text-slate-500">No items in this category right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item, i) => {
            const s = TYPE_STYLE[item.type];
            const isDismissed = seenActionTitles.has(item.title);
            return (
              <div
                key={i}
                className="rounded-2xl p-4 transition-opacity"
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  opacity: isDismissed ? 0.45 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${s.dot}22`, color: s.color }}
                  >
                    {TYPE_ICON[item.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: s.dot, opacity: 0.7 }}
                      >
                        {s.label}
                      </span>
                      {!isDismissed && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: s.dot }}
                        />
                      )}
                    </div>
                    <p className="text-sm font-bold text-white leading-snug mb-1.5">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.body}
                    </p>
                    {item.action && (
                      <Link
                        href={item.action.href}
                        onClick={() => dismissActionItem(item.title)}
                        className="inline-flex items-center gap-1 mt-3 text-sm font-semibold transition-colors"
                        style={{ color: s.color }}
                      >
                        {item.action.label}
                      </Link>
                    )}
                  </div>

                  {/* Dismiss / restore */}
                  <button
                    onClick={() => isDismissed ? restoreActionItem(item.title) : dismissActionItem(item.title)}
                    className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-white/10 mt-0.5"
                    style={{ color: "#475569" }}
                  >
                    {isDismissed ? "Restore" : "Dismiss"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-slate-600 text-center pb-2">
        Items refresh automatically when your portfolio data updates.
      </p>
    </div>
  );
}
