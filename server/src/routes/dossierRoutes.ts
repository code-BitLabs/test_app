import { createRouter } from '@nextrush/router';
import { dossierGenerateSchema } from '@server/schemas/dossierSchema';
import { synthesizeMissionDossier } from '@/domain/dossier/missionDossierModel';
import { formatDossierAsMarkdown, formatDossierAsJson } from '@/domain/dossier/dossierMarkdownFormatter';

export function createDossierRouter() {
  const router = createRouter();

  router.post('/generate', (ctx) => {
    const parseResult = dossierGenerateSchema.safeParse(ctx.body);
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

    const payload = parseResult.data;
    const dossier = synthesizeMissionDossier(payload as any);
    const markdown = formatDossierAsMarkdown(dossier);
    const jsonTelemetry = formatDossierAsJson(dossier);

    ctx.json({
      dossier,
      markdown,
      jsonTelemetry,
      provenance: {
        generator: 'NextRush Backend Calculation Service',
        runtime: 'Bun',
        generatedAt: new Date().toISOString(),
      },
    });
  });

  return router;
}

export const dossierRouter = createDossierRouter();
