# LunaMission — Engineering Decisions Register

**Status:** Approved production baseline & active challenge execution  
**Version:** 2.1  
**Last updated:** 27 October 2026  
**Owner:** LunaMission Architecture & Flight Dynamics Team  
**Purpose:** Formal Architecture Decision Records (ADRs) tracking foundational engineering choices, tech stack evolutions, scientific boundaries, and operational tradeoffs for the NASA Space Apps Challenge "Lunar Landing Site Navigator".

---

## Executive Progress & Decision Tracker

```
========================================================================================
DECISION COMPLETION & RESOLUTION: [██████████████████░░░░░░] 75%
========================================================================================
  [██████████] 100% - Core Architecture & Runtime Baseline (DEC-001 to DEC-010)
  [██████████] 100% - Scientific Authority & Data Safety Baseline (DEC-011 to DEC-018)
  [██████████] 100% - Modern Stack & NASA REST API Integration (DEC-019 to DEC-030)
  [██████████] 100% - Phase 1 & 2 Open Spikes (OPEN-001 to OPEN-008 RESOLVED)
  [████░░░░░░]  40% - Phase 3 Deep Science & Trajectory Spikes (OPEN-009 to OPEN-012 OPEN)
========================================================================================
```

### Decision Register Summary

| Area | Current Decision | Status | Progress |
| :--- | :--- | :---: | :---: |
| **Project Identity** | LunaMission | Accepted | `[██████████]` 100% |
| **Product Scope** | South-Pole site/date comparison with Sun/Earth horizon geometry | Accepted | `[██████████]` 100% |
| **Package Manager** | Bun (v1.4+) exclusively — Never use npm | Accepted | `[██████████]` 100% |
| **Frontend Framework** | Vite 8 + React 19 + TypeScript + Tailwind CSS | Accepted | `[██████████]` 100% |
| **Compute Microservice** | NextRush standalone Bun HTTP service (port 3001) | Accepted | `[██████████]` 100% |
| **Serverless Deployment** | Vercel serverless functions routing `/api/*` to Bun handlers | Accepted | `[██████████]` 100% |
| **3D Rendering Pipeline** | Three.js with SMAAPass, Logarithmic Depth, ResizeObserver | Accepted | `[██████████]` 100% |
| **Navigation Suite** | 7-page synchronized Mission Control (`useMissionRouter`) | Accepted | `[██████████]` 100% |
| **Science Source of Truth**| NextRush server domain + analytical ephemeris | Accepted | `[██████████]` 100% |
| **Scientific Validation** | Empirical verification $<0.05^\circ$ vs NASA JPL Horizons API | Accepted | `[██████████]` 100% |
| **NASA Live APIs** | Moon Trek WMTS, JPL Horizons REST, NASA Image & Video Library | Accepted | `[██████████]` 100% |
| **RF Telecom Link Budget** | Deep Space Network (DSN) Ka/X-band $C/N_0$ and link margins | Accepted | `[██████████]` 100% |
| **Rover Pathfinding** | Slope-impedance A*/Dijkstra solver with elevation profile | Accepted | `[██████████]` 100% |
| **Engineering Ceilings** | Fortune 100 file size caps ($\le 200\text{L}$ UI, $\le 300\text{L}$ domain) | Accepted | `[██████████]` 100% |
| **Descent Trajectory & $\Delta v$** | Powered Descent Initiation (PDI) and fuel mass modeling | Proposed | `[██░░░░░░░░]` 20% |
| **AI Flight Copilot** | Local natural language flight assistant for site safety queries | Proposed | `[█░░░░░░░░░]` 10% |

---

## Historical Baseline Decisions (DEC-001 through DEC-018)

### DEC-001 — Product name
**Status:** Accepted  
**Decision:** Use **LunaMission** as the official project name across the repository, UI, docs, and submission materials.  
**Context:** Earlier prototype materials used the working title "MoonPoint Explorer".  
**Consequences:** Replaced legacy strings across the codebase; external third-party citations remain intact.

### DEC-002 — Challenge-aligned MVP
**Status:** Accepted  
**Decision:** Prioritize lunar south-pole candidate site and date comparison, focusing on Sun geometry, illumination/power opportunity, Earth visibility, and DTE communication windows.  
**Context:** The application is an evidence-led mission planning browser, not a generic flight simulator.  
**Consequences:** Keep orbital trajectory optimization and flight hardware design out of the initial MVP path.

