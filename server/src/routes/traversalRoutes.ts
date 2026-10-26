import { Router } from '@nextrush/router';
import { traversalRequestSchema } from '@server/schemas/traversalSchemas';
import { computeTraversalPlanService } from '@server/services/traversalService';

export const traversalRouter = new Router();

traversalRouter.post('/plan', async (ctx) => {
  const body = (ctx as any).body;
  const parsed = traversalRequestSchema.safeParse(body);

  if (!parsed.success) {
    ctx.status = 400;
    return ctx.json({
      error: 'Invalid traversal request payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const plan = computeTraversalPlanService(parsed.data);
    ctx.status = 200;
    return ctx.json({
      success: true,
      timestamp: Date.now(),
      data: plan,
    });
  } catch (error) {
    ctx.status = 500;
    return ctx.json({
      error: 'Failed to compute traversal route',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
