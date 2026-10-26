# Proposal: Custom Landing Target Studio

## Why

While LunaMission features 20 authoritative landing sites (Artemis III, CLPS, and benchmarks), mission planners, planetary scientists, and hackathon evaluators require the ability to analyze and benchmark **arbitrary coordinates** across the lunar South Pole. Currently, custom point analysis is confined to transient 2D map clicks without 3D pinpointing, persistence, RF link budget computation, or side-by-side comparison with official Artemis candidate sites.

Providing a dedicated Custom Landing Target Studio empowers users to enter precise Selenographic coordinates ($\text{lat}, \text{lon}, \text{elevation}$) or click directly on the 3D Moon sphere, instantly evaluating solar illumination, Earth DSN communication margin, LOLA slope hazard, and water-ice volatile potential.

## What Changes

- **Custom Landing Target Studio Modal / Panel**: An aerospace-grade input modal allowing entry of latitude (e.g., $80^\circ\text{S} - 90^\circ\text{S}$), longitude ($0^\circ - 360^\circ$ or $-180^\circ - +180^\circ$), and elevation (auto-sampled via LOLA DEM or custom override).
- **3D Sphere Pinpointing Interaction**: Click-to-pin mode on `LunarGlobe3D` that raycasts the hit point on the lunar sphere, computes Selenographic coordinates, and drops an interactive beacon marker.
- **Instantaneous Multi-Domain Telemetry**: Computes Sun/Earth topocentric angles, line-of-sight clearance, DSN X/Ka-band RF link margin, LEND hydrogen wt%, Diviner surface temperature, and slope gradient.
- **Benchmark Comparison**: Side-by-side comparison card displaying delta metrics ($\Delta\text{Sun}$, $\Delta\text{Earth}$, $\Delta\text{Slope}$, $\Delta\text{Ice}$) against the nearest Artemis III candidate site.
- **Custom Site Persistence**: Save and name custom targets to localStorage; saved targets integrate directly into the candidate selector and compare matrix.

## Capabilities

### New Capabilities
- `custom-target-studio`: Interactive creation, 3D pinning, multi-domain ephemeris/topography evaluation, and Artemis benchmarking for arbitrary lunar South Pole coordinates.

### Modified Capabilities
- None.

## Impact

- **UI Components**: New `CustomTargetStudioModal.tsx`, `CustomTargetCompareCard.tsx`, and interactive pin button in `SpatialViewport.tsx` and `LunarGlobe3D.tsx`.
- **Domain Modules**: Extends custom point analysis in `src/domain/target/customTargetModel.ts` and `src/domain/target/customTargetStorage.ts`.
- **State Management**: Extends `scenarioState.ts` or custom target store to support saved custom sites alongside catalog candidates.
- **Dependencies**: No external runtime dependencies; uses existing Three.js raycasting and analytical domain math.