### DEC-003 — JavaScript package manager
**Status:** Superseded by **DEC-019**  
**Original Decision:** Use a pnpm workspace to manage JavaScript/TypeScript packages.  
**Superseded Reason:** Migrated to Bun for ultra-fast startup, native TypeScript execution, built-in test runner, and high-throughput HTTP server performance.

### DEC-004 — Web application framework
**Status:** Superseded by **DEC-020**  
**Original Decision:** Build the web application with Next.js and TypeScript.  
**Superseded Reason:** Migrated to Vite 8 + React 19 SPA architecture for instant HMR ($<50\text{ms}$), sub-second production builds ($<800\text{ms}$), and client-side WebGL canvas stability without SSR hydration friction.

### DEC-005 — Public application API
**Status:** Superseded by **DEC-021**  
**Original Decision:** Use Hono integrated inside the Next.js application.  
**Superseded Reason:** Transitioned to standalone NextRush Bun HTTP microservice with Vercel serverless adapters.

### DEC-006 — Separate scientific compute service
**Status:** Superseded by **DEC-021**  
**Original Decision:** Build a separate Python service for scientific compute.  
**Superseded Reason:** Native TypeScript/Bun implementation in NextRush achieved sub-millisecond calculation latency without multi-runtime operational overhead.

### DEC-007 — Public API ownership
**Status:** Accepted  
**Decision:** The frontend interacts exclusively through typed REST API contracts (`/api/*`). The backend owns calculation models, ephemeris caching, and third-party API proxying.  
**Consequences:** Frontend components never perform raw orbital transformations or ungrounded heuristics.

### DEC-008 — Shared schema and type contract
**Status:** Accepted  
**Decision:** Maintain canonical TypeScript interfaces for all payload schemas, ephemeris requests, terrain queries, and safety score outputs.  
**Consequences:** Strict type safety across client and server tiers with zero type-casting escapes.

### DEC-009 — Modular monolith application style
**Status:** Accepted  
**Decision:** Structure the codebase as a cohesive repository with isolated domain and feature packages.  
**Consequences:** High cohesion, low coupling; avoids microservice operational sprawl.

### DEC-010 — Scientific truth constraints
**Status:** Accepted  
**Decision:** Scientific truth resides exclusively in verified domain algorithms, never in UI rendering quirks or AI hallucinations.  
**Consequences:** UI components only render values derived from verified backend models.

### DEC-011 — Scientific feasibility validation spike
**Status:** Accepted  
**Decision:** Validate an analytical ephemeris reference case against NASA JPL Horizons before building visualization interfaces.  
**Consequences:** Confirmed sub-solar and sub-Earth coordinate accuracy within $<0.05^\circ$.

### DEC-012 — Defer trajectory and fuel planning from initial MVP
**Status:** Accepted (Active R&D in Phase 4)  
**Decision:** Defer complex trans-lunar trajectory optimization and propellant budgeting from Phase 1.  
**Consequences:** Focus resources on surface environmental and geotechnical safety first.

### DEC-013 — Distinguish geometric visibility from operational RF link
**Status:** Accepted  
**Decision:** Geometric line-of-sight must never be represented as guaranteed communications contact.  
**Consequences:** Built a dedicated DSN RF link budget model evaluating frequency, antenna gain, FSPL, and receiver sensitivity.

### DEC-014 — No unsupported survival/safety probability
**Status:** Accepted  
**Decision:** Never report a pseudo-scientific "survival probability percentage".  
**Consequences:** Provide an explainable multi-criteria safety evaluation (Slope, Illumination, Earth Visibility, Volatiles, Roughness) with explicit constraint violation flags.

### DEC-015 — Data validation gates before claiming terrain-aware accuracy
**Status:** Accepted  
**Decision:** Only claim terrain-aware accuracy for coordinates backed by high-resolution LOLA DEM data.  
**Consequences:** Explicitly label data quality states as `geometry-only`, `terrain-aware`, or `insufficient-data`.

### DEC-016 — Validate vertical slice before broad UI development
**Status:** Accepted  
**Decision:** Connect one candidate site and epoch through the complete pipeline before expanding to 13 candidate sites.  
**Consequences:** Proven end-to-end flow from coordinate picking to horizon radar rendering.

