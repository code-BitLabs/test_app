import { z } from 'zod';

export const landingSafetyRequestSchema = z.object({
  slopeDeg: z.number().min(0, 'slopeDeg must be >= 0').max(90, 'slopeDeg must be <= 90'),
  illuminationPct: z.number().min(0, 'illuminationPct must be >= 0').max(100, 'illuminationPct must be <= 100'),
  earthVisibilityPct: z.number().min(0, 'earthVisibilityPct must be >= 0').max(100, 'earthVisibilityPct must be <= 100'),
  volatilesScore: z.number().min(0, 'volatilesScore must be >= 0').max(100, 'volatilesScore must be <= 100'),
  roughnessTheta0Deg: z.number().min(0, 'roughnessTheta0Deg must be >= 0').max(90, 'roughnessTheta0Deg must be <= 90'),
});

export type LandingSafetyRequestInput = z.infer<typeof landingSafetyRequestSchema>;
