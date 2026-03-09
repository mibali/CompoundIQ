import { NextResponse } from "next/server";
import { callLLM, LLMError, type AIProvider } from "@/lib/llm";

// Minimal test endpoint — sends a 1-token request to validate the key
export async function POST(request: Request) {
  const aiKey = request.headers.get("X-AI-Key");
  const aiProvider = (request.headers.get("X-AI-Provider") ?? "anthropic") as AIProvider;

  if (!aiKey) {
    return NextResponse.json({ error: "No key" }, { status: 401 });
  }

  try {
    await callLLM(aiProvider, aiKey, "You are a test assistant.", "Reply with only the word: ok");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    // 429 = quota exceeded but key IS valid — treat as success
    if (err instanceof LLMError && err.status === 429) {
      return NextResponse.json({ ok: true, warning: "quota_exceeded" });
    }
    const status = err instanceof LLMError && err.status === 401 ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
