import { z } from 'zod';

export const slopeRoughnessQuerySchema = z.object({
  latDeg: z.number().min(-90, 'Latitude must be >= -90').max(-80, 'South Pole latitude must be <= -80'),
  lonDeg: z.number().min(-360, 'Longitude must be >= -360').max(360, 'Longitude must be <= 360'),
  sampleRadiusMeters: z.number().positive().max(1000).optional().default(50),
});

export type SlopeRoughnessQueryInput = z.infer<typeof slopeRoughnessQuerySchema>;
