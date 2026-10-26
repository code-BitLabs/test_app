import React from 'react';
import {
  Globe,
  Compass,
  Crosshair,
  Eye,
  Target,
  Mountain,
  RotateCw,
  RotateCcw,
} from 'lucide-react';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';

export interface PlanetaryTheaterCameraButtonsProps {
  currentPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isFlyoverActive: boolean;
  onToggleFlyover: () => void;
  onResetCamera: () => void;
}

export function PlanetaryTheaterCameraButtons({
  currentPreset,
  onSelectCameraPreset,
  isFlyoverActive,
  onToggleFlyover,
  onResetCamera,
}: PlanetaryTheaterCameraButtonsProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-text-muted)] px-1.5 hidden xl:inline">
        Mode:
      </span>

      <button
        type="button"
        data-testid="preset-global"
        onClick={() => onSelectCameraPreset('global')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'global'
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Global Context: Full lunar sphere view"
      >
        <Globe className="w-3 h-3" />
        <span>Global</span>
      </button>

      <button
        type="button"
        data-testid="preset-nadir"
        onClick={() => onSelectCameraPreset('nadir')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'nadir'
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Mode A: Regional South Pole view (matching 2D polar map)"
      >
        <Compass className="w-3 h-3 text-[var(--lm-color-selected-site)]" />
        <span>South Pole</span>
      </button>

      <button
        type="button"
        data-testid="preset-site"
        onClick={() => onSelectCameraPreset('site')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'site'
            ? 'bg-[var(--lm-color-surface-strong)] text-indigo-400 border border-indigo-400/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Mode B: Candidate Overview (frames crater and ridge surroundings)"
      >
        <Crosshair className="w-3 h-3" />
        <span>Candidate</span>
      </button>

      <button
        type="button"
        data-testid="preset-oblique"
        onClick={() => onSelectCameraPreset('inspection')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'oblique' || currentPreset === 'inspection'
            ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Mode C: 45° Oblique Site Inspection (grazing perspective across crater rims)"
      >
        <Eye className="w-3 h-3 text-[var(--lm-color-sun)]" />
        <span>45° Oblique</span>
      </button>

      <button
        type="button"
        data-testid="preset-overhead"
        onClick={() => onSelectCameraPreset('overhead')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'overhead'
            ? 'bg-[var(--lm-color-surface-strong)] text-emerald-400 border border-emerald-400/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Mode D: High-Angle Overhead Landing Zone (nadir down to candidate datum)"
      >
        <Target className="w-3 h-3 text-emerald-400" />
        <span>Overhead</span>
      </button>

      <button
        type="button"
        data-testid="preset-horizon"
        onClick={() => onSelectCameraPreset('horizon')}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          currentPreset === 'horizon'
            ? 'bg-[var(--lm-color-surface-strong)] text-amber-400 border border-amber-400/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title="Mode E: Ground-Level Horizon Inspection (astronaut / lander eye-level)"
      >
        <Mountain className="w-3 h-3 text-amber-400" />
        <span>Horizon</span>
      </button>

      <button
        type="button"
        data-testid="toggle-flyover"
        onClick={onToggleFlyover}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
          isFlyoverActive
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 font-semibold'
            : 'text-[var(--lm-color-text-secondary)] hover:text-white'
        }`}
        title={isFlyoverActive ? 'Pause Guided Crater Flyover' : 'Start 360° Guided Flyover Tour'}
      >
        <RotateCw className={`w-3 h-3 ${isFlyoverActive ? 'animate-spin' : ''}`} />
        <span>{isFlyoverActive ? 'Touring' : 'Flyover'}</span>
      </button>

      <button
        type="button"
        data-testid="btn-reset-camera"
        onClick={onResetCamera}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium text-[var(--lm-color-text-muted)] hover:text-white transition-colors border border-transparent hover:border-[var(--lm-color-border-subtle)]"
        title="Reset Camera & Selection: Restores nadir view and default candidate"
      >
        <RotateCcw className="w-3 h-3" />
        <span className="hidden md:inline">Reset</span>
      </button>
    </div>
  );
}
