import { createRouter } from '@nextrush/router';
import { nasaMediaProxyService } from '@server/services/nasaMediaProxyService';

export function createMediaRouter() {
  const router = createRouter();

  router.get('/search', async (ctx) => {
    const q = (ctx.query as any)?.q || '';
    const mediaType = (ctx.query as any)?.media_type || 'image,video';
    const result = await nasaMediaProxyService.searchMedia(q, mediaType);
    ctx.json(result);
  });

  router.get('/asset/:id', async (ctx) => {
    const id = ctx.params?.id || (ctx.query as any)?.id;
    if (!id) {
      ctx.status = 400;
      ctx.json({ error: 'Missing required parameter: id' });
      return;
    }

    const result = await nasaMediaProxyService.getAssetManifest(id);
    ctx.json(result);
  });

  return router;
}

export const mediaRouter = createMediaRouter();
