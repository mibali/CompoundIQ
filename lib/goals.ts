export const GOALS_STORAGE_KEY = "compoundiq_goals";

const MODERATE_RATE = 0.08; // 8% annual
const MONTHLY_RATE = MODERATE_RATE / 12;

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  targetDate: string; // "YYYY-MM-DD"
}

export type GoalStatus = "On Track" | "Ahead" | "Behind" | "Reached";

export interface GoalAnalysis {
  goal: Goal;
  monthsRemaining: number;
  requiredMonthly: number;
  projectedValue: number;
  estimatedReachDate: string | null;
  daysOffTarget: number; // positive = behind, negative = ahead
  progressPercent: number;
  status: GoalStatus;
}

export function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Goal[]) : [];
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

export function monthsUntil(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.max(
    0,
    (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth())
  );
}

/**
 * PMT — monthly contribution needed to reach targetAmount from currentValue in n months.
 * Uses compound interest: PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 */
export function computeRequiredMonthly(
  currentValue: number,
  targetAmount: number,
  monthsRemaining: number
): number {
  if (monthsRemaining <= 0) return Infinity;
  if (targetAmount <= currentValue) return 0;

  const r = MONTHLY_RATE;
  const n = monthsRemaining;
  const factor = Math.pow(1 + r, n);
  const pmt = ((targetAmount - currentValue * factor) * r) / (factor - 1);
  return Math.max(0, Math.round(pmt));
}

/**
 * Future value of currentValue + monthly contributions over n months.
 */
export function projectValueAtDate(
  currentValue: number,
  monthlyContribution: number,
  months: number
): number {
  if (months <= 0) return currentValue;
  const r = MONTHLY_RATE;
  const fvCurrent = currentValue * Math.pow(1 + r, months);
  const fvContributions =
    r > 0
      ? monthlyContribution * ((Math.pow(1 + r, months) - 1) / r)
      : monthlyContribution * months;
  return Math.round(fvCurrent + fvContributions);
}

/**
 * Returns estimated date (ISO string) when portfolio reaches targetAmount,
 * or null if not within 600 months.
 */
export function estimateReachDate(
  currentValue: number,
  monthlyContribution: number,
  targetAmount: number
): string | null {
  if (currentValue >= targetAmount) {
    return new Date().toISOString().split("T")[0];
  }
  if (monthlyContribution <= 0) return null;

  let value = currentValue;
  let months = 0;

  while (months < 600) {
    value = value * (1 + MONTHLY_RATE) + monthlyContribution;
    months++;
    if (value >= targetAmount) break;
  }

  if (months >= 600) return null;

  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export function analyzeGoal(
  goal: Goal,
  currentValue: number,
  monthlyContribution: number
): GoalAnalysis {
  const monthsRemaining = monthsUntil(goal.targetDate);
  const requiredMonthly = computeRequiredMonthly(
    currentValue,
    goal.targetAmount,
    monthsRemaining
  );
  const projectedValue = projectValueAtDate(
    currentValue,
    monthlyContribution,
    monthsRemaining
  );
  const estimatedReachDate = estimateReachDate(
    currentValue,
    monthlyContribution,
    goal.targetAmount
  );

  const progressPercent = Math.min(
    100,
    goal.targetAmount > 0
      ? Math.round((currentValue / goal.targetAmount) * 100)
      : 0
  );

  // Days off target: compare estimated reach date vs goal target date
  let daysOffTarget = 0;
  if (estimatedReachDate) {
    const estMs = new Date(estimatedReachDate).getTime();
    const targetMs = new Date(goal.targetDate).getTime();
    daysOffTarget = Math.round((estMs - targetMs) / (1000 * 60 * 60 * 24));
  }

  let status: GoalStatus;
  if (currentValue >= goal.targetAmount) {
    status = "Reached";
  } else if (projectedValue >= goal.targetAmount * 1.05) {
    status = "Ahead";
  } else if (projectedValue >= goal.targetAmount * 0.95) {
    status = "On Track";
  } else {
    status = "Behind";
  }

  return {
    goal,
    monthsRemaining,
    requiredMonthly,
    projectedValue,
    estimatedReachDate,
    daysOffTarget,
    progressPercent,
    status,
  };
}

export function analyzeAllGoals(
  goals: Goal[],
  currentValue: number,
  monthlyContribution: number
): GoalAnalysis[] {
  return goals.map((g) => analyzeGoal(g, currentValue, monthlyContribution));
}
