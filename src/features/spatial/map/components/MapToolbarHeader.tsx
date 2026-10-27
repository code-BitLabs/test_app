import React from 'react';
import type { MapZoomPreset } from '@/features/spatial/map/model/mapViewportMath';

export interface MapToolbarHeaderProps {
  onApplyPreset: (preset: MapZoomPreset) => void;
  activePreset: MapZoomPreset | 'custom';
  showGrid: boolean;
  showShadowRegions: boolean;
  showCraters: boolean;
  showVectors: boolean;
  onToggleGrid: () => void;
  onToggleShadowRegions: () => void;
  onToggleCraters: () => void;
  onToggleVectors: () => void;
}

export function MapToolbarHeader({
  onApplyPreset,
  activePreset,
  showGrid,
  showShadowRegions,
  showCraters,
  showVectors,
  onToggleGrid,
  onToggleShadowRegions,
  onToggleCraters,
  onToggleVectors,
}: MapToolbarHeaderProps) {
  return (
    <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
      {/* Map Title & Bounds Datum */}
      <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-[var(--lm-color-surface)]/94 backdrop-blur-md px-2.5 py-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
        <span className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
          Polar Stereographic Map
        </span>
        <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] border-l border-[var(--lm-color-border)] pl-2">
          83°S – 90°S
        </span>
        <span className="text-[9.5px] font-mono text-slate-400 border-l border-[var(--lm-color-border)] pl-2 hidden xl:inline">
          IAU/LOLA 128ppd
        </span>
      </div>

      {/* View Extent Presets */}
      <div className="pointer-events-auto flex items-center gap-1 bg-[var(--lm-color-surface)]/94 backdrop-blur-md p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
        <button
          type="button"
          onClick={() => onApplyPreset('regional')}
          title="Regional View: Full 83°S–90°S Basin"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            activePreset === 'regional'
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Regional
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('candidates')}
          title="Candidates Cluster: Focused on Artemis Ridge Sites (87°S–90°S)"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            activePreset === 'candidates'
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Candidates
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('site')}
          title="Site Inspection: High Magnification on Selected Candidate"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            activePreset === 'site'
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Site Focus
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('fit-all')}
          title="Fit All: Bounded framing of all 8 candidate sites"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            activePreset === 'fit-all'
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Fit All
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="pointer-events-auto hidden md:flex items-center gap-1 bg-[var(--lm-color-surface)]/94 backdrop-blur-md p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
        <button
          type="button"
          onClick={onToggleGrid}
          title="Toggle Coordinate Graticule"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            showGrid
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)]'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Grid
        </button>
        <button
          type="button"
          onClick={onToggleShadowRegions}
          title="Toggle Permanently Shadowed Regions (PSR)"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            showShadowRegions
              ? 'bg-[var(--lm-color-surface-strong)] text-[#8CCBFF] border border-[#8CCBFF]/40'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          PSR
        </button>
        <button
          type="button"
          onClick={onToggleCraters}
          title="Toggle Crater Nomenclature"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            showCraters
              ? 'bg-[var(--lm-color-surface-strong)] text-slate-200 border border-[var(--lm-color-border)]'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Craters
        </button>
        <button
          type="button"
          onClick={onToggleVectors}
          title="Toggle Topocentric Sun & Earth Direction Vectors"
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            showVectors
              ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40 font-semibold'
              : 'text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
        >
          Vectors
        </button>
      </div>
    </div>
  );
}
