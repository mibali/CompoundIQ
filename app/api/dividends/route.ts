import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDividends } from "@/lib/trading212";

export async function GET() {
  const session = await getSession();
  if (!session.t212Key) {
    return NextResponse.json({ error: "Not connected to Trading 212" }, { status: 401 });
  }

  try {
    const data = await getDividends(session.t212Key, 50);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
