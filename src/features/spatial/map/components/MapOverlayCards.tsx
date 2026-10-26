import React from 'react';
import type { CandidateSite } from '@/domain/sites/candidateSite';
import type { SelenographicCoordinate } from '@/domain/coordinates/projection';
import { useScenarioModel } from '@/app/scenario/context/scenarioContext';
import { SiteTelemetryCard } from '@/features/spatial/components/cards/SiteTelemetryCard';
import { HoverCandidateCard } from '@/features/spatial/components/cards/HoverCandidateCard';
import { CustomPointCard } from '@/features/spatial/components/cards/CustomPointCard';
import { VectorTelemetryPopover } from '@/features/spatial/components/panels/VectorTelemetryPopover';
import type { MapHoverPreview } from '@/features/spatial/map/components/MapCanvas';
import type { CustomPointAnalysis } from '@/features/spatial/map/model/mapPointAnalysis';
import type { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import { VolatileProspectingCard } from '@/features/spatial/components/cards/VolatileProspectingCard';

export interface MapOverlayCardsProps {
  /** Hover as tracked by the site layer; the telemetry HUD yields to any hover. */
  hoveredSite: CandidateSite | null;
  hoverPreview: MapHoverPreview | null;
  activeVectorPopover: 'sun' | 'earth' | null;
  /** Geodesic distance of the selected site from 90.0°S. */
  distanceFromPoleKm: number;
  customPoint: { coord: SelenographicCoordinate; analysis: CustomPointAnalysis } | null;
  scientificMapMode?: ScientificMapLayerMode;
  onSelectNearest: (site: CandidateSite) => void;
  onClearCustomPoint: () => void;
  onCloseVectorPopover: () => void;
}

/**
 * The map's floating readout panels, in DOM order: selected-site telemetry, the
 * hover preview, the vector telemetry popover and the custom-point inspection card.
 * Values come from the canonical scenario model; only interaction state is passed in.
 */
export function MapOverlayCards({
  hoveredSite,
  hoverPreview,
  activeVectorPopover,
  distanceFromPoleKm,
  customPoint,
  scientificMapMode,
  onSelectNearest,
  onClearCustomPoint,
  onCloseVectorPopover,
}: MapOverlayCardsProps) {
  const { site: selectedSite, conditions, epochIsoUtc, ephemeris } = useScenarioModel();

  return (
    <>
      {/* On-Map Site Telemetry HUD (Panels 3 & 6 in Storyboard) */}
      <SiteTelemetryCard
        site={selectedSite}
        sunElevationDeg={conditions.sunElevationDeg}
        sunAzimuthDeg={conditions.sunAzimuthDeg}
        earthElevationDeg={conditions.earthElevationDeg}
        earthAzimuthDeg={conditions.earthAzimuthDeg}
        distanceFromPoleKm={distanceFromPoleKm}
        visible={!activeVectorPopover && !customPoint && !hoveredSite}
      />

      {/* Volatile Water-Ice Prospecting Card on Active Multi-Spectral Mode */}
      {(scientificMapMode === 'volatiles' || scientificMapMode === 'temperature') && (
        <div className="hidden sm:block absolute top-12 left-3 z-20 max-w-[280px]">
          <VolatileProspectingCard
            latDeg={customPoint ? customPoint.coord.latitudeDeg : selectedSite.coordinates.latitudeDeg}
            lonDeg={customPoint ? customPoint.coord.longitudeDeg : selectedSite.coordinates.longitudeDeg}
            siteName={customPoint ? `Point (${customPoint.coord.latitudeDeg.toFixed(2)}°, ${customPoint.coord.longitudeDeg.toFixed(2)}°)` : selectedSite.name}
          />
        </div>
      )}

      {/* Hover Preview Card for Unselected Candidate (Panel 2 in Storyboard) */}
      {hoverPreview && <HoverCandidateCard site={hoverPreview.site} celestial={hoverPreview.celestial} />}

      {/* Vector Telemetry Popover for Sun / Earth Endpoint Click */}
      {activeVectorPopover && (
        <VectorTelemetryPopover
          target={activeVectorPopover}
          selectedSite={selectedSite}
          elevationDeg={activeVectorPopover === 'sun' ? conditions.sunElevationDeg : conditions.earthElevationDeg}
          azimuthDeg={activeVectorPopover === 'sun' ? conditions.sunAzimuthDeg : conditions.earthAzimuthDeg}
          subLatDeg={activeVectorPopover === 'sun' ? ephemeris.subSolarLatDeg : ephemeris.subEarthLatDeg}
          subLonDeg={activeVectorPopover === 'sun' ? ephemeris.subSolarLonDeg : ephemeris.subEarthLonDeg}
          currentIsoUtc={epochIsoUtc}
          onClose={onCloseVectorPopover}
        />
      )}

      {/* Custom Point Inspection Overlay Card */}
      {customPoint && (
        <CustomPointCard
          coord={customPoint.coord}
          distanceKm={customPoint.analysis.distanceKm}
          sunElevationDeg={customPoint.analysis.celestial.sunElevationDeg}
          sunAzimuthDeg={customPoint.analysis.celestial.sunAzimuthDeg}
          earthElevationDeg={customPoint.analysis.celestial.earthElevationDeg}
          earthAzimuthDeg={customPoint.analysis.celestial.earthAzimuthDeg}
          nearestSite={customPoint.analysis.nearestSite}
          nearestDistanceKm={customPoint.analysis.nearestDistanceKm}
          onSelectNearest={onSelectNearest}
          onClose={onClearCustomPoint}
        />
      )}
    </>
  );
}
