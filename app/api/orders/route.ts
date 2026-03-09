import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllOrders } from "@/lib/trading212";

export async function GET() {
  const session = await getSession();
  if (!session.t212Key) {
    return NextResponse.json({ error: "Not connected to Trading 212" }, { status: 401 });
  }

  try {
    const items = await getAllOrders(session.t212Key, 500);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/orders]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
