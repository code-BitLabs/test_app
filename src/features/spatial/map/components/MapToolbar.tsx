import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Scan } from 'lucide-react';
import type { MapZoomPreset } from '@/features/spatial/map/model/mapViewportMath';
import { MapToolbarHeader } from './MapToolbarHeader';

export type { MapZoomPreset };

export interface MapToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
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
  hideHeader?: boolean;
}

/**
 * Clean scientific toolbar for the 2D Polar Stereographic Map.
 * Provides zoom presets (Regional, Candidates Cluster, Site Focus, Fit All) and layer toggles.
 */
export function MapToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
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
  hideHeader = false,
}: MapToolbarProps) {
  return (
    <>
      {/* Top Layer & Preset Header Bar (if not hidden by unified workspace) */}
      {!hideHeader && (
        <MapToolbarHeader
          onApplyPreset={onApplyPreset}
          activePreset={activePreset}
          showGrid={showGrid}
          showShadowRegions={showShadowRegions}
          showCraters={showCraters}
          showVectors={showVectors}
          onToggleGrid={onToggleGrid}
          onToggleShadowRegions={onToggleShadowRegions}
          onToggleCraters={onToggleCraters}
          onToggleVectors={onToggleVectors}
        />
      )}

      {/* Floating Zoom & Camera Control Palette on bottom-right */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex flex-col gap-1 pointer-events-auto bg-[var(--lm-color-surface)]/95 backdrop-blur-md p-1.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-md">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom in"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom out"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('fit-all')}
          title="Fit All Candidates"
          aria-label="Fit all candidates"
          className={`p-1.5 rounded-[var(--lm-radius-xs)] transition-colors ${
            activePreset === 'fit-all'
              ? 'text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-raised)]'
              : 'text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)]'
          }`}
        >
          <Scan className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('site')}
          title="Focus on Selected Site"
          aria-label="Focus on selected site"
          className={`p-1.5 rounded-[var(--lm-radius-xs)] transition-colors ${
            activePreset === 'site'
              ? 'text-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-raised)]'
              : 'text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-surface-raised)]'
          }`}
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Reset View (Regional 1.0x)"
          aria-label="Reset view"
          className="p-1.5 rounded-[var(--lm-radius-xs)] text-[var(--lm-color-text-secondary)] hover:text-white hover:bg-[var(--lm-color-surface-raised)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
