import type { Order, Position } from "@/types/trading212";

export type InvestorArchetype =
  | "The Steady Compounder"
  | "The Disciplined Builder"
  | "The Reactive Trader"
  | "The Sporadic Investor"
  | "The Growth Chaser";

export interface BehaviourScores {
  consistency: number;    // 0–100
  emotionControl: number; // 0–100
  patience: number;       // 0–100
}

export interface BehaviourInsight {
  text: string;
  positive: boolean;
}

export interface InvestorProfile {
  scores: BehaviourScores;
  archetype: InvestorArchetype;
  archetypeDescription: string;
  insights: BehaviourInsight[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function computeConsistencyScore(orders: Order[]): number {
  const cutoff = Date.now() - ONE_YEAR_MS;
  const activeMonths = new Set<string>();

  for (const order of orders) {
    if (order.status !== "FILLED") continue;
    if (!order.type.includes("BUY")) continue;
    const ts = new Date(order.dateModified).getTime();
    if (ts < cutoff) continue;
    const d = new Date(order.dateModified);
    activeMonths.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return Math.round((activeMonths.size / 12) * 100);
}

export function computeEmotionControlScore(orders: Order[]): number {
  const sells = orders
    .filter((o) => o.status === "FILLED" && o.type.includes("SELL"))
    .sort(
      (a, b) =>
        new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime()
    );

  if (sells.length < 2) return 100;

  let panicEvents = 0;
  let i = 0;

  while (i < sells.length) {
    const windowStart = new Date(sells[i].dateModified).getTime();
    const tickers = new Set<string>();
    let j = i;

    while (
      j < sells.length &&
      new Date(sells[j].dateModified).getTime() - windowStart <= SEVEN_DAYS_MS
    ) {
      tickers.add(sells[j].ticker);
      j++;
    }

    if (tickers.size >= 2) {
      panicEvents++;
      i = j; // skip past this panic window
    } else {
      i++;
    }
  }

  return Math.max(0, 100 - panicEvents * 25);
}

export function computePatienceScore(
  orders: Order[],
  currentPositions: Position[]
): number {
  const everBought = new Set<string>();
  for (const order of orders) {
    if (order.status === "FILLED" && order.type.includes("BUY")) {
      everBought.add(order.ticker);
    }
  }

  if (everBought.size === 0) return 50;

  const heldNow = new Set(currentPositions.map((p) => p.ticker));
  let intersection = 0;
  for (const ticker of everBought) {
    if (heldNow.has(ticker)) intersection++;
  }

  return Math.round((intersection / everBought.size) * 100);
}

export function deriveArchetype(scores: BehaviourScores): {
  archetype: InvestorArchetype;
  description: string;
} {
  const avg = (scores.consistency + scores.emotionControl + scores.patience) / 3;

  if (avg >= 75 && scores.consistency >= 70) {
    return {
      archetype: "The Steady Compounder",
      description:
        "You invest regularly and hold through turbulence. The compounding effect is quietly working in your favour.",
    };
  }
  if (avg >= 60 && scores.emotionControl >= 70) {
    return {
      archetype: "The Disciplined Builder",
      description:
        "You're building wealth methodically. You control emotional reactions well — a rare skill in retail investing.",
    };
  }
  if (scores.emotionControl < 40) {
    return {
      archetype: "The Reactive Trader",
      description:
        "You've shown signs of selling under pressure. Reactive trading often locks in losses. A simple hold rule could make a big difference.",
    };
  }
  if (scores.consistency < 35) {
    return {
      archetype: "The Sporadic Investor",
      description:
        "Your investing has been irregular. Consistent monthly contributions — even small ones — dramatically improve long-term outcomes.",
    };
  }
  return {
    archetype: "The Growth Chaser",
    description:
      "You tend to rotate out of positions. Holding quality assets longer is where most compounding gains are made.",
  };
}

export function generateInsights(scores: BehaviourScores): BehaviourInsight[] {
  const insights: BehaviourInsight[] = [];
  const activeMonths = Math.round((scores.consistency / 100) * 12);

  // Consistency insight
  if (scores.consistency >= 67) {
    insights.push({
      text: `You've been consistently investing in ${activeMonths} of the last 12 months — that puts you in the top 30% of retail investors.`,
      positive: true,
    });
  } else if (scores.consistency < 40) {
    insights.push({
      text: "You've missed investing in most months this year. Setting up a recurring deposit removes the need for willpower.",
      positive: false,
    });
  }

  // Emotion control insight
  if (insights.length < 2) {
    if (scores.emotionControl >= 75) {
      insights.push({
        text: "No panic-selling patterns detected in your history. Holding through volatility is how long-term wealth is built.",
        positive: true,
      });
    } else if (scores.emotionControl < 50) {
      insights.push({
        text: "Selling multiple stocks within the same week can signal emotional reactions. Consider a 48-hour cooling-off rule before selling.",
        positive: false,
      });
    }
  }

  // Patience insight
  if (insights.length < 2) {
    if (scores.patience >= 75) {
      insights.push({
        text: "You're holding most of what you've bought — compounding needs time to work and you're giving it that.",
        positive: true,
      });
    } else {
      insights.push({
        text: "You've rotated out of several positions. Long-term holders statistically outperform frequent traders by 2–4% annually.",
        positive: false,
      });
    }
  }

  // Fallback: always return exactly 2 insights
  if (insights.length < 2) {
    insights.push({
      text: "Every month you invest consistently, you reduce the impact of market timing on your returns.",
      positive: true,
    });
  }

  return insights.slice(0, 2);
}

export function analyzeInvestorBehaviour(
  orders: Order[],
  currentPositions: Position[]
): InvestorProfile {
  const scores: BehaviourScores = {
    consistency: computeConsistencyScore(orders),
    emotionControl: computeEmotionControlScore(orders),
    patience: computePatienceScore(orders, currentPositions),
  };

  const { archetype, description } = deriveArchetype(scores);
  const insights = generateInsights(scores);

  return {
    scores,
    archetype,
    archetypeDescription: description,
    insights,
  };
}
