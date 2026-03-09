import { NextResponse } from "next/server";

const AV_BASE = "https://www.alphavantage.co/query";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const INDEX_NAMES: Record<string, string> = {
  SPY: "S&P 500",
  QQQ: "NASDAQ 100",
  EWU: "FTSE 100",
  VIXY: "VIX",
};

const SYMBOLS = ["SPY", "QQQ", "EWU", "VIXY"] as const;

const FALLBACK: IndexQuote[] = SYMBOLS.map((symbol) => ({
  symbol,
  name: INDEX_NAMES[symbol],
  price: 0,
  change: 0,
  changePercent: 0,
}));

// In-memory cache — persists across requests within the same server process
let cache: { indices: IndexQuote[]; fetchedAt: number; key: string } | null = null;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchQuote(symbol: string, apiKey: string): Promise<IndexQuote> {
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Alpha Vantage ${symbol}: ${res.status}`);
  const data = await res.json();
  // If AV returns a rate-limit Note instead of data, treat as a fetch failure
  if (data["Note"] || data["Information"]) throw new Error(`Rate limited: ${symbol}`);
  const q = data["Global Quote"] ?? {};
  const price = parseFloat(q["05. price"] ?? "0") || 0;
  if (!price) throw new Error(`No data for ${symbol}`);
  const change = parseFloat(q["09. change"] ?? "0") || 0;
  const changePercent = parseFloat((q["10. change percent"] ?? "0%").replace("%", "")) || 0;
  return { symbol, name: INDEX_NAMES[symbol] ?? symbol, price, change, changePercent };
}

export async function GET(request: Request) {
  const avKey = request.headers.get("X-Alpha-Vantage-Key") || process.env.ALPHA_VANTAGE_KEY;

  if (!avKey) {
    return NextResponse.json({
      indices: FALLBACK,
      source: "none",
      message: "Add your Alpha Vantage key in Settings to enable live market data",
    });
  }

  // Serve from cache if fresh and same key
  if (cache && cache.key === avKey && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ indices: cache.indices, source: "alphavantage", cached: true });
  }

  // Fetch sequentially with a small delay to avoid burst rate limiting
  const indices: IndexQuote[] = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    if (i > 0) await delay(2000);
    const symbol = SYMBOLS[i];
    try {
      indices.push(await fetchQuote(symbol, avKey));
    } catch {
      indices.push({ symbol, name: INDEX_NAMES[symbol], price: 0, change: 0, changePercent: 0 });
    }
  }

  const filledCount = indices.filter((idx) => idx.price > 0).length;
  const hasData = filledCount > 0;

  // Only cache if we got a complete result (all 4 symbols)
  if (filledCount === SYMBOLS.length) {
    cache = { indices, fetchedAt: Date.now(), key: avKey };
  }

  return NextResponse.json({
    indices,
    source: hasData ? "alphavantage" : "error",
  });
}
