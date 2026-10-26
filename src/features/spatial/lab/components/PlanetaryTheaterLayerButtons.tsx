import React from 'react';
import { ScientificMapLayerMode, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';

export interface PlanetaryTheaterLayerButtonsProps {
  preferences: SpatialPreferences;
  onToggleLayer: (layer: 'grid' | 'shadowRegions' | 'vectors' | 'laserTracks') => void;
  showTerrain: boolean;
  onToggleTerrain: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onSelectScientificMapMode: (mode: ScientificMapLayerMode) => void;
}

export function PlanetaryTheaterLayerButtons({
  preferences,
  onToggleLayer,
  showTerrain,
  onToggleTerrain,
  showMarkers,
  onToggleMarkers,
  showLabels,
  onToggleLabels,
  onSelectScientificMapMode,
}: PlanetaryTheaterLayerButtonsProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
      <button
        type="button"
        onClick={onToggleTerrain}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          showTerrain
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle Base Lunar Surface Terrain"
      >
        Terrain
      </button>

      <button
        type="button"
        onClick={onToggleMarkers}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          showMarkers
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/40 font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle Candidate Site Markers"
      >
        Sites
      </button>

      <button
        type="button"
        onClick={onToggleLabels}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          showLabels
            ? 'bg-[var(--lm-color-surface-strong)] text-cyan-300 border border-cyan-400/40 font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle Candidate Labels and Badges"
      >
        Labels
      </button>

      <button
        type="button"
        onClick={() => onToggleLayer('vectors')}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          preferences.showVectors
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40 font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle Sun Vector and Earth DTE Sightline"
      >
        Vectors
      </button>

      <button
        type="button"
        onClick={() => onToggleLayer('laserTracks')}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          preferences.showLaserTracks
            ? 'bg-[var(--lm-color-surface-strong)] text-cyan-400 border border-cyan-400/40 font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle NASA SVS 3633 LOLA Laser Altimeter Ground Tracks"
      >
        Tracks
      </button>

      <button
        type="button"
        onClick={() => onToggleLayer('shadowRegions')}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          preferences.showShadowRegions
            ? 'bg-[var(--lm-color-surface-strong)] text-[#8CCBFF] border border-[#8CCBFF]/40 font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle 83°S Polar Coverage Footprint Boundary"
      >
        Footprint
      </button>

      <button
        type="button"
        onClick={() => onToggleLayer('grid')}
        className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          preferences.showGrid
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] font-semibold'
            : 'text-[var(--lm-color-text-muted)] hover:text-white'
        }`}
        title="Toggle Selenographic Coordinate Graticule"
      >
        Grid
      </button>

      <div className="flex items-center gap-1 pl-1 border-l border-[var(--lm-color-border-subtle)]">
        <select
          data-testid="select-3d-scientific-layer"
          value={preferences.scientificMapMode}
          onChange={(e) => onSelectScientificMapMode(e.target.value as any)}
          className="bg-[var(--lm-color-surface-strong)] text-cyan-300 border border-[var(--lm-color-border-subtle)] rounded px-1.5 py-1 text-xs font-mono focus:outline-none cursor-pointer"
          title="Select Scientific Surface Map Layer"
        >
          <option value="topography">Topo (NASA SVS 3727)</option>
          <option value="hillshade">Hillshade</option>
          <option value="slope">Slope Hazard</option>
          <option value="geology">Geology</option>
          <option value="illumination">Illumination</option>
          <option value="none">Regolith</option>
        </select>
      </div>
    </div>
  );
}
