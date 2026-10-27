import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialScenarioState,
  scenarioReducer,
} from '@/app/scenario/state/scenarioState';
import { createCustomLandingTarget } from '@/domain/target/customTargetModel';

test('customTargetCohesion: initializes customTarget as null in initial scenario state', () => {
  const initial = createInitialScenarioState();
  assert.equal(initial.customTarget, null);
  assert.equal(initial.selectedSiteId, 'shackleton-rim');
});

test('customTargetCohesion: updates customTarget when customTarget/changed is dispatched', () => {
  const initial = createInitialScenarioState();
  const target = createCustomLandingTarget({
    name: 'Connecting Ridge Outpost',
    latitudeDeg: -89.45,
    longitudeDeg: 222.0,
    elevationKm: 1.8,
  });

  const next = scenarioReducer(initial, {
    type: 'customTarget/changed',
    target,
  });

  assert.equal(next.customTarget, target);
  assert.equal(next.customTarget?.name, 'Connecting Ridge Outpost');
  assert.equal(next.selectedSiteId, initial.selectedSiteId);
  assert.equal(next.epochMs, initial.epochMs);
});

test('customTargetCohesion: resets customTarget to null on clearing', () => {
  const initial = createInitialScenarioState();
  const target = createCustomLandingTarget({
    name: 'Temporary Target',
    latitudeDeg: -88.0,
    longitudeDeg: 45.0,
  });

  const withTarget = scenarioReducer(initial, {
    type: 'customTarget/changed',
    target,
  });
  assert.notEqual(withTarget.customTarget, null);

  const cleared = scenarioReducer(withTarget, {
    type: 'customTarget/changed',
    target: null,
  });
  assert.equal(cleared.customTarget, null);
});

test('customTargetCohesion: returns same state reference if target has not changed', () => {
  const initial = createInitialScenarioState();
  const target = createCustomLandingTarget({
    name: 'Persistent Target',
    latitudeDeg: -85.5,
    longitudeDeg: 10.0,
  });

  const state1 = scenarioReducer(initial, { type: 'customTarget/changed', target });
  const state2 = scenarioReducer(state1, { type: 'customTarget/changed', target });

  assert.equal(state1, state2, 'Reducer must maintain reference identity when target is unchanged');
});
