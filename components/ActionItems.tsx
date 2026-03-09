"use client";

import Link from "next/link";
import type { PortfolioSummary } from "@/types/trading212";
import type { PortfolioRisk } from "@/lib/risk";
import type { DividendSummary } from "@/lib/dividends";
import type { SectorAllocation } from "@/lib/sectors";

export interface ActionItem {
  type: "warning" | "tip" | "good";
  title: string;
  body: string;
  action?: { label: string; href: string };
}

export function buildItems(
  portfolio: PortfolioSummary,
  risk: PortfolioRisk,
  dividendSummary: DividendSummary | null,
  sectorAllocations: SectorAllocation[],
  monthly: number,
): ActionItem[] {
  const items: ActionItem[] = [];
  const currency = portfolio.currencyCode ?? "GBP";
  const sym = currency === "GBP" ? "£" : "$";

  // ── Warnings (highest priority) ─────────────────────────────────────────

  // Too concentrated
  if (risk.concentrationScore > 50) {
    items.push({
      type: "warning",
      title: "Your portfolio is highly concentrated",
      body: `Your concentration score is ${risk.concentrationScore}/100. A few holdings dominate your portfolio — if one drops sharply, it will noticeably hurt your overall returns. Spread across more sectors or companies to reduce this risk.`,
      action: { label: "View holdings →", href: "/portfolio" },
    });
  } else if (risk.concentrationScore > 30) {
    items.push({
      type: "tip",
      title: "Portfolio slightly concentrated",
      body: `Your concentration score is ${risk.concentrationScore}/100 (aim for under 30). Consider adding a few more holdings in different sectors to spread your risk further.`,
      action: { label: "View holdings →", href: "/portfolio" },
    });
  }

  // Single stock overweight
  if (risk.topHolding && risk.topHolding.weight > 25) {
    const ticker = risk.topHolding.ticker.replace(/_US_EQ$|_UK_EQ$|_EQ$/, "");
    items.push({
      type: "warning",
      title: `${ticker} is ${risk.topHolding.weight.toFixed(0)}% of your portfolio`,
      body: `Having more than 25% in a single stock is risky. If ${ticker} has a bad quarter, your whole portfolio feels it. Consider trimming or balancing with other holdings.`,
      action: { label: "See full risk →", href: "/portfolio" },
    });
  }

  // High beta — risky portfolio
  if (risk.portfolioBeta > 1.4) {
    items.push({
      type: "warning",
      title: "Your portfolio is high risk",
      body: `Your portfolio moves about ${risk.portfolioBeta.toFixed(1)}× as much as the market. In a 10% market dip, you could see roughly a ${(risk.portfolioBeta * 10).toFixed(0)}% drop. Consider adding lower-volatility holdings like dividend stocks or broad ETFs.`,
      action: { label: "Risk details →", href: "/portfolio" },
    });
  }

  // Too few holdings
  if (portfolio.positions.length < 5 && portfolio.positions.length > 0) {
    items.push({
      type: "warning",
      title: `Only ${portfolio.positions.length} holding${portfolio.positions.length === 1 ? "" : "s"} — very undiversified`,
      body: `With fewer than 5 holdings, a single bad investment can seriously damage your portfolio. Most advisors suggest at least 10–15 positions across different sectors. Even adding 2–3 more stocks would meaningfully reduce your risk.`,
      action: { label: "Explore dividend stocks →", href: "/portfolio#dividend-discovery" },
    });
  }

  // ── Tips (actionable improvements) ──────────────────────────────────────

  // Low dividend income — opportunity
  const annualDividend = dividendSummary?.ttmIncome ?? 0;
  if (annualDividend < 50 && portfolio.totalValue > 500) {
    const potentialYield = 0.04; // 4% conservative estimate
    const potentialIncome = Math.round(portfolio.totalValue * potentialYield);
    items.push({
      type: "tip",
      title: "You could be earning more passive income",
      body: `You've received ${sym}${annualDividend.toFixed(0)} in dividends so far. If just 25% of your portfolio held 4% dividend stocks, you'd earn roughly ${sym}${Math.round(potentialIncome * 0.25)}/year in passive income — paid directly to your account.`,
      action: { label: "Explore dividend stocks →", href: "/portfolio#dividend-discovery" },
    });
  }

  // Large free cash sitting idle
  const cashRatio = portfolio.cash.free / portfolio.totalValue;
  if (cashRatio > 0.15 && portfolio.cash.free > 200) {
    items.push({
      type: "tip",
      title: `${sym}${portfolio.cash.free.toFixed(0)} in cash is sitting idle`,
      body: `Your free cash makes up ${(cashRatio * 100).toFixed(0)}% of your total account. Cash doesn't compound — even putting it into a broad ETF or a dividend stock means it starts growing for you.`,
      action: { label: "View plan →", href: "/plan" },
    });
  }

  // No goals set
  const hasGoals = typeof window !== "undefined"
    && JSON.parse(localStorage.getItem("compoundiq_goals") ?? "[]").length > 0;
  if (!hasGoals) {
    items.push({
      type: "tip",
      title: "Set a goal to stay motivated",
      body: `Investors with a specific target (house deposit, retirement, car) are far more likely to stick to their plan during market dips. It takes 30 seconds to set one.`,
      action: { label: "Set a goal →", href: "/plan" },
    });
  }

  // Low monthly contribution relative to portfolio size
  if (monthly < 50 && portfolio.totalValue < 10000) {
    items.push({
      type: "tip",
      title: "Consistency is more powerful than timing",
      body: `Even ${sym}50/month invested consistently over 10 years at 8% grows to roughly ${sym}9,000 in contributions — but compounds to over ${sym}${(50 * 12 * ((Math.pow(1.08, 10) - 1) / 0.08) + portfolio.totalValue * Math.pow(1.08, 10)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}. Small regular amounts add up.`,
      action: { label: "Run projection →", href: "/plan" },
    });
  }

  // Portfolio in loss — reassurance
  if (risk.portfolioDrawdown < -0.1) {
    items.push({
      type: "tip",
      title: "Down on paper — but paper losses aren't real yet",
      body: `Your portfolio is ${(Math.abs(risk.portfolioDrawdown) * 100).toFixed(1)}% below your invested total right now. This is unrealised — it only becomes a real loss if you sell. Historically, patient investors who hold through dips recover and grow. Stay the course.`,
    });
  }

  // ── Positive reinforcements ───────────────────────────────────────────────

  // Great diversification
  if (risk.concentrationScore <= 20) {
    items.push({
      type: "good",
      title: "Excellent diversification",
      body: `Your concentration score is ${risk.concentrationScore}/100 — well under the target of 30. Your money is spread across ${risk.positions.length} holdings, so no single stock can make or break your portfolio.`,
    });
  }

  // Positive return
  const returnPct = portfolio.totalInvested > 0
    ? ((portfolio.totalValue - portfolio.totalInvested) / portfolio.totalInvested) * 100 : 0;
  if (returnPct > 10) {
    items.push({
      type: "good",
      title: `Up ${returnPct.toFixed(1)}% overall — compounding is working`,
      body: `Your portfolio has grown ${returnPct.toFixed(1)}% above what you invested. Keep adding monthly and let compound growth do its job — the longer you stay invested, the faster it accelerates.`,
    });
  }

  // Good dividend income
  if (annualDividend >= 100) {
    items.push({
      type: "good",
      title: `Earning ${sym}${annualDividend.toFixed(0)}/year in dividends`,
      body: `You're receiving real passive income from your investments. Reinvesting these dividends (rather than withdrawing) will compound your returns significantly over time.`,
    });
  }

  // Return top 5 items, warnings first
  const order = { warning: 0, tip: 1, good: 2 };
  return items
    .sort((a, b) => order[a.type] - order[b.type])
    .slice(0, 5);
}

