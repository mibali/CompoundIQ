import type {
  AccountCash,
  AccountInfo,
  Position,
  Order,
  OrdersPage,
  DividendsPage,
  Pie,
} from "@/types/trading212";

const BASE_URL = process.env.TRADING212_BASE_URL ?? "https://live.trading212.com/api/v0";

function makeAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(apiKey).toString("base64")}`;
}

async function t212Fetch<T>(apiKey: string, path: string, revalidate = 0): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: makeAuthHeader(apiKey),
      "Content-Type": "application/json",
    },
    next: { revalidate },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trading 212 API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// Live price/value endpoints — no cache
export async function getAccountCash(apiKey: string): Promise<AccountCash> {
  return t212Fetch<AccountCash>(apiKey, "/equity/account/cash", 0);
}

export async function getAccountInfo(apiKey: string): Promise<AccountInfo> {
  return t212Fetch<AccountInfo>(apiKey, "/equity/account/info", 3600);
}

export async function getOpenPositions(apiKey: string): Promise<Position[]> {
  return t212Fetch<Position[]>(apiKey, "/equity/portfolio", 0);
}

// Historical data — cache 5 minutes
export async function getOrders(apiKey: string, limit = 50): Promise<OrdersPage> {
  const safeLimit = Math.min(limit, 50);
  return t212Fetch<OrdersPage>(apiKey, `/equity/history/orders?limit=${safeLimit}`, 300);
}

export async function getAllOrders(apiKey: string, maxOrders = 500): Promise<Order[]> {
  const allOrders: Order[] = [];
  let path = `/equity/history/orders?limit=50`;

  while (allOrders.length < maxOrders) {
    const page = await t212Fetch<OrdersPage>(apiKey, path, 300);
    allOrders.push(...page.items);
    if (!page.nextPagePath || page.items.length === 0) break;
    const next = page.nextPagePath;
    path = next.startsWith("http") ? next.replace(BASE_URL, "") : next;
  }

  return allOrders;
}

export async function getDividends(apiKey: string, limit = 50): Promise<DividendsPage> {
  return t212Fetch<DividendsPage>(apiKey, `/equity/history/dividends?limit=${limit}`, 300);
}

export async function getPies(apiKey: string): Promise<Pie[]> {
  return t212Fetch<Pie[]>(apiKey, "/equity/pies", 300);
}
