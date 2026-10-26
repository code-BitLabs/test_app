# Proposal: Executive Mission Dossier Exporter

## Why

NASA mission planners and planetary scientists cannot rely solely on ephemeral interactive UI dashboards; real aerospace mission architectures (e.g., NASA Artemis Science Plan, Copernicus Trajectory Design, and GMAT) require authoritative, publication-ready mission briefing dossiers summarizing site geodesy, solar illumination windows, RF line-of-sight margins, volatile water-ice yields, and terrain slope hazard classifications. LunaMission currently computes these multi-domain parameters across isolated consoles, but lacks an automated, unified mission briefing synthesizer and exporter. Providing a one-click executive mission dossier exporter delivers a concrete aerospace-grade deliverable that NASA Space Apps judges and mission planners can download, inspect, and share.

## What Changes

- Introduce a pure domain dossier synthesis engine (`src/domain/dossier/`) that aggregates site geodesy, topocentric solar/Earth illumination, NASA DSN RF link budget, LEND/Diviner volatile prospecting yield, and rover traversal feasibility into a structured briefing model.
- Provide multi-format generation: structured Markdown (`.md`), print-optimized aerospace layout (`window.print` / PDF view), and JSON telemetry interchange (`.json`).
- Implement NextRush backend calculation route `POST /api/dossier/generate` with Zod schema validation, computing server-side dossier packages with resilient client fallback.
- Build a dedicated `MissionDossierModal.tsx` accessible from the top navigation, Candidate Ribbon, and Method page with real-time preview, copy-to-clipboard, and download buttons.
- Fully adhere to Fortune 100 engineering standards: file ceilings ($\le 200$L UI, $\le 300$L domain), 100% test-driven development (TDD), zero browser globals in domain logic, and pure bun runtime.

## Capabilities

### New Capabilities
- `mission-dossier`: End-to-end multi-domain mission briefing synthesis, preview, and multi-format export (Markdown, PDF-ready HTML, JSON) for Artemis catalog candidates and user-defined custom targets, powered by NextRush backend calculation and offline client fallback.

### Modified Capabilities
None.

## Impact

- **Domain**: Adds `src/domain/dossier/missionDossierModel.ts` and `src/domain/dossier/dossierMarkdownFormatter.ts`.
- **Backend**: Adds `server/src/routes/dossierRoutes.ts` with endpoint `POST /api/dossier/generate` and schema in `server/src/schemas/dossierSchema.ts`.
- **Presentation**: Adds `MissionDossierModal.tsx` and dossier export triggers in `CandidateRibbon.tsx` and `ScenarioNav.tsx`.
- **Dependencies**: No external npm packages required (uses pure TypeScript, standard Web APIs, and existing Tailwind/NextRush stack).
