# LunaMission — Project Brief

**Status:** Approved Mission Control Baseline & Active Challenge Execution  
**Version:** 2.1  
**Last updated:** 27 October 2026  
**Project category:** NASA Space Apps Challenge 2026  
**Challenge:** Lunar Landing Site Navigator  
**Related documents:** `docs/prd/LunaMission_Explorer_PRD_v1.md`, `docs/LunaMission_ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SCIENCE_FEASIBILITY.md`, `docs/VALIDATION_PLAN.md`, `docs/DESIGN_SPEC.md`

---

## Executive Progress & Readiness Tracker

> **Current Maturity Assessment:** Active Mission Operations & Engineering R&D  
> **Challenge Full-Scope Completion:** `[█████░░░░░] 52%`  
> *Phase 1 (Core Flight Deck) & Phase 2 (Advanced Mission Workspaces) are complete. Phase 3 (Deep Surface Science & Live Tile Caching) and Phase 4 (Autonomous Operations & Trajectory) are in active development.*

```
========================================================================================
LUNAMISSION OVERALL READINESS: [█████████████░░░░░░░░░░░░] 52% (Active R&D)
========================================================================================
  [██████████] 100% - Multi-Spectral 2D Polar Cartography (LOLA, LROC, SVS 3727)
  [█████████░]  90% - Authoritative 3D Lunar Globe & WebGL Pipeline (SMAAPass)
  [████████░░]  80% - Dedicated 3D Planetary Theater (`/scenario/3d-lab` & Rover)
  [████████░░]  80% - Multi-Site Candidate Comparison Matrix (`/compare`)
  [███████░░░]  70% - Topocentric Horizon Radar & Sky Dome (`/horizon`)
  [███████░░░]  70% - Live NASA REST API Ingestion (Moon Trek, JPL Horizons, Images)
  [██████░░░░]  60% - Deep Space Network (DSN) RF Telecom Link Budget Engine
  [██████░░░░]  60% - Surface Rover Traversal Planner & Elevation Profile (`/traverse`)
  [████░░░░░░]  40% - Direct PDS LOLA Altimetry GeoTIFF Streaming & Tiling
  [██░░░░░░░░]  20% - Orbital Descent Trajectory, $\Delta v$ & Propellant Budget (FR-13)
  [█░░░░░░░░░]  10% - AI Mission Copilot & Anomaly Diagnostics (FR-14)
========================================================================================
```

### Detailed Subsystem Progress Tracker

| Subsystem / Capability | Progress Bar | Status | % Done | Target Milestone |
| :--- | :--- | :---: | :---: | :--- |
| **2D Polar Cartography & Overlays** | `[██████████]` | ✅ Complete | 100% | Phase 1 Baseline |
| **Authoritative 3D Globe & WebGL** | `[█████████░]` | 🔧 Advanced | 90% | Phase 1 Baseline |
| **Dedicated 3D Planetary Theater (`/scenario/3d-lab`)** | `[████████░░]` | 🔧 Advanced | 80% | Phase 2 Expansion |
| **Candidate Site Comparison Matrix (`/compare`)** | `[████████░░]` | 🔧 Advanced | 80% | Phase 2 Expansion |
| **Ephemeris & Topocentric Horizon (`/horizon`)** | `[███████░░░]` | 🔧 Operational | 70% | Phase 2 Expansion |
| **NASA Live REST API Ingestion (Moon Trek, JPL, SVS)** | `[███████░░░]` | 🔧 Operational | 70% | Phase 3 Mission Ops |
| **DSN RF Telecom Link Budget Engine** | `[██████░░░░]` | 🔧 Functional | 60% | Phase 3 Mission Ops |
| **Autonomous Rover Traversal (`/traverse`)** | `[██████░░░░]` | 🔧 Functional | 60% | Phase 3 Mission Ops |
| **Executive Mission Dossier Exporter** | `[██████████]` | ✅ Complete | 100% | Phase 2 Expansion |
| **Mobile & Tablet Touch Gestures** | `[██████████]` | ✅ Complete | 100% | Phase 1 Baseline |
| **Direct NASA Altimetry Tiling (LOLA DEM PDS GeoTIFFs)** | `[████░░░░░░]` | 📋 In Progress | 40% | Phase 4 Deep Science |
| **Flight Dynamics Descent Trajectory & $\Delta v$ (FR-13)** | `[██░░░░░░░░]` | 📋 Planned | 20% | Phase 4 Deep Science |
| **AI Flight Copilot & Anomaly Diagnostics (FR-14)** | `[█░░░░░░░░░]` | 📋 Planned | 10% | Phase 5 Autonomous Ops |
| **Comprehensive Mission Planning (Overall System)** | `[█████░░░░░]` | 🚀 Active R&D | **52%** | **NASA Challenge Release** |

