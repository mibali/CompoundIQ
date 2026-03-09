"use client";

import { formatCurrency } from "@/lib/projection";

interface RegretMinimizerProps {
  currentValue: number;
  totalInvested: number;
  monthlyContribution: number;
  firstTradeDate: string | null; // ISO date
  currency: string;
}

const MODERATE_RATE = 0.08;

function projectEarlier(currentValue: number, monthly: number, extraYears: number): number {
  // How much more would we have today if we'd been investing for extraYears longer?
  // = same monthly contributions for extraYears, compounded forward to now
  const r = MODERATE_RATE / 12;
  const n = extraYears * 12;
  const fvContribs = r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n;
  return Math.round(fvContribs);
}

export default function RegretMinimizer({
  currentValue,
  totalInvested,
  monthlyContribution,
  firstTradeDate,
  currency,
}: RegretMinimizerProps) {
  const startYear = firstTradeDate
    ? new Date(firstTradeDate).getFullYear()
    : new Date().getFullYear();

  const scenarios = [1, 2, 3, 5].map((extraYears) => {
    const extra = projectEarlier(currentValue, monthlyContribution, extraYears);
    const hypotheticalTotal = currentValue + extra;
    const year = startYear - extraYears;
    return { extraYears, extra, hypotheticalTotal, year };
  });

  const startedStr = firstTradeDate
    ? new Date(firstTradeDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "your first trade";

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
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
          Time Machine
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          What if you had started earlier than {startedStr}?
        </p>
      </div>

      {/* Current baseline */}
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <div>
          <p className="text-xs text-slate-400">You started in {startedStr}</p>
          <p className="text-xs text-slate-500 mt-0.5">Current portfolio value</p>
        </div>
        <p className="text-base font-bold text-white">
          {formatCurrency(currentValue, currency)}
        </p>
      </div>

      {/* Scenarios */}
      <div className="flex flex-col gap-2">
        {scenarios.map(({ extraYears, extra, hypotheticalTotal, year }) => (
          <div
            key={extraYears}
            className="rounded-xl p-3 flex items-center justify-between gap-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-300">
                Started in {year}
                <span className="text-slate-500 font-normal ml-1">
                  ({extraYears} {extraYears === 1 ? "year" : "years"} earlier)
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {extraYears * 12} more months of {formatCurrency(monthlyContribution, currency)}/mo compounding
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-emerald-400">
                {formatCurrency(hypotheticalTotal, currency)}
              </p>
              <p className="text-xs text-emerald-600">
                +{formatCurrency(extra, currency)} more
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational callout */}
      <div
        className="rounded-xl p-3"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
      >
        <p className="text-xs font-semibold text-emerald-400 mb-1">
          The best time to invest was yesterday. The second best is today.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Starting {formatCurrency(monthlyContribution, currency)}/mo today instead of next year
          means an extra {formatCurrency(projectEarlier(currentValue, monthlyContribution, 1), currency)} by
          the time you get to the same point. Time is your most powerful asset.
        </p>
      </div>

      <p className="text-xs text-slate-600">
        Assumes {MODERATE_RATE * 100}% annual return (moderate). Not financial advice.
      </p>
    </div>
  );
}