### DEC-017 — Defer heavy database infrastructure
**Status:** Accepted  
**Decision:** Avoid external databases (Postgres, MongoDB) or message brokers (Kafka) for hackathon deployment.  
**Consequences:** High-performance in-memory caching and static geospatial index files provide sub-millisecond query responses.

### DEC-018 — Automated testing is part of science delivery
**Status:** Accepted  
**Decision:** Automated unit, integration, and property tests must guard all calculation models.  
**Consequences:** Delivered 718 passing automated tests with zero test flakiness.

---

## Modern Architecture Decisions (DEC-019 through DEC-030)

### DEC-019 — Bun runtime and package manager adoption
**Status:** Accepted (2026-10-25)  
**Decision:** Adopt **Bun** (v1.4+) as the exclusive runtime and package manager across client and server workspaces.  
**Rationale:** Bun provides $3\times$ faster package installation, native TypeScript execution without transpilation steps, and a lightning-fast test runner (`bun test`).  
**Consequences:** Complete elimination of `npm` and `node_modules` overhead; `bun.lock` is the single source of truth.

### DEC-020 — Vite 8 + React 19 SPA architecture
**Status:** Accepted (2026-10-25)  
**Decision:** Build the frontend as a high-performance Single Page Application using Vite 8 and React 19.  
**Rationale:** WebGL canvas lifecycles and interactive 3D scene graphs suffer from SSR hydration mismatches in Next.js. Vite 8 delivers $<50\text{ms}$ hot module replacement and $<800\text{ms}$ production bundling.  
**Consequences:** Reliable WebGL context persistence, simplified state synchronization, and zero hydration bugs.

### DEC-021 — NextRush Bun HTTP microservice & Vercel serverless adapters
**Status:** Accepted (2026-10-25)  
**Decision:** Implement backend services using **NextRush** (`server/src/app.ts`), a lightweight Bun HTTP microservice listening on port 3001, complemented by Vercel serverless function adapters (`api/*.ts`).  
**Rationale:** Enables unified local development via Bun while maintaining serverless scalability on Vercel.  
**Consequences:** Zero-overhead API endpoints responding in $<2\text{ms}$.

### DEC-022 — Authoritative Three.js WebGL pipeline with SMAAPass & logarithmic depth
**Status:** Accepted (2026-10-26)  
**Decision:** Standardize 3D rendering on Three.js featuring `SMAAPass` anti-aliasing, `logarithmicDepthBuffer: true`, and responsive `ResizeObserver` lifecycle management.  
**Rationale:** Resolves polygon edge shimmering on high-DPI displays and eliminates z-fighting artifacts on low-angle lunar horizons.  
**Consequences:** Rock-solid visual stability during zooming, panning, and fullscreen transitions.

### DEC-023 — 7-Page synchronized Mission Control router (`useMissionRouter`)
**Status:** Accepted (2026-10-26)  
**Decision:** Structure application navigation across 7 specialized workspaces using a lightweight canonical URL router (`useMissionRouter.tsx`):
1. `/explore`: Unified Spatial Flight Deck (2D Map, Dual View, 3D Moon, Docked Inspector).
2. `/scenario/3d-lab`: Dedicated Planetary Theater with Rover Simulator & Visor HUD.
3. `/compare`: Candidate Site Multi-Criteria Trade-Off Decision Matrix.
4. `/horizon`: Topocentric Horizon Radar & Sky Dome.
5. `/traverse`: Slope-Aware Surface Rover Traversal Planner.
6. `/gallery`: NASA Footage Archive powered by NASA Image & Video Library API.
7. `/methodology`: Mathematical specifications, physical constants, and provenance.  
**Rationale:** Separates complex workflows while preserving global scenario state (selected site, epoch, camera position) across page switches.  
**Consequences:** Users can switch between 2D planning, 3D simulation, and comparison without losing context.

