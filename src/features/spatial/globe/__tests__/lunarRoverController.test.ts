import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLunarRoverController } from '../interaction/lunarRoverController';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

const testSite = CANDIDATE_SITES[0]; // Shackleton Crater Rim (-89.90, 0.00, 4250m)

test('Lunar Rover Controller: Initializes at site coordinates and eye-level height', () => {
  const dummyDom = {
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLElement;

  const rover = createLunarRoverController(dummyDom, testSite);
  const telemetry = rover.getTelemetry();

  assert.equal(telemetry.latDeg, -89.90);
  assert.equal(telemetry.lonDeg, 0.00);
  assert.ok(telemetry.elevationMeters > 4000, 'Shackleton rim elevation should be > 4000m');
  assert.equal(telemetry.speedMps, 0);
  assert.equal(telemetry.isDriving, false);
});

test('Lunar Rover Controller: Terrain tracking and gravity settling during camera update', () => {
  const dummyDom = {
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLElement;

  const rover = createLunarRoverController(dummyDom, testSite);
  rover.setActive(true);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);

  // Step simulation forward 1 second (10 frames at 0.1s)
  for (let i = 0; i < 10; i++) {
    rover.update(0.1, camera);
  }

  const telemetry = rover.getTelemetry();
  assert.ok(Number.isFinite(camera.position.x));
  assert.ok(Number.isFinite(camera.position.y));
  assert.ok(Number.isFinite(camera.position.z));
  assert.ok(telemetry.elevationMeters > 0);
  assert.ok(telemetry.slopeDeg >= 0);

  rover.detach();
});
