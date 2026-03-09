"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  { n: "1", text: "Open Trading 212 app or website" },
  { n: "2", text: 'Go to Profile → Settings → API' },
  { n: "3", text: "Generate a new API key and copy it" },
];

export default function ConnectPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/session/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Connection failed");
        return;
      }

      setStatus("success");
      // Brief success pause then navigate to dashboard
      setTimeout(() => router.push("/"), 800);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — check your connection and try again");
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#080d1a" }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            C
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">CompoundIQ</h1>
            <p className="text-slate-400 text-sm mt-1">Your personal wealth intelligence layer</p>
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-6 sm:p-8 space-y-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Connect Trading 212</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Your API key is verified live and sealed into an encrypted session cookie.
              It is never stored in any database.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-2.5">
            {steps.map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                >
                  {s.n}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Trading 212 API Key
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: status === "error"
                    ? "1px solid rgba(244,63,94,0.4)"
                    : status === "success"
                    ? "1px solid rgba(16,185,129,0.4)"
                    : "1px solid rgba(255,255,255,0.1)",
                  transition: "border-color 0.2s",
                }}
              >
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="Paste your API key here"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none font-mono"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 py-3 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                  tabIndex={-1}
                >
                  {showKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Error message */}
              {status === "error" && errorMsg && (
                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!apiKey.trim() || isLoading || isSuccess}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: isSuccess
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {isLoading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {isSuccess && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isLoading ? "Verifying with Trading 212…" : isSuccess ? "Connected! Redirecting…" : "Connect account"}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2.5 px-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your key is verified live against Trading 212, then sealed with AES-256 encryption into an
            HttpOnly cookie on your device. It never touches a database or leaves your browser unencrypted.
            CompoundIQ has read-only access — it cannot place trades.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-700 px-4">
          Projections and analytics are estimates, not financial advice.
        </p>
      </div>
    </div>
  );
}
