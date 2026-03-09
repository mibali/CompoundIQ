"use client";

import { useState } from "react";

interface DividendStock {
  ticker: string;
  name: string;
  sector: string;
  yieldPct: number;        // approximate annual dividend yield %
  frequency: string;       // "Monthly" | "Quarterly" | "Semi-annual"
  category: "high" | "growing" | "stable";
  description: string;     // one-line beginner explanation
  perThousand: number;     // approx annual income per £/$ 1,000 invested
  yahooTicker: string;     // Yahoo Finance ticker (UK stocks use .L suffix)
  market: "US" | "UK";    // primary listing market
}

const STOCKS: DividendStock[] = [
  // High-yield
  { ticker: "O",    name: "Realty Income",           sector: "Real Estate",           yieldPct: 5.5, frequency: "Monthly",     category: "high",    description: "A Real Estate Investment Trust (REIT) — pays monthly dividends like rent income.",          perThousand: 55, yahooTicker: "O",      market: "US" },
  { ticker: "VICI", name: "VICI Properties",          sector: "Real Estate",           yieldPct: 5.2, frequency: "Quarterly",   category: "high",    description: "REIT owning casinos and entertainment venues. High yield, pays quarterly.",                  perThousand: 52, yahooTicker: "VICI",   market: "US" },
  { ticker: "ABBV", name: "AbbVie",                   sector: "Healthcare",            yieldPct: 3.8, frequency: "Quarterly",   category: "high",    description: "Major pharma company behind Botox and Humira. Consistent dividend grower.",                  perThousand: 38, yahooTicker: "ABBV",   market: "US" },
  { ticker: "T",    name: "AT&T",                     sector: "Technology",            yieldPct: 5.8, frequency: "Quarterly",   category: "high",    description: "US telecom giant. One of the highest-yielding blue-chip dividend payers on the NYSE.",        perThousand: 58, yahooTicker: "T",      market: "US" },
  { ticker: "VZ",   name: "Verizon",                  sector: "Technology",            yieldPct: 6.4, frequency: "Quarterly",   category: "high",    description: "Major US telecom. Very high yield backed by stable wireless subscription revenue.",           perThousand: 64, yahooTicker: "VZ",     market: "US" },
  { ticker: "BATS", name: "British American Tobacco", sector: "Consumer",             yieldPct: 9.2,  frequency: "Quarterly",   category: "high",    description: "UK-listed tobacco giant. Very high yield but comes with ESG risk considerations.",           perThousand: 92, yahooTicker: "BATS.L", market: "UK" },
  { ticker: "LLOY", name: "Lloyds Banking Group",     sector: "Financials",           yieldPct: 5.4,  frequency: "Semi-annual", category: "high",    description: "UK's largest retail bank. Pays a good dividend and is priced affordably.",                  perThousand: 54, yahooTicker: "LLOY.L", market: "UK" },
  { ticker: "SHEL", name: "Shell",                    sector: "Energy",               yieldPct: 4.1,  frequency: "Quarterly",   category: "high",    description: "Global energy giant. Oil & gas revenue funds a solid quarterly dividend.",                  perThousand: 41, yahooTicker: "SHEL.L", market: "UK" },
  { ticker: "BP",   name: "BP",                       sector: "Energy",               yieldPct: 5.0,  frequency: "Quarterly",   category: "high",    description: "UK-listed oil major. High yield with ongoing commitment to dividends.",                      perThousand: 50, yahooTicker: "BP.L",   market: "UK" },

  // Dividend growers
  { ticker: "MSFT", name: "Microsoft",                sector: "Technology",           yieldPct: 0.8,  frequency: "Quarterly",   category: "growing", description: "Small yield now but dividend has grown 10%+ annually for over a decade.",                   perThousand: 8,  yahooTicker: "MSFT",   market: "US" },
  { ticker: "AAPL", name: "Apple",                    sector: "Technology",           yieldPct: 0.5,  frequency: "Quarterly",   category: "growing", description: "Small yield but Apple raises it consistently. Combined with buybacks, great shareholder value.", perThousand: 5, yahooTicker: "AAPL",   market: "US" },
  { ticker: "V",    name: "Visa",                     sector: "Financials",           yieldPct: 0.8,  frequency: "Quarterly",   category: "growing", description: "Processes global payments. Growing dividend with strong earnings backing it.",                perThousand: 8,  yahooTicker: "V",      market: "US" },
  { ticker: "MA",   name: "Mastercard",               sector: "Financials",           yieldPct: 0.6,  frequency: "Quarterly",   category: "growing", description: "Like Visa — small yield but raised every year with strong business growth.",                 perThousand: 6,  yahooTicker: "MA",     market: "US" },
  { ticker: "LMT",  name: "Lockheed Martin",          sector: "Industrials & Defense",yieldPct: 2.8,  frequency: "Quarterly",   category: "growing", description: "US defence contractor. Stable government contracts fund consistent dividend growth.",         perThousand: 28, yahooTicker: "LMT",    market: "US" },
  { ticker: "AZN",  name: "AstraZeneca",              sector: "Healthcare",           yieldPct: 2.0,  frequency: "Quarterly",   category: "growing", description: "UK pharma giant with a solid and growing dividend backed by strong drug pipeline.",          perThousand: 20, yahooTicker: "AZN.L",  market: "UK" },
  { ticker: "RR",   name: "Rolls-Royce",              sector: "Industrials & Defense",yieldPct: 1.2,  frequency: "Semi-annual", category: "growing", description: "UK aerospace and defence leader. Reinstated dividends after turnaround — growing fast.",     perThousand: 12, yahooTicker: "RR.L",   market: "UK" },

  // Stable income
  { ticker: "JNJ",  name: "Johnson & Johnson",        sector: "Healthcare",           yieldPct: 3.2,  frequency: "Quarterly",   category: "stable",  description: "Over 60 years of consecutive dividend increases — one of the most reliable dividend payers.", perThousand: 32, yahooTicker: "JNJ",    market: "US" },
  { ticker: "PFE",  name: "Pfizer",                   sector: "Healthcare",           yieldPct: 6.5,  frequency: "Quarterly",   category: "stable",  description: "High yield from a global pharma giant. Yield elevated due to recent stock price decline.",  perThousand: 65, yahooTicker: "PFE",    market: "US" },
  { ticker: "MCD",  name: "McDonald's",               sector: "Consumer",             yieldPct: 2.4,  frequency: "Quarterly",   category: "stable",  description: "Global franchise giant. Reliable dividend for 25+ years. Inflation-resistant business.",    perThousand: 24, yahooTicker: "MCD",    market: "US" },
  { ticker: "COST", name: "Costco",                   sector: "Consumer",             yieldPct: 0.6,  frequency: "Quarterly",   category: "stable",  description: "Low regular yield but pays large special dividends periodically. Very reliable business.",  perThousand: 6,  yahooTicker: "COST",   market: "US" },
  { ticker: "BLK",  name: "BlackRock",                sector: "Financials",           yieldPct: 2.5,  frequency: "Quarterly",   category: "stable",  description: "World's largest asset manager. Steady dividend funded by massive recurring fee income.",    perThousand: 25, yahooTicker: "BLK",    market: "US" },
  { ticker: "GSK",  name: "GSK",                      sector: "Healthcare",           yieldPct: 4.2,  frequency: "Quarterly",   category: "stable",  description: "UK pharma company (formerly GlaxoSmithKline). Solid income stock with UK listing.",       perThousand: 42, yahooTicker: "GSK.L",  market: "UK" },
  { ticker: "ULVR", name: "Unilever",                 sector: "Consumer",             yieldPct: 3.7,  frequency: "Quarterly",   category: "stable",  description: "Makes Dove, Lynx, Persil and hundreds of everyday brands. Reliable consumer-staples dividend.", perThousand: 37, yahooTicker: "ULVR.L", market: "UK" },
  { ticker: "BARC", name: "Barclays",                 sector: "Financials",           yieldPct: 3.9,  frequency: "Semi-annual", category: "stable",  description: "UK high-street and investment bank. Reinstated dividends post-pandemic and growing.",      perThousand: 39, yahooTicker: "BARC.L", market: "UK" },
  { ticker: "NG",   name: "National Grid",            sector: "Energy",               yieldPct: 5.6,  frequency: "Semi-annual", category: "stable",  description: "UK electricity and gas transmission operator. Regulated revenues make dividends very reliable.", perThousand: 56, yahooTicker: "NG.L",   market: "UK" },
];

