# 3D Lunar Terrain & Navigation Overhaul: Overhead & Horizon Modes

A definitive engineering plan to resolve terrain distortion, unrealistic dark shading, coordinate singularities, and visual overlay clutter in close-up Overhead and Horizon exploration modes, benchmarked against NASA Moon Trek.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following technical directions and user clarifications govern this overhaul:
> 1. **Balanced Lunar Lighting (NASA Moon Trek Benchmark)**: Implement physically plausible lunar surface shading with subtle slope illumination that highlights crater rims, massifs, slopes, and floor depressions. Calibrate ambient and earthshine fill to maintain clear readability without pitch-black void cavities or washed-out glare.
> 2. **Topocentric Tangent-Plane Mesh Generation (Zero Polar Singularity)**: Replace naive equirectangular latitude/longitude sampling with metric topocentric East-North-Up (ENU) tangent grid sampling. This completely eliminates pole crossing artifacts, inverted triangles, and negative normal flipping near 90°S.
> 3. **Smart Deep-Zoom Auto-Decluttering**: Automatically fade and hide nonessential structural outlines (crater wireframes, global footprint rings, celestial vector lines) at deep zoom ($d < 0.65\text{ u}$), preserving only a delicate coordinate datum crosshair and the active candidate pin. Retain manual toggle override in the HUD.
> 4. **Authentic NASA LOLA Topography & Micro-Relief Normals**: Maintain true NASA LOLA altimetry elevation profiling while synthesizing high-frequency micro-relief normals to reveal regolith texture and slope definition from any viewing angle.
> 5. **Terrain-Conscious Camera Dynamics**: Bound camera pitch, orbit pivot, and near-clipping plane dynamically against local LOLA elevation, preventing subsurface clipping and disorienting gimbal flips in Horizon and Overhead modes.

---

### 1. Overview & Core Concept

- **What It Delivers**: A realistic, scientifically grounded 3D lunar surface exploration experience. Users can inspect candidate landing sites—specifically **Site 001: Shackleton Crater Rim**—from regional polar orbit down to astronaut eye-level Horizon views and tactical Overhead landing perspectives with natural lunar topography, balanced illumination, and zero visual clutter.
- **Visual Reference**: NASA Moon Trek (trek.nasa.gov) 3D lunar surface visualization standard.
- **Key Beneficiaries**: Mission planners, planetary science researchers, and aerospace engineers analyzing candidate landing site topography, low-angle solar illumination, and terrain clearance.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Seamless Deep Zoom to Overhead (Mode D)**:
   - User switches to **Overhead** mode.
   - Camera glides smoothly to a high-angle tactical nadir perspective directly above the candidate datum.
   - Nonessential guide circles and distant outlines cleanly fade out. The terrain displays crisp, continuous crater relief, rim slopes, and natural regolith albedo without wireframe clutter.
2. **Immersive Ground-Level Horizon Inspection (Mode E)**:
   - User switches to **Horizon** mode.
   - Camera positions at astronaut/lander eye-level ($0.015\text{ u}$ altitude above local LOLA terrain) angled toward the sunward horizon.
   - Balanced Moon Trek style lighting reveals the crest of Shackleton rim rising in relief against subtle ambient space fill. Shadowed slopes remain clearly readable.
   - 360° orbit rotation glides predictably around the local terrain normal without dipping below ground or flipping upside down.
3. **Manual Overlay Control**:
   - The user can open the bottom dock at any zoom level to toggle individual layers (Relief, Sites, Labels, Vectors, Graticule) on or off.

#### B. Visual Identity & 60-30-10 Theme System
- **60% Primary Deep Space Canvas**: Obsidian space void (`#07090E` / `#0B0E17`) providing clean celestial backdrop.
- **30% Lunar Regolith Surface & Structural HUD**: Calibrated lunar highland albedo (`#B8BDC7` to `#8F96A3`) with subtle slope definition and slate instrument docking (`#111827`, `#0F172A`).
- **10% Calibrated Telemetry Accents**:
  - Laser Cyan (`#06B6D4`): Active candidate datum crosshair and selected mode indicator.
  - Solar Amber (`#F59E0B`): Sub-solar azimuth indicator and low-elevation grazing warning.
  - Slate White (`#F8FAFC`): Tabular monospace telemetry measurements.
