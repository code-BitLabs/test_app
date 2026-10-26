# Tasks: Executive Mission Dossier Exporter

## 1. Pure Domain Dossier Engine (TDD)

- [x] 1.1 Write failing unit test `src/domain/dossier/__tests__/missionDossierModel.test.ts` covering multi-domain synthesis (geodesy, solar, telecom, volatiles, traversal) and verify RED failure
- [x] 1.2 Implement pure domain module `src/domain/dossier/missionDossierModel.ts` ($\le 300$ lines) and verify tests turn GREEN
- [x] 1.3 Write failing unit test `src/domain/dossier/__tests__/dossierMarkdownFormatter.test.ts` covering Markdown table formatting, ASCII banners, and JSON telemetry export
- [x] 1.4 Implement `src/domain/dossier/dossierMarkdownFormatter.ts` ($\le 300$ lines) and verify tests turn GREEN

## 2. NextRush Backend Route & Client Adapter (TDD)

- [x] 2.1 Write failing backend test `server/__tests__/dossierRoute.test.ts` testing `POST /api/dossier/generate` input validation and payload response
- [x] 2.2 Implement `server/src/schemas/dossierSchema.ts` and `server/src/routes/dossierRoutes.ts` ($\le 120$ lines), mount in `server/src/index.ts`, and verify tests turn GREEN
- [x] 2.3 Implement client adapter `src/features/dossier/services/dossierApiClient.ts` with seamless local domain fallback when the microservice is offline

## 3. UI Modal & Print-Ready Layout

- [x] 3.1 Implement `src/features/dossier/ui/MissionDossierModal.tsx` ($\le 200$ lines) featuring Markdown tab, JSON telemetry tab, copy actions, file download, and `@media print` CSS rules
- [x] 3.2 Integrate "Export Dossier" triggers into `SpatialToolbar.tsx`, `CandidateRibbon.tsx`, and `WorkspaceModals.tsx`

## 4. End-to-End Verification & Verification Ledger

- [x] 4.1 Execute full test suite `bun test`, static type check `tsc --noEmit` across client and server, and production bundle build
- [x] 4.2 Validate browser visual rendering and print layout via `agent-browser`, capturing screenshot artifact
- [x] 4.3 Update `progress.md` and `Plan.md` ledger reflecting Phase 9 completion

## Workflow follow-up

- Sync delta specs to main `openspec/specs/mission-dossier/spec.md`.
- Archive change `executive-mission-dossier` upon review approval.
