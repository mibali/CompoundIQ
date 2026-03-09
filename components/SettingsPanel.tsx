"use client";

import { useState, useEffect } from "react";
import {
  STORAGE_KEYS,
  AI_PROVIDERS,
  getStoredKey,
  setStoredKey,
  type AIProvider,
} from "@/lib/apikeys";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

function KeyInput({
  label,
  placeholder,
  value,
  onChange,
  docsUrl,
  status,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  docsUrl?: string;
  status: "empty" | "saved" | "testing" | "ok" | "error";
}) {
  const [show, setShow] = useState(false);

  const statusEl =
    status === "ok" ? (
      <span className="text-xs text-emerald-400 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Valid
      </span>
    ) : status === "error" ? (
      <span className="text-xs text-rose-400">Invalid key</span>
    ) : status === "testing" ? (
      <span className="text-xs text-slate-500 animate-pulse">Testing…</span>
    ) : status === "saved" ? (
      <span className="text-xs text-indigo-400">Saved</span>
    ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Get key →
          </a>
        )}
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 pr-10 outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {show ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {statusEl && <div>{statusEl}</div>}
    </div>
  );
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [avKey, setAvKey] = useState("");
  const [aiProvider, setAiProvider] = useState<AIProvider>("anthropic");
  const [aiKey, setAiKey] = useState("");
  const [avStatus, setAvStatus] = useState<"empty" | "saved" | "testing" | "ok" | "error">("empty");
  const [aiStatus, setAiStatus] = useState<"empty" | "saved" | "testing" | "ok" | "error">("empty");
  const [aiError, setAiError] = useState("");
  const [saved, setSaved] = useState(false);

  // Load stored keys on open
  useEffect(() => {
    if (!open) return;
    const storedAv = getStoredKey(STORAGE_KEYS.ALPHA_VANTAGE);
    const storedProvider = getStoredKey(STORAGE_KEYS.AI_PROVIDER) as AIProvider;
    const storedAi = getStoredKey(STORAGE_KEYS.AI_KEY);
    setAvKey(storedAv);
    setAiProvider(AI_PROVIDERS.find((p) => p.id === storedProvider)?.id ?? "anthropic");
    setAiKey(storedAi);
    setAvStatus(storedAv ? "saved" : "empty");
    setAiStatus(storedAi ? "saved" : "empty");
  }, [open]);

  // Test Alpha Vantage key
  async function testAvKey() {
    if (!avKey.trim()) return;
    setAvStatus("testing");
    const controller = new AbortController();
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${avKey.trim()}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      // Only treat "Error Message" as a hard failure.
      // "Note"/"Information" can appear on new/free keys alongside valid data — not a failure.
      if (data["Error Message"]) {
        setAvStatus("error");
      } else {
        setAvStatus("ok");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setAvStatus("error");
    }
  }

  // Test AI key by making a minimal completion request
  async function testAiKey() {
    if (!aiKey.trim()) return;
    setAiStatus("testing");
    setAiError("");
    const controller = new AbortController();
    try {
      const res = await fetch("/api/digest/test", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-AI-Key": aiKey.trim(),
          "X-AI-Provider": aiProvider,
        },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiStatus("ok");
        if (data.warning === "quota_exceeded") {
          setAiError("Key valid — but free-tier quota is exhausted. Enable billing on your Google Cloud project or wait for the quota to reset.");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setAiError(data.error ?? `HTTP ${res.status}`);
        setAiStatus("error");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setAiError(err.message);
        setAiStatus("error");
      }
    }
  }

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  function handleSave() {
    setStoredKey(STORAGE_KEYS.ALPHA_VANTAGE, avKey.trim());
    setStoredKey(STORAGE_KEYS.AI_PROVIDER, aiProvider);
    setStoredKey(STORAGE_KEYS.AI_KEY, aiKey.trim());
    setSaved(true);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 w-full max-w-sm flex flex-col overflow-y-auto"
        style={{
          background: "rgba(10,14,28,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-24px 0 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <p className="text-sm font-bold text-white">Settings & Integrations</p>
            <p className="text-xs text-slate-500 mt-0.5">Manage your API keys</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5 flex-1">

          {/* ── Alpha Vantage ── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">Market Data</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Alpha Vantage provides live sector performance data for Sector Alerts. Free tier is 25 requests/day.
              </p>
            </div>

            <KeyInput
              label="Alpha Vantage API Key"
              placeholder="Enter your Alpha Vantage key…"
              value={avKey}
              onChange={(v) => { setAvKey(v); setAvStatus("empty"); }}
              docsUrl="https://www.alphavantage.co/support/#api-key"
              status={avStatus}
            />

            <button
              onClick={testAvKey}
              disabled={!avKey.trim() || avStatus === "testing"}
              className="text-xs px-3 py-2 rounded-xl font-semibold transition-colors self-start disabled:opacity-40"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              {avStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>
          </section>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* ── AI Provider ── */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">AI Weekly Digest</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Choose your AI provider and enter your API key to enable personalised portfolio insights.
              </p>
            </div>

            {/* Provider selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">AI Provider</label>
              <div className="flex flex-col gap-1.5">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setAiProvider(p.id); setAiStatus("empty"); }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: aiProvider === p.id ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                      border: aiProvider === p.id ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: aiProvider === p.id ? "4px solid #6366f1" : "2px solid rgba(255,255,255,0.2)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200">{p.label}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{p.model}</p>
                    </div>
                    <a
                      href={p.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                    >
                      Key →
                    </a>
                  </button>
                ))}
              </div>
            </div>

            <KeyInput
              label={`${AI_PROVIDERS.find((p) => p.id === aiProvider)?.label} API Key`}
              placeholder="Enter your API key…"
              value={aiKey}
              onChange={(v) => { setAiKey(v); setAiStatus("empty"); }}
              status={aiStatus}
            />

            <button
              onClick={testAiKey}
              disabled={!aiKey.trim() || aiStatus === "testing"}
              className="text-xs px-3 py-2 rounded-xl font-semibold transition-colors self-start disabled:opacity-40"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              {aiStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>
            {aiStatus === "error" && aiError && (
              <p className="text-xs text-rose-400/80 leading-relaxed break-all">{aiError}</p>
            )}
            {aiStatus === "ok" && aiError && (
              <p className="text-xs text-amber-400/80 leading-relaxed">{aiError}</p>
            )}
          </section>
        </div>

        {/* Save button */}
        <div
          className="p-5 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: saved
                ? "rgba(16,185,129,0.3)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: saved ? "1px solid rgba(16,185,129,0.5)" : "none",
            }}
          >
            {saved ? "✓ Saved" : "Save Settings"}
          </button>
          <p className="text-xs text-slate-600 text-center mt-2">
            Keys are stored locally in your browser only.
          </p>
        </div>
      </div>
    </>
  );
}
