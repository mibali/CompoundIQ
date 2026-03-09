import type { Order, Position } from "@/types/trading212";

// S&P 500 historical annualized return (1957–2024 nominal)
export const SP500_ANNUAL = 0.107;
// FTSE 100 historical annualized return (1984–2024 nominal)
export const FTSE100_ANNUAL = 0.075;

export interface BenchmarkPoint {
  label: string;       // "Jan 25", "Feb 25", etc.
  contributions: number;
  sp500: number;
  ftse100: number;
}

export interface BenchmarkResult {
  points: BenchmarkPoint[];
  currentValue: number;
  sp500FinalValue: number;
  ftse100FinalValue: number;
  portfolioCAGR: number;     // annualized from first trade to now
  sp500CAGR: number;
  firstTradeDate: string | null;
  yearsInvested: number;
  beatingMarket: boolean;    // vs S&P 500
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function compoundForward(amount: number, annualRate: number, months: number): number {
  return amount * Math.pow(1 + annualRate / 12, months);
}

export function analyzeBenchmark(
  orders: Order[],
  positions: Position[],
  currentPortfolioValue: number
): BenchmarkResult {
  const now = new Date();

  // --- Build monthly buy cash flows ---
  // Use filledValue first, fall back to fillCost or orderedValue for pie orders
  const getOrderValue = (o: Order): number =>
    o.filledValue ?? o.fillCost ?? o.orderedValue ?? 0;

  const filledBuys = orders.filter(
    (o) =>
      o.status === "FILLED" &&
      !o.type.toUpperCase().includes("SELL") &&
      getOrderValue(o) > 0
  );

  // Fallback: use positions' initialFillDate if no order history
  const firstOrderDate =
    filledBuys.length > 0
      ? new Date(
          filledBuys.reduce((earliest, o) => {
            const d = o.dateCreated ?? o.dateModified;
            return d < earliest ? d : earliest;
          }, filledBuys[0].dateCreated ?? filledBuys[0].dateModified)
        )
      : positions.length > 0
      ? new Date(
          positions.reduce((earliest, p) => {
            return p.initialFillDate < earliest ? p.initialFillDate : earliest;
          }, positions[0].initialFillDate)
        )
      : null;

  if (!firstOrderDate) {
    return {
      points: [],
      currentValue: currentPortfolioValue,
      sp500FinalValue: 0,
      ftse100FinalValue: 0,
      portfolioCAGR: 0,
      sp500CAGR: SP500_ANNUAL * 100,
      firstTradeDate: null,
      yearsInvested: 0,
      beatingMarket: false,
    };
  }

  // Build monthly cash flow map
  const monthlyFlows = new Map<string, number>(); // "YYYY-MM" → amount
  for (const order of filledBuys) {
    const d = new Date(order.dateCreated ?? order.dateModified);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyFlows.set(key, (monthlyFlows.get(key) ?? 0) + getOrderValue(order));
  }

  // Fallback for pie investors: no orders returned, but we know position cost bases
  if (filledBuys.length === 0 && positions.length > 0) {
    for (const p of positions) {
      if (!p.initialFillDate) continue;
      const d = new Date(p.initialFillDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cost = p.averagePrice * p.quantity;
      monthlyFlows.set(key, (monthlyFlows.get(key) ?? 0) + cost);
    }
  }

  // Seed all months from first trade to now with 0 where no buy
  const totalMonths = monthsBetween(firstOrderDate, now);
  for (let i = 0; i <= totalMonths; i++) {
    const d = new Date(firstOrderDate.getFullYear(), firstOrderDate.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyFlows.has(key)) monthlyFlows.set(key, 0);
  }

  // Build timeline points
  const sortedKeys = Array.from(monthlyFlows.keys()).sort();
  const points: BenchmarkPoint[] = [];
  let sp500Running = 0;
  let ftse100Running = 0;
  let contributionsRunning = 0;

  for (const key of sortedKeys) {
    const amount = monthlyFlows.get(key) ?? 0;
    const [year, month] = key.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const monthsRemaining = monthsBetween(monthDate, now);

    // Compound this month's contribution forward to today
    sp500Running += compoundForward(amount, SP500_ANNUAL, monthsRemaining);
    ftse100Running += compoundForward(amount, FTSE100_ANNUAL, monthsRemaining);
    contributionsRunning += amount;

    const label = monthDate.toLocaleString("en-GB", { month: "short", year: "2-digit" });
    points.push({
      label,
      contributions: Math.round(contributionsRunning),
      sp500: Math.round(sp500Running),
      ftse100: Math.round(ftse100Running),
    });
  }

  // Portfolio CAGR from first trade date
  const yearsInvested = totalMonths / 12;
  // Only compute CAGR if we have real contribution data — avoids Infinity/NaN
  const portfolioCAGR =
    yearsInvested > 0 && contributionsRunning > 0
      ? (Math.pow(currentPortfolioValue / contributionsRunning, 1 / yearsInvested) - 1) * 100
      : 0;

  return {
    points,
    currentValue: currentPortfolioValue,
    sp500FinalValue: Math.round(sp500Running),
    ftse100FinalValue: Math.round(ftse100Running),
    portfolioCAGR: Math.round(portfolioCAGR * 100) / 100,
    sp500CAGR: SP500_ANNUAL * 100,
    firstTradeDate: firstOrderDate.toISOString().slice(0, 10),
    yearsInvested: Math.round(yearsInvested * 10) / 10,
    beatingMarket: currentPortfolioValue >= sp500Running,
  };
}