---

## 1. Project at a glance

**LunaMission** is an enterprise aerospace-grade lunar mission flight deck and decision-support platform designed for the NASA Space Apps Challenge "Lunar Landing Site Navigator". It helps flight dynamics engineers, mission planners, planetary scientists, educators, and the public explore and compare candidate lunar landing locations and dates by making Sun geometry, illumination opportunity, Earth visibility, direct-to-Earth (DTE) communication windows, and geotechnical terrain hazards easier to understand.

The application turns mission-planning questions that normally require specialized tools, disconnected command-line scripts, and fragmented planetary data into a clear, visual, time-aware, and explainable workflow across 7 dedicated operational workspaces:

1. **Explore (`/explore`):** Unified Spatial Flight Deck combining interactive 2D Polar Map, Dual View, 3D Moon Flight Deck, docked coordinate inspector, and time progression scrubber.
2. **3D Lab (`/scenario/3d-lab`):** Dedicated Planetary Theater featuring dual split view, Surface Rover EVA driving simulator (WASD with pitch/roll slope physics), Astronaut xEMU Helmet Visor HUD, and 8 camera presets.
3. **Site Compare (`/compare`):** Multi-criteria trade-off decision matrix comparing candidate sites across illumination, slope, Earth visibility, and volatile potential.
4. **Topocentric Horizon (`/horizon`):** 360° radar and sky dome rendering local terrain elevation obstruction profiles, Sun elevation tracks, and Earth libration.
5. **Rover Traversal (`/traverse`):** Slope-aware A*/Dijkstra pathfinding between lander touchdown coordinates and Permanently Shadowed Region (PSR) volatile cold traps.
6. **NASA Footage Gallery (`/gallery`):** Curated multimedia archive powered by NASA's Image & Video Library REST API (`images-api.nasa.gov`) and Goddard SVS hyperwall assets.
7. **Methodology (`/methodology`):** Formal mathematical specifications, physical constants, sensor specifications, error budgets, and API contracts.

**Core interaction:** select a supported candidate site or click custom coordinates, choose a UTC time or interval, inspect Sun and Earth geometry relative to the local horizon, and compare the result with other candidate locations.

---

## 2. The challenge and domain problem

Lunar south-pole mission planning ($80^\circ\text{S} - 90^\circ\text{S}$) is affected by difficult lighting conditions and communication geometry:
- **Grazing Solar Illumination ($0.5^\circ - 2.0^\circ$):** Because the Moon has an axial tilt of only $1.54^\circ$, the Sun stays near the local horizon, casting multi-kilometer shadows. Elevated crater rims receive extended sunlight periods ("peaks of eternal light"), while deep crater floors remain in permanent darkness (Permanently Shadowed Regions or PSRs at 20–40 Kelvin).
- **Direct-to-Earth (DTE) Telecom Libration:** The Moon's optical and physical libration ($\pm 6.7^\circ$ in latitude, $\pm 7.9^\circ$ in longitude) modulates Earth elevation on a 27.3-day synodic cycle. If Earth dips below local terrain ridges, high-rate direct communication with NASA Deep Space Network (DSN) stations (Goldstone, Madrid, Canberra) is severed.
- **Geotechnical Hazards:** Touchdown safety requires terrain slopes $<15^\circ$ to prevent lander tip-over or engine bell impingement.
- **Cryogenic Volatile Prospecting (ISRU):** Locating accessible sub-surface water ice for In-Situ Resource Utilization requires correlating Lunar Exploration Neutron Detector (LEND) epithermal neutron suppression with Diviner Lunar Radiometer maximum summer temperatures ($T_{\text{max}} < 110\text{ K}$).

The challenge is not simply to render an attractive 3D Moon. It is to help users answer practical comparison questions clearly, consistently, and with visible evidence about how each result was obtained.

---

## 3. The proposed solution

LunaMission delivers an integrated, multi-modal mission control experience:

