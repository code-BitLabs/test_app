import * as THREE from 'three';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { MOON_SCENE_RADIUS, latLonToVector3 } from '@/features/spatial/globe/scene/globeScene';
import { CameraTransitioner, createCameraTransitionerWithResolver } from './globeCameraTransitioner';

/** Per-frame easing of a preset change: progress closes the transition, lerp moves the view. */
const TRANSITION_PROGRESS_STEP = 0.055;
const TRANSITION_LERP_FACTOR = 0.14;

/**
 * Calibrated camera distances for 38° FOV and Moon radius 1.45:
 * - South Pole Focus (nadir): 4.8 units -> Moon occupies ~76% of canvas, no cropping.
 * - Global Context: 5.8 units -> Full Moon with ~16% margin around all sides.
 * - Oblique: perspective across crater rims at ~38° inclination.
 * - Site Focus: 1.35 units above candidate normal.
 */
export const NADIR_CAMERA_DISTANCE = 4.8;
export const GLOBAL_CAMERA_POSITION: readonly [number, number, number] = [0, 0, 5.6];
export const GLOBAL_LOOK_TARGET: readonly [number, number, number] = [0, 0, 0];
export const GLOBAL_UP_VECTOR: readonly [number, number, number] = [0, 1, 0];
export const OBLIQUE_CAMERA_POSITION: readonly [number, number, number] = [0, -3.2, 2.2];
export const OBLIQUE_LOOK_TARGET: readonly [number, number, number] = [0, -0.8, 0];
export const OBLIQUE_UP_VECTOR: readonly [number, number, number] = [0, 0.6, 0.8];
export const SITE_CAMERA_ALTITUDE = 1.35;
export const SITE_CAMERA_TILT = 0.35;
export const INSPECTION_CAMERA_ALTITUDE = 0.085;
export const INSPECTION_CAMERA_TILT = 0.035;

export interface CameraPose {
  camPos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  upVector: THREE.Vector3;
}

export interface TopocentricBasis {
  surfacePos: THREE.Vector3;
  normal: THREE.Vector3;
  north: THREE.Vector3;
  east: THREE.Vector3;
}

/**
 * Computes an orthonormal topocentric East-North-Up (ENU) frame at any lunar selenographic coordinate.
 * Resolves the polar singularity gracefully when latitude is near -90° by referencing the prime meridian (+Z).
 */
export function getTopocentricBasis(latDeg: number, lonDeg: number, radius = MOON_SCENE_RADIUS): TopocentricBasis {
  const surfacePos = latLonToVector3(latDeg, lonDeg, radius);
  const normal = surfacePos.clone().normalize();

  // Lunar rotational axis is +Y
  const poleAxis = new THREE.Vector3(0, 1, 0);
  let north = poleAxis.clone().sub(normal.clone().multiplyScalar(poleAxis.dot(normal)));

  // If directly at the exact pole, use Earth-facing prime meridian (+Z) as reference North
  if (north.lengthSq() < 1e-6) {
    const primeMeridian = new THREE.Vector3(0, 0, 1);
    north = primeMeridian.clone().sub(normal.clone().multiplyScalar(primeMeridian.dot(normal)));
  }
  north.normalize();

  const east = new THREE.Vector3().crossVectors(north, normal).normalize();

  return { surfacePos, normal, north, east };
}

