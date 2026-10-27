import test from 'node:test';
import assert from 'node:assert/strict';
import { CANDIDATE_SITES, getSiteById } from '@/domain/sites/catalog';
import { calculateSiteConditions } from '@/domain/celestial/siteConditions';
import { calculateTraversalPlan, DEFAULT_ROVER_SPECS } from '@/domain/traversal/traversePlanner';
import { prospectVolatilesAtCoordinates } from '@/domain/volatiles/volatileProspector';
import {
  calculateFreeSpacePathLoss,
  calculateRfLinkBudget,
  calculateDsnStationVisibilities,
  determineActiveDsnStation,
  FREQUENCY_BANDS,
  DSN_COMPLEXES,
} from '@/domain/telecom/linkBudget';
import { sampleTerrainAtLatLon } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { calculateLunarEphemeris } from '@/domain/celestial/ephemeris';
import { getJulianDate } from '@/domain/time/julianDate';
import { solveParetoLandingWindows } from '@/domain/windows/paretoWindowSolver';

// ============================================================================
// Tier 4 — Real-World Application Scenarios (Artemis III Realistic Mission Workloads)
// ============================================================================

test('Tier 4 [Scenario 1]: Multi-Criteria Landing Site Trade Study across all 13 Artemis III Candidate Zones', () => {
  assert.ok(CANDIDATE_SITES.length >= 13, 'Catalog must contain at least the 13 primary Artemis III candidate sites');
  const targetEpoch = new Date(Date.UTC(2026, 9, 21, 12, 0, 0));

  const evaluations = CANDIDATE_SITES.map((site) => {
    const conditions = calculateSiteConditions(site, targetEpoch, 'terrain-aware');
    const terrain = sampleTerrainAtLatLon(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);
    const volatiles = prospectVolatilesAtCoordinates(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg);

    const solarElev = conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : -99;
    const earthElev = conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : -99;

    return {
      siteId: site.id,
      name: site.name,
      solarElev,
      earthElev,
      slopeDeg: terrain.slopeDeg,
      elevationMeters: terrain.elevationMeters,
      isruScore: volatiles.isruFeasibilityScore,
      isTipOverHazard: terrain.slopeDeg >= 15.0,
    };
  });

  assert.ok(evaluations.length >= 13);
  for (const ev of evaluations) {
    assert.ok(Number.isFinite(ev.solarElev));
    assert.ok(Number.isFinite(ev.earthElev));
    assert.ok(Number.isFinite(ev.slopeDeg));
    assert.ok(Number.isFinite(ev.elevationMeters));
  }

  // Verify at least one site has favorable DTE visibility (> 2° elevation)
  const dteVisibleSites = evaluations.filter((e) => e.earthElev > 2.0);
  assert.ok(dteVisibleSites.length > 0, 'At least one candidate site must have nominal DTE visibility');
});

test('Tier 4 [Scenario 2]: Shackleton Crater Rim EVA Traverse Planning to Permanently Shadowed Region (PSR)', () => {
  const origin = { lat: -89.68, lon: 125.0 }; // Shackleton Rim crest
  const destination = { lat: -89.92, lon: 110.0 }; // Shackleton PSR interior floor

  const plan = calculateTraversalPlan({
    originLatDeg: origin.lat,
    originLonDeg: origin.lon,
    destinationLatDeg: destination.lat,
    destinationLonDeg: destination.lon,
    maxWaypoints: 20,
    rover: DEFAULT_ROVER_SPECS,
  });

  assert.ok(plan.totalDistanceKm > 5.0 && plan.totalDistanceKm < 20.0);
  assert.ok(plan.waypoints.length >= 10);
  assert.ok(Number.isFinite(plan.waypoints[0].elevationMeters), 'Elevation must be finite');
  assert.ok(plan.estimatedDurationHours > 0);
  assert.ok(plan.batteryMarginPct >= 0 && plan.batteryMarginPct <= 100);
});

