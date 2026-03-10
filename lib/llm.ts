// Provider-agnostic LLM router — pure fetch, no npm packages required.
// Each provider uses its native REST API so no SDK version lock-in.

export type AIProvider = "anthropic" | "openai" | "gemini" | "groq";

export interface LLMResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

export class LLMError extends Error {
  constructor(public provider: AIProvider, public status: number, message: string) {
    super(message);
    this.name = "LLMError";
  }
}

const LLM_TIMEOUT_MS = 15_000; // 15 seconds — generous enough for cold starts

/** Returns a fetch-compatible signal that aborts after the given timeout. */
function timeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

export async function callLLM(
  provider: AIProvider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(apiKey, systemPrompt, userPrompt);
    case "openai":
      return callOpenAI(apiKey, systemPrompt, userPrompt);
    case "gemini":
      return callGemini(apiKey, systemPrompt, userPrompt);
    case "groq":
      return callGroq(apiKey, systemPrompt, userPrompt);
    default:
      throw new LLMError(provider, 400, `Unknown provider: ${provider}`);
  }
}

// ── Anthropic ──────────────────────────────────────────────────────────────
async function callAnthropic(apiKey: string, system: string, user: string): Promise<LLMResponse> {
  const model = "claude-haiku-4-5-20251001";
  const { signal, clear } = timeoutSignal(LLM_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new LLMError("anthropic", res.status, `Anthropic error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new LLMError("anthropic", 500, "Unexpected response structure from Anthropic");
    return { content: text, provider: "anthropic", model };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LLMError("anthropic", 408, "Anthropic request timed out");
    }
    throw err;
  } finally {
    clear();
  }
}

// ── OpenAI ─────────────────────────────────────────────────────────────────
async function callOpenAI(apiKey: string, system: string, user: string): Promise<LLMResponse> {
  const model = "gpt-4o-mini";
  const { signal, clear } = timeoutSignal(LLM_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new LLMError("openai", res.status, `OpenAI error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new LLMError("openai", 500, "Unexpected response structure from OpenAI");
    return { content: text, provider: "openai", model };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LLMError("openai", 408, "OpenAI request timed out");
    }
    throw err;
  } finally {
    clear();
  }
}

// ── Google Gemini ──────────────────────────────────────────────────────────
async function callGemini(apiKey: string, system: string, user: string): Promise<LLMResponse> {
  const model = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const { signal, clear } = timeoutSignal(LLM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
      }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new LLMError("gemini", res.status, `Gemini error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new LLMError("gemini", 500, "Unexpected response structure from Gemini");
    return { content: text, provider: "gemini", model };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LLMError("gemini", 408, "Gemini request timed out");
    }
    throw err;
  } finally {
    clear();
  }
}

// ── Groq ───────────────────────────────────────────────────────────────────
async function callGroq(apiKey: string, system: string, user: string): Promise<LLMResponse> {
  const model = "llama-3.1-8b-instant";
  const { signal, clear } = timeoutSignal(LLM_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new LLMError("groq", res.status, `Groq error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new LLMError("groq", 500, "Unexpected response structure from Groq");
    return { content: text, provider: "groq", model };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LLMError("groq", 408, "Groq request timed out");
    }
    throw err;
  } finally {
    clear();
  }
}
