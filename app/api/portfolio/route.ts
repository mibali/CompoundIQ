import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAccountCash, getOpenPositions, getDividends, getAccountInfo } from "@/lib/trading212";

export async function GET() {
  const session = await getSession();
  if (!session.t212Key) {
    return NextResponse.json({ error: "Not connected to Trading 212" }, { status: 401 });
  }

  try {
    const [cash, positions, dividendsPage, accountInfo] = await Promise.all([
      getAccountCash(session.t212Key),
      getOpenPositions(session.t212Key),
      getDividends(session.t212Key, 50),
      getAccountInfo(session.t212Key),
    ]);

    const dividendIncome = dividendsPage.items.reduce((sum, d) => sum + d.amount, 0);
    const totalValue = cash.total;
    const totalInvested = cash.invested;
    const totalPnL = cash.ppl;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return NextResponse.json({
      cash,
      positions,
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      dividendIncome,
      currencyCode: accountInfo.currencyCode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
