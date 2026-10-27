import {
  evaluateLandingSafety,
  type LandingSafetyEvaluationResult,
} from '@domain/safety/landingSafetyIndex';
import type { LandingSafetyRequestInput } from '@server/schemas/safetySchemas';

export interface LandingSafetyResponse {
  compositeScore: number;
  breakdown: {
    slopeScore: number;
    illuminationScore: number;
    earthVisibilityScore: number;
    volatilesScore: number;
    roughnessScore: number;
  };
  recommendation: 'GO' | 'CAUTION' | 'ABORT';
  isTipOverHazard?: boolean;
  hazardFlags?: string[];
}

export class SafetyService {
  evaluate(input: LandingSafetyRequestInput): LandingSafetyResponse {
    const result: LandingSafetyEvaluationResult = evaluateLandingSafety(input);

    return {
      compositeScore: result.compositeScore,
      breakdown: result.breakdown,
      recommendation: result.recommendation,
      isTipOverHazard: result.isTipOverHazard,
      hazardFlags: result.hazardFlags,
    };
  }
}

export const safetyService = new SafetyService();
