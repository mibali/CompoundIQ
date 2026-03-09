"use client";

import type { InvestorProfile } from "@/lib/behaviour";

interface BehaviourProfileProps {
  profile: InvestorProfile;
}

const CIRCUMFERENCE = 2 * Math.PI * 24;

function scoreColor(score: number): string {
  if (score < 40) return "#f43f5e";
  if (score < 65) return "#f59e0b";
  return "#10b981";
}

function ScoreRing({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const color = scoreColor(score);
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          {/* Track */}
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          {/* Progress */}
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="text-xs text-slate-500 uppercase tracking-widest text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function InsightRow({ insight }: { insight: { text: string; positive: boolean } }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{
        background: insight.positive
          ? "rgba(16,185,129,0.06)"
          : "rgba(245,158,11,0.06)",
        borderLeft: `3px solid ${insight.positive ? "#10b981" : "#f59e0b"}`,
      }}
    >
      <span className="flex-shrink-0 mt-0.5">
        {insight.positive ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#10b981" strokeOpacity="0.6" />
            <path d="M4 7l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M7 5.5v3M7 10h.01" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
    </div>
  );
}

export default function BehaviourProfile({ profile }: BehaviourProfileProps) {
  const { scores, archetype, archetypeDescription, insights } = profile;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            {/* DNA icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 2c0 4 8 3 8 7s-8 3-8 7" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 2c0 4-8 3-8 7s8 3 8 7" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="5" y1="7" x2="13" y2="7" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="5" y1="9" x2="13" y2="9" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="5" y1="11" x2="13" y2="11" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Investor DNA
            </p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5">
              {archetype}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
          style={{
            background: "rgba(99,102,241,0.15)",
            color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          Your Profile
        </span>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed -mt-1">
        {archetypeDescription}
      </p>

      {/* Score rings */}
      <div
        className="flex items-center justify-around rounded-xl py-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <ScoreRing score={scores.consistency} label="Consistency" />
        <div style={{ width: "1px", height: "60px", background: "rgba(255,255,255,0.06)" }} />
        <ScoreRing score={scores.patience} label="Patience" />
        <div style={{ width: "1px", height: "60px", background: "rgba(255,255,255,0.06)" }} />
        <ScoreRing score={scores.emotionControl} label="Emotion Control" />
      </div>

      {/* Insights */}
      <div className="flex flex-col gap-2">
        {insights.map((insight, i) => (
          <InsightRow key={i} insight={insight} />
        ))}
      </div>
    </div>
  );
}
