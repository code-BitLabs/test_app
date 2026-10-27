import { createRouter } from '@nextrush/router';
import { landingSafetyRequestSchema } from '@server/schemas/safetySchemas';
import { safetyService } from '@server/services/safetyService';

export function createSafetyRouter() {
  const router = createRouter();

  router.post('/evaluate', (ctx) => {
    const parseResult = landingSafetyRequestSchema.safeParse(ctx.body);
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

    const result = safetyService.evaluate(parseResult.data);
    ctx.json(result);
  });

  return router;
}

export const safetyRouter = createSafetyRouter();
