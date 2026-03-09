import type { Dividend } from "@/types/trading212";
import { cleanTicker, getCompanyName } from "@/lib/tickerNames";

export interface MonthlyIncome {
  label: string;   // "Jan", "Feb", etc.
  fullLabel: string; // "Jan 2025"
  amount: number;
}

export interface DividendByTicker {
  ticker: string;
  companyName: string | null;
  total: number;
  payments: number;
  projectedAnnual: number; // annualised from payment frequency
}

export interface DividendSummary {
  totalReceived: number;
  ttmIncome: number;          // trailing 12-month income
  projectedAnnualYield: number; // ttmIncome / totalPortfolioValue * 100
  byMonth: MonthlyIncome[];   // last 12 months
  byTicker: DividendByTicker[];
  lastPaymentDate: string | null;
  payingTickers: number;
}

export function analyzeDividends(
  dividends: Dividend[],
  totalPortfolioValue: number
): DividendSummary {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // --- By month (last 12 months) ---
  const monthlyMap = new Map<string, number>();

  // Seed all 12 months with 0 so gaps show as empty bars
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  let ttmIncome = 0;
  let totalReceived = 0;
  let lastPaymentDate: string | null = null;

  for (const div of dividends) {
    const paid = new Date(div.paidOn);
    totalReceived += div.amount;

    // Track latest payment
    if (!lastPaymentDate || paid > new Date(lastPaymentDate)) {
      lastPaymentDate = div.paidOn;
    }

    // Only count TTM for yield and monthly chart
    if (paid > oneYearAgo) {
      ttmIncome += div.amount;
      const key = `${paid.getFullYear()}-${String(paid.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + div.amount);
      }
    }
  }

  const byMonth: MonthlyIncome[] = Array.from(monthlyMap.entries()).map(
    ([key, amount]) => {
      const [year, month] = key.split("-");
      const d = new Date(Number(year), Number(month) - 1, 1);
      return {
        label: d.toLocaleString("en-GB", { month: "short" }),
        fullLabel: d.toLocaleString("en-GB", { month: "short", year: "numeric" }),
        amount: Math.round(amount * 100) / 100,
      };
    }
  );

  // --- By ticker ---
  const tickerMap = new Map<
    string,
    { total: number; payments: number; months: Set<string> }
  >();

  for (const div of dividends) {
    const key = div.ticker;
    const paid = new Date(div.paidOn);
    const monthKey = `${paid.getFullYear()}-${String(paid.getMonth() + 1).padStart(2, "0")}`;

    const existing = tickerMap.get(key);
    if (existing) {
      existing.total += div.amount;
      existing.payments += 1;
      existing.months.add(monthKey);
    } else {
      tickerMap.set(key, { total: div.amount, payments: 1, months: new Set([monthKey]) });
    }
  }

  const byTicker: DividendByTicker[] = Array.from(tickerMap.entries())
    .map(([rawTicker, data]) => {
      // Estimate payments per year from unique months observed
      const paymentsPerYear = Math.min(12, Math.max(1, data.months.size));
      const avgPayment = data.total / data.payments;
      return {
        ticker: cleanTicker(rawTicker),
        companyName: getCompanyName(rawTicker),
        total: Math.round(data.total * 100) / 100,
        payments: data.payments,
        projectedAnnual: Math.round(avgPayment * paymentsPerYear * 100) / 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  const projectedAnnualYield =
    totalPortfolioValue > 0 ? (ttmIncome / totalPortfolioValue) * 100 : 0;

  return {
    totalReceived: Math.round(totalReceived * 100) / 100,
    ttmIncome: Math.round(ttmIncome * 100) / 100,
    projectedAnnualYield: Math.round(projectedAnnualYield * 100) / 100,
    byMonth,
    byTicker,
    lastPaymentDate,
    payingTickers: byTicker.length,
  };
}