const TYPE_STYLE = {
  warning: { color: "#fbbf24", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)", dot: "#f59e0b" },
  tip:     { color: "#60a5fa", bg: "rgba(99,162,241,0.07)", border: "rgba(99,162,241,0.18)", dot: "#3b82f6" },
  good:    { color: "#34d399", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.18)", dot: "#10b981" },
};

const TYPE_ICON = {
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  tip: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  good: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

export default function ActionItems({
  portfolio, risk, dividendSummary, sectorAllocations, monthly,
}: {
  portfolio: PortfolioSummary;
  risk: PortfolioRisk;
  dividendSummary: DividendSummary | null;
  sectorAllocations: SectorAllocation[];
  monthly: number;
}) {
  const items = buildItems(portfolio, risk, dividendSummary, sectorAllocations, monthly);
  if (items.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div>
        <h2 className="text-sm font-bold text-white">Your Action Items</h2>
        <p className="text-xs text-slate-500 mt-0.5">Personalised steps based on your portfolio right now</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const s = TYPE_STYLE[item.type];
          return (
            <div
              key={i}
              className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              {/* Icon */}
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${s.dot}22`, color: s.color }}
              >
                {TYPE_ICON[item.type]}
              </div>

              {/* Content */}
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
                    className="inline-block mt-1.5 text-xs font-semibold transition-colors"
                    style={{ color: s.color }}
                  >
                    {item.action.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
