# LunaMission: Scientific Lunar South Pole Explorer & 3D Lab Overhaul

A rigorous, evidence-backed engineering implementation plan for the LunaMission scientific 3D lunar surface explorer, local terrain engine, and standalone 3D Lab.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions have been directly incorporated into the engineering strategy:
> 1. **Explicit DEM Resolution & Honesty**: Use NASA LOLA 128 ppd (~237 m/pixel) strictly for regional polar context (83°S–90°S). For local pilot terrain, investigate and integrate verified higher-resolution polar DEM products (e.g., LOLA 20–30 m/pixel polar products / LROC stereo DEMs). Never imply that 237 m/pixel regional data provides ground-level or meter-scale detail; display clear effective resolution disclosures.
> 2. **Authoritative Coordinate Verification**: Verify Shackleton Connecting Ridge pilot coordinates (-89.90°S, 0.00°E for Shackleton Crater Rim; -89.44°S, 222.50°E for Connecting Ridge) against IAU/IAG Moon 2000 Mean Earth/Polar Axis (ME) frame and East-positive longitude conventions before anchoring the 3D scene.
> 3. **Non-Invented Asset Metadata**: Never hardcode example values for vertical accuracy, effective resolution, vertical datum, or coverage. Populate all asset metadata directly from actual product labels and processing pipelines; any missing or unverified fields must be explicitly marked `Unknown`.
> 4. **Georeferenced LROC NAC & ShadowCam Observations**: Ensure archival orbital imagery (LROC NAC surface context, ShadowCam low-light PSR insets) is strictly georeferenced to the coordinate frame and terrain geometry. Preserve acquisition timestamps, phase angles, and product IDs; handle coverage edges, missing tiles, and seams transparently without fake textures.
> 5. **Polar Singularity Immunity & Real Terrain Collision**: Implement topocentric East-North-Up (ENU) tangent basis with safe mathematical fallback at the exact pole ($\phi = -90^\circ$). Validate camera clearance against actual measured terrain elevation to prevent underground clipping.
> 6. **Measured Performance Targets**: Treat 60 FPS / ~16.7 ms frame times as an empirical measurement target, not an unverified guarantee. Capture baseline vs. post-change frame-time distributions (median, p95, long frame counts), draw calls, and WebGL resource consumption on the test environment.
> 7. **Disciplined Phased Execution**: Maintain a strict phased rollout: Phase 0 (Baseline Reproduction) → Phase 1 (Pilot Site Data Proof of Concept) → Phase 2 (Multi-LOD Terrain) → Phase 3 (Camera Reliability) → Phase 4 (Scientific UX & Gallery) → Phase 5 (Performance Optimization) → Phase 6 (Failure Matrix) → Phase 7 (Browser & Scientific Verification).

---

### 1. Overview & Core Concept

- **What It Does**: Provides a scientifically defensible, interactive lunar south pole exploration environment. Users navigate from global Moon orbital perspective down to measured surface relief at documented candidate exploration sites, inspecting topographic elevation, low-angle solar illumination, Earth line-of-sight geometry, and archival orbital observations with verifiable provenance.
- **Scientific Foundation**:
  - Coordinate Reference: IAU/IAG 2000 Moon Mean Earth / Polar Axis (ME) body-fixed frame.
  - Longitude Convention: 0° to 360° East-positive.
  - Vertical Datum: Reference lunar sphere of radius $R = 1737.4\text{ km}$ (elevations expressed as height above/below mean sphere).
  - Elevation Sources: NASA LOLA 128 ppd (~237 m/px horizontal posting) for regional coverage; verified high-resolution DEM products for pilot site local relief.
  - Imagery Sources: LROC NAC high-resolution polar mosaics and NASA ShadowCam low-light PSR observations.
- **Key Prohibitions**: Zero procedural crater generation masquerading as measured topography; zero unverified 1,000 m Artemis landing ellipses or hazard rings; zero synthetic zero-albedo black floor plates; zero fake "live feeds". Missing or obscured metrics are rendered as "Unavailable / Unknown", never as zero.

---

### 2. User Experience & Visual Design

