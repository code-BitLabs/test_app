import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { LUNAR_MEAN_RADIUS_KM } from '@/domain/constants/astronomy';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';
import { sampleTerrainAtLatLon } from '@/features/spatial/globe/terrain/lolaSouthPoleDemSampler';

const KM_TO_SCENE_UNITS = MOON_SCENE_RADIUS / LUNAR_MEAN_RADIUS_KM;
const LUNAR_GRAVITY_MPS2 = 1.62; // 1.62 m/s² authentic lunar surface gravity
const EYE_LEVEL_METERS = 25.0; // 25.0m survey mast / lander observation platform to clear regional DEM grid cells

export interface RoverTelemetry {
  latDeg: number;
  lonDeg: number;
  elevationMeters: number;
  slopeDeg: number;
  speedMps: number;
  headingDeg: number;
  pitchDeg: number;
  isDriving: boolean;
}

export interface LunarRoverController {
  attach: () => void;
  detach: () => void;
  resetToSite: (site: CandidateSite) => void;
  update: (deltaSeconds: number, camera: THREE.PerspectiveCamera) => RoverTelemetry;
  getTelemetry: () => RoverTelemetry;
  isActive: () => boolean;
  setActive: (active: boolean) => void;
}

export function createLunarRoverController(
  domElement: HTMLElement,
  initialSite: CandidateSite,
): LunarRoverController {
  let active = false;

  let latDeg = initialSite.coordinates.latitudeDeg;
  let lonDeg = initialSite.coordinates.longitudeDeg;
  let headingDeg = 0.0; // 0° = Local North
  let pitchDeg = 0.0; // 0° = Horizon

  let currentElevationMeters = initialSite.coordinates.elevationMeters ?? 4250;
  let currentCameraHeightMeters = currentElevationMeters + EYE_LEVEL_METERS;
  let verticalVelocityMps = 0.0;
  let currentSpeedMps = 0.0;
  let currentSlopeDeg = 8.5;

  const keysDown: Record<string, boolean> = {
    w: false,
    s: false,
    a: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (k in keysDown || e.key in keysDown) {
      keysDown[k] = true;
      keysDown[e.key] = true;
      e.preventDefault();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (k in keysDown) keysDown[k] = false;
    if (e.key in keysDown) keysDown[e.key] = false;
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!active || e.button !== 0) return;
    isDragging = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    try {
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    } catch {
      // Safe fallback
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!active || !isDragging) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    // Responsive, zoom-aware mouse look
    headingDeg = (headingDeg + dx * 0.25) % 360;
    if (headingDeg < 0) headingDeg += 360;

    pitchDeg = Math.max(-60, Math.min(60, pitchDeg - dy * 0.20));
  };

  const onPointerUp = (e?: PointerEvent) => {
    isDragging = false;
    if (e && typeof (e.target as HTMLElement)?.releasePointerCapture === 'function') {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
    }
  };

  return {
    attach: () => {
      if (typeof globalThis.addEventListener === 'function') {
        globalThis.addEventListener('keydown', onKeyDown, { passive: false });
        globalThis.addEventListener('keyup', onKeyUp);
        globalThis.addEventListener('pointermove', onPointerMove);
        globalThis.addEventListener('pointerup', onPointerUp);
        globalThis.addEventListener('pointercancel', onPointerUp);
      }
      domElement?.addEventListener('pointerdown', onPointerDown);
    },
    detach: () => {
      if (typeof globalThis.removeEventListener === 'function') {
        globalThis.removeEventListener('keydown', onKeyDown);
        globalThis.removeEventListener('keyup', onKeyUp);
        globalThis.removeEventListener('pointermove', onPointerMove);
        globalThis.removeEventListener('pointerup', onPointerUp);
        globalThis.removeEventListener('pointercancel', onPointerUp);
      }
      domElement?.removeEventListener('pointerdown', onPointerDown);
      active = false;
    },
    resetToSite: (site: CandidateSite) => {
      latDeg = site.coordinates.latitudeDeg;
      lonDeg = site.coordinates.longitudeDeg;
      headingDeg = 0.0;
      pitchDeg = 0.0;
      const samp = sampleTerrainAtLatLon(latDeg, lonDeg);
      currentElevationMeters = samp.elevationMeters;
      currentCameraHeightMeters = currentElevationMeters + EYE_LEVEL_METERS;
      verticalVelocityMps = 0.0;
      currentSpeedMps = 0.0;
      currentSlopeDeg = samp.slopeDeg;
    },
    isActive: () => active,
    setActive: (newActive: boolean) => {
      active = newActive;
      if (!newActive) {
        Object.keys(keysDown).forEach((k) => (keysDown[k] = false));
        isDragging = false;
      }
    },
    getTelemetry: () => ({
      latDeg,
      lonDeg,
      elevationMeters: Math.round(currentElevationMeters),
      slopeDeg: Math.round(currentSlopeDeg * 10) / 10,
      speedMps: Math.round(currentSpeedMps * 10) / 10,
      headingDeg: Math.round(headingDeg),
      pitchDeg: Math.round(pitchDeg),
      isDriving: currentSpeedMps > 0.1,
    }),
    update: (deltaSeconds: number, camera: THREE.PerspectiveCamera) => {
      const dt = Math.max(0.001, Math.min(0.1, deltaSeconds));

      // 1. Steering & Driving Inputs
      let steerInput = 0;
      if (keysDown.a || keysDown.ArrowLeft) steerInput -= 1;
      if (keysDown.d || keysDown.ArrowRight) steerInput += 1;

      let throttleInput = 0;
      if (keysDown.w || keysDown.ArrowUp) throttleInput += 1;
      if (keysDown.s || keysDown.ArrowDown) throttleInput -= 0.6; // Reverse slower

      // Heading steering (degrees per second)
      headingDeg = (headingDeg + steerInput * 45 * dt) % 360;
      if (headingDeg < 0) headingDeg += 360;

      // Realistic rover velocity model (0 to 4.5 m/s)
      const targetSpeed = throttleInput * 4.5;
      currentSpeedMps += (targetSpeed - currentSpeedMps) * Math.min(1.0, 4.0 * dt);
      if (Math.abs(currentSpeedMps) < 0.02 && throttleInput === 0) {
        currentSpeedMps = 0;
      }

      // 2. Surface Metric Traversal
      if (Math.abs(currentSpeedMps) > 0.001) {
        const distMovedKm = (currentSpeedMps * dt) / 1000.0;
        const radHeading = (headingDeg * Math.PI) / 180.0;

        // Metric coordinate translation:
        // 1 degree latitude = (PI * 1737.4 / 180) km ~ 30.323 km
        const kmPerLatDeg = (Math.PI * LUNAR_MEAN_RADIUS_KM) / 180.0;
        const dLat = (distMovedKm * Math.cos(radHeading)) / kmPerLatDeg;

        // Longitude convergence toward South Pole
        const currentColatRad = ((90 - Math.abs(latDeg)) * Math.PI) / 180.0;
        const kmPerLonDeg = kmPerLatDeg * Math.max(0.005, Math.sin(currentColatRad));
        const dLon = (distMovedKm * Math.sin(radHeading)) / kmPerLonDeg;

        latDeg = Math.max(-89.99, Math.min(-80.0, latDeg + dLat));
        lonDeg = (lonDeg + dLon) % 360;
        if (lonDeg < 0) lonDeg += 360;
      }

      // 3. Terrain Altimetry & Lunar Gravity Settling
      const terrainSample = sampleTerrainAtLatLon(latDeg, lonDeg);
      currentElevationMeters = terrainSample.elevationMeters;
      currentSlopeDeg = terrainSample.slopeDeg;

      const targetHeightMeters = currentElevationMeters + EYE_LEVEL_METERS;
      const heightError = targetHeightMeters - currentCameraHeightMeters;

      // 1.62 m/s² Lunar gravity spring-damper settling
      verticalVelocityMps += heightError * 12.0 * dt - verticalVelocityMps * 6.0 * dt;
      currentCameraHeightMeters += verticalVelocityMps * dt;

      // Strict anti-penetration floor: camera must NEVER drop below ground + 0.5m
      const hardFloorMeters = currentElevationMeters + 0.5;
      if (currentCameraHeightMeters < hardFloorMeters) {
        currentCameraHeightMeters = hardFloorMeters;
        verticalVelocityMps = 0;
      }

      // 4. Update 3D Camera Position & Orientation
      const elevSceneUnits = (currentCameraHeightMeters / 1000.0) * KM_TO_SCENE_UNITS;
      const eyePos = latLonToVector3(latDeg, lonDeg, MOON_SCENE_RADIUS + elevSceneUnits);

      // Local Topocentric Basis: Up = normal, North = toward +Y pole axis
      const normal = eyePos.clone().normalize();
      const poleAxis = new THREE.Vector3(0, 1, 0);
      let localNorth = poleAxis.clone().sub(normal.clone().multiplyScalar(poleAxis.dot(normal)));
      if (localNorth.lengthSq() < 1e-6) {
        const pm = new THREE.Vector3(0, 0, 1);
        localNorth = pm.clone().sub(normal.clone().multiplyScalar(pm.dot(normal)));
      }
      localNorth.normalize();
      const localEast = new THREE.Vector3().crossVectors(localNorth, normal).normalize();

      // Heading and pitch look direction
      const radH = (headingDeg * Math.PI) / 180.0;
      const radP = (pitchDeg * Math.PI) / 180.0;

      const lookDir = localNorth
        .clone()
        .multiplyScalar(Math.cos(radH) * Math.cos(radP))
        .add(localEast.clone().multiplyScalar(Math.sin(radH) * Math.cos(radP)))
        .add(normal.clone().multiplyScalar(Math.sin(radP)))
        .normalize();

      const lookTarget = eyePos.clone().add(lookDir.clone().multiplyScalar(0.05));

      camera.position.copy(eyePos);
      camera.up.copy(normal);
      camera.lookAt(lookTarget);

      return {
        latDeg,
        lonDeg,
        elevationMeters: Math.round(currentElevationMeters),
        slopeDeg: Math.round(currentSlopeDeg * 10) / 10,
        speedMps: Math.round(currentSpeedMps * 10) / 10,
        headingDeg: Math.round(headingDeg),
        pitchDeg: Math.round(pitchDeg),
        isDriving: Math.abs(currentSpeedMps) > 0.1,
      };
    },
  };
}
