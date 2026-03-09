import type { Position } from "@/types/trading212";
import { cleanTicker } from "@/lib/tickerNames";

export type Sector =
  | "Technology"
  | "Financials"
  | "Healthcare"
  | "Consumer"
  | "Energy"
  | "Industrials & Defense"
  | "Real Estate"
  | "Index Funds & ETFs"
  | "Commodities"
  | "Other";

export const SECTOR_COLORS: Record<Sector, string> = {
  "Technology": "#6366f1",
  "Financials": "#0ea5e9",
  "Healthcare": "#10b981",
  "Consumer": "#f59e0b",
  "Energy": "#f97316",
  "Industrials & Defense": "#8b5cf6",
  "Real Estate": "#ec4899",
  "Index Funds & ETFs": "#94a3b8",
  "Commodities": "#d97706",
  "Other": "#475569",
};

const SECTOR_MAP: Record<string, Sector> = {
  // Technology
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", GOOG: "Technology",
  AMZN: "Technology", META: "Technology", FB: "Technology", NVDA: "Technology",
  TSLA: "Technology", AMD: "Technology", INTC: "Technology", AVGO: "Technology",
  QCOM: "Technology", TXN: "Technology", MU: "Technology", AMAT: "Technology",
  LRCX: "Technology", KLAC: "Technology", ASML: "Technology", NOW: "Technology",
  SNOW: "Technology", PLTR: "Technology", COIN: "Technology", UBER: "Technology",
  LYFT: "Technology", ABNB: "Technology", SHOP: "Technology", PYPL: "Technology",
  SQ: "Technology", ROKU: "Technology", ZM: "Technology", TWLO: "Technology",
  NET: "Technology", DDOG: "Technology", CRWD: "Technology", OKTA: "Technology",
  GTLB: "Technology", PATH: "Technology",

  // Financials
  JPM: "Financials", BAC: "Financials", WFC: "Financials", GS: "Financials",
  MS: "Financials", BLK: "Financials", V: "Financials", MA: "Financials",
  AXP: "Financials", BRK_B: "Financials", HSBA: "Financials", LLOY: "Financials",
  BARC: "Financials",

  // Healthcare
  JNJ: "Healthcare", PFE: "Healthcare", MRK: "Healthcare", ABBV: "Healthcare",
  LLY: "Healthcare", UNH: "Healthcare", CVS: "Healthcare", GILD: "Healthcare",
  AZN: "Healthcare", GSK: "Healthcare",

  // Consumer
  WMT: "Consumer", COST: "Consumer", TGT: "Consumer", NKE: "Consumer",
  SBUX: "Consumer", MCD: "Consumer", DIS: "Consumer", NFLX: "Consumer",
  BATS: "Consumer", ULVR: "Consumer",

  // Energy
  XOM: "Energy", CVX: "Energy", BP: "Energy", SHEL: "Energy", COP: "Energy",
  BP_L: "Energy",

  // Industrials & Defense
  LMT: "Industrials & Defense", RTX: "Industrials & Defense", BA: "Industrials & Defense",
  NOC: "Industrials & Defense", GD: "Industrials & Defense", HON: "Industrials & Defense",
  CAT: "Industrials & Defense", DE: "Industrials & Defense",

  // Real Estate
  O: "Real Estate", SPG: "Real Estate", VICI: "Real Estate", AMT: "Real Estate",
  RIO: "Real Estate",

  // Index Funds & ETFs
  SPY: "Index Funds & ETFs", QQQ: "Index Funds & ETFs", VTI: "Index Funds & ETFs",
  VOO: "Index Funds & ETFs", VUSA: "Index Funds & ETFs", VUSAI: "Index Funds & ETFs",
  VUAG: "Index Funds & ETFs", VWRL: "Index Funds & ETFs", VWRP: "Index Funds & ETFs",
  CSPX: "Index Funds & ETFs", IWDA: "Index Funds & ETFs", SWRD: "Index Funds & ETFs",
  EQQQ: "Index Funds & ETFs", ARKK: "Index Funds & ETFs", ARKG: "Index Funds & ETFs",

  // Commodities
  GLD: "Commodities", SLV: "Commodities",
};

export interface SectorAllocation {
  sector: Sector;
  weight: number;   // % of total portfolio
  value: number;
  tickers: string[];
  color: string;
}

export function getSector(rawTicker: string): Sector {
  const clean = rawTicker
    .replace(/_US_EQ$/, "")
    .replace(/_UK_EQ$/, "")
    .replace(/_EQ$/, "")
    .replace(/_DE_EQ$/, "")
    .replace(/_FR_EQ$/, "")
    .toUpperCase();
  return SECTOR_MAP[clean] ?? "Other";
}

export function analyzeSectors(
  positions: Position[],
  totalValue: number
): SectorAllocation[] {
  const sectorMap = new Map<Sector, { value: number; tickers: string[] }>();

  for (const pos of positions) {
    const sector = getSector(pos.ticker);
    const value = pos.quantity * pos.currentPrice;
    const ticker = cleanTicker(pos.ticker);

    const existing = sectorMap.get(sector);
    if (existing) {
      existing.value += value;
      existing.tickers.push(ticker);
    } else {
      sectorMap.set(sector, { value, tickers: [ticker] });
    }
  }

  const allocations: SectorAllocation[] = [];
  for (const [sector, data] of sectorMap.entries()) {
    allocations.push({
      sector,
      value: data.value,
      weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      tickers: data.tickers,
      color: SECTOR_COLORS[sector],
    });
  }

  return allocations.sort((a, b) => b.weight - a.weight);
}