1. **Select a supported lunar location:** All 13 official Artemis III candidate landing regions pre-loaded, plus custom 3D pinpoint raycasting on IAU 2000 coordinates.
2. **Choose a date and time:** Canonical UTC timestamp with sub-second recalculation of sub-solar and sub-Earth coordinates.
3. **Inspect Sun geometry and illumination:** Direction and elevation relative to the local horizon, with terrain-occlusion and shadow analysis.
4. **Inspect Earth geometry and DSN telecom link:** Earth direction, geometric visibility, point-to-Earth range, theoretical light-travel time, and DSN RF link margin ($C/N_0 \ge 3\text{ dB}$).
5. **Compare multiple locations:** Synchronized side-by-side evaluation under identical epochs and astrodynamic assumptions.
6. **Explore opportunity windows:** Evaluates Pareto-optimal landing windows ranking continuous illumination and communication periods.
7. **Transparent scientific evidence:** Shows units, data coverage, calculation methods, source/model versions, and quality flags (with explicit `geometry-only`, `terrain-aware`, or `insufficient-data` labeling).
8. **Surface Rover Traversal:** Autonomous pathfinding computing distance, slope-impedance, and rover energy budgets.
9. **Executive Mission Dossier:** One-click generation of comprehensive mission packages in Markdown and JSON formats.

Scientific correctness and an understandable comparison workflow take priority over visual complexity.

---

## 4. Intended users

- **Mission planners and technical analysts:** Needing to compare site/time conditions, inspect landing ellipses, and verify error budgets.
- **Planetary scientists and geologists:** Correlating crater morphology, slope hazard envelopes, and volatile cold traps.
- **Educators and students:** Exploring lunar south-pole illumination and orbital libration through intuitive interfaces.
- **The public and hackathon reviewers:** Evaluating scientific rigor, usability, and domain alignment without requiring specialized command-line tools.

The application is an evidence-led decision-support platform. It is not, by itself, an operational flight-certification system.

---

## 5. MVP scope & feature status

| Capability Area | Status | Progress | Technical Realization |
| :--- | :---: | :---: | :--- |
| **Site Selection & Graticule** | ✅ Delivered | `[██████████]` 100% | 13 Artemis III sites + custom 3D pinpoint raycasting on IAU 2000 ME. |
| **Ephemeris & Orbit Mechanics** | ✅ Delivered | `[██████████]` 100% | Analytical JPL/Meeus equations validated within $<0.05^\circ$ against JPL Horizons API. |
| **LOLA 20m Altimetry & Shading** | ✅ Delivered | `[██████████]` 100% | Radial polar cap geometry with NASA SVS 3727 16-color hypsometry and elevation scale bar. |
| **Grazing Solar Raytracing & PSRs** | ✅ Delivered | `[██████████]` 100% | Directional solar lighting ($0.5^\circ - 2.0^\circ$) casting authentic crater rim shadows into cold traps. |
| **Slope Hazard Classification** | ✅ Delivered | `[██████████]` 100% | Server-side slope matrix calculation with explicit tip-over hazard gating ($\ge 15^\circ$). |
| **DSN RF Telecom Link Budget** | 🔧 Functional | `[██████░░░░]` 60% | NextRush microservice evaluating Ka-band 26 GHz and S/X-band margins against DSN 34m/70m. |
| **Surface Rover Traversal Planner** | 🔧 Functional | `[██████░░░░]` 60% | Slope-aware Dijkstra/A* pathfinder with elevation cross-section profile and energy budget. |
| **Pareto Landing Window Solver** | 🔧 Advanced | `[████████░░]` 80% | Multi-criteria optimization ranking touchdown epochs across illumination and DTE visibility. |
| **Dedicated 3D Planetary Theater** | 🔧 Advanced | `[████████░░]` 80% | `/scenario/3d-lab` with WASD rover simulator, xEMU visor HUD, and 8 camera presets. |
| **NASA Imagery & Footage Gallery** | 🔧 Operational | `[███████░░░]` 70% | Live proxy integration with NASA Image & Video Library REST API (`images-api.nasa.gov`). |
| **Multi-Touch Gestures** | ✅ Delivered | `[██████████]` 100% | 1-finger pan, 2-finger zoom/rotate with `touch-action: none` gesture isolation. |
| **Executive Dossier Exporter** | ✅ Delivered | `[██████████]` 100% | `/api/dossier/generate` generating formatted mission summaries and export artifacts. |
| **PDS LOLA GeoTIFF Tiling** | 📋 In Progress | `[████░░░░░░]` 40% | Server-side chunked GeoTIFF reader streaming real-time elevation tiles to Three.js meshes. |
| **Descent Trajectory & $\Delta v$ (FR-13)** | 📋 Planned | `[██░░░░░░░░]` 20% | Powered descent initiation (PDI), gate checkpoints, fuel mass ratio, and engine burn profiles. |
| **AI Copilot & Diagnostics (FR-14)** | 📋 Planned | `[█░░░░░░░░░]` 10% | Context-aware mission assistant answering natural language questions about site safety. |

