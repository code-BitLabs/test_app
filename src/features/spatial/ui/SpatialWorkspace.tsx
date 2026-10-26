import { useState } from 'react';
import { Info } from 'lucide-react';
import { useScenario, useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { PointPassport } from '@/features/passport/ui/PointPassport';
import { CandidateRibbon } from '@/features/spatial/components/cards/CandidateRibbon';
import { PassportDrawer } from '@/features/spatial/components/panels/PassportDrawer';
import { SpatialToolbar } from '@/features/spatial/components/toolbar/SpatialToolbar';
import { WorkspaceModals } from '@/features/spatial/components/panels/WorkspaceModals';
import { SpatialViewport } from '@/features/spatial/ui/SpatialViewport';
import {
  DEFAULT_SPATIAL_VIEW_MODE,
  spatialViewModeLabel,
  SpatialViewMode,
} from '@/features/spatial/model/spatialViewMode';
import { useSpatialPreferences } from '@/features/spatial/hooks/useSpatialPreferences';
import { useWorkspaceFullscreen } from '@/features/spatial/hooks/useWorkspaceFullscreen';
import { useCustomTargetManager } from '@/features/spatial/target/hooks/useCustomTargetManager';
import { CustomTargetCompareCard } from '@/features/spatial/target/CustomTargetCompareCard';

export interface SpatialWorkspaceProps {
  onOpenMethodDetails: () => void;
}

/**
 * Composition shell for the spatial workspace.
 */
export function SpatialWorkspace({ onOpenMethodDetails }: SpatialWorkspaceProps) {
  const [viewMode, setViewMode] = useState<SpatialViewMode>(DEFAULT_SPATIAL_VIEW_MODE);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const { selectedSiteId } = useScenario();
  const { selectSite } = useScenarioCommands();
  const { site: selectedSite, epochMs } = useScenarioModel();
  const targetManager = useCustomTargetManager(selectedSite, epochMs, typeof window !== 'undefined' ? window.localStorage : null);
  const { preferences, toggleLayer, selectCameraPreset, selectScientificMapMode } = useSpatialPreferences();
  const { workspaceRef, isActiveFullscreen, showPassportOverlay, toggleFullscreen, togglePassportOverlay, closePassportOverlay } = useWorkspaceFullscreen();

  const toolbar = (
    <SpatialToolbar
      viewMode={viewMode} onViewModeChange={setViewMode}
      preferences={preferences} onToggleLayer={toggleLayer}
      onCameraPresetChange={selectCameraPreset}
      isFullscreenActive={isActiveFullscreen} onToggleFullscreen={toggleFullscreen}
      onOpenComparisonModal={() => setIsComparisonModalOpen(true)}
      onOpenMissionDossier={() => setIsDossierOpen(true)}
      onOpenCustomTargetStudio={() => targetManager.openStudio()}
      isPinpointMode={targetManager.isPinpointMode} onTogglePinpointMode={targetManager.togglePinpoint}
    />
  );

  const viewport = (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col">
      <SpatialViewport
        viewMode={viewMode}
        preferences={preferences}
        onToggleLayer={toggleLayer}
        onCameraPresetChange={selectCameraPreset}
        onSelectScientificMapMode={selectScientificMapMode}
        onGlobeFallbackTo2D={() => setViewMode('map2d')}
        customTarget={targetManager.customTarget}
        isPinpointMode={targetManager.isPinpointMode}
        onPinpointCustomTarget={targetManager.saveTarget}
      />
      {targetManager.customTarget && targetManager.evaluation && targetManager.deltas && (
        <div className="absolute bottom-3 left-3 z-20 max-w-sm pointer-events-auto">
          <CustomTargetCompareCard
            target={targetManager.customTarget}
            evaluation={targetManager.evaluation}
            deltas={targetManager.deltas}
            onClearTarget={targetManager.clearTarget}
            onEditTarget={() => targetManager.openStudio(targetManager.customTarget)}
          />
        </div>
      )}
    </div>
  );

  if (isActiveFullscreen) {
    return (
      <section
        ref={workspaceRef}
        aria-label="Spatial Workspace Fullscreen"
        className="fixed inset-0 z-50 rounded-none border-none p-3 sm:p-5 bg-[var(--lm-color-canvas)] overflow-hidden w-screen h-screen flex flex-col gap-3"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[var(--lm-color-border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono">
                Spatial Workspace
              </span>
              <span className="px-2 py-0.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/40 text-[11px] font-mono text-[var(--lm-color-selected-site)] font-medium">
                Fullscreen Active
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] hidden md:inline">
              Press <kbd className="px-1 py-0.5 rounded bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)]">Esc</kbd> to exit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {toolbar}

            <button
              type="button"
              onClick={togglePassportOverlay}
              title="Toggle Point Passport overlay in fullscreen"
              aria-label="Toggle Point Passport overlay"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
                showPassportOverlay
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)] font-semibold'
                  : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border-[var(--lm-color-border)] hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Point Passport</span>
            </button>
          </div>
        </header>

        <div className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col rounded-[var(--lm-radius-md)] border border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-canvas)]">
          {viewport}

          {showPassportOverlay && (
            <PassportDrawer onClose={closePassportOverlay} onOpenMethodDetails={onOpenMethodDetails} />
          )}
        </div>

        <CandidateRibbon
          selectedCustomTargetId={targetManager.customTarget?.id}
          onSelectCustomTarget={targetManager.setCustomTarget}
          onOpenMissionDossier={() => setIsDossierOpen(true)}
        />

        <WorkspaceModals
          isComparisonModalOpen={isComparisonModalOpen} onCloseComparison={() => setIsComparisonModalOpen(false)}
          isDossierOpen={isDossierOpen} onCloseDossier={() => setIsDossierOpen(false)}
          selectedSite={selectedSite} epochMs={epochMs} onSelectSite={(s) => selectSite(s.id)}
          targetManager={targetManager}
        />
      </section>
    );
  }

  return (
    <section
      ref={workspaceRef}
      aria-label="Spatial Workspace"
      className="flex flex-col bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 gap-4 w-full min-w-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--lm-color-border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono">
            Spatial Workspace
          </span>
          <span className="text-xs text-[var(--lm-color-text-muted)] font-mono hidden sm:inline">
            [
            {spatialViewModeLabel(viewMode)}
            ]
          </span>
        </div>

        {toolbar}
      </header>

      {/* Main Workspace Grid (Left: 2D/3D Visualization, Right: Point Passport) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        <div className={`${viewMode === 'dual' ? 'lg:col-span-8' : 'lg:col-span-7'} min-w-0 flex flex-col gap-2`}>
          <div className="w-full h-[560px] sm:h-[620px] lg:h-[700px] xl:h-[740px] min-h-[480px] relative rounded-[var(--lm-radius-md)] overflow-hidden border border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-canvas)] flex flex-col">
            {viewport}
          </div>
        </div>

        <div className={`${viewMode === 'dual' ? 'lg:col-span-4' : 'lg:col-span-5'} min-w-0 flex flex-col`}>
          <PointPassport onOpenMethodDetails={onOpenMethodDetails} />
        </div>
      </div>

      <CandidateRibbon
        selectedCustomTargetId={targetManager.customTarget?.id}
        onSelectCustomTarget={targetManager.setCustomTarget}
        onOpenMissionDossier={() => setIsDossierOpen(true)}
      />

      <WorkspaceModals
        isComparisonModalOpen={isComparisonModalOpen} onCloseComparison={() => setIsComparisonModalOpen(false)}
        isDossierOpen={isDossierOpen} onCloseDossier={() => setIsDossierOpen(false)}
        selectedSite={selectedSite} epochMs={epochMs} onSelectSite={(s) => selectSite(s.id)}
        targetManager={targetManager}
      />
    </section>
  );
}
