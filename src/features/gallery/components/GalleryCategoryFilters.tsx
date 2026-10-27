import { Film, Video, Eye, Compass, Rocket } from 'lucide-react';
import {
  CATEGORY_DEFINITIONS,
  GalleryCategory,
} from '@/features/gallery/data/nasaFootageManifest';

interface GalleryCategoryFiltersProps {
  activeCategory: GalleryCategory;
  onSelectCategory: (category: GalleryCategory) => void;
  categoryCounts: Record<GalleryCategory, number>;
}

const CATEGORY_ICONS: Record<GalleryCategory, React.ReactNode> = {
  all: <Film className="w-3.5 h-3.5 shrink-0" />,
  svs: <Eye className="w-3.5 h-3.5 shrink-0 text-cyan-400" />,
  lro: <Video className="w-3.5 h-3.5 shrink-0 text-emerald-400" />,
  apollo: <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />,
  artemis: <Rocket className="w-3.5 h-3.5 shrink-0 text-purple-400" />,
};

export function GalleryCategoryFilters({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}: GalleryCategoryFiltersProps) {
  return (
    <div
      role="tablist"
      aria-label="Footage Categories"
      className="flex flex-wrap items-center gap-2 p-1.5 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl"
    >
      {CATEGORY_DEFINITIONS.map((cat) => {
        const isSelected = activeCategory === cat.id;
        const count = categoryCounts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectCategory(cat.id)}
            type="button"
            className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              isSelected
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-sm'
                : 'bg-[var(--lm-color-canvas)] border-transparent text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] hover:border-[var(--lm-color-border-subtle)]'
            }`}
          >
            {CATEGORY_ICONS[cat.id]}
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-[var(--lm-color-surface)] text-[var(--lm-color-text-muted)]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
