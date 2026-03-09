export interface AccountCash {
  free: number;
  total: number;
  ppl: number;
  result: number;
  invested: number;
  pieCash: number;
  blocked: number;
}

export interface AccountInfo {
  id: number;
  currencyCode: string;
}

export interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
  fxPpl: number | null;
  initialFillDate: string;
  frontend: string;
  maxBuy: number;
  maxSell: number;
  pieQuantity: number;
}

export interface Order {
  id: number;
  dateCreated: string;
  dateModified: string;
  executor: string;
  fillCost: number | null;
  fillId: number | null;
  fillPrice: number | null;
  fillResult: number | null;
  fillType: string | null;
  filledQuantity: number | null;
  filledValue: number | null;
  limitPrice: number | null;
  orderedQuantity: number;
  orderedValue: number | null;
  parentOrder: number | null;
  status: string;
  stopPrice: number | null;
  ticker: string;
  timeValidity: string | null;
  type: string;
}

export interface OrdersPage {
  items: Order[];
  nextPagePath: string | null;
}

export interface Dividend {
  ticker: string;
  reference: string;
  quantity: number;
  amount: number;
  grossAmountPerShare: number;
  paidOn: string;
  type: string;
}

export interface DividendsPage {
  items: Dividend[];
  nextPagePath: string | null;
}

export interface Pie {
  id: number;
  cash: number;
  dividendDetails: {
    gained: number;
    inCash: number;
    reinvested: number;
  };
  progress: number;
  result: {
    priceAvgInvestedValue: number;
    priceAvgResult: number;
    priceAvgResultCoef: number;
    priceAvgValue: number;
  };
  status: string;
}

export interface PortfolioSummary {
  cash: AccountCash;
  positions: Position[];
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dividendIncome: number;
  currencyCode: string;
}
