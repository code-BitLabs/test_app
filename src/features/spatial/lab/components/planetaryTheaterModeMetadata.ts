import { CameraPreset } from '@/features/spatial/model/spatialPreferences';

export interface ModeMetadata {
  readonly code: string;
  readonly name: string;
  readonly desc: string;
  readonly color: string;
}

export function getModeMetadata(preset: CameraPreset): ModeMetadata {
  switch (preset) {
    case 'nadir':
      return {
        code: 'MODE A',
        name: 'Regional South Pole',
        desc: 'Polar relief, 83°S LOLA coverage boundary, and candidate comparison',
        color: 'text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)]/50 bg-[var(--lm-color-selected-site)]/10',
      };
    case 'site':
      return {
        code: 'MODE B',
        name: 'Candidate Overview',
        desc: 'Crater and ridge morphology surrounding candidate site',
        color: 'text-indigo-400 border-indigo-400/50 bg-indigo-500/10',
      };
    case 'oblique':
    case 'inspection':
      return {
        code: 'MODE C',
        name: '45° Oblique Inspection',
        desc: 'Grazing view across crater rim relief with synchronized solar shadows',
        color: 'text-[var(--lm-color-sun)] border-[var(--lm-color-sun)]/50 bg-[var(--lm-color-sun)]/10',
      };
    case 'overhead':
      return {
        code: 'MODE D',
        name: 'Overhead Tactical Nadir',
        desc: 'High-angle tactical top-down view centered on the candidate datum',
        color: 'text-emerald-400 border-emerald-400/50 bg-emerald-500/10',
      };
    case 'horizon':
      return {
        code: 'MODE E',
        name: 'Ground Horizon View',
        desc: 'Low-angle perspective looking toward the illuminated lunar horizon',
        color: 'text-amber-400 border-amber-400/50 bg-amber-500/10',
      };
    case 'global':
    default:
      return {
        code: 'GLOBAL',
        name: 'Full Moon Context',
        desc: 'Global selenographic sphere with comfortable margin',
        color: 'text-slate-300 border-slate-500/50 bg-slate-500/10',
      };
  }
}
