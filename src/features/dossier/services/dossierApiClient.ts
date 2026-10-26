/**
 * Executive Mission Dossier Client Adapter
 *
 * Communicates with the NextRush calculation microservice (POST /api/dossier/generate)
 * with transparent offline fallback to the pure client-side domain synthesis engine.
 */

import {
  synthesizeMissionDossier,
  type DossierInput,
  type MissionDossier,
} from '@/domain/dossier/missionDossierModel';
import {
  formatDossierAsMarkdown,
  formatDossierAsJson,
} from '@/domain/dossier/dossierMarkdownFormatter';

export interface DossierProvenance {
  generator: string;
  runtime: string;
  generatedAt: string;
  source: 'nextrush_server' | 'local_analytical_fallback';
}

export interface DossierApiResponse {
  dossier: MissionDossier;
  markdown: string;
  jsonTelemetry: string;
  provenance: DossierProvenance;
}

const DEFAULT_BASE_URL = typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api';
const TIMEOUT_MS = 3000;

export async function requestMissionDossier(
  input: DossierInput,
  baseUrl = DEFAULT_BASE_URL,
): Promise<DossierApiResponse> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${baseUrl}/dossier/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      if (data && data.dossier && data.markdown) {
        return {
          dossier: data.dossier,
          markdown: data.markdown,
          jsonTelemetry: data.jsonTelemetry,
          provenance: {
            ...data.provenance,
            source: 'nextrush_server',
          },
        };
      }
    }
  } catch {
    // NextRush microservice offline or network timed out; fallback to local domain engine
  }

  // Local analytical synthesis fallback
  const localDossier = synthesizeMissionDossier(input);
  const localMarkdown = formatDossierAsMarkdown(localDossier);
  const localJson = formatDossierAsJson(localDossier);

  return {
    dossier: localDossier,
    markdown: localMarkdown,
    jsonTelemetry: localJson,
    provenance: {
      generator: 'LunaMission In-Browser Analytical Engine (Offline Fallback)',
      runtime: 'Client-side V8/JavaScriptCore',
      generatedAt: new Date().toISOString(),
      source: 'local_analytical_fallback',
    },
  };
}
