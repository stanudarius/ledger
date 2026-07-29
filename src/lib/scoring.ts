import type { Metrics, AnalystRatings } from "@/lib/providers";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Value: lower P/E & P/B = more undervalued. Analyst upside adds conviction. */
export function computeValue(m: Metrics, ratings: AnalystRatings | null, price: number): number {
  let score = 0;
  let weight = 0;
  const knownLoss = Number.isFinite(m.eps) && m.eps < 0;

  // A zero P/E with negative EPS means the company is loss-making, not that the input is missing.
  if (Number.isFinite(m.peRatio) && (m.peRatio !== 0 || knownLoss)) {
    const pePoints = m.peRatio > 0 ? clamp(100 - m.peRatio * 2.5, 0, 100) : 0;
    score += pePoints * 0.40;
    weight += 0.40;
  }
  if (Number.isFinite(m.pbRatio) && m.pbRatio !== 0) {
    const pbPoints = m.pbRatio > 0 ? clamp(100 - m.pbRatio * 8, 0, 100) : 0;
    score += pbPoints * 0.35;
    weight += 0.35;
  }
  // Analyst upside: 30%+ upside = 100, flat/downside = 0
  if (ratings && ratings.targetMean > 0 && price > 0) {
    const upside = ((ratings.targetMean - price) / price) * 100;
    score += clamp(upside * 3, 0, 100) * 0.25;
    weight += 0.25;
  }

  return weight > 0 ? Math.round(score / weight) : 50;
}

/** Growth: revenue expansion + ROE as earnings quality. */
export function computeGrowth(m: Metrics): number {
  let score = 0;
  let weight = 0;

  if (Number.isFinite(m.revenueGrowthYoy)) {
    score += clamp(m.revenueGrowthYoy * 2.5, 0, 100) * 0.55;
    weight += 0.55;
  }
  if (Number.isFinite(m.roe) && m.roe !== 0) {
    score += clamp(m.roe * 2, 0, 100) * 0.45;
    weight += 0.45;
  }

  return weight > 0 ? Math.round(score / weight) : 50;
}

/** Quality: profitability, efficiency, and shareholder returns. */
export function computeQuality(m: Metrics): number {
  let score = 0;
  let weight = 0;
  const knownLoss = Number.isFinite(m.eps) && m.eps < 0;

  if (Number.isFinite(m.roe) && m.roe !== 0) {
    score += clamp(m.roe * 1.5, 0, 100) * 0.30;
    weight += 0.30;
  }
  if (Number.isFinite(m.roa) && m.roa !== 0) {
    score += clamp(m.roa * 5, 0, 100) * 0.25;
    weight += 0.25;
  }
  if (m.dividendYield >= 0 && Number.isFinite(m.dividendYield)) {
    score += clamp(m.dividendYield * 100 * 4, 0, 100) * 0.25;
    weight += 0.25;
  }
  // Profitable company bonus; a known loss contributes zero rather than being omitted.
  if (Number.isFinite(m.peRatio) && (m.peRatio !== 0 || knownLoss)) {
    score += (m.peRatio > 0 ? 60 : 0) * 0.20;
    weight += 0.20;
  }

  return weight > 0 ? Math.round(score / weight) : 50;
}

export function computeComposite(valueScore: number, growthScore: number, qualityScore: number): number {
  return Math.round(valueScore * 0.40 + growthScore * 0.35 + qualityScore * 0.25);
}

export interface StockScores {
  value: number;
  growth: number;
  quality: number;
  composite: number;
}