---

## 6. What we will deliberately NOT build for the hackathon MVP

- No launch simulator, orbital transfer optimizer, or trans-lunar injection (TLI) model.
- No rocket hardware design, tank sizing, or payload integration simulator.
- No real-time spacecraft telemetry parser or live mission command uplink.
- No unvalidated "survival probability" percentage (we report explicit multi-criteria constraints).
- No ungrounded 3D game physics (everything is bound to lunar gravity $1.62\text{ m/s}^2$ and LOLA terrain).

---

## 7. Product principles

1. **Product, not game:** A serious decision-support browser for mission planning, not an ungrounded simulator.
2. **Challenge first:** Keep the focus on landing site comparison, Sun/Earth geometry, illumination opportunity, and DTE communication.
3. **Show the evidence beside the claim:** Every score or chart must show units, data source, and assumptions.
4. **Honest precision:** Clearly distinguish geometric estimates from terrain-aware calculations; never present an ideal calculation as an operational certainty.
5. **Fast comprehension:** A user should understand what a site offers within two minutes.
6. **Compare like with like:** Comparison requires identical UTC epochs, frames, and constraint thresholds.
7. **Clean boundary:** Domain science is computed in tested backend/core logic, never guessed in UI components.
8. **No NPM:** All package workflows strictly use Bun.
9. **Fortune 100 Engineering Ceilings:** Strict file size hard caps enforced across all repository files.

---

## 8. Hackathon delivery strategy

### What a great hackathon product looks like

- Solves the actual problem stated in the challenge.
- Demonstrates NASA data used meaningfully.
- Produces a clear, explainable result.
- Provides a polished, reliable user experience.
- Communicates its value quickly in a demonstration.

### What we deliver by demo time

- A clean web application running smoothly on modern browsers.
- A functional vertical slice for the 13 Artemis III sites and custom coordinates.
- A side-by-side comparison between candidate sites with visible differences in illumination and DTE visibility.
- A dedicated 3D Planetary Theater with surface rover inspection.
- Clear attribution for NASA data sources and honest labeling of model limitations.

---

## 9. Success criteria

- A reviewer can select two sites, pick a date, and immediately identify which offers better illumination and why.
- The Sun and Earth horizon positions match independent NASA references (e.g. JPL Horizons).
- The application handles edge cases gracefully (missing data, polar coordinates, high slopes).
- The codebase passes all automated test suites with zero type errors.

---

## 10. Project milestones & status

| Milestone | Target | Status | Progress | Deliverables |
| :--- | :--- | :---: | :---: | :--- |
| **M0: Foundation & Setup** | Day 1 | ✅ Complete | `[██████████]` 100% | Bun workspace, Vite 8 + React 19, Three.js, NextRush server skeleton. |
| **M1: Science Feasibility Spike** | Day 2 | ✅ Complete | `[██████████]` 100% | Analytical ephemeris verified $<0.05^\circ$ vs JPL Horizons API; coordinate frames. |
| **M2: Vertical Slice** | Day 3 | ✅ Complete | `[██████████]` 100% | 2D polar map + 3D Moon + docked inspector + time scrubber. |
| **M3: Spatial & 3D Lab Integration** | Day 4 | ✅ Complete | `[██████████]` 100% | Dedicated `/scenario/3d-lab`, WASD rover simulator, xEMU HUD, 8 camera presets. |
| **M4: Multi-Page Navigation Suite** | Day 5 | ✅ Complete | `[██████████]` 100% | 7-page navigation (`/explore`, `/scenario/3d-lab`, `/compare`, `/horizon`, `/traverse`, `/gallery`, `/methodology`). |
| **M5: Backend REST Calculation Engine** | Day 6 | ✅ Complete | `[██████████]` 100% | NextRush service on port 3001 (`/api/terrain/slope-roughness`, `/api/landing-safety/evaluate`, `/api/ephemeris/horizons`). |
| **M6: Fortune 100 Refactoring & Testing** | Day 7 | ✅ Complete | `[██████████]` 100% | File ceiling refactoring ($\le 200\text{L}$ UI), 718 automated tests, 10,000-cycle fuzzer. |
| **M7: Live Altimetry Tiling (LOLA DEM)** | Week 2 | 📋 In Progress | `[████░░░░░░]` 40% | Direct chunked GeoTIFF tile streaming from NASA PDS archives. |
| **M8: Descent Trajectory & $\Delta v$ (FR-13)** | Week 3 | 📋 Planned | `[██░░░░░░░░]` 20% | PDI checkpoint solver, fuel burn optimization, terrain collision avoidance. |
| **M9: AI Copilot & Anomaly Assist (FR-14)** | Week 4 | 📋 Planned | `[█░░░░░░░░░]` 10% | Natural language flight assistant for site safety queries. |

