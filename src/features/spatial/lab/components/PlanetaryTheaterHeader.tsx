import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  Compass,
  Columns,
  FileText,
  Activity,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { getModeMetadata } from './planetaryTheaterModeMetadata';

export interface PlanetaryTheaterHeaderProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  cameraPreset: CameraPreset;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  showSitePanel: boolean;
  onToggleSitePanel: () => void;
  showDiagnostics: boolean;
  onToggleDiagnostics: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenComparison: () => void;
  onReturnToObservatory: () => void;
}

export function PlanetaryTheaterHeader({
  selectedSite,
  onSelectSite,
  cameraPreset,
  isSplitView,
  onToggleSplitView,
  showSitePanel,
  onToggleSitePanel,
  showDiagnostics,
  onToggleDiagnostics,
  isFullscreen,
  onToggleFullscreen,
  onOpenComparison,
  onReturnToObservatory,
}: PlanetaryTheaterHeaderProps) {
  const modeMetadata = getModeMetadata(cameraPreset);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[var(--lm-color-surface)]/90 backdrop-blur-md border-b border-[var(--lm-color-border-subtle)] pointer-events-auto">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReturnToObservatory}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] hover:bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          title="Return to LunaMission Observatory"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Observatory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-[var(--lm-color-selected-site)]">
            LunaMission 3D Lab
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-muted)] border border-[var(--lm-color-border-subtle)]">
            STANDALONE 3D HARNESS
          </span>
        </div>

        <div
          className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${modeMetadata.color}`}
          title={modeMetadata.desc}
        >
          <Sparkles className="w-3 h-3" />
          <span className="font-bold">{modeMetadata.code}:</span>
          <span>{modeMetadata.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedSite.id}
          onChange={(e) => {
            const target = CANDIDATE_SITES.find((s) => s.id === e.target.value);
            if (target) onSelectSite(target);
          }}
          className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-xs text-[var(--lm-color-text-primary)] rounded-[var(--lm-radius-xs)] px-2.5 py-1 font-mono focus:outline-none focus:border-[var(--lm-color-selected-site)]"
          title="Select Authoritative Artemis Candidate Landing Site"
        >
          {CANDIDATE_SITES.map((site) => (
            <option key={site.id} value={site.id}>
              {site.code} • {site.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          data-testid="open-comparison-matrix"
          onClick={onOpenComparison}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border bg-amber-500/10 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 transition-colors font-semibold shadow-sm"
          title="Open Artemis Multi-Site Comparison Navigator"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Compare Sites</span>
        </button>

        <button
          type="button"
          data-testid="toggle-split-view"
          onClick={onToggleSplitView}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border transition-colors ${
            isSplitView
              ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-semibold'
              : 'bg-[var(--lm-color-surface-raised)] border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
          title="Toggle Synchronized 2D/3D Split-Screen View"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Split 2D/3D</span>
        </button>

        <button
          type="button"
          onClick={onToggleSitePanel}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border transition-colors ${
            showSitePanel
              ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-semibold'
              : 'bg-[var(--lm-color-surface-raised)] border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
          title="Toggle Scientific Site Inspection Panel"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Site Intel</span>
        </button>

        <button
          type="button"
          onClick={onToggleDiagnostics}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border transition-colors ${
            showDiagnostics
              ? 'bg-[var(--lm-color-selected-site)]/15 border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] font-semibold'
              : 'bg-[var(--lm-color-surface-raised)] border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white'
          }`}
          title="Toggle Engine Diagnostics HUD"
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Telemetry</span>
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}