test('Tier 4 [Scenario 3]: Direct-To-Earth (DTE) Occultation Window & Libration Outage Forecast for Malapert Mountain', () => {
  const site = getSiteById('malapert-massif') || CANDIDATE_SITES[0];
  const startEpoch = Date.UTC(2026, 9, 1, 0, 0, 0);

  // Sample 28 days of libration at daily intervals
  const dailyEarthVisibilities = [];
  for (let day = 0; day < 28; day++) {
    const epoch = new Date(startEpoch + day * 86400 * 1000);
    const conditions = calculateSiteConditions(site, epoch, 'terrain-aware');
    const earthElev = conditions.earthElevationDeg.kind === 'available' ? conditions.earthElevationDeg.value : -99;
    const isObstructed = conditions.earthVisibility === 'sub-horizon';

    const budget = calculateRfLinkBudget({
      earthDistanceKm: 384400,
      earthElevationDeg: earthElev,
      isTerrainObstructed: isObstructed,
      band: 'xBandDownlink',
      transmitterPowerWatts: 15,
      dataRateMbps: 2.0,
    });

    dailyEarthVisibilities.push({ day, earthElev, linkState: budget.linkState, marginDb: budget.linkMarginDb });
  }

  assert.equal(dailyEarthVisibilities.length, 28);
  const lockedDays = dailyEarthVisibilities.filter((d) => d.linkState === 'locked');
  assert.ok(lockedDays.length > 5, 'Malapert Mountain must maintain locked DTE contact during favorable libration');
});

test('Tier 4 [Scenario 4]: Cryogenic Cold-Trap Water-Ice Prospecting & ISRU Extraction Trade Study in Haworth Crater', () => {
  const haworthFloor = prospectVolatilesAtCoordinates(-87.4, -5.1);

  assert.equal(haworthFloor.isPsr, true);
  assert.ok(haworthFloor.divinerTempKelvin < 110.0, 'Haworth PSR must remain cryogenic (<110K)');
  assert.equal(haworthFloor.temperatureCategory, 'cryogenic_cold_trap');
  assert.equal(haworthFloor.sublimationStability, 'perennially_stable');
  assert.ok(haworthFloor.waterEquivalentHydrogenPct > 1.0, 'Water-equivalent hydrogen must be elevated');
  assert.ok(haworthFloor.iceYieldMetricTonsPerHectare > 100, 'Yield per hectare must support ISRU');
  assert.ok(['sublimation_tent', 'deep_thermal_coring'].includes(haworthFloor.extractionMethod));
});

test('Tier 4 [Scenario 5]: High-Rate Artemis III Video Telecom Link Budget to Goldstone DSN 70m Dish', () => {
  const nominalDistanceKm = 384400;
  const xBandGhz = FREQUENCY_BANDS.xBandDownlink.frequencyGhz; // 8.45 GHz
  const kaBandGhz = FREQUENCY_BANDS.kaBandDownlink.frequencyGhz; // 32.0 GHz

  const fsplX = calculateFreeSpacePathLoss(nominalDistanceKm, xBandGhz);
  const fsplKa = calculateFreeSpacePathLoss(nominalDistanceKm, kaBandGhz);

  assert.ok(fsplX > 222.0 && fsplX < 223.5);
  assert.ok(fsplKa > 233.5 && fsplKa < 235.0);
  assert.ok(fsplKa > fsplX, 'Ka-band experiences higher atmospheric and free space loss');

  // Video streaming link budget (10 Mbps high-def downlink)
  const videoBudget = calculateRfLinkBudget({
    earthDistanceKm: nominalDistanceKm,
    earthElevationDeg: 12.0,
    isTerrainObstructed: false,
    band: 'kaBandDownlink',
    transmitterPowerWatts: 50, // 50W Ka-band TWTA
    dataRateMbps: 10.0,
  });

  assert.equal(videoBudget.linkState, 'locked');
  assert.ok(videoBudget.linkMarginDb >= 3.0, 'Video stream must maintain >= 3 dB DSN margin');

  // DSN Tracking Handover test across Goldstone, Madrid, and Canberra
  const stations = calculateDsnStationVisibilities(Date.UTC(2026, 9, 21, 12, 0, 0));
  const activeStation = determineActiveDsnStation(stations);
  assert.ok(activeStation !== null, 'An active DSN complex must be visible');
  assert.ok(['goldstone', 'madrid', 'canberra'].includes(activeStation.stationId));
});

