import { z } from 'zod';

export const ephemerisQuerySchema = z.object({
  siteId: z.string().min(1, 'siteId is required'),
  epochMs: z.number().finite('epochMs must be a finite number'),
  calculationMode: z.enum(['geometry-only', 'terrain-aware']).default('geometry-only'),
});

export type EphemerisQueryPayload = z.infer<typeof ephemerisQuerySchema>;
