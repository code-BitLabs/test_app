import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_LUNAR_TRAVERSES } from '@/domain/traversal/presetRoutes';
import { calculateTraversalPlan } from '@/domain/traversal/traversePlanner';

test('Traversal View: provides at least 4 authoritative Artemis preset traverses', () => {
  assert.ok(PRESET_LUNAR_TRAVERSES.length >= 4);
  for (const preset of PRESET_LUNAR_TRAVERSES) {
    assert.ok(preset.name !== undefined);
    assert.ok(preset.originLatDeg < -70);
    assert.ok(preset.destinationLatDeg < -70);
    assert.ok(preset.scientificGoal.length > 10);
  }
});

test('Traversal View: generates waypoints compatible with elevation transect rendering', () => {
  const preset = PRESET_LUNAR_TRAVERSES[0];
  const plan = calculateTraversalPlan({
    originLatDeg: preset.originLatDeg,
    originLonDeg: preset.originLonDeg,
    destinationLatDeg: preset.destinationLatDeg,
    destinationLonDeg: preset.destinationLonDeg,
    maxWaypoints: 20,
  });

  assert.equal(plan.waypoints.length, 21);
  const firstPoint = plan.waypoints[0];
  const lastPoint = plan.waypoints[plan.waypoints.length - 1];

  assert.equal(firstPoint.distanceFromStartKm, 0);
  assert.equal(lastPoint.distanceFromStartKm, plan.totalDistanceKm);
  assert.ok(plan.waypoints.every((wp) => Number.isFinite(wp.elevationMeters)));
});
