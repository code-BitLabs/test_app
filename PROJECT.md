# Project: LunaMission Spatial Workspace Consolidation

## Architecture
The LunaMission spatial workspace is an aerospace-grade cartographic and planetary flight deck supporting 2D stereographic south polar exploration and 3D lunar orbital/surface operations.

### Data Flow & Component Hierarchy
1. **Root & Navigation**:
   - `App.tsx` hosts global state, active tab (`explore`), and routing aliases.
   - `Header.tsx` & `HeaderStatusControls.tsx` provide mission status and direct flight deck triggers (`🪐 3D Moon`).
2. **Workspace & Layout Shell**:
   - `SpatialWorkspace.tsx` manages view modes (`map2d`, `dual`, `globe3d`) and responsive 12-column grid layout.
   - In single modes (`map2d`, `globe3d`): 7/5 grid split (7 columns viewport + 5 columns `PointPassport`).
   - In `dual` mode: Full-width 12-column expansion (12 columns for side-by-side viewports; `PointPassport` docked in slide-over `PassportDrawer.tsx`).
   - `SpatialToolbar.tsx`: 5 stable visual slots on desktop (>=1280px) with single-line layout and zero CLS.
3. **2D Polar Map Pipeline**:
   - `SouthPoleMap.tsx`: Top-level 2D container hosting `MapToolbar`, `MapScaleBar`, `MapCanvas`, and docked `DockedMapInspector`.
   - `MapCanvas.tsx`: 1000x1000 SVG stereographic projection with `preserveAspectRatio="xMidYMid meet"`.
   - `DockedMapInspector.tsx`: Docked non-intrusive container below map canvas displaying custom point geometry and ISRU volatiles telemetry without occluding the polar disc.
4. **3D Planetary Flight Deck Pipeline**:
   - `LunarGlobe3D.tsx`: Three.js / WebGL LOLA 128ppd lunar globe rendering IAU 2000 ME frames.
   - `GlobeFlightDeckHudOverlay.tsx`: Modular HUD overlay hosting `AstronautHelmetHud` (EVA), Rover Driving HUD (Horizon), Overhead Tactical HUD, and telemetry diagnostics.
   - Consolidates all capabilities from legacy `Scenario3DLab.tsx`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Docked Inspector Bar | Replace floating cards with non-intrusive bottom inspector in 2D map | M1 | R1 (ORIGINAL_REQUEST) |
| F2 | Central Polar Disc Non-Occlusion | Guarantee 83°S-90°S disc, graticule, and candidate sites are 100% visible | M1 | R1 (ORIGINAL_REQUEST) |
| F3 | Multi-Spectral Volatiles Integration | Seamlessly display LEND & Diviner telemetry in docked inspector without stacking | M1 | R1 (ORIGINAL_REQUEST) |
| F4 | MapScaleBar Collision Elimination | Relocate scale bar / legend to resolve bottom-left corner collision | M1 | Survey 1 Findings |
| F5 | Full-Width Dual View Expansion | Expand workspace to 12 columns in Dual View for ~780px viewport breathability | M2 | R2 (ORIGINAL_REQUEST) |
| F6 | Point Passport Drawer Docking | Automatically dock Point Passport into accessible drawer overlay in Dual View | M2 | R2 (ORIGINAL_REQUEST) |
| F7 | Stable 5-Slot SpatialToolbar | Assign permanent visual slots for buttons across 2D, Dual, and 3D modes | M3 | R3 (ORIGINAL_REQUEST) |
| F8 | Compact Camera Preset Dropdown | Replace 485px flat 6-button group with compact dropdown `[ 🎥 Preset ▾ ]` | M3 | R3 (ORIGINAL_REQUEST) |
| F9 | Desktop Zero-Wrap Layout | Guarantee single-row toolbar layout on viewports >= 1280px with zero CLS | M3 | R3 (ORIGINAL_REQUEST) |
| F10 | Standalone 3D Lab Route Retirement | Eliminate `/scenario/3d-lab` route branch in `App.tsx` and alias to Explore 3D | M4 | R4 (ORIGINAL_REQUEST) |
| F11 | Navigation Header Trigger | Replace divergent `🔬 3D Lab` link with direct `🪐 3D Moon` flight deck trigger | M4 | R4 (ORIGINAL_REQUEST) |
| F12 | Complete 3D Theater Controls Unification | Expose Rover HUD, Overhead HUD, Flyover tour, and all 8 camera presets in 3D Moon | M4 | R4 (ORIGINAL_REQUEST) |
| F13 | Fullscreen Observatory Parity | Ensure Fullscreen mode inherits complete unified flight deck capabilities | M4 | R4 (ORIGINAL_REQUEST) |
| F14 | UI File Size Ceiling Compliance | Ensure every touched component is strictly <= 200 lines | M1-M4 | Arch Gates |
| F15 | Zero Regression Test Suite | Maintain 100% passing tests (`bun test`) across all suites | M1-M5 | Arch Gates |
| F16 | Clean TypeScript & Vite Build | 0 compiler errors on client/server and clean Vite bundle | M1-M5 | Arch Gates |
| F17 | E2E Browser Visual Verification | Capture screenshots via `agent-browser` validating all four core requirements | M5 | Arch Gates |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Non-Occluding Docked Inspector | Implement `DockedMapInspector`, decompose panels, eliminate floating card occlusions on 2D map, resolve scale bar collision | None | DONE |
| M2 | Full-Width Dual View Expansion | Update `SpatialWorkspace` 12-col grid, integrate `PassportDrawer` pill overlay for Dual View, ensure ~50/50 division | None | DONE |
| M3 | Stable, Predictable SpatialToolbar | Structure `SpatialToolbar` into 5 fixed visual slots, compact camera dropdown, eliminate desktop wrapping/jumping | M2 | DONE |
| M4 | 3D Moon & 3D Lab Unification | Extract `GlobeFlightDeckHudOverlay`, consolidate Rover/Overhead HUDs & Flyovers into `LunarGlobe3D`, update header & route alias | M3 | PLANNED |
| M5 | E2E Verification & Browser Audit | Execute full unit test suite, TypeScript check, Vite build, and browser screenshot verification via `agent-browser` | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 2D Map ↔ DockedMapInspector
- **Props**:
  ```ts
  interface DockedMapInspectorProps {
    customPointData: CustomPointAnalysis | null;
    selectedSite: CandidateSite | null;
    scientificMapMode: ScientificMapLayerMode;
    onClose: () => void;
    onSelectNearestSite: (site: CandidateSite) => void;
  }
  ```
