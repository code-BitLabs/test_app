import { createRouter } from '@nextrush/router';
import { horizonsProxyService } from '@server/services/horizonsProxyService';

export function createEphemerisProxyRouter() {
  const router = createRouter();

  router.post('/horizons', async (ctx) => {
    const body = (ctx.body as any) || {};
    const epochMs = typeof body.epochMs === 'number' ? body.epochMs : Date.now();
    const result = await horizonsProxyService.getHorizonsEphemeris(epochMs);
    ctx.json(result);
  });

  router.get('/horizons', async (ctx) => {
    const epochStr = (ctx.query as any)?.epochMs;
    const epochMs = epochStr ? Number(epochStr) : Date.now();
    const validEpoch = Number.isFinite(epochMs) ? epochMs : Date.now();
    const result = await horizonsProxyService.getHorizonsEphemeris(validEpoch);
    ctx.json(result);
  });

  return router;
}

export const ephemerisProxyRouter = createEphemerisProxyRouter();
