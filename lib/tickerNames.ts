// Maps Trading 212 ticker symbols to full company / fund names
const TICKER_NAMES: Record<string, string> = {
  // US Technology
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc. (Google)",
  GOOG: "Alphabet Inc. (Google)",
  AMZN: "Amazon.com Inc.",
  META: "Meta Platforms Inc.",
  FB: "Meta Platforms Inc.",
  NVDA: "NVIDIA Corporation",
  TSLA: "Tesla Inc.",
  AMD: "Advanced Micro Devices",
  INTC: "Intel Corporation",
  AVGO: "Broadcom Inc.",
  QCOM: "Qualcomm Inc.",
  TXN: "Texas Instruments",
  MU: "Micron Technology",
  AMAT: "Applied Materials",
  LRCX: "Lam Research",
  KLAC: "KLA Corporation",
  ASML: "ASML Holding",
  NOW: "ServiceNow Inc.",
  SNOW: "Snowflake Inc.",
  PLTR: "Palantir Technologies",
  COIN: "Coinbase Global",
  UBER: "Uber Technologies",
  LYFT: "Lyft Inc.",
  ABNB: "Airbnb Inc.",
  SHOP: "Shopify Inc.",
  PYPL: "PayPal Holdings",
  SQ: "Block Inc. (Square)",
  ROKU: "Roku Inc.",
  ZM: "Zoom Video Communications",
  TWLO: "Twilio Inc.",
  NET: "Cloudflare Inc.",
  DDOG: "Datadog Inc.",
  CRWD: "CrowdStrike Holdings",
  OKTA: "Okta Inc.",
  GTLB: "GitLab Inc.",
  PATH: "UiPath Inc.",

  // US Financials
  JPM: "JPMorgan Chase & Co.",
  BAC: "Bank of America",
  WFC: "Wells Fargo & Co.",
  GS: "Goldman Sachs Group",
  MS: "Morgan Stanley",
  BLK: "BlackRock Inc.",
  V: "Visa Inc.",
  MA: "Mastercard Inc.",
  AXP: "American Express",
  BRK_B: "Berkshire Hathaway B",

  // US Healthcare
  JNJ: "Johnson & Johnson",
  PFE: "Pfizer Inc.",
  MRK: "Merck & Co.",
  ABBV: "AbbVie Inc.",
  LLY: "Eli Lilly and Company",
  UNH: "UnitedHealth Group",
  CVS: "CVS Health",
  GILD: "Gilead Sciences",

  // US Consumer / Retail
  AMZN_US: "Amazon.com Inc.",
  WMT: "Walmart Inc.",
  COST: "Costco Wholesale",
  TGT: "Target Corporation",
  NKE: "Nike Inc.",
  SBUX: "Starbucks Corporation",
  MCD: "McDonald's Corporation",
  DIS: "The Walt Disney Company",
  NFLX: "Netflix Inc.",

  // US Energy
  XOM: "ExxonMobil Corporation",
  CVX: "Chevron Corporation",
  BP: "BP plc",
  SHEL: "Shell plc",
  COP: "ConocoPhillips",

  // US Defense / Industrials
  LMT: "Lockheed Martin",
  RTX: "RTX Corporation (Raytheon)",
  BA: "Boeing Company",
  NOC: "Northrop Grumman",
  GD: "General Dynamics",
  HON: "Honeywell International",
  CAT: "Caterpillar Inc.",
  DE: "Deere & Company",

  // US Real Estate ETFs
  O: "Realty Income Corporation",
  SPG: "Simon Property Group",
  VICI: "VICI Properties",
  AMT: "American Tower Corp",

  // ETFs
  SPY: "SPDR S&P 500 ETF",
  QQQ: "Invesco QQQ (NASDAQ-100)",
  VTI: "Vanguard Total Stock Market ETF",
  VOO: "Vanguard S&P 500 ETF",
  VUSA: "Vanguard S&P 500 UCITS ETF",
  VUSAI: "Vanguard S&P 500 UCITS ETF (Acc)",
  VUAG: "Vanguard S&P 500 UCITS ETF (Acc)",
  VWRL: "Vanguard FTSE All-World ETF",
  VWRP: "Vanguard FTSE All-World ETF (Acc)",
  CSPX: "iShares Core S&P 500 UCITS ETF",
  IWDA: "iShares Core MSCI World ETF",
  SWRD: "SPDR MSCI World UCITS ETF",
  EQQQ: "Invesco NASDAQ-100 UCITS ETF",
  GLD: "SPDR Gold Shares ETF",
  SLV: "iShares Silver Trust",
  ARKK: "ARK Innovation ETF",
  ARKG: "ARK Genomic Revolution ETF",

  // UK Stocks
  AZN: "AstraZeneca plc",
  GSK: "GSK plc",
  BATS: "British American Tobacco",
  ULVR: "Unilever plc",
  HSBA: "HSBC Holdings plc",
  LLOY: "Lloyds Banking Group",
  BARC: "Barclays plc",
  RIO: "Rio Tinto plc",
  BP_L: "BP plc",
};

export function getCompanyName(rawTicker: string): string | null {
  // Strip Trading 212 suffixes: _US_EQ, _EQ, _UK_EQ, etc.
  const clean = rawTicker
    .replace(/_US_EQ$/, "")
    .replace(/_UK_EQ$/, "")
    .replace(/_EQ$/, "")
    .replace(/_DE_EQ$/, "")
    .replace(/_FR_EQ$/, "")
    .toUpperCase();

  return TICKER_NAMES[clean] ?? null;
}

export function cleanTicker(rawTicker: string): string {
  return rawTicker
    .replace(/_US_EQ$/, "")
    .replace(/_UK_EQ$/, "")
    .replace(/_EQ$/, "")
    .replace(/_DE_EQ$/, "")
    .replace(/_FR_EQ$/, "")
    .replace(/_/g, " ");
}