- **Panel Separation**:
  - `InspectorGeometryPanel`: accepts `customPointData`, `selectedSite`, `onSelectNearestSite`.
  - `InspectorVolatilesPanel`: accepts `latDeg`, `lonDeg`, `scientificMapMode`.

### SpatialWorkspace ↔ Dual View & PassportDrawer
- **Dual View Layout State**:
  - `viewMode === 'dual'` applies `lg:col-span-12` to viewport container.
  - `PointPassport` rendered in normal right column when `viewMode !== 'dual'`.
  - `PassportDrawer` rendered as slide-over overlay in `dual` mode when `isPassportDrawerOpen === true`.
  - Toggle pill rendered in header/toolbar: "Point Passport".

### SpatialToolbar ↔ CameraPresetSelector
- **Compact Dropdown Contract**:
  ```ts
  interface CameraPresetSelectorProps {
    activePreset: CameraPresetId;
    onSelectPreset: (preset: CameraPresetId) => void;
    disabled?: boolean;
    compact?: boolean;
  }
  ```
  - Presets list: `global`, `southPole`, `oblique`, `site`, `inspection`, `overhead`, `horizon`, `eva`.

### Navigation Header ↔ SpatialWorkspace
- Direct navigation trigger dispatches tab change to `'explore'` and signals `SpatialWorkspace` to activate `globe3d` view mode.
- Route `/scenario/3d-lab` aliases directly to `explore` tab with `viewMode = 'globe3d'`.

---

## Code Layout & Hard Ceilings
All touched UI components must strictly adhere to the `<= 200 lines` enterprise hard ceiling:

| Component File | Role | Expected Lines | Ceiling |
|---|---|---|---|
| `src/features/spatial/map/components/inspector/DockedMapInspector.tsx` | Docked inspector root | ~140 lines | 200 |
| `src/features/spatial/map/components/inspector/InspectorGeometryPanel.tsx` | Point coordinates & geometry | ~90 lines | 200 |
| `src/features/spatial/map/components/inspector/InspectorVolatilesPanel.tsx` | LEND/Diviner ISRU data | ~100 lines | 200 |
| `src/features/spatial/map/components/MapSvgDefs.tsx` | SVG gradients & patterns | ~40 lines | 200 |
| `src/features/spatial/map/components/MapCanvas.tsx` | Map SVG canvas | ~175 lines | 200 |
| `src/features/spatial/ui/SouthPoleMap.tsx` | 2D map parent container | ~170 lines | 200 |
| `src/features/spatial/ui/SpatialWorkspace.tsx` | Main spatial workspace container | ~160 lines | 200 |
| `src/features/spatial/ui/SpatialViewport.tsx` | Viewport split manager | ~115 lines | 200 |
| `src/features/spatial/components/toolbar/SpatialToolbar.tsx` | Top toolbar with visual slots | ~130 lines | 200 |
| `src/features/spatial/components/toolbar/CameraPresetSelector.tsx` | Compact preset dropdown | ~70 lines | 200 |
| `src/features/spatial/ui/LunarGlobe3D.tsx` | Primary 3D Moon component | ~145 lines | 200 |
| `src/features/spatial/globe/components/GlobeFlightDeckHudOverlay.tsx` | 3D flight deck HUD overlay | ~90 lines | 200 |
| `src/app/App.tsx` | Root application & route alias | ~105 lines | 200 |
| `src/app/header/components/HeaderStatusControls.tsx` | Header controls & 3D trigger | ~65 lines | 200 |
