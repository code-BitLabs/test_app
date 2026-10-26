# Design: Executive Mission Dossier Exporter

## Context

LunaMission already possesses high-fidelity analytical calculation engines:
- JPL Meeus ephemeris & topocentric Sun/Earth vectors (`src/domain/celestial/`)
- NASA DSN RF link budget & ground station tracking (`src/domain/telecom/`)
- NASA LOLA DEM altimetry & slope gradient analysis (`src/domain/dem/`)
- LRO LEND/Diviner volatile prospecting & water-ice yield (`src/domain/volatiles/`)
- A* rover traversal & terrain hazard evaluation (`src/domain/traversal/`)

These domains operate independently. The Mission Dossier Exporter acts as a multi-domain aggregator and briefing generator, producing an executive-level aerospace report that can be previewed on-screen, copied as Markdown, downloaded as JSON, or printed as a clean vector PDF via native browser print stylesheets.

## Goals / Non-Goals

**Goals:**
- Synthesize all planetary mission metrics into a single immutable `MissionDossier` data structure.
- Produce standardized GitHub-Flavored Markdown briefings with formatted telemetry tables, ASCII headers, and scientific citations.
- Provide a NextRush backend route `POST /api/dossier/generate` with Zod validation.
- Provide a responsive UI modal `MissionDossierModal.tsx` with Markdown tab, JSON tab, print preview, and one-click export actions.
- Maintain strict Fortune 100 ceilings: UI $\le 200$ lines, Domain $\le 300$ lines, Server routes $\le 120$ lines.

**Non-Goals:**
- Heavy server-side headless browser PDF rendering (e.g., Puppeteer/Playwright): Native browser `@media print` with custom print CSS produces crisp, vector-sharp PDFs without server bloat or multi-megabyte dependencies.
- Modifying underlying ephemeris or telecom algorithms: Dossier engine consumes outputs from existing pure domain modules.

## Decisions

### 1. Hexagonal Domain Separation: Model vs Formatter
- **Choice:** Split the briefing system into `missionDossierModel.ts` (data synthesis) and `dossierMarkdownFormatter.ts` (text formatting).
- **Rationale:** Keeps files under the 300-line ceiling and separates raw data processing from document presentation.
- **Alternative Considered:** A single monolithic `dossierGenerator.ts` file, rejected because it would exceed 450 lines and violate SRP.

### 2. Print-Optimized Vector PDF via CSS `@media print`
- **Choice:** Use Tailwind `print:` modifiers and `@media print` CSS with page break controls (`break-inside-avoid`, high-contrast monochrome aerospace palette).
- **Rationale:** Browser native `window.print()` outputs perfect PDF vectors with zero bundle weight, zero CVE risk, and zero rendering latency.
- **Alternative Considered:** `jspdf` or `pdfmake` npm packages, rejected due to bundle bloat, styling limitations, and font kerning bugs.

### 3. Dual Server Route with Seamless Offline Fallback
- **Choice:** NextRush microservice serves `POST /api/dossier/generate`. The frontend client calls this endpoint, but falls back seamlessly to the in-memory domain synthesis if the microservice is offline or unreachable.
- **Rationale:** Ensures 100% offline resilience while demonstrating enterprise microservice architecture on NextRush.

## Risks / Trade-offs

- **[Risk]** Deep space coordinates near the $-70^\circ\text{S}$ boundary may produce grazing horizon edge cases.
  - *Mitigation:* `missionDossierModel.ts` checks horizon bounds and emits explicit warning flags in the dossier executive summary when Earth elevation is $<1.5^\circ$.
- **[Risk]** Markdown tables can overflow on narrow mobile screens.
  - *Mitigation:* Modal preview includes horizontal scroll wrappers (`overflow-x-auto`) and compact column widths.
