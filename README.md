# LunaMission — Lunar Landing Site Navigator

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-blue.svg)](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)
[![Runtime](https://img.shields.io/badge/Runtime-Bun%20v1.4+-black.svg)](https://bun.sh/)
[![Frontend](https://img.shields.io/badge/Frontend-Vite%208%20%2B%20React%2019-61dafb.svg)](https://vitejs.dev/)
[![Microservice](https://img.shields.io/badge/Microservice-NextRush%20(Bun%20HTTP)-orange.svg)](server/src/app.ts)
[![Tests Passing](https://img.shields.io/badge/Tests-718%20Passing-brightgreen.svg)](tests/)
[![Ceilings](https://img.shields.io/badge/Fortune%20100%20Ceilings-0%20Violations-success.svg)](docs/LunaMission_ARCHITECTURE.md)

**LunaMission** is an enterprise aerospace-grade flight deck and landing site evaluation platform built for the **NASA Space Apps Challenge 2026** challenge: [**Lunar Landing Site Navigator**](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/).

It empowers mission planners, flight dynamics engineers, planetary scientists, educators, and the public to analyze and compare the 13 candidate Artemis III landing zones ($80^\circ\text{S} - 90^\circ\text{S}$) alongside custom pinpointed landing coordinates with mathematical rigor, transparent error budgets, and official NASA citations.

---

## Executive Progress & Readiness Tracker

> **Current Maturity:** Operational Mission Control Suite & Active Engineering R&D  
> **Challenge Full-Scope Delivery:** `[█████░░░░░] 52%` (Calibrated against full NASA mission planning lifecycle)  
> *Phase 1 (Core Flight Deck) & Phase 2 (7-Page Mission Control Suite) are operational. Phase 3 (Deep Altimetry Tiling) & Phase 4 (Descent Trajectory & Autonomous Ops) are in active development.*

```
========================================================================================
LUNAMISSION READINESS BREAKDOWN: [█████████████░░░░░░░░░░░░] 52%
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
  [██░░░░░░░░]  20% - Orbital Descent Trajectory, Δv & Propellant Budget (FR-13)
  [█░░░░░░░░░]  10% - AI Mission Copilot & Anomaly Diagnostics (FR-14)
========================================================================================
```

---

## The 7 Synchronized Mission Workspaces

LunaMission organizes complex aerospace workflows across seven specialized operational workspaces managed by a lightweight, state-synchronized router ([`useMissionRouter.tsx`](src/app/hooks/useMissionRouter.tsx)):

1. **Integrated Flight Deck (`/explore`):** Unified 2D South Polar stereographic projection, 3D interactive lunar globe, and docked non-occluding coordinate inspector.
2. **Dedicated 3D Planetary Theater (`/scenario/3d-lab`):** First-class 50/50 split view with Surface Rover EVA driving simulator (WASD locomotion with real-time slope pitch/roll feedback), Astronaut xEMU Helmet Visor HUD, and 8 camera presets (`nadir`, `site`, `horizon`, `eva`, `earth_align`, `orbit360`, `north_look`, `sunward_terminator`).
3. **Site Compare Matrix (`/compare`):** Multi-criteria trade-off decision matrix comparing candidate sites across illumination, slope, Earth visibility, and volatile potential.
4. **Topocentric Horizon Radar (`/horizon`):** 360° radar and sky dome rendering local terrain elevation obstruction profiles, Sun elevation tracks, and Earth libration.
5. **Rover Traversal Planner (`/traverse`):** Slope-aware A*/Dijkstra pathfinding between lander touchdown coordinates and Permanently Shadowed Region (PSR) volatile cold traps.
6. **NASA Footage Archive (`/gallery`):** Curated multimedia archive powered by NASA's Image & Video Library REST API (`images-api.nasa.gov`) and Goddard SVS hyperwall assets.
7. **Scientific Methodology (`/methodology`):** Formal mathematical specifications, physical constants, sensor specifications, error budgets, and API contracts.

---

## Scientific Truth & Live NASA APIs

LunaMission derives its calculations from authentic space agency data and mathematical models:
- **NASA JPL SSD Horizons REST Ephemeris API:** Live sub-solar and sub-Earth position validation (`https://ssd.jpl.nasa.gov/api/horizons.api`).
- **NASA Solar System Treks (Moon Trek) WMTS:** High-resolution multi-spectral tile layers (`https://trek.nasa.gov/`).
- **NASA Image & Video Library REST API:** Real mission footage from Apollo, LRO, and Artemis missions (`https://images-api.nasa.gov/`).
- **LOLA 20m Altimetry & NASA SVS 3727:** 16-color hypsometric elevation colormap and Beckmann roughness modeling.
- **DSN RF Telecom Link Budget:** Analytical carrier-to-noise density ($C/N_0$), free space path loss (FSPL), and DSN 34m/70m link margins ($\ge 3\text{ dB}$).
- **Explainable Landing Safety Score:** 5-factor weighted matrix (Slope 30%, Illumination 25%, Earth Visibility 20%, Volatiles 15%, Roughness 10%) with explicit tip-over hazard gating ($\ge 15^\circ$).

---

## Quickstart & Local Development

This project uses **[Bun](https://bun.sh/)** exclusively. **Never use npm.**

```bash
# 1. Install dependencies
bun install

# 2. Start the Vite 8 frontend development server (port 3000)
bun run dev

# 3. Start the NextRush backend calculation microservice (port 3001)
bun run dev:server

# 4. Open http://localhost:3000 in your browser
```

---

## Automated Verification & Testing

LunaMission maintains a strict **718-test** automated verification baseline:

```bash
# Run all client unit, integration, and scenario tests (689 passing tests)
bun test

# Run NextRush backend calculation microservice tests (29 passing tests)
bun test server/__tests__

# Run static type verification (0 errors across client and server)
bun run typecheck

# Run 5-tier Playwright end-to-end integration suite (191 passing tests)
bun run test:e2e

# Run 10,000-cycle adversarial interaction fuzzer
bun run test:fuzz

# Audit Fortune 100 enterprise file-size ceilings
bun run audit:ceilings
```

---

## Repository Structure & Engineering Standards

```text
test_app/
├── src/                         # Vite 8 + React 19 Frontend SPA
│   ├── app/                     # Navigation, router, scenario context
│   ├── features/                # High-cohesion features (spatial, lab, compare, etc.)
│   ├── domain/                  # Pure mathematical & astrodynamic logic (TDD)
│   └── shared/                  # UI tokens, hooks, components
├── server/                      # NextRush Bun HTTP Microservice (Port 3001)
│   ├── src/app.ts               # Bun HTTP server & route handlers
│   └── __tests__/               # Server API validation tests
├── api/                         # Vercel Serverless Function Adapters
├── docs/                        # Enterprise Documentation Suite v2.1
│   ├── PROJECT_BRIEF.md         # Executive brief & readiness trackers
│   ├── LunaMission_ARCHITECTURE.md # 2-tier flight deck architecture
│   ├── DECISIONS.md             # ADRs DEC-001 through DEC-030
│   ├── SCIENCE_FEASIBILITY.md   # Mathematical models & NASA API experiments
│   ├── VALIDATION_PLAN.md       # 5-tier test architecture & test catalog
│   ├── DESIGN_SPEC.md           # Cognitive ergonomics & UX specifications
│   └── prd/LunaMission_Explorer_PRD_v1.md # Complete PRD with MoSCoW FR-01 to FR-14
├── tests/                       # 5-Tier E2E Suites & Interaction Fuzzer
└── package.json                 # Bun scripts & dependencies
```

**Fortune 100 File-Size Ceilings:** Strict maintainability caps enforced across all 411 repository files: UI components $\le 200\text{L}$, hooks $\le 150\text{L}$, server/domain $\le 300\text{L}$, routes $\le 120\text{L}$.

---

## Official NASA References & Credits

- [NASA Space Apps Challenge — Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)
- [Lunar and Planetary Institute (LPI) Lunar South Pole Atlas](https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/)
- [NASA Scientific Visualization Studio (SVS 5127, 3633, 3727)](https://svs.gsfc.nasa.gov/)
- [NASA Planetary Data System (PDS) & LOLA Altimetry](https://pgda.gsfc.nasa.gov/products/78)
- [NASA Jet Propulsion Laboratory SSD Horizons Ephemeris](https://ssd.jpl.nasa.gov/)
