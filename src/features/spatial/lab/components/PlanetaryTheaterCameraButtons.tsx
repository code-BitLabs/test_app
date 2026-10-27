import React from 'react';
import {
  Globe,
  Compass,
  Crosshair,
  Eye,
  Target,
  Mountain,
  Sparkles,
  Radio,
  RotateCw,
  Sun,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';

export interface PlanetaryTheaterCameraButtonsProps {
  currentPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isFlyoverActive: boolean;
  onToggleFlyover: () => void;
  onResetCamera: () => void;
}

interface PresetButtonDef {
  id: string;
  preset: CameraPreset;
  label: string;
  title: string;
  Icon: LucideIcon;
  colorClass?: string;
}

const PRESET_BUTTONS: readonly PresetButtonDef[] = [
  { id: 'global', preset: 'global', label: 'Global', title: 'Global Context: Full lunar sphere view', Icon: Globe },
  { id: 'nadir', preset: 'nadir', label: 'South Pole', title: 'Mode A: Regional South Pole view (matching 2D polar map)', Icon: Compass, colorClass: 'text-[var(--lm-color-selected-site)]' },
  { id: 'site', preset: 'site', label: 'Candidate', title: 'Mode B: Candidate Overview (frames crater and ridge surroundings)', Icon: Crosshair, colorClass: 'text-indigo-400' },
  { id: 'oblique', preset: 'inspection', label: '45° Oblique', title: 'Mode C: 45° Oblique Site Inspection (grazing perspective across crater rims)', Icon: Eye, colorClass: 'text-[var(--lm-color-sun)]' },
  { id: 'overhead', preset: 'overhead', label: 'Overhead', title: 'Mode D: High-Angle Overhead Landing Zone (nadir down to candidate datum)', Icon: Target, colorClass: 'text-emerald-400' },
  { id: 'horizon', preset: 'horizon', label: 'Horizon', title: 'Mode E: Ground-Level Horizon Inspection (astronaut / lander eye-level)', Icon: Mountain, colorClass: 'text-amber-400' },
  { id: 'eva', preset: 'eva', label: 'EVA', title: 'Astronaut EVA: Ground-level first-person surface EVA visor perspective', Icon: Sparkles, colorClass: 'text-cyan-400' },
  { id: 'earth_align', preset: 'earth_align', label: 'Earth Align', title: 'Earth Alignment: Direct RF telecom line-of-sight toward Earth hovering on horizon', Icon: Radio, colorClass: 'text-sky-400' },
  { id: 'orbit360', preset: 'orbit360', label: 'Orbit 360°', title: 'Orbit 360°: Continuous 360-degree circular orbital reconnaissance vantage', Icon: RotateCw, colorClass: 'text-purple-400' },
  { id: 'north_look', preset: 'north_look', label: 'North Look', title: 'North-Looking: Camera anchored at site oriented toward local North along prime meridian', Icon: Compass, colorClass: 'text-teal-400' },
  { id: 'sunward_terminator', preset: 'sunward_terminator', label: 'Terminator', title: 'Sunward Terminator: Facing grazing low-elevation solar vector across shadow boundary', Icon: Sun, colorClass: 'text-yellow-400' },
];

export function PlanetaryTheaterCameraButtons({
  currentPreset,
  onSelectCameraPreset,
  isFlyoverActive,
  onToggleFlyover,
  onResetCamera,
}: PlanetaryTheaterCameraButtonsProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)] overflow-x-auto max-w-full">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-text-muted)] px-1.5 hidden xl:inline shrink-0">
        Mode:
      </span>

      {PRESET_BUTTONS.map((def) => {
        const isActive = currentPreset === def.preset || (def.id === 'oblique' && currentPreset === 'oblique');
        const Icon = def.Icon;
        return (
          <button
            key={def.id}
            type="button"
            data-testid={`preset-${def.id}`}
            onClick={() => onSelectCameraPreset(def.preset)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors shrink-0 ${
              isActive
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                : 'text-[var(--lm-color-text-secondary)] hover:text-white'
            }`}
            title={def.title}
          >
            <Icon className={`w-3 h-3 ${def.colorClass ?? ''}`} />
            <span>{def.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        data-testid="toggle-flyover"
        onClick={onToggleFlyover}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors shrink-0 ${
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
        className="flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium text-[var(--lm-color-text-muted)] hover:text-white transition-colors border border-transparent hover:border-[var(--lm-color-border-subtle)] shrink-0"
        title="Reset Camera & Selection: Restores nadir view and default candidate"
      >
        <RotateCcw className="w-3 h-3" />
        <span className="hidden md:inline">Reset</span>
      </button>
    </div>
  );
}
