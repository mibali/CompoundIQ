"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredKey, getAIProvider, STORAGE_KEYS, AI_PROVIDERS } from "@/lib/apikeys";
import type { PortfolioSummary } from "@/types/trading212";
import type { PortfolioRisk } from "@/lib/risk";
import type { SectorAllocation } from "@/lib/sectors";
import type { DividendSummary } from "@/lib/dividends";
import { getCompanyName, cleanTicker } from "@/lib/tickerNames";

interface AIDigestProps {
  portfolio: PortfolioSummary;
  risk: PortfolioRisk;
  sectorAllocations: SectorAllocation[];
  dividendSummary: DividendSummary | null;
  monthlyContribution: number;
  onOpenSettings?: () => void;
  settingsVersion?: number;
}

const CACHE_PREFIX = "compoundiq_digest_";
const todayKey = () => `${CACHE_PREFIX}${new Date().toISOString().slice(0, 10)}`;

export default function AIDigest({
  portfolio,
  risk,
  sectorAllocations,
  dividendSummary,
  monthlyContribution,
  onOpenSettings,
  settingsVersion,
}: AIDigestProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [providerLabel, setProviderLabel] = useState("");

  // Re-check key/provider whenever settings panel closes (settingsVersion bumps)
  useEffect(() => {
    const aiKey = getStoredKey(STORAGE_KEYS.AI_KEY);
    const prov = getAIProvider();
    setHasKey(!!aiKey);
    setProviderLabel(AI_PROVIDERS.find((p) => p.id === prov)?.label ?? prov);
  }, [settingsVersion]);

  // Load cached digest once on mount
  useEffect(() => {
    const cached = localStorage.getItem(todayKey());
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDigest(parsed.digest);
        setProvider(parsed.provider ?? "");
      } catch {
        // ignore corrupt cache
      }
    }
  }, []);

  const generate = useCallback(async () => {
    const aiKey = getStoredKey(STORAGE_KEYS.AI_KEY);
    const prov = getAIProvider();
    if (!aiKey) return;

    setLoading(true);
    setError(null);

    const topHoldings = [...risk.positions]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((p) => ({
        ticker: cleanTicker(p.ticker),
        companyName: getCompanyName(p.ticker),
        weight: p.weight,
        pnlPercent: p.pnlPercent,
      }));

    const controller = new AbortController();
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-AI-Key": aiKey,
          "X-AI-Provider": prov,
        },
        body: JSON.stringify({
          totalValue: portfolio.totalValue,
          totalInvested: portfolio.totalInvested,
          totalPnL: portfolio.totalPnL,
          totalPnLPercent: portfolio.totalPnLPercent,
          monthlyContribution,
          currency: portfolio.currencyCode ?? "GBP",
          topHoldings,
          sectorAllocation: sectorAllocations,
          beta: risk.portfolioBeta,
          sharpeRatio: risk.sharpeRatio,
          dividendYield: dividendSummary?.projectedAnnualYield ?? 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to generate digest");
        return;
      }

      setDigest(data.digest);
      setProvider(data.provider ?? prov);

      // Cache for today, remove old entries
      localStorage.setItem(todayKey(), JSON.stringify({ digest: data.digest, provider: data.provider }));
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX) && k !== todayKey()) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [portfolio, risk, sectorAllocations, dividendSummary, monthlyContribution]);

  const providerInfo = AI_PROVIDERS.find((p) => p.id === provider);

  // ── No key configured ──────────────────────────────────────────────────
  if (!hasKey) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            <span style={{ fontSize: "18px" }}>✦</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AI Insight</p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5">Weekly Digest</p>
          </div>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px dashed rgba(99,102,241,0.2)" }}
        >
          <p className="text-sm text-slate-300 leading-relaxed">
            Get a plain-English AI summary of your portfolio — what moved, what it means, and what to keep in mind.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Supports Anthropic, OpenAI, Google Gemini, and Groq. Your key is stored locally and never leaves your device.
          </p>
          <button
            onClick={onOpenSettings}
            className="text-xs text-indigo-400 font-semibold mt-1 text-left hover:text-indigo-300 transition-colors"
          >
            → Open Settings to add your AI API key
          </button>
        </div>
        <p className="text-xs text-slate-600">Not financial advice. Cached daily.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            <span style={{ fontSize: "18px" }}>✦</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AI Insight</p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5">Weekly Digest</p>
          </div>
        </div>
        {digest && !loading && (
          <button
            onClick={generate}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold flex-shrink-0 transition-colors"
            style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* States */}
      {loading ? (
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-slate-400 animate-pulse">{providerLabel} is analysing your portfolio…</p>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            {[100, 88, 95, 72].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full animate-pulse" style={{ width: `${w}%`, background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}
        >
          <p className="text-xs font-semibold text-rose-400">Generation failed</p>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={generate}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold self-start mt-1"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            Try again
          </button>
        </div>
      ) : digest ? (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm text-slate-300 leading-relaxed">{digest}</p>
        </div>
      ) : (
        <div
          className="rounded-xl p-5 flex flex-col items-center gap-4 text-center"
          style={{ background: "rgba(99,102,241,0.04)", border: "1px dashed rgba(99,102,241,0.15)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
            <span style={{ fontSize: "22px" }}>✦</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Ready to generate your digest</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
              Using {providerLabel}. Your portfolio data is sent to the AI to generate a personalised weekly insight.
            </p>
          </div>
          <button
            onClick={generate}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Generate Digest
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">Not financial advice. Cached daily.</p>
        {providerInfo && <p className="text-xs text-slate-600 font-mono">{providerInfo.model}</p>}
      </div>
    </div>
  );
}
