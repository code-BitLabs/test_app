import test from 'node:test';
import assert from 'node:assert/strict';
import { createMultiLodTerrainMesh } from '../terrain/globeMultiLodTerrain';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

const testSite = CANDIDATE_SITES[0]; // Shackleton Crater Rim

test('Multi-LOD Terrain: Initializes at 64x64 base resolution with perimeter skirts', () => {
  const terrain = createMultiLodTerrainMesh(testSite);
  const diag = terrain.getTerrainDiagnostics();

  assert.equal(diag.currentLOD, '64x64');
  assert.equal(diag.isHighDetailActive, false);
  assert.ok(diag.vertexCount > 64 * 64, 'Vertex count must include grid plus perimeter skirts');
  assert.ok(diag.triangleCount > 64 * 64 * 2);
  assert.ok(diag.sourceDem.includes('LOLA'));

  terrain.dispose();
});

test('Multi-LOD Terrain: Dynamically transitions to 128x128 on close camera proximity', () => {
  const terrain = createMultiLodTerrainMesh(testSite);

  // Distant range (0.5 units) -> 64x64
  terrain.updateLOD(0.5);
  assert.equal(terrain.getTerrainDiagnostics().currentLOD, '64x64');

  // Deep inspection range (0.2 units) -> switches to 128x128
  terrain.updateLOD(0.2);
  const deepDiag = terrain.getTerrainDiagnostics();
  assert.equal(deepDiag.currentLOD, '128x128');
  assert.equal(deepDiag.isHighDetailActive, true);
  assert.ok(deepDiag.vertexCount > 128 * 128);
  assert.equal(deepDiag.effectiveResolution, '20 m/pixel (Refined Patch)');

  // Hysteresis: at 0.32 units, stays at 128x128 to prevent thrashing
  terrain.updateLOD(0.32);
  assert.equal(terrain.getTerrainDiagnostics().currentLOD, '128x128');

  // Pull back beyond 0.36 units -> reverts to 64x64
  terrain.updateLOD(0.42);
  assert.equal(terrain.getTerrainDiagnostics().currentLOD, '64x64');

  terrain.dispose();
});

test('Multi-LOD Terrain: Evaluates true LOLA surface elevation at candidate coordinates', () => {
  const terrain = createMultiLodTerrainMesh(testSite);

  // Rim summit should report high elevation ~4,250 m
  const rimElev = terrain.getSurfaceElevationAt(-89.90, 0.0);
  assert.ok(rimElev > 3500 && rimElev <= 4500, `Rim elevation should be ~4250m, got ${rimElev}`);

  // Interior of Shackleton drops down below -3,000 m
  const interiorElev = terrain.getSurfaceElevationAt(-89.92, 90.0);
  assert.ok(interiorElev < 0, `Interior floor elevation must be negative, got ${interiorElev}`);

  terrain.dispose();
});
