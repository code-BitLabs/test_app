import React from 'react';
import { LunarGlobe3D } from '@/features/spatial/ui/LunarGlobe3D';
import { GlobeSiteInspectionPanel } from '@/features/spatial/globe/components/GlobeSiteInspectionPanel';
import { availableValue } from '@/shared/formatting/availability';
import { SiteComparisonMatrixModal } from '@/features/spatial/components/SiteComparisonMatrixModal';
import { PlanetaryTheaterHeader } from './components/PlanetaryTheaterHeader';
import { PlanetaryTheaterToolbar } from './components/PlanetaryTheaterToolbar';
import { PlanetaryTheaterHuds } from './components/PlanetaryTheaterHuds';
import { PlanetaryTheaterSidebar } from './components/PlanetaryTheaterSidebar';
import { usePlanetaryTheaterState } from './hooks/usePlanetaryTheaterState';

export function Scenario3DLab() {
  const state = usePlanetaryTheaterState();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isRoverActive) {
        state.setIsRoverActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isRoverActive, state.setIsRoverActive]);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (state.containerRef.current) {
          await state.containerRef.current.requestFullscreen();
          state.setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        state.setIsFullscreen(false);
      }
    } catch {
      state.setIsFullscreen((prev) => !prev);
    }
  };

  const handleReturnToObservatory = () => {
    window.location.href = '/';
  };

  return (
    <div
      ref={state.containerRef}
      className={`relative w-screen h-screen bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)] overflow-hidden flex flex-col select-none font-sans ${
        state.isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      <PlanetaryTheaterHeader
        selectedSite={state.selectedSite}
        onSelectSite={state.handleSelectSite}
        cameraPreset={state.preferences.cameraPreset}
        isSplitView={state.isSplitView}
        onToggleSplitView={() => state.setIsSplitView((prev) => !prev)}
        showSitePanel={state.showSitePanel}
        onToggleSitePanel={() => state.setShowSitePanel((prev) => !prev)}
        showDiagnostics={state.showDiagnostics}
        onToggleDiagnostics={() => state.setShowDiagnostics((prev) => !prev)}
        isFullscreen={state.isFullscreen}
        onToggleFullscreen={toggleNativeFullscreen}
        onOpenComparison={() => state.setIsComparisonOpen(true)}
        onReturnToObservatory={handleReturnToObservatory}
      />

      <main className="flex-1 w-full h-full relative min-h-0 flex overflow-hidden">
        <div className={`h-full relative min-h-0 transition-all duration-300 ${state.isSplitView ? 'w-1/2' : 'w-full'}`}>
          <LunarGlobe3D
            selectedSite={state.selectedSite}
            onSelectSite={state.handleSelectSite}
            subSolarLatDeg={state.ephemeris.subSolarLatDeg}
            subSolarLonDeg={state.ephemeris.subSolarLonDeg}
            subEarthLatDeg={state.ephemeris.subEarthLatDeg}
            subEarthLonDeg={state.ephemeris.subEarthLonDeg}
            earthElevationDeg={state.conditions.earthElevationDeg}
            showGrid={state.preferences.showGrid}
            showShadowRegions={state.preferences.showShadowRegions}
            showVectors={state.preferences.showVectors}
            showLaserTracks={state.preferences.showLaserTracks}
            showTerrain={state.showTerrain}
            showMarkers={state.showMarkers}
            showLabels={state.showLabels}
            onToggleGrid={() => state.toggleLayer('grid')}
            onToggleShadowRegions={() => state.toggleLayer('shadowRegions')}
            onToggleVectors={() => state.toggleLayer('vectors')}
            onToggleLaserTracks={() => state.toggleLayer('laserTracks')}
            cameraPreset={state.preferences.cameraPreset}
            onCameraPresetChange={state.selectCameraPreset}
            scientificMapMode={state.preferences.scientificMapMode}
            onRoverTelemetryChange={state.setRoverTelemetry}
            showDiagnostics={state.showDiagnostics}
            epochIsoUtc={state.epochIsoUtc}
            isFlyoverActive={state.isFlyoverActive}
            onFlyoverChange={state.setIsFlyoverActive}
            isRoverActive={state.isRoverActive}
            hideHeader
            hideRibbon
            hideLegend
          />

          {state.showSitePanel && (
            <div className="absolute top-14 left-4 z-20 pointer-events-none">
              <GlobeSiteInspectionPanel
                site={state.selectedSite}
                epochIsoUtc={state.epochIsoUtc}
                sunElevationDeg={state.conditions.sunElevationDeg ? availableValue(state.conditions.sunElevationDeg) ?? -1.29 : -1.29}
                sunAzimuthDeg={state.conditions.sunAzimuthDeg ? availableValue(state.conditions.sunAzimuthDeg) ?? 52.9 : 52.9}
                earthElevationDeg={state.conditions.earthElevationDeg}
                onEnterLocalInspection={() => state.selectCameraPreset('inspection')}
                currentMode={state.preferences.cameraPreset === 'oblique' || state.preferences.cameraPreset === 'inspection' ? 'inspection' : state.preferences.cameraPreset === 'site' ? 'overview' : 'regional'}
              />
            </div>
          )}

          <PlanetaryTheaterHuds
            cameraPreset={state.preferences.cameraPreset}
            selectedSite={state.selectedSite}
            isRoverActive={state.isRoverActive}
            onToggleRoverActive={() => state.setIsRoverActive((prev) => !prev)}
            roverTelemetry={state.roverTelemetry}
          />
        </div>

        <PlanetaryTheaterSidebar
          isSplitView={state.isSplitView}
          onReturnToObservatory={handleReturnToObservatory}
        />
      </main>

      <PlanetaryTheaterToolbar
        preferences={state.preferences}
        onSelectCameraPreset={state.selectCameraPreset}
        onSelectScientificMapMode={state.selectScientificMapMode}
        onToggleLayer={state.toggleLayer}
        showTerrain={state.showTerrain}
        onToggleTerrain={() => state.setShowTerrain((prev) => !prev)}
        showMarkers={state.showMarkers}
        onToggleMarkers={() => state.setShowMarkers((prev) => !prev)}
        showLabels={state.showLabels}
        onToggleLabels={() => state.setShowLabels((prev) => !prev)}
        isFlyoverActive={state.isFlyoverActive}
        onToggleFlyover={() => state.setIsFlyoverActive((prev) => !prev)}
        onResetCamera={state.handleResetCamera}
        isPlaying={state.isPlaying}
        onTogglePlayback={state.togglePlayback}
        onStepTimeHours={state.stepTimeHours}
        isControlsCollapsed={state.isControlsCollapsed}
        onToggleCollapsed={() => state.setIsControlsCollapsed((prev) => !prev)}
      />

      <SiteComparisonMatrixModal
        isOpen={state.isComparisonOpen}
        onClose={() => state.setIsComparisonOpen(false)}
        selectedSiteId={state.selectedSite.id}
        onSelectSite={state.handleSelectSite}
      />
    </div>
  );
}
