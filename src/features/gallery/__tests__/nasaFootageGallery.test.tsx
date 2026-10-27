import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  NASA_FOOTAGE_MANIFEST,
  CATEGORY_DEFINITIONS,
  filterFootage,
} from '@/features/gallery/data/nasaFootageManifest';
import { GalleryCategoryFilters } from '@/features/gallery/components/GalleryCategoryFilters';
import { GalleryMediaCard } from '@/features/gallery/components/GalleryMediaCard';
import { GalleryMediaPlayerModal } from '@/features/gallery/components/GalleryMediaPlayerModal';
import { NasaFootageGalleryView } from '@/features/gallery/ui/NasaFootageGalleryView';

test('NasaFootageManifest: contains all 5 required authentic NASA footage assets', () => {
  assert.equal(NASA_FOOTAGE_MANIFEST.length, 5);

  const svs5127 = NASA_FOOTAGE_MANIFEST.find((i) => i.id.includes('5127'));
  const lroFlyover = NASA_FOOTAGE_MANIFEST.find((i) => i.id.includes('lro-nac'));
  const apollo17 = NASA_FOOTAGE_MANIFEST.find((i) => i.id.includes('apollo-17'));
  const artemis3 = NASA_FOOTAGE_MANIFEST.find((i) => i.id.includes('artemis-3'));
  const svs4720 = NASA_FOOTAGE_MANIFEST.find((i) => i.id.includes('4720'));

  assert.ok(svs5127, 'SVS 5127 must exist');
  assert.ok(lroFlyover, 'LRO NAC South Pole 85S flyover must exist');
  assert.ok(apollo17, 'Apollo 17 Station 6 boulder sampling must exist');
  assert.ok(artemis3, 'Artemis III South Pole descent animation must exist');
  assert.ok(svs4720, 'SVS 4720 shadow raytracing must exist');
});

test('NasaFootageManifest: validates metadata fields, centers, and licenses', () => {
  for (const item of NASA_FOOTAGE_MANIFEST) {
    assert.ok(item.title.length > 10, 'Title must be descriptive');
    assert.ok(['GSFC', 'JSC', 'JPL', 'HQ'].includes(item.nasaCenter), 'Valid NASA center');
    assert.ok(item.duration.includes(':'), 'Duration formatted mm:ss');
    assert.ok(item.resolution.length > 3, 'Resolution specified');
    assert.ok(item.credit.includes('NASA'), 'Credit must attribute NASA');
    assert.ok(item.license.includes('Public Domain') || item.license.includes('Open'), 'Public license');
  }
});

test('filterFootage: filters by category correctly', () => {
  const svsOnly = filterFootage(NASA_FOOTAGE_MANIFEST, 'svs', '');
  assert.equal(svsOnly.length, 2);
  assert.ok(svsOnly.every((i) => i.category === 'svs'));

  const lroOnly = filterFootage(NASA_FOOTAGE_MANIFEST, 'lro', '');
  assert.equal(lroOnly.length, 1);
  assert.equal(lroOnly[0].category, 'lro');

  const apolloOnly = filterFootage(NASA_FOOTAGE_MANIFEST, 'apollo', '');
  assert.equal(apolloOnly.length, 1);
  assert.equal(apolloOnly[0].category, 'apollo');

  const artemisOnly = filterFootage(NASA_FOOTAGE_MANIFEST, 'artemis', '');
  assert.equal(artemisOnly.length, 1);
  assert.equal(artemisOnly[0].category, 'artemis');
});

test('filterFootage: filters by search query term across title, description, and keywords', () => {
  const cernan = filterFootage(NASA_FOOTAGE_MANIFEST, 'all', 'Cernan');
  assert.equal(cernan.length, 1);
  assert.ok(cernan[0].title.includes('Apollo 17'));

  const raytracing = filterFootage(NASA_FOOTAGE_MANIFEST, 'all', 'raytracing');
  assert.equal(raytracing.length, 1);
  assert.ok(raytracing[0].title.includes('4720'));

  const empty = filterFootage(NASA_FOOTAGE_MANIFEST, 'all', 'nonexistent-mars-rover');
  assert.equal(empty.length, 0);
});

test('GalleryCategoryFilters: renders all 5 category filter buttons with WCAG >= 44x44px target', () => {
  const counts = { all: 5, svs: 2, lro: 1, apollo: 1, artemis: 1 };
  const html = renderToStaticMarkup(
    <GalleryCategoryFilters
      activeCategory="all"
      onSelectCategory={() => {}}
      categoryCounts={counts}
    />,
  );

  assert.ok(html.includes('All Footage'));
  assert.ok(html.includes('SVS Visualizations'));
  assert.ok(html.includes('LRO Orbital Flybys'));
  assert.ok(html.includes('Apollo Surface EVAs'));
  assert.ok(html.includes('Artemis III Missions'));
  assert.ok(html.includes('min-h-[44px]'));
});

test('GalleryMediaCard: renders thumbnail metadata, resolution, duration, and play trigger', () => {
  const item = NASA_FOOTAGE_MANIFEST[0];
  const html = renderToStaticMarkup(<GalleryMediaCard item={item} onPlay={() => {}} />);

  assert.ok(html.includes(item.title));
  assert.ok(html.includes(item.nasaCenter));
  assert.ok(html.includes(item.resolution));
  assert.ok(html.includes(item.duration));
  assert.ok(html.includes('Watch'));
});

test('GalleryMediaPlayerModal: renders accessible dialog with video, credits, and license', () => {
  const item = NASA_FOOTAGE_MANIFEST[2]; // Apollo 17
  const html = renderToStaticMarkup(<GalleryMediaPlayerModal item={item} onClose={() => {}} />);

  assert.ok(html.includes('role="dialog"'));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes(item.title));
  assert.ok(html.includes(item.credit));
  assert.ok(html.includes(item.license));
});

test('NasaFootageGalleryView: renders full page view with banner, search bar, and media cards', () => {
  const html = renderToStaticMarkup(<NasaFootageGalleryView />);

  assert.ok(html.includes('NASA Lunar Footage Gallery'));
  assert.ok(html.includes('Search footage &amp; missions...'));
  assert.ok(html.includes('SVS 5127'));
  assert.ok(html.includes('Apollo 17'));
});