- **Zero-Pill Discipline**: All status indicators, resolution badges, and coordinate readouts use unboxed text with typographic bullet separators (`·`).

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Topocentric Tangent-Grid Terrain Projection vs. Spherical Lat/Lon Grid
- **Chosen Approach**: Generate the local terrain patch using a planar East-North-Up (ENU) metric grid anchored at the site coordinates $(u, v) \in [-L, +L]$, project each grid vertex radially onto the reference sphere, and displace radially by LOLA elevation:
  $$\mathbf{P}(u, v) = \text{normalize}\left(\mathbf{C}_{\text{site}} + u\hat{\mathbf{E}} + v\hat{\mathbf{N}}\right) \cdot (R_{\text{moon}} + h_{\text{LOLA}}(u, v))$$
- **Why**: Eliminates polar coordinate singularity at $-89.90^\circ\text{S}$. In the previous implementation, stepping latitude past $-90^\circ$ inverted polygons, scrambled triangle winding, and inverted surface normals, causing distorted spikes and pitch-black shading.
- **Alternatives Considered**: Truncating latitude at $-89.99^\circ$. Rejected because it creates severe anisotropic stretching and mesh distortion.

#### Decision 2: Balanced Moon Trek Photometric Lighting Model
- **Chosen Approach**: Combine physically directed sunlight with calibrated ambient wrap-fill (`0.28` intensity) and Earthshine backfill (`0.22` intensity), supplemented by micro-relief normal perturbation.
- **Why**: Pure directional sunlight at lunar polar grazing angles ($< 1.5^\circ$) casts 90% of the local terrain into impenetrable pure black. Moon Trek maintains subtle ambient illumination so shadowed crater floors, ridges, and slopes remain legible to human eyes during 3D navigation.
- **Alternatives Considered**: Unlit color maps. Rejected as non-physical and toy-like.

#### Decision 3: Automatic Distance-Based Overlay Decluttering
- **Chosen Approach**: Hook overlay visibility into camera-to-target distance $d$. When $d < 0.65\text{ u}$ (Modes C, D, E), auto-hide global crater rim wireframes, footprint rings, and vector arrows, keeping only the candidate datum pin and crosshair.
- **Why**: Overlays designed for global/regional scale become giant visual obstacles at sub-kilometer scale. Auto-decluttering keeps the terrain unobstructed while allowing manual overrides via the HUD toggles.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LunaMission 3D Overhaul Architecture                  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Scenario Context Authority (Selected Site, UTC Epoch, Ephemeris)   │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Three.js Scene Builder & Render Lifecycle                           │   │
│   │                                                                     │   │
│   │ ┌───────────────────────────┐       ┌─────────────────────────────┐ │   │
│   │ │ Multi-LOD Terrain Engine  │       │ Moon Trek Lighting Rig      │ │   │
│   │ │ - Topocentric ENU Grid    │       │ - Directional Grazing Sun   │ │   │
│   │ │ - Bicubic LOLA Sampling   │       │ - Earthshine Diffuse Fill   │ │   │
│   │ │ - Micro-Relief Normal Map │       │ - Ambient Space Scatter     │ │   │
│   │ │ - Perimeter Skirt Seams   │       │ - Regolith PBR Material     │ │   │
│   │ └─────────────┬─────────────┘       └──────────────┬──────────────┘ │   │
│   │               │                                    │                │   │
│   │ ┌─────────────▼────────────────────────────────────▼──────────────┐ │   │
│   │ │ Camera Navigation & Collision Engine                            │ │   │
│   │ │ - ENU Local Orbit Pivot (Overhead / Horizon Modes)              │ │   │
│   │ │ - Dynamic Near-Plane Slicing (0.002u at Ground Level)           │ │   │
│   │ │ - Real LOLA Elevation Collision Guard (Prevents Subsurface Dip) │ │   │
│   │ └─────────────────────────────────┬───────────────────────────────┘ │   │
│   │                                   │                                 │   │
│   │ ┌─────────────────────────────────▼───────────────────────────────┐ │   │
│   │ │ Adaptive Visual Hierarchy & Overlay Manager                     │ │   │
│   │ │ - Auto-Decluttering: Fades Wireframes & Vectors at Close Zoom   │ │   │
│   │ │ - Rescaled Site Marker Pin & Datum Crosshair                    │ │   │
│   │ └─────────────────────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                      │
│                                      │                                      │
│   ┌──────────────────────────────────┴──────────────────────────────────┐   │
│   │ Collapsible Scientific HUD (Camera Presets | Layers | Diagnostics)  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Execution Phases

