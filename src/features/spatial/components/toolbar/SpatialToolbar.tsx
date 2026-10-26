import { Layers } from 'lucide-react';
import {
  CameraPreset,
  SpatialLayer,
  SpatialPreferences,
} from '@/features/spatial/model/spatialPreferences';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';
import { ViewModeSelector } from '@/features/spatial/components/toolbar/ViewModeSelector';
import { CameraPresetSelector } from '@/features/spatial/components/toolbar/CameraPresetSelector';
import { LayerToggleGroup } from '@/features/spatial/components/toolbar/LayerToggleGroup';
import { FullscreenToggle } from '@/features/spatial/components/toolbar/FullscreenToggle';

export interface SpatialToolbarProps {
  viewMode: SpatialViewMode;
  onViewModeChange: (mode: SpatialViewMode) => void;
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
  onCameraPresetChange: (preset: CameraPreset) => void;
  isFullscreenActive: boolean;
  onToggleFullscreen: () => void;
  onOpenComparisonModal?: () => void;
  onOpenCustomTargetStudio?: () => void;
  isPinpointMode?: boolean;
  onTogglePinpointMode?: () => void;
}

/**
 * Workspace toolbar. One set of controls drives both visualizations at once,
 * so the shared preference owner passes state down and receives intents back.
 */
export function SpatialToolbar({
  viewMode,
  onViewModeChange,
  preferences,
  onToggleLayer,
  onCameraPresetChange,
  isFullscreenActive,
  onToggleFullscreen,
  onOpenComparisonModal,
  onOpenCustomTargetStudio,
  isPinpointMode,
  onTogglePinpointMode,
}: SpatialToolbarProps) {
  const cameraPresetsApply = viewMode === 'globe3d' || viewMode === 'dual';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewModeSelector viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {cameraPresetsApply && (
        <CameraPresetSelector preferences={preferences} onCameraPresetChange={onCameraPresetChange} />
      )}

      <LayerToggleGroup preferences={preferences} onToggleLayer={onToggleLayer} />

      {onOpenCustomTargetStudio && (
        <button
          type="button"
          onClick={onOpenCustomTargetStudio}
          title="Open Custom Landing Target Studio (Specify Lat/Lon or LOLA coordinates)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400/50 transition-colors cursor-pointer"
        >
          <span>📍</span>
          <span>Target Studio</span>
        </button>
      )}

      {onTogglePinpointMode && (viewMode === 'globe3d' || viewMode === 'dual') && (
        <button
          type="button"
          onClick={onTogglePinpointMode}
          title="Click to drop a pin anywhere on the 3D Moon sphere"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors cursor-pointer ${
            isPinpointMode
              ? 'border-amber-400 bg-amber-500/20 text-amber-200 animate-pulse'
              : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🎯</span>
          <span>{isPinpointMode ? 'Click Moon to Pin' : 'Pin 3D'}</span>
        </button>
      )}

      {onOpenComparisonModal && (
        <button
          type="button"
          onClick={onOpenComparisonModal}
          title="Open Landing Site Comparison Navigator (NASA Space Apps 2026 Matrix)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Compare Sites</span>
          <span className="hidden lg:inline-block px-1 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
            9 Regions
          </span>
        </button>
      )}

      <FullscreenToggle isFullscreenActive={isFullscreenActive} onToggleFullscreen={onToggleFullscreen} />
    </div>
  );
}
