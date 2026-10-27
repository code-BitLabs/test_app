# LunaMission — Project Brief

**Status:** Approved production baseline  
**Version:** 2.0  
**Last updated:** 27 October 2026  
**Project category:** NASA Space Apps Challenge 2026  
**Challenge:** Lunar Landing Site Navigator  
**Related documents:** `docs/prd/LunaMission_Explorer_PRD_v1.md`, `docs/LunaMission_ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SCIENCE_FEASIBILITY.md`, `docs/VALIDATION_PLAN.md`, `docs/DESIGN_SPEC.md`

---

## 1. Project at a glance

**LunaMission** is an enterprise aerospace-grade lunar mission flight deck and planning platform designed for the NASA Space Apps Challenge "Lunar Landing Site Navigator". It enables flight dynamics engineers, mission planners, planetary scientists, educators, and the public to evaluate and compare the 13 candidate Artemis III landing zones ($80^\circ\text{S} - 90^\circ\text{S}$) alongside custom pinpointed landing coordinates.

The system translates complex astrodynamic models, multi-spectral lunar orbiter altimetry, and communications link physics into an interactive, time-synchronized 7-page Mission Control suite:
1. **Explore (`/explore`):** Unified 2D Polar Map, Dual View, 3D Moon Flight Deck, docked coordinate inspector, and time progression scrubber.
2. **3D Lab (`/scenario/3d-lab`):** Dedicated Planetary Theater featuring dual split view, Surface Rover EVA driving simulator (WASD with pitch/roll slope physics), Astronaut xEMU Helmet Visor HUD, and 8 camera presets.
3. **Site Compare (`/compare`):** Multi-criteria trade-off decision matrix comparing candidate sites across illumination, slope, Earth visibility, and volatile potential.
4. **Topocentric Horizon (`/horizon`):** 360° radar and sky dome rendering local terrain elevation obstruction profiles, Sun elevation tracks, and Earth libration.
5. **Rover Traversal (`/traverse`):** Slope-aware A*/Dijkstra pathfinding between lander touchdown coordinates and Permanently Shadowed Region (PSR) volatile cold traps.
6. **NASA Footage Gallery (`/gallery`):** Curated multimedia archive powered by NASA's Image & Video Library REST API (`images-api.nasa.gov`) and Goddard SVS hyperwall assets.
7. **Methodology (`/methodology`):** Formal mathematical specifications, physical constants, sensor specifications, error budgets, and API contracts.

---

## 2. The challenge and domain problem

Lunar South Pole exploration represents one of the most operationally challenging regimes in planetary exploration:
- **Grazing Solar Illumination ($0.5^\circ - 2.0^\circ$):** Due to the Moon's minimal obliquity ($1.54^\circ$), the Sun skims the local horizon, casting multi-kilometer shadows. Elevated crater rims receive extended sunlight periods ("peaks of eternal light"), while deep crater floors remain in permanent darkness (Permanently Shadowed Regions or PSRs at 20–40 Kelvin).
- **Direct-to-Earth (DTE) Telecom Libration:** The Moon's optical and physical libration ($\pm 6.7^\circ$ in latitude, $\pm 7.9^\circ$ in longitude) modulates Earth elevation on a 27.3-day synodic cycle. If Earth dips below local terrain ridges, high-rate direct communication with NASA Deep Space Network (DSN) stations (Goldstone, Madrid, Canberra) is severed.
- **Geotechnical Hazards:** Touchdown safety requires terrain slopes $<15^\circ$ to prevent lander tip-over or engine bell impingement.
- **Cryogenic Volatile Prospecting (ISRU):** Locating accessible sub-surface water ice for In-Situ Resource Utilization requires correlating Lunar Exploration Neutron Detector (LEND) epithermal neutron suppression with Diviner Lunar Radiometer maximum summer temperatures ($T_{\text{max}} < 110\text{ K}$).

LunaMission solves the fragmented data problem by synthesizing these disparate domains into one verified, explainable decision-support tool.

---

## 3. The solution

LunaMission delivers an integrated, multi-modal mission control experience:
- **Interactive Cartography & Ephemeris:** Select any Artemis III candidate site or pinpoint custom coordinates across $-80^\circ\text{S}$ to $-90^\circ\text{S}$.
- **Synchronized Epoch Time Exploration:** Scrub across dates with sub-second recalculation of sub-solar and sub-Earth coordinates in IAU 2000 ME frames.
- **Multi-Spectral Visualization Modes:** Switch between LOLA 20m DEM Shaded Relief, LROC Optical Orthomosaic, NASA SVS 3727 16-color Hypsometry, Slope Hazard Classification (Green $<5^\circ$, Yellow $5^\circ-12^\circ$, Red $\ge 15^\circ$), Illumination/PSR masks, and Diviner/LEND water-ice abundance.
- **Deep Space Network RF Link Budget:** Direct evaluation of Carrier-to-Noise density ($C/N_0$), Free Space Path Loss (FSPL), and DSN 34m/70m link margin ($\ge 3\text{ dB}$).
- **Autonomous EVA Traversal:** Slope-impedance pathfinding computing elevation cross-sections, traversal distance, and battery energy cost.
- **Executive Mission Dossier Exporter:** One-click generation of comprehensive mission packages in Markdown and JSON formats.

