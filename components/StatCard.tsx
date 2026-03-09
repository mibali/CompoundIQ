"use client";

import Tooltip from "@/components/Tooltip";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean | null;
  hint?: string;
  accent?: "indigo" | "emerald" | "rose" | "violet" | "amber";
}

const accentMap = {
  indigo: "from-indigo-500 to-violet-500",
  emerald: "from-emerald-400 to-teal-500",
  rose: "from-rose-500 to-pink-500",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-400 to-orange-500",
};

export default function StatCard({
  label,
  value,
  subValue,
  positive,
  hint,
  accent = "indigo",
}: StatCardProps) {
  const card = (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-1.5 overflow-hidden w-full"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        cursor: hint ? "default" : undefined,
      }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentMap[accent]} opacity-60`} />

      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
        {hint && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-600 flex-shrink-0">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeOpacity="0.6" />
            <path d="M6 5.5v3M6 4h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <p className="text-2xl font-bold text-white leading-tight">{value}</p>

      {subValue && (
        <div className="flex items-center gap-1.5">
          {positive !== undefined && positive !== null && (
            <span className={`text-xs font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}>
              {positive ? "▲" : "▼"}
            </span>
          )}
          <p
            className={`text-sm font-semibold ${
              positive === true ? "text-emerald-400" : positive === false ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {subValue}
          </p>
        </div>
      )}
    </div>
  );

  if (hint) {
    return (
      <Tooltip content={hint} position="bottom" maxWidth={240}>
        {card}
      </Tooltip>
    );
  }

  return card;
}
