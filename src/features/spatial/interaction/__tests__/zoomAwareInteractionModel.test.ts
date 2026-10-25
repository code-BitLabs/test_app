import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate3DOrbitSensitivity,
  calculate2DPanSensitivity,
  DEFAULT_ORBIT_SENSITIVITY_CONFIG,
} from '../zoomAwareInteractionModel';

test('Zoom-Aware 3D Orbit: Monotonically scales sensitivity from global down to surface scale', () => {
  const globalSens = calculate3DOrbitSensitivity(5.6);
  const regionalSens = calculate3DOrbitSensitivity(4.8);
  const overviewSens = calculate3DOrbitSensitivity(1.26);
  const inspectionSens = calculate3DOrbitSensitivity(0.096);
  const overheadSens = calculate3DOrbitSensitivity(0.12);
  const horizonSens = calculate3DOrbitSensitivity(0.052);
  const maxZoomSens = calculate3DOrbitSensitivity(0.015);

  // Strict monotonic decrease in rotation sensitivity
  assert.ok(globalSens.rotateSpeed >= regionalSens.rotateSpeed);
  assert.ok(regionalSens.rotateSpeed > overviewSens.rotateSpeed);
  assert.ok(overviewSens.rotateSpeed > overheadSens.rotateSpeed);
  assert.ok(overheadSens.rotateSpeed > inspectionSens.rotateSpeed);
  assert.ok(inspectionSens.rotateSpeed > horizonSens.rotateSpeed);
  assert.ok(horizonSens.rotateSpeed > maxZoomSens.rotateSpeed);

  // At global scale, rotateSpeed reaches max (1.0)
  assert.ok(regionalSens.rotateSpeed >= 0.95 && regionalSens.rotateSpeed <= 1.0);

  // At maximum zoom, rotateSpeed drops to ~0.065 - 0.08
  assert.ok(
    maxZoomSens.rotateSpeed >= DEFAULT_ORBIT_SENSITIVITY_CONFIG.minRotateSpeed,
    `Rotate speed ${maxZoomSens.rotateSpeed} must be >= min ${DEFAULT_ORBIT_SENSITIVITY_CONFIG.minRotateSpeed}`
  );
  assert.ok(
    maxZoomSens.rotateSpeed < 0.10,
    `Rotate speed ${maxZoomSens.rotateSpeed} at maximum zoom must be < 0.10 to prevent violent swings`
  );
});

test('Zoom-Aware 3D Orbit: Angular displacement per pixel remains strictly bounded at maximum zoom', () => {
  const viewportHeight = 900;
  const maxZoomSens = calculate3DOrbitSensitivity(0.015, viewportHeight);

  // For a 50px mouse drag at max zoom:
  // theta = (2 * PI * 50 / 900) * rotateSpeed
  const disp50pxDeg = (maxZoomSens.estimatedAngularDisplacementDegPer100Px / 100) * 50;

  // With rotateSpeed ~0.07, 50px drag produces only ~1.4° rotation (instead of 20°!)
  assert.ok(
    disp50pxDeg < 2.5,
    `50px drag displacement at maximum zoom should be < 2.5°, was ${disp50pxDeg.toFixed(2)}°`
  );
  assert.ok(
    disp50pxDeg > 0.5,
    `50px drag displacement should be > 0.5° for responsive control, was ${disp50pxDeg.toFixed(2)}°`
  );

  // For a tiny 5px twitch, angular displacement is < 0.25°
  const disp5pxDeg = (maxZoomSens.estimatedAngularDisplacementDegPer100Px / 100) * 5;
  assert.ok(
    disp5pxDeg < 0.30,
    `5px twitch displacement should be < 0.30°, was ${disp5pxDeg.toFixed(3)}°`
  );
});

test('Zoom-Aware 3D Orbit: Damping increases at surface scale to prevent inertia overshoot', () => {
  const globalSens = calculate3DOrbitSensitivity(5.0);
  const maxZoomSens = calculate3DOrbitSensitivity(0.015);

  assert.ok(
    maxZoomSens.dampingFactor > globalSens.dampingFactor,
    `Damping at max zoom (${maxZoomSens.dampingFactor}) should exceed global damping (${globalSens.dampingFactor})`
  );
  assert.ok(maxZoomSens.dampingFactor >= 0.12, 'Surface damping should be >= 0.12 to lock view on target');
});

test('Zoom-Aware 3D Orbit: Defensively handles non-finite or degenerate distances', () => {
  const nanSens = calculate3DOrbitSensitivity(NaN);
  assert.ok(Number.isFinite(nanSens.rotateSpeed));
  assert.ok(Number.isFinite(nanSens.panSpeed));
  assert.ok(Number.isFinite(nanSens.dampingFactor));

  const zeroSens = calculate3DOrbitSensitivity(0);
  assert.ok(zeroSens.rotateSpeed >= DEFAULT_ORBIT_SENSITIVITY_CONFIG.minRotateSpeed);

  const negSens = calculate3DOrbitSensitivity(-5.0);
  assert.ok(negSens.rotateSpeed >= DEFAULT_ORBIT_SENSITIVITY_CONFIG.minRotateSpeed);
});

test('Zoom-Aware 2D Pan: Damps high-frequency pan displacement as zoom increases', () => {
  const basePan = calculate2DPanSensitivity(1.0);
  const mediumPan = calculate2DPanSensitivity(2.5);
  const maxPan = calculate2DPanSensitivity(4.5);

  assert.equal(basePan.panMultiplier, 1.0, 'At zoom 1.0, pan multiplier is 1.0');
  assert.ok(basePan.panMultiplier > mediumPan.panMultiplier);
  assert.ok(mediumPan.panMultiplier > maxPan.panMultiplier);
  assert.ok(maxPan.panMultiplier >= 0.45, 'Pan multiplier should remain comfortable (>= 0.45)');
});
