import { createRouter } from '@nextrush/router';
import { slopeRoughnessQuerySchema } from '@server/schemas/terrainSchemas';
import { terrainService } from '@server/services/terrainService';

export function createTerrainRouter() {
  const router = createRouter();

  router.post('/slope-roughness', (ctx) => {
    const parseResult = slopeRoughnessQuerySchema.safeParse(ctx.body);
    if (!parseResult.success) {
      ctx.status = 400;
      ctx.json({
        error: 'Validation Error',
        issues: parseResult.error.issues.map((i: any) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const result = terrainService.calculateSlopeRoughness(parseResult.data);
    ctx.json(result);
  });

  return router;
}

export const terrainRouter = createTerrainRouter();
