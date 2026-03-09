import type { Order } from "@/types/trading212";
import { cleanTicker, getCompanyName } from "@/lib/tickerNames";

export interface RealizedByTicker {
  ticker: string;
  companyName: string | null;
  gain: number;       // total realized P&L
  proceeds: number;   // total sale value
  trades: number;     // number of sell executions
}

export interface RealizedPnLSummary {
  totalGain: number;
  totalProceeds: number;
  trades: number;
  byTicker: RealizedByTicker[];
  hasData: boolean;
}

export function analyzeRealizedPnL(orders: Order[]): RealizedPnLSummary {
  // Only FILLED SELL orders — T212 provides fillResult which is the P&L for that fill
  const sells = orders.filter(
    (o) =>
      o.status === "FILLED" &&
      (o.type.includes("SELL") || o.type.includes("LIMIT_SELL") || o.type.includes("MARKET_SELL")) &&
      o.filledValue != null
  );

  const tickerMap = new Map<string, { gain: number; proceeds: number; trades: number }>();

  let totalGain = 0;
  let totalProceeds = 0;

  for (const order of sells) {
    const proceeds = order.filledValue ?? 0;
    const gain = order.fillResult ?? 0;

    totalGain += gain;
    totalProceeds += proceeds;

    const existing = tickerMap.get(order.ticker);
    if (existing) {
      existing.gain += gain;
      existing.proceeds += proceeds;
      existing.trades += 1;
    } else {
      tickerMap.set(order.ticker, { gain, proceeds, trades: 1 });
    }
  }

  const byTicker: RealizedByTicker[] = Array.from(tickerMap.entries())
    .map(([rawTicker, data]) => ({
      ticker: cleanTicker(rawTicker),
      companyName: getCompanyName(rawTicker),
      gain: Math.round(data.gain * 100) / 100,
      proceeds: Math.round(data.proceeds * 100) / 100,
      trades: data.trades,
    }))
    .sort((a, b) => b.gain - a.gain);

  return {
    totalGain: Math.round(totalGain * 100) / 100,
    totalProceeds: Math.round(totalProceeds * 100) / 100,
    trades: sells.length,
    byTicker,
    hasData: sells.length > 0,
  };
}