#### A. Aesthetic Direction & Theme (60-30-10 Rule)
- **60% Primary Deep Space Canvas**: Obsidian space void (`#07090E` / `#0B0E17`) with physically consistent directional sunlight cast from verified ephemeris coordinates.
- **30% Structural Panels & Precision Framing**: Muted slate instrument panels (`#111827`, `#0F172A`), hairline borders (`border border-slate-800`), technical graticules, and crosshairs.
- **10% Calibrated Telemetry Accents**:
  - Laser Cyan (`#06B6D4`): Selected candidate datum, IAU benchmark crosshair, and active camera preset.
  - Telemetry Amber (`#F59E0B`): Grazing solar elevation warning ($< 1.5^\circ$) or below-horizon Earth communication warning.
  - Slate White (`#F8FAFC`): Numerical measurements and tabular data.
- **Zero-Pill Discipline**:
  - Informational metadata (lat/lon, elevation, solar azimuth, DEM posting, observation epoch) is formatted as clean unboxed text with typographic bullet separators (`·`).
  - Interactive filter controls (camera presets, layer toggles, split view) use functional segmented button groups with clear active states.

#### B. Typographic System & Precision Notation
- **Body & Labels**: Technical neo-grotesque sans (`Plus Jakarta Sans` / `Inter`), with wide-tracked uppercase kickers (`text-xs uppercase tracking-wider text-slate-400`).
- **Measurements & Ephemeris**: Dedicated tabular monospace (`font-mono tabular-nums`) to prevent layout jitter during dynamic time scrubbing or camera movement.
- **Explicit Units**: Large numeric display (`text-xl font-mono font-semibold text-slate-100`) followed by small muted units (`text-xs uppercase text-slate-400 ml-1`).

#### C. Viewport Zones & Layout Architecture
1. **Top Telemetry Header (44px)**:
   - Navigation: Return to Observatory, candidate site selector dropdown, synchronized UTC epoch display.
   - Tools: Split 2D/3D toggle, Site Intel drawer toggle, Engine Telemetry toggle, native Fullscreen toggle.
2. **Main 3D Stage (Flexible Fullscreen or 50/50 Split)**:
   - Full-bleed WebGL viewport hosting the lunar globe, measured polar terrain mesh, directional sunlight, and dynamic near/far clipping plane manager.
   - Synchronized 2D/3D split view docking the verified 2D LOLA slope profile, radar elevation passport, and local sky horizon chart alongside the 3D scene.
3. **Collapsible Floating Scientific HUD (Bottom Center)**:
   - Floating glassmorphic dock (`max-w-4xl mx-auto mb-4 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-lg p-2.5 shadow-2xl`).
   - Grouped into 4 functional toolbars: Camera Presets (Global, South Pole, 45° Oblique, Overhead, Horizon), Time Controls (-6h, -1h, Play/Pause diurnal loop, +1h, +6h), Independent Layer Toggles (Relief, Markers, Earth Link, Graticule), and Zen View toggle.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Orthonormal Topocentric East-North-Up (ENU) Orbit Frame
- **Chosen Approach**: Decouple OrbitControls from the global Cartesian axes during local inspection. Construct an orthonormal topocentric basis anchored at the candidate surface coordinate $\mathbf{C}$:
  $$\hat{\mathbf{U}} = \frac{\mathbf{C}}{\|\mathbf{C}\|}, \quad \hat{\mathbf{E}} = \frac{\hat{\mathbf{Y}}_{\text{pole}} \times \hat{\mathbf{U}}}{\|\hat{\mathbf{Y}}_{\text{pole}} \times \hat{\mathbf{U}}\|}, \quad \hat{\mathbf{N}} = \hat{\mathbf{U}} \times \hat{\mathbf{E}}$$
  When the latitude approaches $-90^\circ$ (singularity where $\hat{\mathbf{Y}}_{\text{pole}} \parallel \hat{\mathbf{U}}$), use the prime meridian axis $+\hat{\mathbf{Z}}$ as the fallback cross-vector.
- **Why**: Standard polar orbiting causes gimbal lock, 180° camera flips, and inverted pitch. The topocentric basis keeps pitch and azimuth navigation intuitive and stable down to meter-scale inspection.
- **Alternatives Considered**: Global Euler clamping. Rejected due to severe control inversion at polar latitudes.

