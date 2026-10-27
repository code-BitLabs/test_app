import { useEffect, useRef } from 'react';
import { X, Award, ShieldCheck, Film, ExternalLink } from 'lucide-react';
import { NasaFootageItem } from '@/features/gallery/data/nasaFootageManifest';

interface GalleryMediaPlayerModalProps {
  item: NasaFootageItem | null;
  onClose: () => void;
}

export function GalleryMediaPlayerModal({ item, onClose }: GalleryMediaPlayerModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-canvas)]">
          <div className="flex items-center gap-2.5 truncate mr-3">
            <Film className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 id="gallery-modal-title" className="text-sm sm:text-base font-bold text-[var(--lm-color-text-primary)] truncate">
              {item.title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface)] transition-colors cursor-pointer"
            aria-label="Close video player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Canvas */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            src={item.videoUrl}
            title={item.title}
          >
            <track kind="captions" />
            Your browser does not support HTML5 video playback.
          </video>
        </div>

        {/* Modal Metadata & Attributions */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold">
              {item.nasaCenter} • {item.centerFullName}
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
              {item.resolution}
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
              {item.year}
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
              Duration: {item.duration}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--lm-color-text-secondary)] leading-relaxed">
            {item.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--lm-color-border-subtle)] text-xs">
            <div className="flex items-start gap-2 bg-[var(--lm-color-canvas)]/60 p-3 rounded-lg border border-[var(--lm-color-border-subtle)]">
              <Award className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--lm-color-text-primary)]">Official NASA Credit</span>
                <span className="text-[var(--lm-color-text-muted)] text-[11px] mt-0.5">{item.credit}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[var(--lm-color-canvas)]/60 p-3 rounded-lg border border-[var(--lm-color-border-subtle)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--lm-color-text-primary)]">Public License & Provenance</span>
                <span className="text-[var(--lm-color-text-muted)] text-[11px] mt-0.5">{item.license}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
