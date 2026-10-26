import React from 'react';
import { Compass, MapPin } from 'lucide-react';
import type { SelenographicCoordinate } from '@/domain/coordinates/projection';
import type { CandidateSite } from '@/domain/sites/candidateSite';
import type {
  TopocentricAzimuthDeg,
  TopocentricElevationDeg,
} from '@/domain/coordinates/frames';

export interface InspectorGeometryPanelProps {
  coord: SelenographicCoordinate;
  distanceKm: number;
  sunElevationDeg: TopocentricElevationDeg;
  sunAzimuthDeg: TopocentricAzimuthDeg;
  earthElevationDeg: TopocentricElevationDeg;
  earthAzimuthDeg: TopocentricAzimuthDeg;
  nearestSite: CandidateSite;
  nearestDistanceKm: number;
  onSelectNearest: (site: CandidateSite) => void;
  className?: string;
}

/**
 * Docked readout panel for clicked selenographic coordinates on the 2D map.
 * Displays spherical geometry metrics, solar/terrestrial horizon elevations,
 * and nearest published candidate landing site.
 */
export function InspectorGeometryPanel({
  coord,
  distanceKm,
  sunElevationDeg,
  sunAzimuthDeg,
  earthElevationDeg,
  earthAzimuthDeg,
  nearestSite,
  nearestDistanceKm,
  onSelectNearest,
  className = '',
}: InspectorGeometryPanelProps) {
  const formattedLat = `${Math.abs(coord.latitudeDeg).toFixed(3)}°S`;
  const formattedLon = `${coord.longitudeDeg.toFixed(3)}°E`;

  return (
    <div
      data-testid="inspector-geometry-panel"
      className={`flex flex-col gap-2 font-mono text-xs ${className}`}
    >
      {/* Selenographic & Celestial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {/* Coordinates */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--lm-color-text-muted)] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Coordinates</span>
          </span>
          <span className="font-semibold text-[var(--lm-color-text-primary)]">
            {formattedLat}, {formattedLon}
          </span>
        </div>

        {/* Distance to Active Selected Site */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">Distance to Active</span>
          <span className="font-semibold text-[var(--lm-color-selected-site)]">
            {distanceKm.toFixed(1)} km
          </span>
        </div>

        {/* Sun Elevation & Azimuth */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--lm-color-sun)]">Sun Elev / Az</span>
          <span className="font-semibold text-[var(--lm-color-text-primary)]">
            {sunElevationDeg >= 0 ? '+' : ''}
            {sunElevationDeg.toFixed(2)}° / {sunAzimuthDeg.toFixed(1)}°
          </span>
        </div>

        {/* Earth Elevation & Azimuth */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--lm-color-earth)]">Earth Elev / Az</span>
          <span className="font-semibold text-[var(--lm-color-text-primary)]">
            {earthElevationDeg >= 0 ? '+' : ''}
            {earthElevationDeg.toFixed(2)}° / {earthAzimuthDeg.toFixed(1)}°
          </span>
        </div>
      </div>

      {/* Action Row & Datum Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--lm-color-border-subtle)]">
        <button
          type="button"
          onClick={() => onSelectNearest(nearestSite)}
          className="px-2.5 py-1 text-[11px] font-mono rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/50 hover:bg-[var(--lm-color-surface)] hover:border-[var(--lm-color-selected-site)] transition-colors cursor-pointer"
        >
          Select Nearest: {nearestSite.code} ({nearestDistanceKm.toFixed(1)} km)
        </button>

        <div className="text-[9.5px] text-[var(--lm-color-text-disabled)] leading-tight flex items-center gap-1">
          <Compass className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Spherical datum (R=1737.4 km). Full LOLA DEM terrain mask compiled for certified sites.</span>
        </div>
      </div>
    </div>
  );
}
