import { z } from 'zod';

export const paretoWindowRequestSchema = z.object({
  siteId: z.string().min(1),
  startEpochMs: z.number().int(),
  endEpochMs: z.number().int(),
  stayDurationDays: z.number().int().min(3).max(60).optional(),
  minSunlightPct: z.number().min(0).max(100).optional(),
  maxContinuousShadowHours: z.number().min(0).max(1000).optional(),
  minEarthElevationDeg: z.number().min(-90).max(90).optional(),
  topN: z.number().int().min(1).max(20).optional(),
});

export type ParetoWindowInput = z.infer<typeof paretoWindowRequestSchema>;
