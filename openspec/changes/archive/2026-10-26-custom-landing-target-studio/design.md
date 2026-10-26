# Design: Custom Landing Target Studio

## Context

See `proposal.md` for user motivation and problem statement.

The codebase currently maintains a fixed 20-candidate catalog (`candidateSites.ts`). Spatial coordinates are projected in polar stereographic projection in 2D (`stereographicProjection.ts`) and on a Three.js unit sphere in 3D (`lunarCoordinateFrames.ts`). A transient 2D point analyzer exists in `src/features/spatial/map/model/mapPointAnalysis.ts`, but it is strictly read-only, has no persistence, does not support 3D raycasting, and does not compute RF link budgets or comparative delta matrices against Artemis sites.

## Goals / Non-Goals

**Goals:**
- Provide a responsive `CustomTargetStudioModal.tsx` ($\le 200$ lines) with input validation (latitude, longitude, elevation).
- Implement 3D click-to-pin raycasting on `LunarGlobe3D` transforming world hits to Selenographic coordinates.
- Implement pure domain module `src/domain/target/customTargetModel.ts` ($\le 200$ lines) computing ephemeris, DSN link budget, and relative delta metrics against the nearest Artemis candidate site.
- Implement storage manager `src/domain/target/customTargetStorage.ts` ($\le 120$ lines) persisting targets in `localStorage`.
- Integrate custom targets into the site selection dropdown and comparison view.

**Non-Goals:**
- Uploading arbitrary external GeoTIFF files.
- Mutating the immutable 20 NASA baseline candidate records.

## Decisions

### Decision 1: Pure Functional Custom Target Domain Engine
- **Approach**: Create `src/domain/target/customTargetModel.ts` exposing:
  - `createCustomLandingTarget(input: CustomTargetInput): CustomLandingTarget`
  - `evaluateCustomTargetConditions(target: CustomLandingTarget, epochMs: number): CustomTargetEvaluation`
  - `findNearestCandidateSite(lat: number, lon: number): CandidateSite`
  - `computeTargetDeltas(targetEval: CustomTargetEvaluation, baselineEval: SiteConditions): TargetComparisonDeltas`
- **Rationale**: Keeps domain logic 100% testable with zero Three.js/React dependencies, strictly adhering to `domainBoundaries.test.ts`.

### Decision 2: Selenographic Inversion for 3D Raycasting
- **Approach**: In Three.js, when raycasting against the Moon mesh ($R_{\text{scene}} = 2.0$), the intersection point $\vec{P} = (x, y, z)$ is converted to Selenographic coordinates:
  $$\text{lat} = \arcsin\left(\frac{y}{\|\vec{P}\|}\right) \times \frac{180^\circ}{\pi}$$
  $$\text{lon} = \left(\text{atan2}(x, -z) \times \frac{180^\circ}{\pi} + 360^\circ\right) \pmod{360^\circ}$$
- **Rationale**: Reuses the exact spherical frame convention from `lunarCoordinateFrames.ts` to ensure 100% geometric consistency between 2D and 3D.

### Decision 3: Component Modularity & File Size Ceilings
- Break the feature into 3 small units:
  1. `CustomTargetStudioModal.tsx` ($\sim 160$ lines): Coordinate inputs, elevation resolver, save/cancel actions.
  2. `CustomTargetCompareCard.tsx` ($\sim 120$ lines): Side-by-side delta telemetry HUD ($\Delta\text{Sun}$, $\Delta\text{Earth}$, $\Delta\text{Ice}$, $\Delta\text{Slope}$).
  3. `useCustomTargetStudio.ts` ($\sim 110$ lines): Hook managing target creation, raycast state, and storage persistence.

## Risks / Trade-offs

- **[Risk]** User enters non-physical coordinates (e.g. $+85^\circ\text{N}$ in a South Pole tool).
  - *Mitigation*: Restrict latitude inputs to $[-90^\circ, -70^\circ]$ with real-time UI validation errors.
- **[Risk]** Local storage corruption or quota exceedance.
  - *Mitigation*: Defensive parsing with schema validation and fallback to empty array.
