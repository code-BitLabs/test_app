import { useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ResultAvailability } from '@/domain/celestial/availability';
import { availableValue } from '@/shared/formatting/availability';
import { CameraPreset, ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
  TopocentricElevationDeg,
} from '@/domain/coordinates/frames';
import { RoverTelemetry } from '@/features/spatial/globe/interaction/lunarRoverController';
import { CustomLandingTarget } from '@/domain/target/customTargetModel';
import {
  GlobeLoadingOverlay,
  GlobeTextureErrorBanner,
  GlobeUnavailablePanel,
} from '@/features/spatial/globe/components/GlobeStatusOverlay';
import { GlobeControlsOverlay } from '@/features/spatial/globe/components/GlobeControlsOverlay';
import { GlobeHoverCard } from '@/features/spatial/globe/components/GlobeHoverCard';
import { GlobeLegend } from '@/features/spatial/globe/components/GlobeLegend';
import { NasaSvsElevationLegend } from '@/features/spatial/globe/components/NasaSvsElevationLegend';
import { GlobeCandidateRibbon } from '@/features/spatial/globe/components/GlobeCandidateRibbon';
import { GlobeFlightDeckHudOverlay } from '@/features/spatial/globe/components/GlobeFlightDeckHudOverlay';
import { useGlobeScene } from '@/features/spatial/globe/hooks/useGlobeScene';

export interface LunarGlobe3DProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  earthElevationDeg?: ResultAvailability<TopocentricElevationDeg>;
  showGrid: boolean;
  showShadowRegions: boolean;
  showVectors: boolean;
  showLaserTracks?: boolean;
  showTerrain?: boolean;
  showMarkers?: boolean;
  showLabels?: boolean;
  onToggleGrid: () => void;
  onToggleShadowRegions: () => void;
  onToggleVectors: () => void;
  onToggleLaserTracks?: () => void;
  hideHeader?: boolean;
  hideRibbon?: boolean;
  hideLegend?: boolean;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  scientificMapMode?: ScientificMapLayerMode;
  onRoverTelemetryChange?: (telemetry: RoverTelemetry | null) => void;
  onRoverActiveChange?: (active: boolean) => void;
  showDiagnostics?: boolean;
  epochIsoUtc?: string;
  isFlyoverActive?: boolean;
  onFlyoverChange?: (active: boolean) => void;
  isRoverActive?: boolean;
  customTarget?: CustomLandingTarget | null;
  isPinpointMode?: boolean;
  onPinpointCustomTarget?: (target: CustomLandingTarget) => void;
}

/**
 * Authoritative 3D lunar flight deck rendering IAU 2000 ME frames and LOLA DEM.
 * Scene management delegates to useGlobeScene; HUD overlays mount in GlobeFlightDeckHudOverlay.
 */
export function LunarGlobe3D(props: LunarGlobe3DProps) {
  const {
    selectedSite,
    cameraPreset,
    onCameraPresetChange,
    onSelectSite,
    hideHeader = false,
    hideRibbon = false,
    hideLegend = false,
    showDiagnostics = false,
    epochIsoUtc,
  } = props;

  const [internalRoverActive, setInternalRoverActive] = useState(false);
  const [internalTelemetry, setInternalTelemetry] = useState<RoverTelemetry | null>(null);

  const isRoverActive = props.isRoverActive ?? internalRoverActive;
  const toggleRoverActive = () => {
    const next = !isRoverActive;
    setInternalRoverActive(next);
    props.onRoverActiveChange?.(next);
  };

  const handleRoverTelemetry = (telemetry: RoverTelemetry | null) => {
    setInternalTelemetry(telemetry);
    props.onRoverTelemetryChange?.(telemetry);
  };

  const earthElevationValue = props.earthElevationDeg === undefined ? null : availableValue(props.earthElevationDeg);
  const earthElevationDisplay =
    earthElevationValue === null ? '—' : `${earthElevationValue >= 0 ? '+' : ''}${earthElevationValue.toFixed(1)}° elev`;

  const { containerRef, status, hoveredSite, applyCameraPreset, getDiagnostics } = useGlobeScene({
    ...props,
    earthElevationDeg: earthElevationValue,
    onRoverTelemetryChange: handleRoverTelemetry,
    isRoverActive,
  });

  if (status.kind === 'unsupported') return <GlobeUnavailablePanel />;

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-hidden select-none min-h-0">
      {!hideHeader && (
        <GlobeControlsOverlay
          cameraPreset={cameraPreset}
          onSelectPreset={(preset) => applyCameraPreset(preset, selectedSite)}
          showGrid={props.showGrid}
          showShadowRegions={props.showShadowRegions}
          showVectors={props.showVectors}
          showLaserTracks={props.showLaserTracks}
          onToggleGrid={props.onToggleGrid}
          onToggleShadowRegions={props.onToggleShadowRegions}
          onToggleVectors={props.onToggleVectors}
          onToggleLaserTracks={props.onToggleLaserTracks}
        />
      )}

      {status.kind === 'loading' && <GlobeLoadingOverlay />}
      {status.kind === 'textureError' && <GlobeTextureErrorBanner message={status.message} />}

      <div
        ref={containerRef}
        style={{ touchAction: 'none' }}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing min-h-0 touch-none"
      />

      <GlobeFlightDeckHudOverlay
        cameraPreset={cameraPreset}
        onCameraPresetChange={onCameraPresetChange}
        selectedSite={selectedSite}
        subSolarLatDeg={props.subSolarLatDeg}
        subSolarLonDeg={props.subSolarLonDeg}
        subEarthLatDeg={props.subEarthLatDeg}
        subEarthLonDeg={props.subEarthLonDeg}
        earthElevationValue={earthElevationValue}
        isRoverActive={isRoverActive}
        onToggleRoverActive={toggleRoverActive}
        roverTelemetry={internalTelemetry}
        showDiagnostics={showDiagnostics}
        getDiagnostics={getDiagnostics}
        epochIsoUtc={epochIsoUtc}
      />

      {hoveredSite && <GlobeHoverCard site={hoveredSite} />}
      {!hideLegend && <GlobeLegend earthElevationDisplay={earthElevationDisplay} isCompact={hideRibbon} />}
      <NasaSvsElevationLegend isVisible={props.scientificMapMode === 'topography'} />

      {!hideRibbon && (
        <GlobeCandidateRibbon
          selectedSiteId={selectedSite.id}
          onSelectSite={(site) => {
            onSelectSite(site);
            applyCameraPreset('site', site);
          }}
        />
      )}
    </div>
  );
}
