import { z } from 'zod';

export const traversalRequestSchema = z.object({
  originLatDeg: z.number().min(-90).max(-70),
  originLonDeg: z.number().min(-360).max(360),
  destinationLatDeg: z.number().min(-90).max(-70),
  destinationLonDeg: z.number().min(-360).max(360),
  rover: z
    .object({
      roverMassKg: z.number().positive(),
      maxSpeedMps: z.number().positive(),
      basePowerWatts: z.number().positive(),
      motorEfficiency: z.number().min(0.1).max(1.0),
      batteryCapacityWh: z.number().positive(),
      maxTraversableSlopeDeg: z.number().min(5).max(45),
    })
    .optional(),
  maxWaypoints: z.number().int().min(10).max(80).optional(),
});

export type TraversalRequestInput = z.infer<typeof traversalRequestSchema>;