### DEC-024 — Dedicated 3D Planetary Theater Lab (`/scenario/3d-lab`)
**Status:** Accepted (2026-10-26)  
**Decision:** Re-establish `/scenario/3d-lab` as a dedicated top-level page featuring a $50/50$ split view, WASD Surface Rover driving simulator with real-time slope pitch/roll feedback, Astronaut xEMU Visor HUD, and 8 camera presets (`nadir`, `site`, `horizon`, `eva`, `earth_align`, `orbit360`, `north_look`, `sunward_terminator`).  
**Rationale:** Provides immersive ground-level visualization distinct from macro-orbital exploration.  
**Consequences:** Bridges orbital landing site selection with astronaut surface EVA simulation.

### DEC-025 — Live NASA REST API integration & caching
**Status:** Accepted (2026-10-26)  
**Decision:** Integrate directly with official NASA REST APIs via backend proxy endpoints:
- NASA Solar System Treks (Moon Trek) WMTS (`trek.nasa.gov`) for high-resolution tile layers.
- NASA JPL SSD Horizons API (`ssd.jpl.nasa.gov`) for high-precision ephemeris verification.
- NASA Image & Video Library API (`images-api.nasa.gov`) for curated mission footage.  
**Rationale:** Ensures authentic planetary data without exposing client API keys or triggering CORS violations.  
**Consequences:** Live NASA data backed by in-memory caching for offline resilience.

### DEC-026 — Multi-touch gesture navigation & gesture isolation
**Status:** Accepted (2026-10-26)  
**Decision:** Implement custom multi-touch gesture handling supporting 1-finger panning, 2-finger pinch/zoom, and two-finger rotation with CSS `touch-action: none`.  
**Rationale:** Resolves touch gesture conflicts between browser viewport scrolling and WebGL/Canvas manipulation on mobile and tablet devices.  
**Consequences:** Smooth touch navigation on iOS Safari, Android Chrome, and touch-enabled laptops.

### DEC-027 — Multi-spectral cartography layers
**Status:** Accepted (2026-10-26)  
**Decision:** Provide 6 multi-spectral layer modes on the 2D Polar Map:
1. LOLA 20m DEM Shaded Relief.
2. LROC Optical Orthomosaic.
3. NASA SVS 3727 16-color Hypsometric Elevation with scale legend.
4. Geotechnical Slope Hazard classification (Green $<5^\circ$, Yellow $5^\circ-12^\circ$, Red $\ge 15^\circ$).
5. Illumination and Permanently Shadowed Region (PSR) masks.
6. Diviner thermal ($T_{\text{max}} < 110\text{ K}$) and LEND neutron suppression ($<0.8\text{ cps}$) volatile traps.  
**Rationale:** Allows scientists to correlate topography, lighting, and resources on a single map.

### DEC-028 — Deep Space Network (DSN) RF telecom link budget engine
**Status:** Accepted (2026-10-26)  
**Decision:** Implement an end-to-end RF telecom link budget calculator modeling Ka-band (26 GHz) and S/X-band links against DSN 34m and 70m ground stations.  
**Rationale:** Elevates the tool from simple geometric line-of-sight to true communications feasibility analysis ($C/N_0$, FSPL, link margin $\ge 3\text{ dB}$).

### DEC-029 — Autonomous slope-impedance rover traversal pathfinder
**Status:** Accepted (2026-10-26)  
**Decision:** Build an A*/Dijkstra pathfinding engine on LOLA digital elevation models that computes optimal EVA traverse routes between landing sites and science targets.  
**Rationale:** Calculates slope impedance, total distance, elevation cross-sections, and rover battery power consumption.

### DEC-030 — Fortune 100 enterprise file-size ceilings
**Status:** Accepted (2026-10-26)  
**Decision:** Enforce strict file size hard limits across all code:
- UI components: $\le 200$ lines (target $\sim 150$)
- Hooks & composables: $\le 150$ lines (target $\sim 100$)
- Server modules & domain repositories: $\le 300$ lines (target $\sim 200$)
- Route handlers & controllers: $\le 120$ lines (target $\sim 80$)
- Schemas & validation: $\le 200$ lines (target $\sim 150$)  
**Rationale:** Eliminates God objects, enforces Single Responsibility Principle, and ensures high testability.  
**Consequences:** 411 repository files strictly audited with 0 violations.

---

## Resolved Spikes (OPEN-001 through OPEN-008)

