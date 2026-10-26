import React from 'react';
import { Rewind, FastForward, Play, Pause } from 'lucide-react';
import { CameraPreset, ScientificMapLayerMode, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import { PlanetaryTheaterCameraButtons } from './PlanetaryTheaterCameraButtons';
import { PlanetaryTheaterLayerButtons } from './PlanetaryTheaterLayerButtons';

export interface PlanetaryTheaterToolbarProps {
  preferences: SpatialPreferences;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onSelectScientificMapMode: (mode: ScientificMapLayerMode) => void;
  onToggleLayer: (layer: 'grid' | 'shadowRegions' | 'vectors' | 'laserTracks') => void;
  showTerrain: boolean;
  onToggleTerrain: () => void;
  showMarkers: boolean;
  onToggleMarkers: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  isFlyoverActive: boolean;
  onToggleFlyover: () => void;
  onResetCamera: () => void;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStepTimeHours: (hours: number) => void;
  isControlsCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function PlanetaryTheaterToolbar({
  preferences,
  onSelectCameraPreset,
  onSelectScientificMapMode,
  onToggleLayer,
  showTerrain,
  onToggleTerrain,
  showMarkers,
  onToggleMarkers,
  showLabels,
  onToggleLabels,
  isFlyoverActive,
  onToggleFlyover,
  onResetCamera,
  isPlaying,
  onTogglePlayback,
  onStepTimeHours,
  isControlsCollapsed,
  onToggleCollapsed,
}: PlanetaryTheaterToolbarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[min(1080px,96vw)] w-full flex flex-col items-center gap-1 pointer-events-none">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="pointer-events-auto px-3 py-0.5 rounded-t-[var(--lm-radius-sm)] bg-[var(--lm-color-surface)]/90 backdrop-blur-md border border-[var(--lm-color-border-subtle)] border-b-0 text-[10px] font-mono text-[var(--lm-color-text-muted)] hover:text-white transition-colors shadow-xs"
      >
        {isControlsCollapsed ? '▲ Show 3D Navigation Dock' : '▼ Collapse Dock (Zen View)'}
      </button>

      {!isControlsCollapsed && (
        <div className="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-[var(--lm-radius-md)] bg-[var(--lm-color-surface)]/92 backdrop-blur-md border border-[var(--lm-color-border)] shadow-xl">
          <PlanetaryTheaterCameraButtons
            currentPreset={preferences.cameraPreset}
            onSelectCameraPreset={onSelectCameraPreset}
            isFlyoverActive={isFlyoverActive}
            onToggleFlyover={onToggleFlyover}
            onResetCamera={onResetCamera}
          />

          <PlanetaryTheaterLayerButtons
            preferences={preferences}
            onToggleLayer={onToggleLayer}
            showTerrain={showTerrain}
            onToggleTerrain={onToggleTerrain}
            showMarkers={showMarkers}
            onToggleMarkers={onToggleMarkers}
            showLabels={showLabels}
            onToggleLabels={onToggleLabels}
            onSelectScientificMapMode={onSelectScientificMapMode}
          />

          {/* Provenance Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-slate-400 border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)]">
            <span className="text-cyan-400 font-semibold">NASA SVS 3727 / 3760</span>
            <span>128ppd LOLA</span>
            <span className="text-slate-600">|</span>
            <span>IAU 2000 ME</span>
          </div>

          {/* 3. Real-Time Ephemeris Time Stepper */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
            <button
              type="button"
              onClick={() => onStepTimeHours(-6)}
              className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
              title="Step Backward 6 Hours"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onTogglePlayback}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                isPlaying
                  ? 'bg-[var(--lm-color-sun)]/20 text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/50 font-semibold'
                  : 'text-[var(--lm-color-text-secondary)] hover:text-white'
              }`}
              title={isPlaying ? 'Pause Ephemeris Playback' : 'Play Ephemeris Time Progression'}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={() => onStepTimeHours(6)}
              className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
              title="Step Forward 6 Hours"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