const CATEGORY_CONFIG = {
  high:    { label: "High Yield",       color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  desc: "4%+ yield — great for immediate income" },
  growing: { label: "Growing Dividend", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)",  desc: "Smaller yield now, but growing fast" },
  stable:  { label: "Stable Income",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",  desc: "Consistent payers with long track record" },
};

const ALL_SECTORS = ["All", ...Array.from(new Set(STOCKS.map((s) => s.sector))).sort()];

export default function DividendDiscovery({ currency, existingTickers }: {
  currency: string;
  existingTickers?: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<"all" | "high" | "growing" | "stable">("all");
  const [activeSector, setActiveSector] = useState("All");
  const [activeMarket, setActiveMarket] = useState<"Global" | "US" | "UK">("Global");
  const [showOwned, setShowOwned] = useState(false);
  const currencySymbol = currency === "GBP" ? "£" : "$";

  const held = new Set((existingTickers ?? []).map((t) => t.toUpperCase()));

  const filtered = STOCKS.filter((s) => {
    if (!showOwned && held.has(s.ticker)) return false;
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (activeSector !== "All" && s.sector !== activeSector) return false;
    if (activeMarket !== "Global" && s.market !== activeMarket) return false;
    return true;
  });

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white">Dividend Stock Ideas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Well-known stocks that pay regular dividends — hover a row for details
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl px-3 py-2 flex items-start gap-2"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
      >
        <span className="text-amber-500 flex-shrink-0 text-xs mt-0.5">ℹ</span>
        <p className="text-xs text-amber-400/80 leading-relaxed">
          Yields shown are approximate and change daily with share price. Click <span className="font-semibold">Live yield</span> on any stock to see the current figure on Yahoo Finance. This is educational, not financial advice.
        </p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: "All categories", color: "#94a3b8" },
          { key: "high",    ...CATEGORY_CONFIG.high },
          { key: "growing", ...CATEGORY_CONFIG.growing },
          { key: "stable",  ...CATEGORY_CONFIG.stable },
        ] as const).map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
            className="text-xs px-3 py-1 rounded-full transition-all font-medium"
            style={{
              background: activeCategory === cat.key ? `${cat.color}22` : "rgba(255,255,255,0.04)",
              border: activeCategory === cat.key ? `1px solid ${cat.color}55` : "1px solid rgba(255,255,255,0.07)",
              color: activeCategory === cat.key ? cat.color : "#64748b",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Market toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-600">Market:</span>
        {(["Global", "US", "UK"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setActiveMarket(m)}
            className="text-xs px-3 py-1 rounded-full transition-all font-medium"
            style={{
              background: activeMarket === m ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
              border: activeMarket === m ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.07)",
              color: activeMarket === m ? "#34d399" : "#64748b",
            }}
          >
            {m === "Global" ? "🌍 Global" : m === "US" ? "🇺🇸 US" : "🇬🇧 UK"}
          </button>
        ))}
      </div>

      {/* Sector filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-600">Sector:</span>
        {ALL_SECTORS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSector(s)}
            className="text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: activeSector === s ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
              border: activeSector === s ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.06)",
              color: activeSector === s ? "#818cf8" : "#475569",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Show owned toggle */}
      {held.size > 0 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{ background: showOwned ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)" }}
            onClick={() => setShowOwned((v) => !v)}
          >
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
              style={{
                background: showOwned ? "#818cf8" : "#475569",
                left: showOwned ? "calc(100% - 14px)" : "2px",
              }}
            />
          </div>
          <span className="text-xs text-slate-500">Show stocks I already hold</span>
        </label>
      )}

      {/* Stock list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs text-slate-600">No stocks match these filters</p>
          </div>
        ) : (
          filtered.map((stock) => {
            const cfg = CATEGORY_CONFIG[stock.category];
            const alreadyHeld = held.has(stock.ticker);
            return (
              <div
                key={stock.ticker}
                className="rounded-xl px-4 py-3 flex items-start gap-3 group relative"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                {/* Ticker badge */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${cfg.color}22`, color: cfg.color }}
                >
                  {stock.ticker.slice(0, 4)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{stock.ticker}</span>
                    <span className="text-xs text-slate-400">{stock.name}</span>
                    <span className="text-xs">{stock.market === "US" ? "🇺🇸" : "🇬🇧"}</span>
                    {alreadyHeld && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                      >
                        In portfolio
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{stock.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-600">{stock.sector}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-600">{stock.frequency}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <a
                      href={`https://finance.yahoo.com/quote/${stock.yahooTicker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium flex items-center gap-1 transition-colors"
                      style={{ color: "#60a5fa" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Live yield
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7"/>
                        <path d="M8 1h3v3M11 1 6 6"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Yield info */}
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black" style={{ color: cfg.color }}>
                    {stock.yieldPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600">yield</p>
                  <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                    {currencySymbol}{stock.perThousand}/yr
                  </p>
                  <p className="text-xs text-slate-700">per {currencySymbol}1k</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Income calculator hint */}
      <div
        className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <span className="text-indigo-400 flex-shrink-0 text-xs mt-0.5">💡</span>
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-indigo-300 font-semibold">How to use this:</span> The{" "}
          <span className="text-white">&ldquo;per {currencySymbol}1k&rdquo;</span> column shows roughly how much income you&apos;d receive per year for every {currencySymbol}1,000 you invest.
          For example, investing {currencySymbol}5,000 in a 5% stock earns around {currencySymbol}250/year — paid quarterly or monthly directly to your account.
        </p>
      </div>
    </div>
  );
}
