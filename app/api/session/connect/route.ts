import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAccountInfo } from "@/lib/trading212";

export async function POST(request: Request) {
  let apiKey: string;
  try {
    const body = await request.json();
    apiKey = (body.apiKey ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  // Validate the key live against T212 — if this succeeds, the key is good
  try {
    const info = await getAccountInfo(apiKey);
    // Key is valid — seal it into the session cookie
    const session = await getSession();
    session.t212Key = apiKey;
    await session.save();

    return NextResponse.json({
      ok: true,
      currency: info.currencyCode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // T212 returns 401 for invalid keys, 403 for wrong permissions
    if (message.includes("401") || message.includes("403")) {
      return NextResponse.json(
        { error: "Invalid API key — please check it and try again" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Could not reach Trading 212: ${message}` },
      { status: 502 }
    );
  }
}
