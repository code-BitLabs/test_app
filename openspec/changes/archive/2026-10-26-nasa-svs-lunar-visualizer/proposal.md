# Proposal

## Why

The current 3D visualization renders the lunar South Pole as a severed 105 km planar tangent patch with vertical perimeter dropoff skirts suspended in black void ("floating plate syndrome"), accompanied by an unlit cyan disc for Earth. This creates a disconnected, toy-like appearance that conflicts with NASA Goddard Scientific Visualization Studio (SVS) standards. This change elevates LunaMission's 3D visualizer to an authentic flight-grade planetary observatory grounded in NASA SVS 3727, SVS 3760, and SVS 3633.

## What Changes

- **Continuous Spherical Moon Geometry**: Replace the severed 105 km planar tangent box and dropoff skirts with a continuous radial spherical polar mesh ($80^\circ\text{S}-90^\circ\text{S}$) deformed along spherical normals, creating a seamless planetary curvature without edge seams or void gaps.
- **NASA SVS 3727 Global False-Color Topography**: Implement the official 16-stop LOLA rainbow hypsometric palette (-9 km to +9 km) and render a docked NASA standard elevation scale bar (-8 km to +8 km).
- **NASA SVS 3633 LOLA Laser Altimeter Ground Tracks**: Render authentic converging LRO orbital laser profiling passes draped across polar crater rims.
- **Photorealistic Blue Marble Earth**: Replace the unlit cyan sphere with a textured Earth globe exhibiting accurate day/night solar phase terminators and subtle atmospheric limb glow.
- **NASA SVS 3760 Knife-Edge Shadows & 3D Billboards**: Calibrate low-incidence directional solar lighting casting sharp cast shadows into cryogenic PSRs, accompanied by 3D crater nomenclature billboards.
- **Planetary Theater Modernization**: Decompose the legacy 765-line `Scenario3DLab.tsx` into modular subcomponents ($\le 150$ lines each) powered by the unified `LunarGlobe3D` engine.

## Capabilities

### New Capabilities
- `spatial-visualization`: 3D planetary rendering engine supporting global LOLA false-color hypsometry, continuous spherical polar displacement, LRO laser altimeter ground tracks, and photorealistic cislunar celestial vectors.

### Modified Capabilities
<!-- None -->

## Impact

- Affected frontend components: `src/features/spatial/globe/`, `src/features/spatial/lab/Scenario3DLab.tsx`, `src/features/spatial/ui/LunarGlobe3D.tsx`.
- New domain utility: `src/domain/terrain/nasaSvsColorRamp.ts`.
- No breaking changes to existing REST backend routes or coordinate math.
