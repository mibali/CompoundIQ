import type { Position } from "@/types/trading212";
import { cleanTicker, getCompanyName } from "@/lib/tickerNames";
import { getSector } from "@/lib/sectors";

export type RiskLevel = "Low" | "Medium" | "High";
export type DividendLevel = "Low" | "Medium" | "High";

export interface PositionRisk {
  ticker: string;
  value: number;
  weight: number;
  pnl: number;
  pnlPercent: number;
  riskLevel: RiskLevel;
  sector: string;
  riskScore: number;       // 1–10
  drawdownFromEntry: number; // ≤0: current loss% from avg entry
}

export interface PortfolioRisk {
  concentrationScore: number; // 0–100, higher = more concentrated
  topHolding: { ticker: string; weight: number } | null;
  overweightWarnings: string[];
  positions: PositionRisk[];
  // New metrics
  portfolioBeta: number;
  portfolioVolatility: number; // std dev of position P&L%
  sharpeRatio: number | null;  // null if < 1 year data
  maxPositionDrawdown: number; // worst drawdownFromEntry across all positions (≤0)
  portfolioDrawdown: number;   // total P&L / total invested (≤0 if losing)
}

// Approximate betas by sector (market beta = 1.0)
const SECTOR_BETAS: Record<string, number> = {
  "Technology": 1.25,
  "Financials": 1.15,
  "Healthcare": 0.75,
  "Consumer": 0.90,
  "Energy": 0.85,
  "Industrials & Defense": 1.05,
  "Real Estate": 0.80,
  "Index Funds & ETFs": 1.00,
  "Commodities": 0.70,
  "Other": 1.00,
};

const RISK_FREE_RATE = 0.045; // ~4.5% (UK base rate approx)

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function classifyRisk(pnlPercent: number): RiskLevel {
  const abs = Math.abs(pnlPercent);
  if (abs < 15) return "Low";
  if (abs < 35) return "Medium";
  return "High";
}

export function analyzePortfolioRisk(
  positions: Position[],
  totalValue: number
): PortfolioRisk {
  const warnings: string[] = [];

  const positionsWithRisk: PositionRisk[] = positions.map((p) => {
    const value = p.quantity * p.currentPrice;
    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const pnl = p.ppl;
    const cost = p.quantity * p.averagePrice;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

    const sector = getSector(p.ticker);
    const drawdownFromEntry = Math.min(0, pnlPercent);
    const riskScore = Math.min(10, Math.max(1, Math.round(Math.abs(pnlPercent) / 5) + 1));

    return {
      ticker: p.ticker,
      value,
      weight,
      pnl,
      pnlPercent,
      riskLevel: classifyRisk(pnlPercent),
      sector,
      riskScore,
      drawdownFromEntry,
    };
  });

  // Concentration score: Herfindahl index (0–100)
  const hhi = positionsWithRisk.reduce((sum, p) => sum + Math.pow(p.weight / 100, 2), 0);
  const concentrationScore = Math.round(hhi * 100);

  // Top holding
  const sorted = [...positionsWithRisk].sort((a, b) => b.weight - a.weight);
  const topHolding = sorted[0] ? { ticker: sorted[0].ticker, weight: sorted[0].weight } : null;

  // Warnings
  positionsWithRisk.forEach((p) => {
    if (p.weight > 20) {
      const name = getCompanyName(p.ticker) ?? cleanTicker(p.ticker);
      warnings.push(`${name} makes up ${p.weight.toFixed(1)}% of your portfolio. Most advisors suggest keeping any single holding below 20% to reduce risk.`);
    }
  });

  if (concentrationScore > 30) {
    warnings.push("Your portfolio is more concentrated than ideal. Adding more diverse holdings (e.g. an index fund) would spread your risk.");
  }

  // Portfolio Beta — weighted average of sector betas
  const portfolioBeta =
    totalValue > 0
      ? positionsWithRisk.reduce((sum, p) => {
          const beta = SECTOR_BETAS[p.sector] ?? 1.0; // p.sector already computed above
          return sum + (p.weight / 100) * beta;
        }, 0)
      : 1.0;

  // Portfolio Volatility — std dev of individual position P&L percentages
  // (proxy for cross-sectional return dispersion)
  const pnlPercents = positionsWithRisk.map((p) => p.pnlPercent);
  const portfolioVolatility = stdDev(pnlPercents);

  // Sharpe Ratio — (portfolio weighted return - risk free) / volatility
  // Only meaningful with reasonable number of positions
  const weightedReturn =
    positionsWithRisk.reduce((sum, p) => sum + (p.weight / 100) * p.pnlPercent, 0) / 100; // as decimal
  const sharpeRatio =
    positionsWithRisk.length >= 3 && portfolioVolatility > 0
      ? Math.round(((weightedReturn - RISK_FREE_RATE) / (portfolioVolatility / 100)) * 100) / 100
      : null;

  // Max position drawdown (worst single position loss from entry)
  const maxPositionDrawdown =
    positionsWithRisk.length > 0
      ? Math.min(0, ...positionsWithRisk.map((p) => p.drawdownFromEntry))
      : 0;

  // Portfolio drawdown: total P&L vs total invested
  const totalInvested = positions.reduce((sum, p) => sum + p.quantity * p.averagePrice, 0);
  const totalPnL = positions.reduce((sum, p) => sum + p.ppl, 0);
  const portfolioDrawdown = totalInvested > 0 ? totalPnL / totalInvested : 0;

  return {
    concentrationScore,
    topHolding,
    overweightWarnings: warnings,
    positions: positionsWithRisk,
    portfolioBeta: Math.round(portfolioBeta * 100) / 100,
    portfolioVolatility: Math.round(portfolioVolatility * 100) / 100,
    sharpeRatio,
    maxPositionDrawdown: Math.round(maxPositionDrawdown * 100) / 100,
    portfolioDrawdown: Math.round(portfolioDrawdown * 10000) / 10000,
  };
}
