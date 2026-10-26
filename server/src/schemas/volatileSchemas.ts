import { z } from 'zod';

export const volatileProspectSchema = z.object({
  latDeg: z.number().min(-90).max(-70),
  lonDeg: z.number().min(-360).max(360),
});

export type VolatileProspectInput = z.infer<typeof volatileProspectSchema>;
