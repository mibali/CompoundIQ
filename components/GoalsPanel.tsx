"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Goal,
  type GoalAnalysis,
  type GoalStatus,
  loadGoals,
  saveGoals,
  analyzeAllGoals,
} from "@/lib/goals";
import { formatCurrency } from "@/lib/projection";

interface GoalsPanelProps {
  currentValue: number;
  monthlyContribution: number;
  currency: string;
}

const PRESETS = [
  { emoji: "🏠", name: "House Deposit", targetAmount: 50000, years: 5 },
  { emoji: "🎓", name: "Education Fund", targetAmount: 30000, years: 10 },
  { emoji: "✈️", name: "Dream Holiday", targetAmount: 5000, years: 2 },
  { emoji: "🌴", name: "Early Retirement", targetAmount: 500000, years: 20 },
  { emoji: "🛡️", name: "Emergency Fund", targetAmount: 10000, years: 1 },
];

const EMOJIS = PRESETS.map((p) => p.emoji);

const STATUS_COLORS: Record<GoalStatus, { color: string; bg: string }> = {
  Reached: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Ahead: { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  "On Track": { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Behind: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)" },
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function GoalCard({
  analysis,
  currency,
  onDelete,
  onEdit,
}: {
  analysis: GoalAnalysis;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  const { goal, monthsRemaining, requiredMonthly, estimatedReachDate, progressPercent, status } =
    analysis;
  const statusStyle = STATUS_COLORS[status];

  return (
    <div
      className="flex-shrink-0 rounded-2xl p-5 flex flex-col gap-3"
      style={{
        width: "220px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl leading-none flex-shrink-0">{goal.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 leading-tight truncate">{goal.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {monthsRemaining > 0
                ? `${monthsRemaining}mo remaining`
                : "Target date passed"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit button */}
          <button
            onClick={() => onEdit(goal)}
            className="text-slate-600 hover:text-slate-300 transition-colors p-0.5"
            aria-label="Edit goal"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11H2v-2L9.5 1.5Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* Delete button */}
          <button
            onClick={() => onDelete(goal.id)}
            className="text-slate-600 hover:text-slate-400 transition-colors p-0.5"
            aria-label="Delete goal"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Target */}
      <div>
        <p className="text-lg font-bold text-white">
          {formatCurrency(goal.targetAmount, currency)}
        </p>
        <p className="text-xs text-slate-500">by {formatShortDate(goal.targetDate)}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background:
                status === "Behind"
                  ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                  : "linear-gradient(90deg, #6366f1, #8b5cf6)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{progressPercent}% of target in portfolio</p>
      </div>

      {/* Status + details */}
      <div className="flex flex-col gap-1.5">
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full self-start"
          style={{ color: statusStyle.color, background: statusStyle.bg }}
        >
          {status}
        </span>
        {requiredMonthly > 0 && requiredMonthly !== Infinity && (
          <p className="text-xs text-slate-500">
            Need{" "}
            <span className="text-slate-300 font-semibold">
              {formatCurrency(requiredMonthly, currency)}/mo
            </span>
          </p>
        )}
        {estimatedReachDate && status !== "Reached" && (
          <p className="text-xs text-slate-500">
            Est. <span className="text-slate-300">{formatShortDate(estimatedReachDate)}</span>
          </p>
        )}
        {status === "Reached" && (
          <p className="text-xs" style={{ color: "#10b981" }}>
            Goal achieved! 🎉
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex-shrink-0 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-colors"
      style={{
        width: "220px",
        minHeight: "180px",
        border: "1px dashed rgba(255,255,255,0.12)",
        background: "transparent",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span className="text-3xl">🎯</span>
      <p className="text-sm text-slate-500 text-center leading-snug">
        Add your first goal
        <br />
        <span style={{ color: "#6366f1" }}>→</span>
      </p>
    </button>
  );
}

interface GoalFormProps {
  editingGoal: Goal | null; // null = adding new
  onSave: (data: Omit<Goal, "id">) => void;
  onCancel: () => void;
}

function GoalForm({ editingGoal, onSave, onCancel }: GoalFormProps) {
  const [formName, setFormName] = useState(editingGoal?.name ?? "");
  const [formEmoji, setFormEmoji] = useState(editingGoal?.emoji ?? "🏠");
  const [formTarget, setFormTarget] = useState(
    editingGoal ? String(editingGoal.targetAmount) : ""
  );
  const [formDate, setFormDate] = useState(editingGoal?.targetDate ?? "");

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setFormName(preset.name);
    setFormEmoji(preset.emoji);
    setFormTarget(String(preset.targetAmount));
    const d = new Date();
    d.setFullYear(d.getFullYear() + preset.years);
    setFormDate(d.toISOString().split("T")[0]);
  };

  const handleSave = () => {
    const targetAmount = parseFloat(formTarget);
    if (!formName.trim() || isNaN(targetAmount) || !formDate) return;
    onSave({ name: formName.trim(), emoji: formEmoji, targetAmount, targetDate: formDate });
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {editingGoal ? "Edit Goal" : "New Goal"}
      </p>

      {/* Preset templates — only show when adding */}
      {!editingGoal && (
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Quick templates</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.emoji}
                onClick={() => handlePreset(p)}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ ...inputStyle, color: "#94a3b8" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                  e.currentTarget.style.color = "#818cf8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = inputStyle.background;
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji + name */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1.5 flex-shrink-0">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setFormEmoji(e)}
              className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors"
              style={{
                background: formEmoji === e ? "rgba(99,102,241,0.25)" : inputStyle.background,
                border: formEmoji === e
                  ? "1px solid rgba(99,102,241,0.4)"
                  : inputStyle.border,
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Goal name"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full sm:flex-1 text-sm text-white placeholder-slate-600 rounded-xl px-4 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      {/* Target + date */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-widest">
            Target amount
          </label>
          <input
            type="number"
            placeholder="50000"
            value={formTarget}
            onChange={(e) => setFormTarget(e.target.value)}
            min={1}
            className="w-full text-sm text-white placeholder-slate-600 rounded-xl px-4 py-2.5 outline-none"
            style={inputStyle}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-widest">
            Target date
          </label>
          <input
            type="date"
            value={formDate}
            min={minDateStr}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full text-sm text-white rounded-xl px-4 py-2.5 outline-none"
            style={{ ...inputStyle, colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!formName.trim() || !formTarget || !formDate}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
        >
          {editingGoal ? "Save Changes" : "Save Goal"}
        </button>
      </div>
    </div>
  );
}

export default function GoalsPanel({
  currentValue,
  monthlyContribution,
  currency,
}: GoalsPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analyses, setAnalyses] = useState<GoalAnalysis[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  useEffect(() => {
    setAnalyses(analyzeAllGoals(goals, currentValue, monthlyContribution));
  }, [goals, currentValue, monthlyContribution]);

  const handleDelete = useCallback((id: string) => {
    setGoals((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      saveGoals(updated);
      return updated;
    });
  }, []);

  const handleEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  }, []);

  const handleSave = (data: Omit<Goal, "id">) => {
    if (editingGoal) {
      // Update existing
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.id === editingGoal.id ? { ...g, ...data } : g
        );
        saveGoals(updated);
        return updated;
      });
    } else {
      // Create new
      const newGoal: Goal = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        ...data,
      };
      setGoals((prev) => {
        const updated = [...prev, newGoal];
        saveGoals(updated);
        return updated;
      });
    }
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleAddClick = () => {
    setEditingGoal(null);
    setShowForm((v) => !v);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Life Goals</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track whether your portfolio reaches your real-life targets
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          style={{
            background: showForm && !editingGoal ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)",
            color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>
            {showForm && !editingGoal ? "−" : "+"}
          </span>
          {showForm && !editingGoal ? "Cancel" : "Add Goal"}
        </button>
      </div>

      {/* Form (add or edit) */}
      {showForm && (
        <GoalForm
          editingGoal={editingGoal}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Goal cards */}
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
        {analyses.length === 0 ? (
          <EmptyState onAdd={() => { setEditingGoal(null); setShowForm(true); }} />
        ) : (
          analyses.map((analysis) => (
            <GoalCard
              key={analysis.goal.id}
              analysis={analysis}
              currency={currency}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}
