import { useEffect } from 'react';
import { Mountain, Target } from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { RoverTelemetry } from '@/features/spatial/globe/interaction/lunarRoverController';
import { GlobeDiagnosticsMetrics } from '@/features/spatial/globe/scene/globeSceneBuilder';
import { AstronautHelmetHud } from './AstronautHelmetHud';
import { GlobeDiagnosticsOverlay } from './GlobeDiagnosticsOverlay';

export interface GlobeFlightDeckHudOverlayProps {
  cameraPreset: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  selectedSite: CandidateSite;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  earthElevationValue?: number | null;
  isRoverActive: boolean;
  onToggleRoverActive: () => void;
  roverTelemetry: RoverTelemetry | null;
  showDiagnostics?: boolean;
  getDiagnostics?: () => GlobeDiagnosticsMetrics | null;
  epochIsoUtc?: string;
}

/**
 * Modular flight deck HUD overlay for the unified 3D Moon experience.
 * Consolidates EVA Helmet Visor, Rover Surface Driving HUD, Tactical Overhead HUD,
 * and Telemetry Diagnostics into a single non-intrusive container.
 */
export function GlobeFlightDeckHudOverlay({
  cameraPreset,
  onCameraPresetChange,
  selectedSite,
  subSolarLatDeg,
  subSolarLonDeg,
  subEarthLatDeg,
  subEarthLonDeg,
  earthElevationValue,
  isRoverActive,
  onToggleRoverActive,
  roverTelemetry,
  showDiagnostics = false,
  getDiagnostics,
  epochIsoUtc,
}: GlobeFlightDeckHudOverlayProps) {
  useEffect(() => {
    if (!isRoverActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleRoverActive();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRoverActive, onToggleRoverActive]);

  return (
    <>
      {cameraPreset === 'eva' && (
        <AstronautHelmetHud
          site={selectedSite}
          subSolarLatDeg={subSolarLatDeg}
          subSolarLonDeg={subSolarLonDeg}
          subEarthLatDeg={subEarthLatDeg}
          subEarthLonDeg={subEarthLonDeg}
          earthElevationDeg={earthElevationValue}
          onExit={() => onCameraPresetChange?.('site')}
        />
      )}

      {(cameraPreset === 'horizon' || isRoverActive) && (
        <aside
          data-testid="rover-hud"
          aria-label="Rover Traversal Telemetry HUD"
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-amber-500/50 rounded-[var(--lm-radius-md)] px-4 py-2 text-xs font-mono shadow-2xl flex flex-col gap-1.5 max-w-lg w-full"
        >
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-1">
            <span className="flex items-center gap-1.5 font-bold text-amber-300 uppercase tracking-wider">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRoverActive ? 'Surface Rover EVA Traverse • 25m Mast' : 'Crater Rim Ground Horizon Perspective'}</span>
            </span>
            <button
              type="button"
              onClick={onToggleRoverActive}
              className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                isRoverActive
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
              }`}
            >
              {isRoverActive ? 'Exit Rover • Orbit View' : 'Drive Rover (EVA)'}
            </button>
          </div>

          {isRoverActive ? (
            <>
              <div className="grid grid-cols-4 gap-2 text-[10px] pt-0.5">
                <div>
                  <span className="text-slate-400 block">COORDINATES</span>
                  <span className="text-white font-semibold">
                    {roverTelemetry
                      ? `${roverTelemetry.latDeg.toFixed(3)}°S, ${roverTelemetry.lonDeg.toFixed(1)}°E`
                      : `${selectedSite.coordinates.latitudeDeg.toFixed(3)}°S, ${selectedSite.coordinates.longitudeDeg.toFixed(1)}°E`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">LOLA ELEVATION</span>
                  <span className="text-cyan-300 font-semibold">
                    {roverTelemetry
                      ? `${roverTelemetry.elevationMeters > 0 ? '+' : ''}${roverTelemetry.elevationMeters.toLocaleString()} m`
                      : `+${selectedSite.coordinates.elevationMeters.toLocaleString()} m`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">SURFACE SLOPE</span>
                  <span className="text-emerald-400 font-semibold">
                    {roverTelemetry ? `${roverTelemetry.slopeDeg.toFixed(1)}°` : '8.5°'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">GROUND SPEED</span>
                  <span className="text-white font-semibold">
                    {roverTelemetry ? `${roverTelemetry.speedMps.toFixed(1)} m/s` : '0.0 m/s'}
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 flex items-center justify-between border-t border-[var(--lm-color-border-subtle)] pt-1">
                <span>Controls: <strong className="text-slate-200">W/A/S/D or Arrow keys</strong> to drive</span>
                <span><strong className="text-slate-200">Click & Drag</strong> to look • <strong className="text-slate-200">Esc</strong> to exit</span>
              </div>
            </>
          ) : (
            <div className="text-[10px] text-slate-300 flex items-center justify-between">
              <span>Orbit Controls: <strong className="text-white">Drag</strong> to orbit horizon • <strong className="text-white">Scroll</strong> to zoom</span>
              <span className="text-amber-400/90 text-[9px]">Ridge Horizon Overlook</span>
            </div>
          )}
        </aside>
      )}

      {cameraPreset === 'overhead' && (
        <aside
          data-testid="overhead-hud"
          aria-label="Overhead Tactical Nadir HUD"
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-emerald-500/50 rounded-[var(--lm-radius-md)] px-3.5 py-1.5 text-xs font-mono shadow-2xl flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>OVERHEAD NADIR • {selectedSite.code}</span>
          </div>
          <div className="text-[10px] text-slate-300 border-l border-emerald-500/30 pl-3 flex items-center gap-2">
            <span>Tactical 84° Nadir</span>
            <span>•</span>
            <span>Drag to rotate azimuth • Scroll to zoom</span>
          </div>
        </aside>
      )}

      {showDiagnostics && getDiagnostics && (
        <GlobeDiagnosticsOverlay
          getDiagnostics={getDiagnostics}
          selectedSite={selectedSite}
          epochIsoUtc={epochIsoUtc}
          isVisible={showDiagnostics}
        />
      )}
    </>
  );
}
