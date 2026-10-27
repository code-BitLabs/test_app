/**
 * Multi-Factor Landing Site Safety Index
 *
 * Implements an aerospace-grade, transparent 5-factor safety index for
 * Artemis III and commercial CLPS lander site assessment at the Lunar South Pole.
 *
 * Factor Weights:
 * - Slope Score: 30% weight (Penalties for slope >= 5°, zero score for slope >= 15° tip-over threshold)
 * - Illumination Score: 25% weight (Percentage of direct solar illumination)
 * - Earth Visibility Score: 20% weight (RF DTE line-of-sight elevation and libration visibility)
 * - Volatiles Score: 15% weight (Proximity to permanent cold traps <110 K and LEND neutron suppression)
 * - Surface Roughness Score: 10% weight (Beckmann RMS roughness angle theta_0 penalty)
 */

export interface LandingSafetyEvaluationInput {
  slopeDeg: number;
  illuminationPct: number;
  earthVisibilityPct: number;
  volatilesScore: number;
  roughnessTheta0Deg: number;
}

export interface LandingSafetyBreakdown {
  slopeScore: number;
  illuminationScore: number;
  earthVisibilityScore: number;
  volatilesScore: number;
  roughnessScore: number;
}

export interface LandingSafetyEvaluationResult {
  compositeScore: number;
  breakdown: LandingSafetyBreakdown;
  recommendation: 'GO' | 'CAUTION' | 'ABORT';
  isTipOverHazard: boolean;
  hazardFlags: string[];
}

export const SAFETY_WEIGHTS = {
  slope: 0.30,
  illumination: 0.25,
  earthVisibility: 0.20,
  volatiles: 0.15,
  roughness: 0.10,
} as const;

/**
 * Calculates the slope factor score (0..100).
 * Penalties apply for slope >= 5°; drops to 0 at >= 15° tip-over threshold.
 */
export function calculateSlopeFactorScore(slopeDeg: number): number {
  if (slopeDeg >= 15.0) return 0;
  if (slopeDeg <= 5.0) return 100;
  // Linear degradation between 5.0° and 15.0°
  const score = 100 * (15.0 - slopeDeg) / 10.0;
  return Number(Math.max(0, Math.min(100, score)).toFixed(1));
}

/**
 * Calculates the solar illumination factor score (0..100).
 */
export function calculateIlluminationFactorScore(illuminationPct: number): number {
  return Number(Math.max(0, Math.min(100, illuminationPct)).toFixed(1));
}

/**
 * Calculates the Earth DTE visibility factor score (0..100).
 */
export function calculateEarthVisibilityFactorScore(earthVisibilityPct: number): number {
  return Number(Math.max(0, Math.min(100, earthVisibilityPct)).toFixed(1));
}

/**
 * Calculates the volatiles / cold trap proximity factor score (0..100).
 */
export function calculateVolatilesFactorScore(volatilesScore: number): number {
  return Number(Math.max(0, Math.min(100, volatilesScore)).toFixed(1));
}

/**
 * Calculates the surface roughness factor score (0..100) based on Beckmann theta_0.
 * Penalty begins above 3.0°; drops to 0 at >= 15.0°.
 */
export function calculateRoughnessFactorScore(roughnessTheta0Deg: number): number {
  if (roughnessTheta0Deg >= 15.0) return 0;
  if (roughnessTheta0Deg <= 3.0) return 100;
  const score = 100 * (15.0 - roughnessTheta0Deg) / 12.0;
  return Number(Math.max(0, Math.min(100, score)).toFixed(1));
}

/**
 * Evaluates the full multi-factor landing site safety index.
 */
export function evaluateLandingSafety(
  input: LandingSafetyEvaluationInput,
): LandingSafetyEvaluationResult {
  const slopeScore = calculateSlopeFactorScore(input.slopeDeg);
  const illuminationScore = calculateIlluminationFactorScore(input.illuminationPct);
  const earthVisibilityScore = calculateEarthVisibilityFactorScore(input.earthVisibilityPct);
  const volatilesScore = calculateVolatilesFactorScore(input.volatilesScore);
  const roughnessScore = calculateRoughnessFactorScore(input.roughnessTheta0Deg);

  const compositeScore = Number(
    (
      slopeScore * SAFETY_WEIGHTS.slope +
      illuminationScore * SAFETY_WEIGHTS.illumination +
      earthVisibilityScore * SAFETY_WEIGHTS.earthVisibility +
      volatilesScore * SAFETY_WEIGHTS.volatiles +
      roughnessScore * SAFETY_WEIGHTS.roughness
    ).toFixed(1),
  );

  const isTipOverHazard = input.slopeDeg >= 15.0;
  const hazardFlags: string[] = [];

  if (isTipOverHazard) {
    hazardFlags.push('TIP_OVER_HAZARD');
  }
  if (input.slopeDeg >= 10.0 && !isTipOverHazard) {
    hazardFlags.push('ELEVATED_SLOPE');
  }
  if (input.illuminationPct < 20.0) {
    hazardFlags.push('DEEP_SHADOW_RISK');
  }
  if (input.earthVisibilityPct < 25.0) {
    hazardFlags.push('DTE_COMMUNICATION_OUTAGE_RISK');
  }
  if (input.roughnessTheta0Deg >= 10.0) {
    hazardFlags.push('HIGH_SURFACE_ROUGHNESS');
  }

  let recommendation: 'GO' | 'CAUTION' | 'ABORT';
  if (isTipOverHazard || compositeScore < 50.0) {
    recommendation = 'ABORT';
  } else if (compositeScore >= 75.0 && input.slopeDeg < 10.0) {
    recommendation = 'GO';
  } else {
    recommendation = 'CAUTION';
  }

  return {
    compositeScore,
    breakdown: {
      slopeScore,
      illuminationScore,
      earthVisibilityScore,
      volatilesScore,
      roughnessScore,
    },
    recommendation,
    isTipOverHazard,
    hazardFlags,
  };
}