---

## 11. Main risks and mitigations

| Risk | Impact | Response & Status |
| :--- | :---: | :--- |
| **Incorrect frames or UTC handling** | High | Resolved: Validated against JPL Horizons ephemeris; explicit IAU 2000 ME frame declared. |
| **Large DEM bandwidth / browser lag** | High | Resolved: Pre-processed multi-spectral layers; server-side slope computation in NextRush. |
| **Too much effort on 3D vs Science** | Med | Mitigated: Balanced 7-page suite giving equal weight to Methodology, Horizon Radar, and Comparison. |
| **False precision in suitability scores** | High | Mitigated: Replaced arbitrary percentage with 5-factor weighted safety matrix and explicit `GO`/`ABORT` triggers. |
| **Mobile touch navigation conflicts** | Med | Resolved: Integrated 1-finger pan and 2-finger pinch/zoom with CSS `touch-action: none`. |
| **API rate limiting by external NASA servers** | Med | Mitigated: Local NextRush caching layer for JPL Horizons and NASA Images proxies. |

---

## 12. Project documents

| Document | Purpose |
|---|---|
| `docs/PROJECT_BRIEF.md` | Executive project brief, readiness trackers, progress bars, and high-level milestones. |
| `docs/prd/LunaMission_Explorer_PRD_v1.md` | Comprehensive PRD, MoSCoW functional requirements FR-01 through FR-14, scientific policies, and user journeys. |
| `docs/LunaMission_ARCHITECTURE.md` | System boundaries, tech stack, NextRush microservice, 7-page navigation, and Fortune 100 standards. |
| `docs/DECISIONS.md` | Architecture Decision Records (ADRs) DEC-001 through DEC-030 and open engineering questions. |
| `docs/SCIENCE_FEASIBILITY.md` | Astrodynamic models, IAU frames, physical constants, DEM altimetry, and experiment results. |
| `docs/DESIGN_SPEC.md` | Interface layout, touch ergonomics, 3D Lab specifications, cognitive laws, and visual tokens. |
| `docs/VALIDATION_PLAN.md` | 5-tier test architecture, 8-part test catalog, tolerances, and 718-test audited baseline. |

---

## 13. External references & NASA data sources

- **Official Challenge:** [NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)
- **LPI Lunar South Pole Atlas:** https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/
- **NASA SVS 5127 (Moon's South Pole Lighting):** https://svs.gsfc.nasa.gov/5127
- **NASA SVS 3633 (South Pole Illumination and Topography):** https://svs.gsfc.nasa.gov/3633/
- **NASA SVS 3727 (Color-Shaded Relief):** https://science.nasa.gov/resource/color-shaded-relief-map-of-the-moons-south-polar-region/
- **NASA Moon Trek WMTS API:** https://trek.nasa.gov/
- **NASA JPL SSD Horizons API:** https://ssd.jpl.nasa.gov/api/horizons.api
- **NASA Image and Video Library:** https://images-api.nasa.gov/
- **NASA PGDA Products (LOLA DEM):** https://pgda.gsfc.nasa.gov/products/78
- **NASA Water and Ices Overview:** https://science.nasa.gov/moon/moon-water-and-ices/

---

**One-line pitch:** LunaMission makes lunar south-pole landing-site and time trade-offs understandable in minutes by synthesizing high-resolution orbiter altimetry, solar illumination geometry, Earth libration telecom windows, and autonomous rover traversal into an enterprise flight deck.
