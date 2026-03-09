import { NextResponse } from "next/server";

// Alpha Vantage sector performance endpoint
// Returns daily % change for each GICS sector ETF
// Free tier: 25 requests/day, no intraday needed — just daily snapshot

const AV_BASE = "https://www.alphavantage.co/query";

export interface SectorPerformance {
  sector: string;
  changePercent: number; // e.g. 2.34 means +2.34%
}

// Alpha Vantage sector names → our internal sector labels
const AV_TO_INTERNAL: Record<string, string> = {
  "Information Technology": "Technology",
  "Financials": "Financials",
  "Health Care": "Healthcare",
  "Consumer Discretionary": "Consumer",
  "Consumer Staples": "Consumer",
  "Energy": "Energy",
  "Industrials": "Industrials & Defense",
  "Real Estate": "Real Estate",
  "Materials": "Commodities",
  "Communication Services": "Technology",
  "Utilities": "Other",
};

// Fallback data when no API key — shows neutral/illustrative values
const FALLBACK_DATA: SectorPerformance[] = [
  { sector: "Technology", changePercent: 0 },
  { sector: "Financials", changePercent: 0 },
  { sector: "Healthcare", changePercent: 0 },
  { sector: "Energy", changePercent: 0 },
  { sector: "Consumer", changePercent: 0 },
  { sector: "Industrials & Defense", changePercent: 0 },
  { sector: "Real Estate", changePercent: 0 },
];

export async function GET(request: Request) {
  // Header key (from user settings) takes priority over env var
  const avKey = request.headers.get("X-Alpha-Vantage-Key") || process.env.ALPHA_VANTAGE_KEY;

  if (!avKey) {
    return NextResponse.json({
      sectors: FALLBACK_DATA,
      source: "none",
      message: "Add your Alpha Vantage key in Settings to enable live sector data",
    });
  }

  try {
    const url = `${AV_BASE}?function=SECTOR&apikey=${avKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Alpha Vantage returned ${res.status}`);

    const data = await res.json();

    // If rate-limited, throw so we return fallback gracefully
    if (data["Note"] || data["Information"]) throw new Error("Rate limited");

    // Use "Rank A: Real-Time Performance" or fallback to "Rank B: 1 Day Performance"
    const raw: Record<string, string> =
      data["Rank A: Real-Time Performance"] ??
      data["Rank B: 1 Day Performance"] ??
      {};

    const sectors: SectorPerformance[] = Object.entries(raw)
      .map(([avSector, pctStr]) => {
        const internal = AV_TO_INTERNAL[avSector];
        if (!internal) return null;
        const changePercent = parseFloat(pctStr.replace("%", ""));
        return { sector: internal, changePercent };
      })
      .filter(Boolean) as SectorPerformance[];

    // Merge duplicate sectors (e.g. Consumer Discretionary + Consumer Staples → Consumer)
    const mergedSum = new Map<string, number>();
    const mergedCount = new Map<string, number>();
    for (const s of sectors) {
      mergedSum.set(s.sector, (mergedSum.get(s.sector) ?? 0) + s.changePercent);
      mergedCount.set(s.sector, (mergedCount.get(s.sector) ?? 0) + 1);
    }
    const result: SectorPerformance[] = Array.from(mergedSum.entries()).map(
      ([sector, sum]) => ({
        sector,
        changePercent: Math.round((sum / (mergedCount.get(sector) ?? 1)) * 100) / 100,
      })
    );

    return NextResponse.json({ sectors: result, source: "alphavantage" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { sectors: FALLBACK_DATA, source: "error", message },
      { status: 200 } // 200 so client renders fallback gracefully
    );
  }
}