#### Decision 2: Multi-LOD Terrain Mesh with Georeferenced LOLA Elevation
- **Chosen Approach**: Replace decorative flat floor geometry with a dual-resolution terrain grid (64×64 base, 128×128 high-detail) sampled directly from NASA LOLA South Pole DEM products. Use camera distance and screen-space error thresholds for hysteresis-based LOD switching, with skirt geometry to eliminate boundary seams.
- **Why**: Guarantees that every peak, ridge, and crater wall corresponds to real elevation data without polygon cracks or performance drops on lower-tier GPUs.
- **Alternatives Considered**: Generating procedural displacement maps. Strictly prohibited by scientific principles.

#### Decision 3: Archival Orbital Imagery Gallery with Georeferenced Footprints
- **Chosen Approach**: Integrate date-stamped, georeferenced LROC NAC polar mosaics draped over the measured terrain, complemented by NASA ShadowCam low-light observations in permanently shadowed crater floors. Every image displays acquisition UTC, resolution, illumination phase angle, and product ID.
- **Why**: Delivers genuine photographic surface context while making it crystal clear that these are archival orbital observations, not fabricated "live camera feeds".

#### Decision 4: Profile-Driven GPU Performance Strategy
- **Chosen Approach**: Cap renderer device pixel ratio at `Math.min(window.devicePixelRatio, 1.75)`, budget directional shadow map resolution to $2048 \times 2048$ centered on the South Pole frustum, and throttle React state updates from the Three.js render loop.
- **Why**: Prevents fillrate bottlenecks on 4K/Retina displays and guarantees a consistent 60 FPS target.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LunaMission 3D Architecture                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Scenario Workspace State Authority (Site ID, UTC Epoch, Conditions) │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                ┌─────────────────────┴─────────────────────┐                │
│                ▼                                           ▼                │
│   ┌───────────────────────────────┐           ┌─────────────────────────┐   │
│   │ 3D Viewport Stage             │           │ Synchronized 2D Panel   │   │
│   │                               │           │ (Optional Split View)   │   │
│   │ ┌───────────────────────────┐ │           │                         │   │
│   │ │ Three.js Scene Builder    │ │           │ - PointPassport         │   │
│   │ │ - Lunar Globe PBR Base    │ │           │ - LOLA Elevation Curve  │   │
│   │ │ - Polar Multi-LOD Mesh    │ │           │ - Horizon Mask Chart    │   │
│   │ │ - LROC NAC / ShadowCam    │ │           │ - Sun/Earth Az/Elev     │   │
│   │ │ - Dynamic Near/Far Plane  │ │           │ - Provenance Metadata   │   │
│   │ └─────────────┬─────────────┘ │           │                         │   │
│   │               │               │           └─────────────────────────┘   │
│   │ ┌─────────────▼─────────────┐ │                                         │
│   │ │ Topocentric Orbit Engine  │ │                                         │
│   │ │ - Orthonormal ENU Basis   │ │                                         │
│   │ │ - Anti-Penetration Guard  │ │                                         │
│   │ │ - 4 Camera Presets + Fly  │ │                                         │
│   │ └───────────────────────────┘ │                                         │
│   └───────────────────────────────┘                                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Collapsible Scientific HUD (Bottom Center, Non-Occluding)           │   │
│   │ [Presets: Nadir | Oblique 45° | Overhead | Horizon]                │   │
│   │ [Diurnal Scrubber: -6h | -1h | Play/Pause | +1h | +6h]              │   │
│   │ [Layers: Relief | Imagery | Markers | Sightline | Graticule]       │   │
│   │ [LOD Readout: 64x64 / 128x128] | [Telemetry HUD] | [Zen Mode]       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Asset Manifest Schema
```typescript
export interface LunarAssetManifestEntry {
  id: string;
  sourceOrganization: 'NASA / GSFC' | 'ASU / LROC' | 'KARI / ShadowCam';
  productId: string;
  sourceUrl: string;
  version: string;
  observationEpoch: string | 'Unknown'; // ISO UTC for imagery, or 'Unknown'
  coordinateReferenceFrame: 'IAU/IAG 2000 Moon Mean Earth/Polar Axis';
  projection: 'South Polar Stereographic' | 'Equirectangular';
  longitudeConvention: '0° to 360° East-positive';
  verticalDatum: 'Mean Lunar Sphere R = 1737.4 km';
  horizontalPixelSpacing: string | 'Unknown'; // e.g. "237 m/px (128 ppd)"
  effectiveResolution: string | 'Unknown';
  verticalAccuracy: string | 'Unknown';
  coveragePolygon: [number, number][]; // [[lat, lon], ...]
  noDataValue: number | null;
  checksum: string;
  processingSteps: string[];
  validationStatus: 'Verified' | 'Reference-Only' | 'Illustrative';
}
```

