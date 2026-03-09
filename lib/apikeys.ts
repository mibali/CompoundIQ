// Client-side API key management — stored in localStorage
// Keys are sent as request headers so Next.js API routes can forward them to third-party services.

export const STORAGE_KEYS = {
  ALPHA_VANTAGE: "compoundiq_alphavantage_key",
  AI_PROVIDER: "compoundiq_ai_provider",
  AI_KEY: "compoundiq_ai_key",
} as const;

export type AIProvider = "anthropic" | "openai" | "gemini" | "groq";

export const AI_PROVIDERS: { id: AIProvider; label: string; model: string; docsUrl: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", model: "claude-haiku-4-5-20251001", docsUrl: "https://console.anthropic.com/keys" },
  { id: "openai",    label: "OpenAI (GPT-4o mini)", model: "gpt-4o-mini",             docsUrl: "https://platform.openai.com/api-keys" },
  { id: "gemini",    label: "Google (Gemini Flash)", model: "gemini-2.0-flash-lite",    docsUrl: "https://aistudio.google.com/app/apikey" },
  { id: "groq",      label: "Groq (Llama 3.1)",    model: "llama-3.1-8b-instant",     docsUrl: "https://console.groq.com/keys" },
];

export function getStoredKey(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

export function setStoredKey(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
}

export function getAIProvider(): AIProvider {
  const stored = getStoredKey(STORAGE_KEYS.AI_PROVIDER);
  return (AI_PROVIDERS.find((p) => p.id === stored)?.id) ?? "anthropic";
}
