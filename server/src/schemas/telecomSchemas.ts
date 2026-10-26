import { z } from 'zod';

export const telecomQuerySchema = z.object({
  siteId: z.string().min(1, 'siteId is required'),
  epochMs: z.number().finite('epochMs must be a finite number'),
  band: z
    .enum(['sBandUplink', 'sBandDownlink', 'xBandUplink', 'xBandDownlink', 'kaBandDownlink'])
    .default('xBandDownlink'),
  transmitterPowerWatts: z.number().positive('transmitterPowerWatts must be > 0').default(15),
  dataRateMbps: z.number().positive('dataRateMbps must be > 0').default(2.0),
});

export type TelecomQueryPayload = z.infer<typeof telecomQuerySchema>;
