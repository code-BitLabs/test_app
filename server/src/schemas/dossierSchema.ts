import { z } from 'zod';

export const dossierGenerateSchema = z.object({
  targetName: z.string().min(1, 'targetName is required'),
  catalogId: z.string().optional(),
  latitudeDeg: z
    .number()
    .min(-90.0, 'Latitude cannot be less than -90.0°')
    .max(-70.0, 'South-polar latitude must be between -90.0° and -70.0°'),
  longitudeDeg: z.number().finite('longitudeDeg must be a finite number'),
  elevationKm: z.number().finite('elevationKm must be finite').optional(),
  epochMs: z.number().finite('epochMs must be a finite number'),
  telecomBand: z
    .enum(['sBandUplink', 'sBandDownlink', 'xBandUplink', 'xBandDownlink', 'kaBandDownlink'])
    .optional(),
  roverDestination: z
    .object({
      name: z.string().min(1, 'rover destination name is required'),
      latitudeDeg: z.number().min(-90.0).max(-70.0),
      longitudeDeg: z.number().finite(),
      elevationKm: z.number().finite().optional(),
    })
    .optional(),
});

export type DossierGeneratePayload = z.infer<typeof dossierGenerateSchema>;
