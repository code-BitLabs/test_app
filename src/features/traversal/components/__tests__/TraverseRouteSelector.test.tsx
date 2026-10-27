import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { TraverseRouteSelector } from '../TraverseRouteSelector';
import { PresetLunarTraverse } from '@/domain/traversal/types';
import { PRESET_LUNAR_TRAVERSES } from '@/domain/traversal/presetRoutes';

const CUSTOM_TEST_ROUTE: PresetLunarTraverse = {
  id: 'custom-target-shackleton-ridge',
  name: 'Custom Target: Shackleton Ridge Outpost',
  subtitle: 'Lander (Connecting Ridge) to Custom Target (-89.44°, 115.20°)',
  description: 'A* slope-optimized traverse to designated target coordinates.',
  originName: 'Connecting Ridge',
  originLatDeg: -89.44,
  originLonDeg: 115.2,
  destinationName: 'Shackleton Ridge Outpost',
  destinationLatDeg: -89.65,
  destinationLonDeg: 118.5,
  scientificGoal: 'Geotechnical surface inspection and regolith sample collection.',
};

test('TraverseRouteSelector: renders default canonical traverses when routes prop is omitted', () => {
  const html = renderToStaticMarkup(
    <TraverseRouteSelector
      selectedRouteId={PRESET_LUNAR_TRAVERSES[0].id}
      onSelectRoute={() => {}}
    />,
  );

  assert.ok(html.includes(PRESET_LUNAR_TRAVERSES[0].name));
  assert.ok(html.includes(PRESET_LUNAR_TRAVERSES[1].name));
});

test('TraverseRouteSelector: maps and renders dynamic custom corridors passed via routes prop', () => {
  const customRoutes = [CUSTOM_TEST_ROUTE, ...PRESET_LUNAR_TRAVERSES];
  const html = renderToStaticMarkup(
    <TraverseRouteSelector
      selectedRouteId={CUSTOM_TEST_ROUTE.id}
      onSelectRoute={() => {}}
      routes={customRoutes}
    />,
  );

  // The custom corridor button MUST be present in the corridor selector grid
  assert.ok(
    html.includes('Custom Target: Shackleton Ridge Outpost'),
    'Custom corridor button must be rendered when customRoutes are passed via routes prop',
  );
  assert.ok(
    html.includes('Lander (Connecting Ridge) to Custom Target'),
    'Custom corridor subtitle must be rendered',
  );
});