#### Phased Implementation Roadmap

- [ ] **Phase 0: Baseline Reproduction & Profiling**
  - Reproduce and document polar camera singularities, flipping, and near-plane polygon clipping at Shackleton (-89.90°S).
  - Record empirical baseline performance on the test machine: median FPS, 95th percentile frame times, draw calls, and memory footprint in Chrome/WebKit.
  - Audit existing assets in `public/assets/lunar/` against licensing and provenance records.

- [ ] **Phase 1: Pilot Site Data Proof of Concept (Shackleton Connecting Ridge)**
  - Validate exact coordinates, naming lineage, and coverage boundaries for Shackleton Crater Rim (-89.90°S, 0.00°E) and Connecting Ridge (-89.44°S, 222.50°E) against authoritative NASA study catalogs.
  - Populate the `LunarAssetManifest` with strictly verified metadata (no hardcoded approximations; missing items marked `Unknown`).
  - Configure co-registered elevation grid and registered LROC NAC + ShadowCam polar imagery tiles for the pilot site.

- [ ] **Phase 2: Multi-LOD Terrain Mesh Engine**
  - Implement dynamic multi-LOD terrain patch (`globeMultiLodTerrain.ts`) switching between 64×64 and 128×128 vertex density based on camera distance and screen-space error.
  - Implement geometry skirts around tile boundaries to guarantee seamless integration with the global lunar sphere without visible cracks.
  - Compute accurate vertex normals directly from measured DEM elevation samples for physically authentic grazing illumination.

- [ ] **Phase 3: Topocentric Camera System & Polar Orbit Reliability**
  - Implement orthonormal topocentric ENU tangent basis with exact-pole ($\phi = -90^\circ$) singularity fallback to prime meridian +Z.
  - Calibrate terrain collision guard against actual measured DEM surface height, preventing subsurface penetration.
  - Implement dynamic near-clipping plane scaling ($0.002\text{ u}$ at ground level to $0.05\text{ u}$ at regional scale).
  - Add regression unit tests for camera orientation stability, handedness, and preset transition interruption.

- [ ] **Phase 4: Scientific Inspection UX & Imagery Gallery**
  - Build date-stamped archival imagery gallery in the Site Intel panel displaying observation epoch, footprint, phase angle, and resolution badge.
  - Add real-time dynamic LOD and DEM resolution indicator to the bottom scientific inspection dock.
  - Display explicit coverage and uncertainty disclosures; ensure missing metrics show as "Unavailable / Unknown" rather than false zeros.

- [ ] **Phase 5: Performance Profiling & Optimization**
  - Enforce device pixel ratio cap (`Math.min(window.devicePixelRatio, 1.75)`) and optimize polar shadow map camera frustum ($2048 \times 2048$).
  - Measure and record post-optimization frame-time distributions (median, p95, worst long-frame counts) across deep zoom cycles.
  - Ensure zero memory leaks on repeated site switches, preset toggles, and scene mount/unmount cycles.

- [ ] **Phase 6: Failure Matrix & Edge-Case Hardening**
  - Test and handle: missing or corrupted elevation tiles, out-of-bounds coordinates, exact pole navigation, rapid site switching during fly-in, and WebGL context loss recovery.
  - Add accessible keyboard navigation controls and `prefers-reduced-motion` compliance.

- [ ] **Phase 7: Comprehensive Browser Verification & Scientific Reporting**
  - Execute end-to-end Playwright browser test script validating all 16 acceptance gates.
  - Capture high-resolution validation screenshots across regional, oblique 45°, overhead, horizon, split-view, and imagery states.
  - Run full test suite (`bun test`), linting (`bun run lint`), and production build (`compile_applet`).
  - Publish the comprehensive scientific validation report with exact before/after metrics, residuals, and remaining limitations.
