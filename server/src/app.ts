import { createApp } from '@nextrush/core';
import { createRouter } from '@nextrush/router';
import { cors } from '@nextrush/cors';
import { json } from '@nextrush/body-parser';
import { SERVER_CONFIG } from '@server/config/serverConfig';
import { requestLogger } from '@server/middleware/requestLogger';
import { createHealthRouter } from '@server/routes/healthRoutes';
import { createEphemerisRouter } from '@server/routes/ephemerisRoutes';
import { createTelecomRouter } from '@server/routes/telecomRoutes';
import { traversalRouter } from '@server/routes/traversalRoutes';
import { volatileRouter } from '@server/routes/volatileRoutes';
import { windowRouter } from '@server/routes/windowRoutes';
import { dossierRouter } from '@server/routes/dossierRoutes';
import { createTerrainRouter } from '@server/routes/terrainRoute';
import { createSafetyRouter } from '@server/routes/safetyRoute';
import { createEphemerisProxyRouter } from '@server/routes/ephemerisRoute';
import { createMediaRouter } from '@server/routes/mediaRoute';

export function createServerApp() {
  const app = createApp();

  // Global Middleware
  app.use(
    cors({
      origin: SERVER_CONFIG.allowedOrigins,
    }),
  );
  app.use(json());
  app.use(requestLogger);

  // Unified API Router mounted at /api
  const apiRouter = createRouter();

  // Mount feature sub-routers using NextRush router.mount()
  const healthRouter = createHealthRouter();
  const ephemerisRouter = createEphemerisRouter();
  const telecomRouter = createTelecomRouter();

  apiRouter.mount('', healthRouter);
  apiRouter.mount('/ephemeris', ephemerisRouter);
  apiRouter.mount('/ephemeris', createEphemerisProxyRouter());
  apiRouter.mount('/telecom', telecomRouter);
  apiRouter.mount('/traversal', traversalRouter);
  apiRouter.mount('/volatiles', volatileRouter);
  apiRouter.mount('/windows', windowRouter);
  apiRouter.mount('/dossier', dossierRouter);
  apiRouter.mount('/terrain', createTerrainRouter());
  apiRouter.mount('/landing-safety', createSafetyRouter());
  apiRouter.mount('/media', createMediaRouter());

  app.route('/api', apiRouter);

  return app;
}
