export interface ProjectionPoint {
  year: number;
  label: string;
  conservative: number;
  moderate: number;
  aggressive: number;
  contributions: number;
  custom?: number;
}

export interface ProjectionInputs {
  currentValue: number;
  monthlyContribution: number;
  years: number;
  inflationAdjust: boolean;
  customRate?: number; // annual rate as decimal, e.g. 0.10 for 10%
}

const RATES = {
  conservative: 0.05,
  moderate: 0.08,
  aggressive: 0.12,
};

const INFLATION = 0.025;

function project(
  currentValue: number,
  monthly: number,
  annualRate: number,
  years: number,
  inflationAdjust: boolean
): number {
  const r = inflationAdjust ? annualRate - INFLATION : annualRate;
  const monthlyRate = r / 12;
  const months = years * 12;

  // Future value of existing portfolio
  const fvCurrent = currentValue * Math.pow(1 + monthlyRate, months);

  // Future value of recurring contributions
  const fvContributions =
    monthlyRate > 0
      ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : monthly * months;

  return fvCurrent + fvContributions;
}

export function generateProjection(inputs: ProjectionInputs): ProjectionPoint[] {
  const { currentValue, monthlyContribution, years, inflationAdjust, customRate } = inputs;
  const baseHorizons = years <= 1 ? [years] : [1, 2, 3, 5, 10, 15, 20, years];
  const horizons = [0, ...baseHorizons.filter((y) => y <= years)];
  const unique = [...new Set(horizons)].sort((a, b) => a - b);

  return unique.map((y) => {
    const label = y === 0 ? "Now" : y === 0.5 ? "6 mo" : y === 1 ? "1 yr" : `${y} yrs`;
    const point: ProjectionPoint = {
      year: y,
      label,
      conservative: Math.round(project(currentValue, monthlyContribution, RATES.conservative, y, inflationAdjust)),
      moderate: Math.round(project(currentValue, monthlyContribution, RATES.moderate, y, inflationAdjust)),
      aggressive: Math.round(project(currentValue, monthlyContribution, RATES.aggressive, y, inflationAdjust)),
      contributions: Math.round(currentValue + monthlyContribution * 12 * y),
    };
    if (customRate !== undefined) {
      point.custom = Math.round(project(currentValue, monthlyContribution, customRate, y, inflationAdjust));
    }
    return point;
  });
}

export function formatCurrency(value: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
