import { Play, Clock, Sparkles } from 'lucide-react';
import { NasaFootageItem } from '@/features/gallery/data/nasaFootageManifest';

interface GalleryMediaCardProps {
  item: NasaFootageItem;
  onPlay: (item: NasaFootageItem) => void;
}

export function GalleryMediaCard({ item, onPlay }: GalleryMediaCardProps) {
  return (
    <article
      className="group bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] hover:border-cyan-500/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label={item.title}
    >
      {/* Media Thumbnail Container */}
      <div
        className="relative w-full aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={() => onPlay(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(item);
          }
        }}
        aria-label={`Play video: ${item.title}`}
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Center Play Button Graphic */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>

        {/* Badges Over Thumbnail */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 border border-white/10 text-cyan-300">
            {item.nasaCenter}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-black/75 border border-white/10">
            {item.resolution}
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 bg-black/80 border border-white/10">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{item.duration}</span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--lm-color-text-muted)]">
            <span className="text-cyan-400/90 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {item.categoryLabel}
            </span>
            <span>{item.year}</span>
          </div>

          <h3 className="text-sm font-bold text-[var(--lm-color-text-primary)] line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h3>

          <p className="text-xs text-[var(--lm-color-text-muted)] line-clamp-2 mt-0.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Card Footer Action */}
        <div className="pt-3 border-t border-[var(--lm-color-border-subtle)] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] truncate max-w-[170px]" title={item.credit}>
            {item.credit}
          </span>

          <button
            type="button"
            onClick={() => onPlay(item)}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 flex items-center gap-1.5 transition-all cursor-pointer"
            aria-label={`Watch ${item.title}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch</span>
          </button>
        </div>
      </div>
    </article>
  );
}
