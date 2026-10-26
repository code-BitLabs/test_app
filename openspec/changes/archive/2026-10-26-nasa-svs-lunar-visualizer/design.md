# Design

## Context

See `proposal.md` for problem statement and motivation. The existing implementation relies on a flat 105 km planar tangent patch in `globeMultiLodTerrain.ts` with perimeter skirts, causing visible geometry borders and seams. Earth in `globeCelestialVectors.ts` is rendered with an unlit `MeshBasicMaterial` that washes out texture details and reads as a flat cyan disc.

## Goals / Non-Goals

**Goals:**
- Deliver a continuous spherical lunar globe with radial polar deformation, completely eliminating the "floating severed plate" artifact.
- Implement NASA SVS 3727 LOLA 16-stop false-color hypsometry and docked elevation scale bar (-8 km to +8 km).
- Implement NASA SVS 3633 laser altimeter ground tracks draped across crater topography.
- Implement photorealistic Blue Marble Earth with authentic solar day/night terminator phasing.
- Decompose the legacy 765-line `Scenario3DLab.tsx` into modular components adhering to enterprise file-size caps ($\le 200$ lines).

**Non-Goals:**
- Full-globe procedural micro-craters down to 1-meter pebble scale (out of scope for browser WebGL memory budgets; focused on the LOLA 128ppd / 20m mission corridor).
- Replacing the pure domain mathematical ephemeris or telecom models.

## Decisions

### Decision 1: Continuous Radial Spherical Polar Cap vs. Tangent Plane Patch
- **Choice:** Build `buildSphericalPolarCapGeometry` where vertices are distributed across selenographic coordinates ($\text{lat} \in [-80^\circ, -90^\circ], \text{lon} \in [0^\circ, 360^\circ]$) and displaced radially along the sphere normal:
  $$\vec{P} = \hat{n}(\text{lat}, \text{lon}) \cdot \left( R_{\text{scene}} + \Delta r \right)$$
- **Rationale:** At $-80^\circ\text{S}$, the elevation smoothly transitions to the regional reference datum with 0 displacement. This completely eliminates perimeter dropoff skirts and provides a seamless planetary horizon from any orbital or oblique camera view.
- **Alternatives Considered:** Flat tangent plane with transparent alpha feathering (rejected because alpha blending causes sorting artifacts with atmospheric glow and shadows).

### Decision 2: Canvas-Generated NASA SVS 3727 False-Color Texture vs. Custom GLSL Shader
- **Choice:** Process `ldem_topo.jpg` via a high-performance offscreen 2D canvas that maps 8-bit elevation into the official NASA 16-stop rainbow color ramp.
- **Rationale:** Standard `MeshStandardMaterial` can directly sample this texture, preserving Three.js built-in PCF soft shadows, ACES Filmic tone mapping, and roughness/metalness without maintaining custom GLSL lighting passes.
- **Alternatives Considered:** Custom raw GLSL fragment shader (rejected due to fragility across varying WebGL implementations).

### Decision 3: Directional Solar Phasing for Earth
- **Choice:** Orient Earth's texture and shading relative to the sub-solar vector so the hemisphere facing away from the Sun is naturally in darkness, revealing subtle night-side city lights and realistic crescent/gibbous phases.
- **Rationale:** Eliminates the unlit cyan disc and provides authentic astronomical context.

### Decision 4: Modular Refactoring of `Scenario3DLab.tsx`
- **Choice:** Split the 765-line file into:
  - `PlanetaryTheaterHeader.tsx` (~70 lines)
  - `PlanetaryTheaterSidebar.tsx` (~140 lines)
  - `PlanetaryTheaterToolbar.tsx` (~80 lines)
  - `Scenario3DLab.tsx` (~130 lines)
- **Rationale:** Adheres strictly to the Fortune 100 200-line hard cap for UI components while unifying rendering with `LunarGlobe3D`.

## Risks / Trade-offs

- **[Risk]** Dynamic radial polar cap generation might increase frame latency during site selection.  
  → **Mitigation:** Precompute polar cap geometry index buffer and update only vertex radial offsets, maintaining 60 FPS.
- **[Risk]** High-contrast shadows may obscure candidate pin markers in deep PSRs.  
  → **Mitigation:** Markers maintain emissive badges with subtle depth test offset to remain clearly legible.
