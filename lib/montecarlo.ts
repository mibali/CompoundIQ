// Monte Carlo simulation engine
// Uses Box-Muller transform to generate normally distributed monthly returns

const ANNUAL_MEAN = 0.08;   // 8% expected annual return
const ANNUAL_STD = 0.15;    // 15% annual volatility (historical equity market)
const MONTHLY_MEAN = Math.pow(1 + ANNUAL_MEAN, 1 / 12) - 1;
const MONTHLY_STD = ANNUAL_STD / Math.sqrt(12);
const NUM_SIMULATIONS = 1000;

function randomNormal(mean: number, std: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 === 0 ? 1e-10 : u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

function runSimulation(
  initialValue: number,
  monthlyContribution: number,
  months: number
): number[] {
  const path: number[] = new Array(months + 1);
  path[0] = initialValue;
  for (let m = 1; m <= months; m++) {
    const monthReturn = randomNormal(MONTHLY_MEAN, MONTHLY_STD);
    path[m] = path[m - 1] * (1 + monthReturn) + monthlyContribution;
  }
  return path;
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
}

export interface MonteCarloPoint {
  year: number;
  label: string;
  contributions: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  // For recharts stacked AreaChart:
  bandOuterBottom: number;  // = p10 (base, transparent)
  bandOuter: number;        // = p90 - p10 (visible outer band)
  bandInnerBottom: number;  // = p25 (base, transparent)
  bandInner: number;        // = p75 - p25 (visible inner band)
}

export interface MonteCarloResult {
  points: MonteCarloPoint[];
  finalP10: number;
  finalP50: number;
  finalP90: number;
}

export function runMonteCarlo(
  initialValue: number,
  monthlyContribution: number,
  years: number
): MonteCarloResult {
  const totalMonths = years * 12;

  // Run all simulations and store full paths
  const allPaths: number[][] = [];
  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    allPaths.push(runSimulation(initialValue, monthlyContribution, totalMonths));
  }

  // Sample at yearly intervals (+ month 0)
  const points: MonteCarloPoint[] = [];
  for (let y = 0; y <= years; y++) {
    const monthIdx = y * 12;
    const values = allPaths.map((path) => path[monthIdx]).sort((a, b) => a - b);
    const contributions = initialValue + monthlyContribution * monthIdx;

    const p10 = percentile(values, 10);
    const p25 = percentile(values, 25);
    const p50 = percentile(values, 50);
    const p75 = percentile(values, 75);
    const p90 = percentile(values, 90);

    points.push({
      year: y,
      label: y === 0 ? "Now" : `Year ${y}`,
      contributions: Math.round(contributions),
      p10: Math.round(p10),
      p25: Math.round(p25),
      p50: Math.round(p50),
      p75: Math.round(p75),
      p90: Math.round(p90),
      bandOuterBottom: Math.round(p10),
      bandOuter: Math.round(p90 - p10),
      bandInnerBottom: Math.round(p25),
      bandInner: Math.round(p75 - p25),
    });
  }

  const final = points[points.length - 1];
  return {
    points,
    finalP10: final.p10,
    finalP50: final.p50,
    finalP90: final.p90,
  };
}
