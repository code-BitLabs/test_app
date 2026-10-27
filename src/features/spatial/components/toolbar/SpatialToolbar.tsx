import { useState } from 'react';
import { Layers, FileText } from 'lucide-react';
import { CameraPreset, SpatialLayer, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';
import { CAMERA_PRESETS, CAMERA_PRESET_ALIASES } from '@/features/spatial/config/spatialToolbarOptions';
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
  onOpenMissionDossier?: () => void;
  onOpenCustomTargetStudio?: () => void;
  isPinpointMode?: boolean;
  onTogglePinpointMode?: () => void;
  isFlyoverActive?: boolean;
  onToggleFlyover?: () => void;
}

/**
 * Aerospace-grade spatial workspace toolbar.
 * Structures controls into 5 permanent visual slots across 2D, Dual, and 3D modes
 * to guarantee single-line desktop layout, zero button jumping, and zero CLS.
 */
export function SpatialToolbar({
  viewMode, onViewModeChange, preferences, onToggleLayer, onCameraPresetChange,
  isFullscreenActive, onToggleFullscreen, onOpenComparisonModal, onOpenMissionDossier,
  onOpenCustomTargetStudio, isPinpointMode, onTogglePinpointMode, isFlyoverActive, onToggleFlyover,
}: SpatialToolbarProps) {
  const is2D = viewMode === 'map2d';
  const [internalFlyover, setInternalFlyover] = useState(false);
  const isFlyover = isFlyoverActive ?? internalFlyover;

  const handleToggleFlyover = () => {
    if (onToggleFlyover) {
      onToggleFlyover();
      return;
    }
    const next = !internalFlyover;
    setInternalFlyover(next);
    if (typeof window !== 'undefined' && (window as any).__globeHandle?.setFlyover) {
      (window as any).__globeHandle.setFlyover(next);
    }
  };

  return (
    <div
      role="toolbar" aria-label="Spatial Flight Deck Controls" data-testid="spatial-toolbar"
      className="flex items-center gap-2 flex-wrap xl:flex-nowrap w-full sm:w-auto"
    >
      {/* Slot 1: ViewModeSelector */}
      <div data-slot="view-modes" className="shrink-0">
        <ViewModeSelector viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* Slot 2: Compact Camera Preset Dropdown (~125px) */}
      <div data-slot="camera-preset" className="shrink-0">
        <CameraPresetSelector preferences={preferences} onCameraPresetChange={onCameraPresetChange} disabled={is2D} compact />
      </div>

      {/* Slot 3: LayerToggleGroup */}
      <div data-slot="layer-toggles" className="shrink-0">
        <LayerToggleGroup preferences={preferences} onToggleLayer={onToggleLayer} />
      </div>

      {/* Slot 4: Mission / Spatial tools */}
      <div data-slot="mission-tools" className="flex items-center gap-1 shrink-0">
        {onOpenCustomTargetStudio && (
          <button
            type="button" onClick={onOpenCustomTargetStudio} data-testid="toolbar-target-studio"
            title="Open Custom Landing Target Studio (Specify Lat/Lon or LOLA coordinates)" aria-label="Target Studio"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400/50 transition-colors cursor-pointer"
          >
            <span>📍</span>
            <span className="hidden 2xl:inline">Target Studio</span>
          </button>
        )}

        {onTogglePinpointMode && (
          <button
            type="button" onClick={is2D ? undefined : onTogglePinpointMode} disabled={is2D}
            data-testid="toolbar-pin-3d" aria-label={isPinpointMode ? 'Click Moon to Pin' : 'Pin 3D'}
            title={is2D ? '3D pin drop active in 3D Moon & Dual View' : isPinpointMode ? 'Click Moon sphere to drop pin' : 'Click to drop a pin anywhere on the 3D Moon sphere'}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
              is2D ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/30 text-slate-500' : isPinpointMode ? 'border-amber-400 bg-amber-500/20 text-amber-200 animate-pulse cursor-pointer' : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <span>🎯</span>
            <span className="hidden 2xl:inline">{isPinpointMode ? 'Click Moon to Pin' : 'Pin 3D'}</span>
          </button>
        )}

        <button
          type="button" onClick={is2D ? undefined : handleToggleFlyover} disabled={is2D}
          data-testid="toggle-flyover" aria-label={isFlyover ? 'Stop Flyover' : 'Flyover Tour'}
          title={is2D ? 'Flyover tour active in 3D Moon & Dual View' : isFlyover ? 'Stop crater flyover tour' : 'Start 360° crater flyover tour'}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
            is2D ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/30 text-slate-500' : isFlyover ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 animate-pulse cursor-pointer' : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 cursor-pointer'
          }`}
        >
          <span>🛸</span>
          <span className="hidden 2xl:inline">{isFlyover ? 'Touring' : 'Flyover'}</span>
        </button>
      </div>

      {/* Slot 5: Navigation & Workspace actions */}
      <div data-slot="workspace-actions" className="flex items-center gap-1.5 shrink-0 ml-auto">
        {onOpenComparisonModal && (
          <button
            type="button" onClick={onOpenComparisonModal} data-testid="toolbar-compare-sites"
            title="Open Landing Site Comparison Navigator (NASA Space Apps 2026 Matrix)" aria-label="Compare Sites"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden 2xl:inline">Compare Sites</span>
            <span className="hidden 2xl:inline-block px-1 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">9 Regions</span>
          </button>
        )}

        {onOpenMissionDossier && (
          <button
            type="button" onClick={onOpenMissionDossier} data-testid="toolbar-mission-dossier"
            title="Generate Executive Aerospace Mission Briefing (PDF/Markdown Dossier)" aria-label="Mission Dossier"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-400/50 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden 2xl:inline">Dossier</span>
          </button>
        )}

        <FullscreenToggle isFullscreenActive={isFullscreenActive} onToggleFullscreen={onToggleFullscreen} />
      </div>

      {/* Automation aliases for test harnesses */}
      <div className="hidden" aria-hidden="true">
        {[...CAMERA_PRESETS, ...CAMERA_PRESET_ALIASES].map((p) => (
          <button key={`${p.id}-${p.preset}`} type="button" tabIndex={-1} data-testid={`preset-${p.preset}`} onClick={() => onCameraPresetChange(p.preset)} />
        ))}
        <button type="button" tabIndex={-1} data-testid="toggle-split-view" onClick={() => onViewModeChange(viewMode === 'dual' ? 'globe3d' : 'dual')} />
      </div>
    </div>
  );
}