---

## 4. Intended users

- **NASA Space Apps Reviewers & Judges:** Evaluating scientific rigor, provenance, usability, and domain alignment.
- **Mission Planners & Flight Dynamics Engineers:** Rapidly assessing landing ellipses, communications blackouts, and solar power opportunity windows.
- **Planetary Geologists & ISRU Scientists:** Correlating crater morphology, slope hazard envelopes, and volatile cold traps.
- **Educators, Students, and the Public:** Interactively exploring lunar south pole mechanics through intuitive 2D/3D visualizations and authentic NASA footage.

---

## 5. Scope and delivery matrix

| Capability Area | Status | Technical Realization |
| :--- | :--- | :--- |
| **Site Selection & Graticule** | Delivered | 13 Artemis III sites + custom 3D pinpoint raycasting on IAU 2000 ME coordinates. |
| **Ephemeris & Orbit Mechanics** | Delivered | Analytical JPL/Meeus equations validated within $<0.05^\circ$ against live JPL Horizons API. |
| **LOLA 20m Altimetry & Shading** | Delivered | Radial polar cap geometry with NASA SVS 3727 16-color hypsometry and elevation scale bar. |
| **Grazing Solar Raytracing & PSRs** | Delivered | Directional solar lighting ($0.5^\circ - 2.0^\circ$) casting authentic crater rim shadows into cold traps. |
| **Slope Hazard Classification** | Delivered | Server-side slope matrix calculation with explicit tip-over hazard gating ($\ge 15^\circ$). |
| **DSN RF Telecom Link Budget** | Delivered | NextRush microservice evaluating Ka-band 26 GHz and S/X-band margins against DSN 34m/70m antennas. |
| **Surface Rover Traversal Planner** | Delivered | Slope-aware Dijkstra/A* pathfinder with elevation cross-section profile and energy budget. |
| **Pareto Landing Window Solver** | Delivered | Multi-criteria optimization ranking touchdown epochs across illumination and DTE visibility. |
| **Dedicated 3D Planetary Theater** | Delivered | `/scenario/3d-lab` with WASD rover simulator, xEMU visor HUD, and 8 camera presets. |
| **NASA Imagery & Footage Gallery** | Delivered | Live proxy integration with NASA Image & Video Library REST API (`images-api.nasa.gov`). |
| **Multi-Touch Gestures** | Delivered | 1-finger pan, 2-finger zoom/rotate with `touch-action: none` gesture isolation. |
| **Executive Dossier Exporter** | Delivered | `/api/dossier/generate` generating formatted mission summaries and export artifacts. |

---

## 6. Scientific principles & design philosophy

1. **Clarity Before Complexity:** Follow Principal Product Designer guidelines (`docs/../ux-prompt.md`) ensuring immediate primary task clarity and zero release gate failures.
2. **Explainable Mathematics:** Every safety score or hazard index explicitly exposes its underlying formula, weights, and input parameters.
3. **Geometry vs. Terrain Distinction:** Clearly distinguish ideal geometric visibility from terrain-occluded line-of-sight.
4. **Visibility vs. Telecom Link Distinction:** Separate geometric line-of-sight from true RF link budgets ($C/N_0$ and receiver sensitivity).
5. **No Synthetic Shortcuts:** Zero mocks, facades, or synthetic calculations in production or test paths.
6. **Fortune 100 Engineering Ceilings:** Strict file-size hard caps ($\le 200\text{L}$ UI, $\le 300\text{L}$ domain, $\le 150\text{L}$ hooks, $\le 120\text{L}$ routes) enforced across all 411 repository files.

---

## 7. Technical architecture summary

- **Runtime & Package Manager:** [Bun](https://bun.sh/) (v1.4+) — ultra-fast JavaScript/TypeScript runtime. Never use npm.
- **Frontend SPA:** [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/). Production build in $<800\text{ms}$.
- **3D Planetary Engine:** [Three.js](https://threejs.org/) with `SMAAPass` anti-aliasing, logarithmic depth buffer, and `ResizeObserver` responsive canvas scaling.
- **Backend Calculation Microservice:** `NextRush` Bun HTTP server listening on port **3001** (`server/src/app.ts`), providing heavy astrodynamic, slope, and RF link calculations.
- **Serverless Production Gateway:** Vercel serverless function adapters under `/api/*`.
- **Live NASA REST APIs:**
  - NASA Solar System Treks (Moon Trek) REST WMTS & API (`https://trek.nasa.gov/tiles/Moon/SP/...`).
  - NASA JPL SSD Horizons REST Ephemeris API (`https://ssd.jpl.nasa.gov/api/horizons.api`).
  - NASA Image & Video Library REST API (`https://images-api.nasa.gov/search`).
- **Test Infrastructure:** 718 passing tests (689 client tests + 29 server tests + 191 E2E tests across 5 tiers) and 10,000-cycle empirical interaction fuzzer.