/** Where each preset parks the camera, using rigorous topocentric coordinates for local modes. */
export function cameraPoseForPreset(preset: CameraPreset, site: CandidateSite): CameraPose {
  if (preset === 'nadir') {
    // Straight down on the South Pole, matching the 2D polar map: +Z (prime meridian) is up.
    return {
      camPos: new THREE.Vector3(0, -NADIR_CAMERA_DISTANCE, 0.0001),
      lookTarget: new THREE.Vector3(0, 0, 0),
      upVector: new THREE.Vector3(0, 0, 1),
    };
  }

  if (preset === 'global') {
    // Global context: complete Moon with safe margins and clear view
    return {
      camPos: new THREE.Vector3(...GLOBAL_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...GLOBAL_LOOK_TARGET),
      upVector: new THREE.Vector3(...GLOBAL_UP_VECTOR).normalize(),
    };
  }

  if (preset === 'oblique') {
    // Low perspective view across south-polar crater rims toward the terminator
    return {
      camPos: new THREE.Vector3(...OBLIQUE_CAMERA_POSITION),
      lookTarget: new THREE.Vector3(...OBLIQUE_LOOK_TARGET),
      upVector: new THREE.Vector3(...OBLIQUE_UP_VECTOR).normalize(),
    };
  }

  const elevMeters = site.coordinates.elevationMeters ?? 0;
  const elevSceneUnits = (elevMeters / 1000.0) * (MOON_SCENE_RADIUS / 1737.4);
  const { surfacePos, normal, north } = getTopocentricBasis(
    site.coordinates.latitudeDeg,
    site.coordinates.longitudeDeg,
    MOON_SCENE_RADIUS + elevSceneUnits,
  );

  if (preset === 'inspection') {
    // 45° Oblique Site Inspection: Grazing perspective looking at crater rim relief
    // Calibrated to 0.096 units distance from target (< 0.15 and > 0.05 units)
    const altitude = INSPECTION_CAMERA_ALTITUDE;
    const tilt = INSPECTION_CAMERA_TILT;
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(altitude))
      .add(north.clone().multiplyScalar(-tilt));

    return {
      camPos,
      lookTarget: surfacePos.clone(),
      upVector: normal.clone(),
    };
  }

  if (preset === 'overhead') {
    // Steep High-Angle Tactical Nadir: ~84° topocentric elevation angle centered on candidate datum
    // Altitude 0.135 scene units with slight southern offset (0.014 units) to eliminate the polar gimbal lock.
    // Up-vector set to normal (zenith) so horizontal OrbitControls drag rotates compass azimuth smoothly around local zenith
    // without ever dipping into the ground or triggering collision clamp.
    const altitude = 0.135;
    const tangentOffset = 0.014;
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(altitude))
      .add(north.clone().multiplyScalar(-tangentOffset));

    return {
      camPos,
      lookTarget: surfacePos.clone(),
      upVector: normal.clone(),
    };
  }

  if (preset === 'horizon') {
    // Ground-Level Horizon Perspective: Low-altitude view looking outward across the crater horizon
    // Simulates lander/astronaut eye-level looking toward the illuminated horizon
    // Target is anchored closely to the local ridge to ensure stable, intuitive orbit rotation
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.016))
      .add(north.clone().multiplyScalar(-0.028));
    const lookTarget = surfacePos
      .clone()
      .add(north.clone().multiplyScalar(0.035))
      .add(normal.clone().multiplyScalar(0.008));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone().normalize(),
    };
  }

  if (preset === 'eva') {
    // First-Person Astronaut Eye-Level (~1.8m above LOLA datum)
    // Looking forward across the local terrain toward the illuminated ridge
    const altitude = 0.003;
    const tangentOffset = 0.006;
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(altitude))
      .add(north.clone().multiplyScalar(-tangentOffset));
    const lookTarget = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(altitude))
      .add(north.clone().multiplyScalar(0.040));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone().normalize(),
    };
  }

  if (preset === 'earth_align') {
    // Earth Alignment: Camera placed at candidate site looking along topocentric DTE vector toward Earth hovering on the horizon
    const earthVector = new THREE.Vector3(0, 0, 1).sub(surfacePos).normalize();
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.025))
      .sub(earthVector.clone().multiplyScalar(0.04));
    const lookTarget = surfacePos
      .clone()
      .add(earthVector.clone().multiplyScalar(0.08))
      .add(normal.clone().multiplyScalar(0.008));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone().normalize(),
    };
  }

  if (preset === 'orbit360') {
    // Orbit 360°: Circular orbital observation vantage point (~0.65 units altitude, 45° inclination)
    const { east } = getTopocentricBasis(
      site.coordinates.latitudeDeg,
      site.coordinates.longitudeDeg,
      MOON_SCENE_RADIUS + elevSceneUnits,
    );
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.65))
      .add(east.clone().multiplyScalar(0.35))
      .add(north.clone().multiplyScalar(0.25));

    return {
      camPos,
      lookTarget: surfacePos.clone(),
      upVector: normal.clone().normalize(),
    };
  }

  if (preset === 'north_look') {
    // North-Looking: Camera anchored at site oriented toward local North along prime meridian
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.03))
      .sub(north.clone().multiplyScalar(0.05));
    const lookTarget = surfacePos
      .clone()
      .add(north.clone().multiplyScalar(0.06))
      .add(normal.clone().multiplyScalar(0.006));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone().normalize(),
    };
  }

  if (preset === 'sunward_terminator') {
    // Sunward Terminator: Camera oriented facing the grazing solar vector (0.5°-2.0° elevation) across shadow boundary
    const sunVector = new THREE.Vector3(1, 0, 0.4).normalize();
    const camPos = surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(0.018))
      .sub(sunVector.clone().multiplyScalar(0.045));
    const lookTarget = surfacePos
      .clone()
      .add(sunVector.clone().multiplyScalar(0.075))
      .add(normal.clone().multiplyScalar(0.004));

    return {
      camPos,
      lookTarget,
      upVector: normal.clone().normalize(),
    };
  }

  // 'site' preset: Candidate Overview framing surrounding crater complexes (1.26 units range, within 1.0 - 2.0 units)
  return {
    camPos: surfacePos
      .clone()
      .add(normal.clone().multiplyScalar(1.20))
      .add(north.clone().multiplyScalar(0.40)),
    lookTarget: surfacePos.clone(),
    upVector: normal.clone(),
  };
}

export type { CameraTransitioner } from './globeCameraTransitioner';

/** Eased camera moves between presets, interruptible on user manipulation. */
export function createCameraTransitioner(): CameraTransitioner {
  return createCameraTransitionerWithResolver(cameraPoseForPreset);
}
