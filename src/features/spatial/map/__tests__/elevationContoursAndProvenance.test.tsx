import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ElevationContourLayer } from '../layers/ElevationContourLayer';
import { ScientificProvenanceBadge } from '../components/ScientificProvenanceBadge';
import { ScientificMapLegend } from '../components/ScientificMapLegend';
import { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';

test('ElevationContourLayer: renders SVG elevation contour paths when visible is true', () => {
  const html = renderToStaticMarkup(
    <svg viewBox="0 0 600 600">
      <ElevationContourLayer visible={true} zoom={1.5} />
    </svg>
  );

  assert.ok(html.includes('elevation-contour-layer'), 'Layer group must be rendered');
  assert.ok(html.includes('circle'), 'Contour circles must be present');
  assert.ok(html.includes('elevation-contour-scale-bar'), 'Contour scale bar must be rendered');
  assert.ok(html.includes('CONTOURS: 1,000m'), 'Scale bar label must be present');
});

test('ElevationContourLayer: returns null when visible is false', () => {
  const html = renderToStaticMarkup(
    <svg viewBox="0 0 600 600">
      <ElevationContourLayer visible={false} zoom={1.0} />
    </svg>
  );

  assert.equal(html, '<svg viewBox="0 0 600 600"></svg>');
});

test('ScientificProvenanceBadge: displays sensor, resolution, IAU 2000 ME, and credits across all modes', () => {
  const modes: ScientificMapLayerMode[] = [
    'topography',
    'slope',
    'volatiles',
    'temperature',
    'illumination',
    'geology',
    'hillshade',
    'none',
  ];

  for (const mode of modes) {
    const html = renderToStaticMarkup(<ScientificProvenanceBadge mode={mode} />);
    assert.ok(html.includes('layer-provenance-badge'), `Mode ${mode} must render provenance badge`);
    assert.ok(html.includes('IAU 2000 ME'), `Mode ${mode} must reference IAU 2000 ME frame`);
    assert.ok(html.includes('Credits:'), `Mode ${mode} must display credits`);
  }
});

test('ScientificMapLegend: displays NASA SVS 3727 ramp in topography mode and includes provenance badge', () => {
  const html = renderToStaticMarkup(
    <ScientificMapLegend mode="topography" onSelectMode={() => {}} />
  );

  assert.ok(html.includes('NASA SVS 3727 16-Color Ramp'), 'Legend must cite NASA SVS 3727 ramp');
  assert.ok(html.includes('-9,000 m (Basin)'), 'Legend must span down to -9,000 m');
  assert.ok(html.includes('+9,000 m (Highlands)'), 'Legend must span up to +9,000 m');
  assert.ok(html.includes('layer-provenance-badge'), 'Legend must include provenance badge');
  assert.ok(html.includes('LRO LOLA Laser Altimeter'), 'Legend must state LOLA instrument');
});

test('ScientificMapLegend: displays >=15° hazard threshold in slope mode and includes provenance badge', () => {
  const html = renderToStaticMarkup(
    <ScientificMapLegend mode="slope" onSelectMode={() => {}} />
  );

  assert.ok(html.includes('&ge;15° Hazard') || html.includes('≥15° Hazard'), 'Must show >=15° Hazard');
  assert.ok(html.includes('Tip-Over Limit (≥15°)'), 'Must state tip-over limit');
  assert.ok(html.includes('layer-provenance-badge'), 'Legend must include provenance badge');
  assert.ok(html.includes('Artemis III'), 'Legend must display Artemis III credit badge');
});
