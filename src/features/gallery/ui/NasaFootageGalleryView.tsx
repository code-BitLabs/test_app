import { useMemo, useState } from 'react';
import { Film, Search, Sparkles } from 'lucide-react';
import {
  filterFootage,
  GalleryCategory,
  NASA_FOOTAGE_MANIFEST,
  NasaFootageItem,
} from '@/features/gallery/data/nasaFootageManifest';
import { GalleryCategoryFilters } from '../components/GalleryCategoryFilters';
import { GalleryMediaCard } from '../components/GalleryMediaCard';
import { GalleryMediaPlayerModal } from '../components/GalleryMediaPlayerModal';

export function NasaFootageGalleryView() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NasaFootageItem | null>(null);

  const categoryCounts = useMemo(() => {
    return {
      all: NASA_FOOTAGE_MANIFEST.length,
      svs: NASA_FOOTAGE_MANIFEST.filter((i) => i.category === 'svs').length,
      lro: NASA_FOOTAGE_MANIFEST.filter((i) => i.category === 'lro').length,
      apollo: NASA_FOOTAGE_MANIFEST.filter((i) => i.category === 'apollo').length,
      artemis: NASA_FOOTAGE_MANIFEST.filter((i) => i.category === 'artemis').length,
    };
  }, []);

  const filteredItems = useMemo(() => {
    return filterFootage(NASA_FOOTAGE_MANIFEST, activeCategory, searchQuery);
  }, [activeCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0" aria-label="NASA Footage Gallery">
      {/* Top Banner & Search Section */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-base sm:text-lg font-bold text-[var(--lm-color-text-primary)] tracking-tight flex items-center gap-2">
              NASA Lunar Footage Gallery
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-medium">
                Official Archives
              </span>
            </h1>
            <p className="text-xs text-[var(--lm-color-text-muted)]">
              Curated authentic video feeds from SVS visualizations, LRO flybys, Apollo EVAs, and Artemis III animations
            </p>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[var(--lm-color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search footage & missions..."
            aria-label="Search footage"
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border)] rounded-lg text-[var(--lm-color-text-primary)] placeholder-[var(--lm-color-text-muted)] focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <GalleryCategoryFilters
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Media Cards Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <GalleryMediaCard key={item.id} item={item} onPlay={setSelectedItem} />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
          <Sparkles className="w-8 h-8 text-[var(--lm-color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--lm-color-text-secondary)]">
            No footage matching &ldquo;{searchQuery}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
          >
            Reset filters to view all footage
          </button>
        </div>
      )}

      {/* Video Modal Player */}
      <GalleryMediaPlayerModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