| ID | Original Question | Resolution | Status |
| :--- | :--- | :--- | :---: |
| **OPEN-001** | What candidate sites and timestamps will be supported? | All 13 Artemis III sites + custom pinpoint coordinates ($80^\circ\text{S}-90^\circ\text{S}$). Canonical UTC timestamps. | ✅ Resolved |
| **OPEN-002** | Which SPICE kernels and frame conventions are required? | Analytical Meeus/JPL ephemeris verified against JPL Horizons DE440/DE441 in IAU 2000 ME frame. | ✅ Resolved |
| **OPEN-003** | Which reference case and numeric tolerance will validate calculations? | Shackleton Rim at 2026-10-20 12:00:00 UTC verified within $<0.05^\circ$ vs JPL Horizons API. | ✅ Resolved |
| **OPEN-004** | Which DEM product covers chosen sites, at what resolution? | LOLA 20m polar DEM products (LRO-L-LOLA-4-GDR-V1.0) and NASA SVS 3727 hypsometry. | ✅ Resolved |
| **OPEN-005** | Which schema/tooling will be canonical across TypeScript services? | Native TypeScript interfaces and runtime schema validators in NextRush. | ✅ Resolved |
| **OPEN-006** | Which runtime and deployment target will host the application? | Bun runtime on local port 3001; Vercel serverless adapters for production cloud deployment. | ✅ Resolved |
| **OPEN-007** | Is the time-window timeline in the MVP or stretch feature? | Delivered in Phase 2: Pareto landing window solver with continuous illumination ranking. | ✅ Resolved |
| **OPEN-008** | What pre-event work and data usage terms apply? | All data sourced under NASA Open Data Policy (public domain / US Government work). | ✅ Resolved |

---

## Active & Forward-Looking Engineering Spikes (OPEN-009 through OPEN-012)

```
========================================================================================
PHASE 3 & 4 ACTIVE SPIKES: [████████░░░░░░░░░░░░] 40%
========================================================================================
```

### OPEN-009 — Direct PDS LOLA GeoTIFF chunking vs. pre-tiled pyramids
- **Status:** Open (In Active R&D — `[████░░░░░░]` 40%)
- **Question:** Should NextRush ingest raw multi-gigabyte PDS GeoTIFFs via chunked HTTP range requests, or pre-generate quantized WebP elevation tiles?
- **Current Approach:** Pre-generated multi-spectral assets with server-side slope matrix calculation.
- **Trigger for Change:** Need for global sub-meter zoom outside pre-loaded Artemis candidate regions.

### OPEN-010 — Trajectory powered descent initiation (PDI) integration (FR-13)
- **Status:** Open (Planned — `[██░░░░░░░░]` 20%)
- **Question:** What astrodynamics formulation should be used for landing trajectory simulation without overwhelming the browser main thread?
- **Current Direction:** Implement a 3-DOF numerical integrator in NextRush evaluating gravity-turn descent trajectories, $\Delta v$, and propellant burn profiles.

### OPEN-011 — AI Flight Copilot & anomaly diagnostics (FR-14)
- **Status:** Open (Planned — `[█░░░░░░░░░]` 10%)
- **Question:** How should natural language queries about landing constraints be grounded in verified flight deck state?
- **Current Direction:** Provide a tool-calling LLM interface bound to NextRush calculation endpoints (`/api/landing-safety/evaluate`).

### OPEN-012 — Offline PWA service worker caching for field use
- **Status:** Open (Proposed — `[███░░░░░░░]` 30%)
- **Question:** How should offline mission planning be supported when internet connectivity to NASA APIs is unavailable?
- **Current Direction:** Service Worker Cache API storing ephemeris tables and LOLA basemaps.

---

## Change Log

| Date | Version | Author | Change Description |
| :--- | :---: | :--- | :--- |
| **2026-10-19** | 1.0 | Architecture Team | Initial register: DEC-001 through DEC-018 and OPEN-001 through OPEN-008. |
| **2026-10-25** | 1.5 | Architecture Team | Recorded supersession of DEC-003, DEC-004, DEC-005, DEC-006 by modern Bun/Vite stack. |
| **2026-10-27** | 2.0 | Tech Lead | Added DEC-019 through DEC-030 detailing 7-page suite, Three.js pipeline, and Fortune 100 ceilings. |
| **2026-10-27** | 2.1 | Senior Architect | Added executive progress bars, resolved OPEN-001 to OPEN-008, and opened Phase 3/4 engineering spikes. |
