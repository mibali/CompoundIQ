"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PortfolioSummary, OrdersPage, DividendsPage } from "@/types/trading212";
import type { PortfolioRisk } from "@/lib/risk";
import type { ProjectionPoint } from "@/lib/projection";
import type { InvestorProfile } from "@/lib/behaviour";
import type { SectorAllocation } from "@/lib/sectors";
import type { DividendSummary } from "@/lib/dividends";
import type { MonteCarloResult } from "@/lib/montecarlo";
import type { RealizedPnLSummary } from "@/lib/realizedpnl";
import type { BenchmarkResult } from "@/lib/benchmark";
import { analyzePortfolioRisk } from "@/lib/risk";
import { analyzeSectors } from "@/lib/sectors";
import { analyzeDividends } from "@/lib/dividends";
import { analyzeInvestorBehaviour } from "@/lib/behaviour";
import { generateProjection } from "@/lib/projection";
import { runMonteCarlo } from "@/lib/montecarlo";
import { analyzeRealizedPnL } from "@/lib/realizedpnl";
import { analyzeBenchmark } from "@/lib/benchmark";
import { STORAGE_KEYS, getStoredKey } from "@/lib/apikeys";

interface PortfolioContextValue {
  // Data
  portfolio: PortfolioSummary | null;
  risk: PortfolioRisk | null;
  sectorAllocations: SectorAllocation[];
  dividendSummary: DividendSummary | null;
  behaviourProfile: InvestorProfile | null;
  realizedPnL: RealizedPnLSummary | null;
  benchmarkResult: BenchmarkResult | null;
  projectionData: ProjectionPoint[];
  monteCarloResult: MonteCarloResult | null;
  // Status
  loading: boolean;
  error: string | null;
  // UI
  hideValues: boolean;
  setHideValues: (v: boolean) => void;
  simpleMode: boolean;
  setSimpleMode: (v: boolean) => void;
  // Projection controls (shared between Home + Plan pages)
  monthly: number;
  setMonthly: (v: number) => void;
  years: number;
  setYears: (v: number) => void;
  inflationAdjust: boolean;
  setInflationAdjust: (v: boolean) => void;
  customRate: number | null;
  setCustomRate: (v: number | null) => void;
  customRateInput: string;
  setCustomRateInput: (v: string) => void;
  showMonteCarlo: boolean;
  setShowMonteCarlo: (v: boolean) => void;
  // Action item seen-state (shared across AppNav + Actions page)
  seenActionTitles: Set<string>;
  dismissActionItem: (title: string) => void;
  restoreActionItem: (title: string) => void;
  dismissAllActions: (titles: string[]) => void;
  // Settings
  avKey: string;
  settingsVersion: number;
  bumpSettingsVersion: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [risk, setRisk] = useState<PortfolioRisk | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]);
  const [monthly, setMonthly] = useState(200);
  const [years, setYears] = useState(10);
  const [inflationAdjust, setInflationAdjust] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [simpleMode, setSimpleModeState] = useState(true); // default ON for beginners

  const setSimpleMode = (v: boolean) => {
    setSimpleModeState(v);
    if (typeof window !== "undefined") localStorage.setItem("compoundiq_simple_mode", String(v));
  };

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("compoundiq_simple_mode") : null;
    if (stored !== null) setSimpleModeState(stored === "true");
  }, []);
  const [behaviourProfile, setBehaviourProfile] = useState<InvestorProfile | null>(null);
  const [sectorAllocations, setSectorAllocations] = useState<SectorAllocation[]>([]);
  const [dividendSummary, setDividendSummary] = useState<DividendSummary | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [realizedPnL, setRealizedPnL] = useState<RealizedPnLSummary | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [customRateInput, setCustomRateInput] = useState("");
  const [avKey, setAvKey] = useState("");
  const [seenActionTitles, setSeenActionTitles] = useState<Set<string>>(new Set());

  // Load seen action titles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("compoundiq_seen_actions");
      if (stored) setSeenActionTitles(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
  }, []);

  function dismissActionItem(title: string) {
    setSeenActionTitles((prev) => {
      const next = new Set([...prev, title]);
      try { localStorage.setItem("compoundiq_seen_actions", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function restoreActionItem(title: string) {
    setSeenActionTitles((prev) => {
      const next = new Set([...prev]);
      next.delete(title);
      try { localStorage.setItem("compoundiq_seen_actions", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function dismissAllActions(titles: string[]) {
    setSeenActionTitles((prev) => {
      const next = new Set([...prev, ...titles]);
      try { localStorage.setItem("compoundiq_seen_actions", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  // ── Portfolio (live prices — always fresh) ──────────────────────────────
  useEffect(() => {
    // Skip portfolio fetch on the connect page to avoid a redirect loop
    if (typeof window !== "undefined" && window.location.pathname === "/connect") {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch("/api/portfolio", { signal: controller.signal })
      .then((r) => {
        // Session expired or missing — send back to connect page
        if (r.status === 401) {
          window.location.href = "/connect";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) { setError(data.error); return; }
        setPortfolio(data);
        setRisk(analyzePortfolioRisk(data.positions, data.totalValue));
        setSectorAllocations(analyzeSectors(data.positions, data.totalValue));
      })
      .catch((e) => { if (e?.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // ── Orders → behaviour + realised P&L + benchmark (non-blocking) ────────
  useEffect(() => {
    if (!portfolio) return;
    const controller = new AbortController();
    fetch("/api/orders", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: OrdersPage & { error?: string }) => {
        if (data.error || !Array.isArray(data.items)) return;
        setBehaviourProfile(analyzeInvestorBehaviour(data.items, portfolio.positions));
        setRealizedPnL(analyzeRealizedPnL(data.items));
        const investedValue = portfolio.totalValue - portfolio.cash.free;
        setBenchmarkResult(analyzeBenchmark(data.items, portfolio.positions, investedValue));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [portfolio]);

  // ── Dividends (non-blocking) ─────────────────────────────────────────────
  useEffect(() => {
    if (!portfolio) return;
    const controller = new AbortController();
    fetch("/api/dividends", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: DividendsPage) => {
        setDividendSummary(analyzeDividends(data.items, portfolio.totalValue));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [portfolio]);

  // ── Alpha Vantage key from localStorage ──────────────────────────────────
  useEffect(() => {
    setAvKey(getStoredKey(STORAGE_KEYS.ALPHA_VANTAGE));
  }, [settingsVersion]);

  // ── Projection ───────────────────────────────────────────────────────────
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

  // ── Monte Carlo (only when toggled on — avoids 1000 sims on every change) ──
  useEffect(() => {
    if (!portfolio) return;
    if (!showMonteCarlo) { setMonteCarloResult(null); return; }
    setMonteCarloResult(runMonteCarlo(portfolio.totalValue, monthly, years));
  }, [portfolio, monthly, years, showMonteCarlo]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolio, risk, sectorAllocations, dividendSummary,
        behaviourProfile, realizedPnL, benchmarkResult,
        projectionData, monteCarloResult,
        loading, error,
        hideValues, setHideValues,
        simpleMode, setSimpleMode,
        monthly, setMonthly,
        years, setYears,
        inflationAdjust, setInflationAdjust,
        customRate, setCustomRate,
        customRateInput, setCustomRateInput,
        showMonteCarlo, setShowMonteCarlo,
        seenActionTitles, dismissActionItem, restoreActionItem, dismissAllActions,
        avKey,
        settingsVersion,
        bumpSettingsVersion: () => setSettingsVersion((v) => v + 1),
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
