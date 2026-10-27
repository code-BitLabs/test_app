import React, { useCallback, useMemo, useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { projectLatLon, type SelenographicCoordinate } from '@/domain/coordinates/projection';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import type { ScientificMapLayerMode, SpatialLayer, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import { MapCanvas, type MapHoverPreview } from '@/features/spatial/map/components/MapCanvas';
import { MapToolbar } from '@/features/spatial/map/components/MapToolbar';
import { MapScaleBar } from '@/features/spatial/map/components/MapScaleBar';
import { MapCandidateRibbon } from '@/features/spatial/map/components/MapCandidateRibbon';
import { MapOverlayCards } from '@/features/spatial/map/components/MapOverlayCards';
import { DockedMapInspector } from '@/features/spatial/map/components/inspector/DockedMapInspector';
import { useMapViewport } from '@/features/spatial/map/hooks/useMapViewport';
import {
  analyzeCustomPoint,
  analyzeHoveredSite,
  distanceFromSouthPoleKm,
  distanceToSite,
  type SubPoints,
} from '@/features/spatial/map/model/mapPointAnalysis';

export interface SouthPoleMapProps {
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
  onSelectScientificMapMode?: (mode: ScientificMapLayerMode) => void;
  hideHeader?: boolean;
  hideRibbon?: boolean;
}

/**
 * 2D Polar Stereographic Geographic Map (83°S–90°S).
 * Features geography-first exploration with non-occluding docked bottom inspector (R1).
 */
export function SouthPoleMap({
  preferences,
  onToggleLayer,
  onSelectScientificMapMode,
  hideHeader = false,
  hideRibbon = false,
}: SouthPoleMapProps) {
  const { site: selectedSite, conditions, ephemeris } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  const [hoveredSite, setHoveredSite] = useState<CandidateSite | null>(null);
  const [activeVectorPopover, setActiveVectorPopover] = useState<'sun' | 'earth' | null>(null);
  const [customInspectPoint, setCustomInspectPoint] = useState<SelenographicCoordinate | null>(null);
  const [isInspectorDismissed, setIsInspectorDismissed] = useState(false);

  const sitePos = useMemo(
    () => projectLatLon(selectedSite.coordinates.latitudeDeg, selectedSite.coordinates.longitudeDeg),
    [selectedSite],
  );
  const viewport = useMapViewport(sitePos);

  const subPoints = useMemo<SubPoints>(() => ({
    subSolarLatDeg: ephemeris.subSolarLatDeg,
    subSolarLonDeg: ephemeris.subSolarLonDeg,
    subEarthLatDeg: ephemeris.subEarthLatDeg,
    subEarthLonDeg: ephemeris.subEarthLonDeg,
  }), [ephemeris]);

  const distanceFromPoleKm = useMemo(() => distanceFromSouthPoleKm(selectedSite.coordinates), [selectedSite]);

  const hoverPreview = useMemo<MapHoverPreview | null>(() => {
    if (!hoveredSite || hoveredSite.id === selectedSite.id) return null;
    return { site: hoveredSite, ...analyzeHoveredSite(hoveredSite, subPoints) };
  }, [hoveredSite, selectedSite, subPoints]);

  const customPointData = useMemo(
    () => (customInspectPoint ? analyzeCustomPoint(customInspectPoint, selectedSite, subPoints) : null),
    [customInspectPoint, selectedSite, subPoints],
  );

  const cursorDistanceKm = useMemo(
    () => (viewport.cursorCoord ? distanceToSite(viewport.cursorCoord, selectedSite) : null),
    [viewport.cursorCoord, selectedSite],
  );

  const handleSelectSite = useCallback((site: CandidateSite) => selectSite(site.id), [selectSite]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (viewport.isDragging) return;
    const coord = viewport.coordinateFromEvent(event);
    if (coord) {
      setCustomInspectPoint(coord);
      setIsInspectorDismissed(false);
    }
  }, [viewport]);

  const handleCloseInspector = useCallback(() => {
    setCustomInspectPoint(null);
    setIsInspectorDismissed(true);
  }, []);

  const handleSelectScientificMapMode = useCallback((mode: ScientificMapLayerMode) => {
    setIsInspectorDismissed(false);
    onSelectScientificMapMode?.(mode);
  }, [onSelectScientificMapMode]);

  const customPointProp = useMemo(() => (
    customInspectPoint && customPointData ? { coord: customInspectPoint, analysis: customPointData } : null
  ), [customInspectPoint, customPointData]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      <MapToolbar
        zoom={viewport.zoom}
        onZoomIn={viewport.zoomIn}
        onZoomOut={viewport.zoomOut}
        onReset={viewport.resetViewport}
        onApplyPreset={viewport.applyPreset}
        activePreset={viewport.activePreset}
        showGrid={preferences.showGrid}
        showShadowRegions={preferences.showShadowRegions}
        showCraters={preferences.showCraters}
        showVectors={preferences.showVectors}
        onToggleGrid={() => onToggleLayer('grid')}
        onToggleShadowRegions={() => onToggleLayer('shadowRegions')}
        onToggleCraters={() => onToggleLayer('craters')}
        onToggleVectors={() => onToggleLayer('vectors')}
        hideHeader={hideHeader}
      />

      {/* Map Viewport Area */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden flex flex-col touch-none" style={{ touchAction: 'none' }}>
        <MapOverlayCards
          hoveredSite={hoveredSite}
          hoverPreview={hoverPreview}
          activeVectorPopover={activeVectorPopover}
          distanceFromPoleKm={distanceFromPoleKm}
          customPoint={customPointProp}
          onCloseVectorPopover={() => setActiveVectorPopover(null)}
        />

        <MapCanvas
          svgRef={viewport.svgRef}
          zoom={viewport.zoom}
          viewportStyle={viewport.viewportStyle}
          layers={{
            showGrid: preferences.showGrid,
            showShadowRegions: preferences.showShadowRegions,
            showCraters: preferences.showCraters,
            showVectors: preferences.showVectors,
          }}
          selectedSite={selectedSite}
          sitePos={sitePos}
          siteVectors={{
            sunAzimuthDeg: conditions.sunAzimuthDeg,
            sunElevationDeg: conditions.sunElevationDeg,
            earthAzimuthDeg: conditions.earthAzimuthDeg,
            earthElevationDeg: conditions.earthElevationDeg,
          }}
          hoveredSite={hoveredSite}
          hoverPreview={hoverPreview}
          customPoint={customPointData ? { pos: customPointData.pos, distanceKm: customPointData.distanceKm } : null}
          onSelectSite={handleSelectSite}
          onHoverSite={setHoveredSite}
          onOpenVectorPopover={setActiveVectorPopover}
          scientificMapMode={preferences.scientificMapMode}
          onSelectScientificMapMode={handleSelectScientificMapMode}
          gestures={{
            onMouseDown: viewport.handleMouseDown, onMouseMove: viewport.handleMouseMove,
            onMouseUp: viewport.handleMouseUp, onMouseLeave: viewport.handleMouseLeave,
            onWheel: viewport.handleWheel, onClick: handleCanvasClick,
            onTouchStart: viewport.handleTouchStart, onTouchMove: viewport.handleTouchMove,
            onTouchEnd: viewport.handleTouchEnd, onTouchCancel: viewport.handleTouchCancel,
          }}
        />

        <MapScaleBar
          zoom={viewport.zoom}
          cursorCoord={viewport.cursorCoord}
          cursorDistanceKm={cursorDistanceKm}
          selectedSite={selectedSite}
          className="bottom-3 left-3"
        />
      </div>

      {/* Non-Occluding Docked Bottom Inspector */}
      {!isInspectorDismissed && (
        <DockedMapInspector
          customPoint={customPointProp}
          customPointData={customPointData}
          selectedSite={selectedSite}
          scientificMapMode={preferences.scientificMapMode}
          onClose={handleCloseInspector}
          onSelectNearestSite={handleSelectSite}
        />
      )}

      {!hideRibbon && <MapCandidateRibbon selectedSite={selectedSite} onSelectSite={handleSelectSite} />}
    </div>
  );
}
