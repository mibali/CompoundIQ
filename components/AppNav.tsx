"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import SettingsPanel from "@/components/SettingsPanel";
import { buildItems, type ActionItem } from "@/components/ActionItems";

// ── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PortfolioIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function InsightsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <line x1="9" y1="21" x2="15" y2="21" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function MarketsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ActionsNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DisconnectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ── Action item styles ────────────────────────────────────────────────────────

const TYPE_STYLE = {
  warning: { color: "#fbbf24", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)", dot: "#f59e0b" },
  tip:     { color: "#60a5fa", bg: "rgba(99,162,241,0.07)", border: "rgba(99,162,241,0.18)", dot: "#3b82f6" },
  good:    { color: "#34d399", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.18)", dot: "#10b981" },
};

const TYPE_ICON = {
  warning: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  tip: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  good: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/",          label: "Home",      Icon: HomeIcon },
  { href: "/portfolio", label: "Portfolio", Icon: PortfolioIcon },
  { href: "/plan",      label: "Plan",      Icon: PlanIcon },
  { href: "/insights",  label: "Insights",  Icon: InsightsIcon },
  { href: "/markets",   label: "Markets",   Icon: MarketsIcon },
  { href: "/actions",   label: "Actions",   Icon: ActionsNavIcon },
] as const;

const SIDEBAR_BG = "rgba(8,13,26,0.98)";
const SIDEBAR_BORDER = "1px solid rgba(255,255,255,0.06)";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    hideValues, setHideValues, bumpSettingsVersion,
    portfolio, risk, dividendSummary, sectorAllocations, monthly,
    seenActionTitles, dismissActionItem, dismissAllActions,
  } = usePortfolio();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const bellDesktopRef = useRef<HTMLButtonElement>(null);
  const bellMobileRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute action items from portfolio data
  const notifItems = useMemo<ActionItem[]>(() => {
    if (!portfolio || !risk) return [];
    return buildItems(portfolio, risk, dividendSummary, sectorAllocations, monthly);
  }, [portfolio, risk, dividendSummary, sectorAllocations, monthly]);

  // Badge only counts items the user hasn't seen yet
  const unseenItems = notifItems.filter((i) => !seenActionTitles.has(i.title));
  const warningCount = unseenItems.filter((i) => i.type === "warning").length;
  const badgeCount = unseenItems.length;

  function dismissAll() {
    dismissAllActions(notifItems.map((i) => i.title));
    setShowNotifications(false);
  }

  // Click-outside to close dropdown
  useEffect(() => {
    if (!showNotifications) return;
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        bellDesktopRef.current?.contains(target) ||
        bellMobileRef.current?.contains(target)
      ) return;
      setShowNotifications(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showNotifications]);

  async function handleDisconnect() {
    await fetch("/api/session/disconnect", { method: "POST" });
    router.push("/connect");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function NavLink({ href, label, Icon }: (typeof NAV_ITEMS)[number]) {
    const active = isActive(href);
    const isActions = href === "/actions";
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
        style={{
          background: active ? "rgba(99,102,241,0.14)" : "transparent",
          color: active ? "#a5b4fc" : "#64748b",
          border: active ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
        }}
      >
        <div className="relative flex-shrink-0">
          <Icon active={active} />
          {isActions && badgeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center font-bold"
              style={{ fontSize: "8px", background: warningCount > 0 ? "#f43f5e" : "#f59e0b" }}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </div>
        {label}
        {isActions && badgeCount > 0 && (
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold"
            style={{
              background: warningCount > 0 ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
              color: warningCount > 0 ? "#f43f5e" : "#f59e0b",
            }}
          >
            {badgeCount}
          </span>
        )}
      </Link>
    );
  }

  const badgeEl = badgeCount > 0 ? (
    <span
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
      style={{
        fontSize: "9px",
        background: warningCount > 0 ? "#f43f5e" : "#f59e0b",
      }}
    >
      {badgeCount > 9 ? "9+" : badgeCount}
    </span>
  ) : null;

  return (
    <>
      {/* ══ Desktop sidebar ════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col z-30"
        style={{ background: SIDEBAR_BG, borderRight: SIDEBAR_BORDER }}
      >
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: SIDEBAR_BORDER }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            >
              C
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">CompoundIQ</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Wealth Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-3 space-y-0.5" style={{ borderTop: SIDEBAR_BORDER }}>
          {/* Live */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>

          {/* Notifications bell */}
          {notifItems.length > 0 && (
            <button
              ref={bellDesktopRef}
              onClick={() => setShowNotifications((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
              style={{
                background: showNotifications ? "rgba(245,158,11,0.1)" : "transparent",
                color: showNotifications ? "#fbbf24" : "#64748b",
                border: showNotifications ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
              }}
            >
              <div className="relative flex-shrink-0">
                <BellIcon />
                {badgeEl}
              </div>
              <span>Action Items</span>
              {badgeCount > 0 && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold"
                  style={{
                    background: warningCount > 0 ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
                    color: warningCount > 0 ? "#f43f5e" : "#f59e0b",
                  }}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          )}

          {/* Hide values */}
          <button
            onClick={() => setHideValues(!hideValues)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
            style={{
              background: hideValues ? "rgba(99,102,241,0.1)" : "transparent",
              color: hideValues ? "#a5b4fc" : "#64748b",
              border: hideValues ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
            }}
          >
            {hideValues ? <EyeOffIcon /> : <EyeIcon />}
            {hideValues ? "Show values" : "Hide values"}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <GearIcon />
            Settings
          </button>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium hover:bg-rose-500/10"
            style={{ color: "#64748b" }}
          >
            <DisconnectIcon />
            Disconnect
          </button>
        </div>
      </aside>

      {/* ══ Mobile top bar ════════════════════════════════════════════════ */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4"
        style={{ background: SIDEBAR_BG, borderBottom: SIDEBAR_BORDER }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            C
          </div>
          <span className="text-sm font-bold text-white">CompoundIQ</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-1">
          {/* Bell */}
          {notifItems.length > 0 && (
            <button
              ref={bellMobileRef}
              onClick={() => setShowNotifications((v) => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors relative"
              style={{ color: showNotifications ? "#fbbf24" : "#64748b" }}
            >
              <BellIcon />
              {badgeEl}
            </button>
          )}
          <button
            onClick={() => setHideValues(!hideValues)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: hideValues ? "#818cf8" : "#64748b" }}
          >
            {hideValues ? <EyeOffIcon /> : <EyeIcon />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: "#64748b" }}
          >
            <GearIcon />
          </button>
          <button
            onClick={handleDisconnect}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:text-rose-400"
            style={{ color: "#64748b" }}
            title="Disconnect Trading 212"
          >
            <DisconnectIcon />
          </button>
        </div>
      </header>

      {/* ══ Mobile bottom tabs ════════════════════════════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-20 flex"
        style={{ background: SIDEBAR_BG, borderTop: SIDEBAR_BORDER }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: active ? "#818cf8" : "#475569" }}
            >
              <Icon active={active} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ══ Notifications dropdown ═════════════════════════════════════════ */}
      {showNotifications && notifItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-50 rounded-2xl shadow-2xl overflow-y-auto
            top-14 left-2 right-2 max-h-[calc(100vh-120px)]
            lg:top-auto lg:bottom-20 lg:left-[232px] lg:right-auto lg:w-[340px]"
          style={{
            background: "rgba(10,15,30,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 sticky top-0"
            style={{ background: "rgba(10,15,30,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm font-bold text-white">Action Items</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {badgeCount > 0 ? `${badgeCount} remaining` : "All caught up"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {badgeCount > 0 && (
                <button
                  onClick={dismissAll}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-white/10"
                  style={{ color: "#64748b" }}
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "#64748b" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="p-3 flex flex-col gap-2">
            {notifItems.map((item, i) => {
              const s = TYPE_STYLE[item.type];
              const isDismissed = seenActionTitles.has(item.title);
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 flex items-start gap-2.5 transition-opacity"
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    opacity: isDismissed ? 0.4 : 1,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${s.dot}22`, color: s.color }}
                  >
                    {TYPE_ICON[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug" style={{ color: s.color }}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                      {item.body}
                    </p>
                    {item.action && (
                      <Link
                        href={item.action.href}
                        onClick={() => { dismissActionItem(item.title); setShowNotifications(false); }}
                        className="inline-block mt-1.5 text-xs font-semibold transition-colors"
                        style={{ color: s.color }}
                      >
                        {item.action.label}
                      </Link>
                    )}
                  </div>
                  {/* Per-item dismiss */}
                  {!isDismissed && (
                    <button
                      onClick={() => dismissActionItem(item.title)}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10 mt-0.5"
                      style={{ color: "#475569" }}
                      title="Dismiss"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings panel (accessible from any page) */}
      <SettingsPanel
        open={showSettings}
        onClose={() => { setShowSettings(false); bumpSettingsVersion(); }}
      />
    </>
  );
}