- [ ] **Phase 1: Topocentric Tangent-Grid Terrain Patch (`globeMultiLodTerrain.ts`)**
  - Refactor `buildTerrainPatchGeometry` to construct a regular $(X, Y)$ metric grid on the site's topocentric ENU tangent plane rather than spherical $(\text{lat}, \text{lon})$.
  - Project points radially onto the lunar sphere to prevent latitude overflow below $-90^\circ$ and eliminate polar seam distortions.
  - Upgrade LOLA elevation sampling with smooth bicubic interpolation and calculate accurate surface vertex normals.
  - Generate a procedural high-frequency micro-relief normal texture to give regolith realistic granular depth and slope definition under grazing light.

- [ ] **Phase 2: Moon Trek Balanced Lighting & Regolith Material (`globeScene.ts`, `globeSurfaceMaterial.ts`)**
  - Adjust celestial lighting rig in `globeScene.ts`: boost ambient space light intensity (`0.26`) with cool lunar fill tint, calibrate earthshine fill (`0.22`), and tune directional sun brightness (`2.2`).
  - Upgrade terrain material with calibrated roughness (`0.92`), subtle diffuse wrap, and polygon offset to eliminate shadow acne and z-fighting.
  - Ensure shadowed craters display subtle slope shading rather than pitch-black occlusion.

- [ ] **Phase 3: Deep-Zoom Overlay Decluttering & Anchoring (`globeSiteMarkers.ts`, `globePolarTerrain.ts`)**
  - In `applyMarkerHorizonOcclusion` and `globeSceneBuilder.ts`, check distance to target $d$: when $d < 0.65\text{ u}$, auto-hide crater outline loops, massif ridge lines, and global graticule rings unless explicitly overridden.
  - Refine Candidate Coordinate Benchmark crosshairs: render delicate 1px laser cyan datum ticks anchored flush to the local LOLA surface elevation.
  - Scale marker beacons and billboard badges proportionally so they never obstruct local crater rims.

- [ ] **Phase 4: Camera Presets & Collision Hardening (`globeCameraPresets.ts`, `globeSceneBuilder.ts`)**
  - Recalibrate **Overhead Mode**: Set look target directly to the candidate surface datum, position camera at $0.095\text{ u}$ along the local surface normal, and align up-vector with topocentric North.
  - Recalibrate **Horizon Mode**: Position camera at $0.012\text{ u}$ normal altitude, look target at $0.050\text{ u}$ forward along the azimuth of the sun or terrain crest, and lock OrbitControls up-vector to the local surface normal.
  - Enforce terrain-aware collision detection in `globeSceneBuilder.ts`: compute local terrain surface radius $R_{\text{local}} = R_{\text{moon}} + h_{\text{LOLA}}$ and clamp minimum camera altitude to $R_{\text{local}} + 0.003\text{ u}$.

- [ ] **Phase 5: Automated Test Matrix & Browser Verification**
  - Update unit test suites in `src/features/spatial/globe/__tests__/` to test topocentric mesh geometry, collision bounds, and auto-decluttering thresholds.
  - Run `scripts/verify-3d-lab.ts` in Playwright headless Chromium to capture updated verification screenshots across Overhead, Horizon, and maximum zoom states.
  - Ensure all 207+ tests pass, with 0 lint errors and clean compilation.