test('Tier 4 [Scenario 6]: Connecting Ridge Topocentric Sky Dome & Grazing Solar Horizon Profile Analysis', () => {
  const site = getSiteById('connecting-ridge') || CANDIDATE_SITES[0];
  const epoch = new Date(Date.UTC(2026, 9, 21, 12, 0, 0));
  const conditions = calculateSiteConditions(site, epoch, 'terrain-aware');

  assert.equal(conditions.provenance.calculationMode, 'terrain-aware');
  assert.ok(conditions.sunElevationDeg.kind === 'available');
  assert.ok(conditions.sunAzimuthDeg.kind === 'available');
  assert.ok(conditions.localTerrainElevationAtSunAzimuthDeg.kind === 'available');

  const sunElev = conditions.sunElevationDeg.value;
  const horizonMaskElev = conditions.localTerrainElevationAtSunAzimuthDeg.value;

  assert.ok(Number.isFinite(sunElev));
  assert.ok(Number.isFinite(horizonMaskElev));
  const isDirectlySunlit = sunElev > horizonMaskElev;
  assert.equal(conditions.solarIllumination === 'illuminated', isDirectlySunlit);
});

test('Tier 4 [Scenario 7]: Amundsen Rim Extreme Low-Elevation Solar Grazing & Dynamic Shadowing Synodic Cycle', () => {
  const site = getSiteById('amundsen-rim') || CANDIDATE_SITES[0];
  const startEpoch = Date.UTC(2026, 9, 1, 0, 0, 0);
  const synodicDays = 29.53; // 1 full lunar day/night synodic cycle

  let sunlitHours = 0;
  const totalSamplingSteps = 30;

  for (let i = 0; i < totalSamplingSteps; i++) {
    const epoch = new Date(startEpoch + (i * synodicDays * 86400 * 1000) / totalSamplingSteps);
    const conditions = calculateSiteConditions(site, epoch, 'geometry-only');
    const sunElev = conditions.sunElevationDeg.kind === 'available' ? conditions.sunElevationDeg.value : -99;
    if (sunElev > 0) sunlitHours++;
  }

  // Elevated rim crest receives grazing solar illumination across synodic cycle
  assert.ok(sunlitHours > 0, 'Amundsen rim must experience sunlit periods during synodic month');
});

test('Tier 4 [Scenario 8]: Autonomous Commercial CLPS Lander Geotechnical Hazard & Tip-Over Safety Scoring', () => {
  // Candidate A: Flat plateau with low slope (< 5°)
  const flatPlateau = sampleTerrainAtLatLon(-82.0, 45.0);
  assert.ok(flatPlateau.slopeDeg < 5.0);

  // Candidate B: Dangerous crater wall scarp (>= 15°)
  const hazardousScarp = sampleTerrainAtLatLon(-89.44, 137.31);
  assert.ok(hazardousScarp.slopeDeg >= 15.0);

  // Safety scoring evaluation
  const evaluateLanderSafety = (slopeDeg: number) => {
    if (slopeDeg >= 15.0) return { verdict: 'ABORT' as const, isTipOver: true };
    if (slopeDeg >= 8.0) return { verdict: 'CAUTION' as const, isTipOver: false };
    return { verdict: 'GO' as const, isTipOver: false };
  };

  const safeEval = evaluateLanderSafety(flatPlateau.slopeDeg);
  assert.equal(safeEval.verdict, 'GO');
  assert.equal(safeEval.isTipOver, false);

  const hazardEval = evaluateLanderSafety(hazardousScarp.slopeDeg);
  assert.equal(hazardEval.verdict, 'ABORT');
  assert.equal(hazardEval.isTipOver, true);
});
