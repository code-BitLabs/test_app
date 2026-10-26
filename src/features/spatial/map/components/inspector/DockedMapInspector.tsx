import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, MapPin, X } from 'lucide-react';
import type { SelenographicCoordinate } from '@/domain/coordinates/projection';
import type { CandidateSite } from '@/domain/sites/candidateSite';
import type { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import type { CustomPointAnalysis } from '@/features/spatial/map/model/mapPointAnalysis';
import { InspectorGeometryPanel } from './InspectorGeometryPanel';
import { InspectorVolatilesPanel } from './InspectorVolatilesPanel';

export interface DockedMapInspectorProps {
  customPoint?: {
    coord: SelenographicCoordinate;
    analysis: CustomPointAnalysis;
  } | null;
  customPointData?: CustomPointAnalysis | null;
  selectedSite: CandidateSite | null;
  scientificMapMode?: ScientificMapLayerMode;
  onClose: () => void;
  onSelectNearestSite: (site: CandidateSite) => void;
}

/**
 * Docked cartographic inspector bar mounted at the bottom of the 2D polar map.
 * Replaces floating overlapping cards to guarantee zero occlusion of the polar disc,
 * graticule, and candidate sites. Supports minimization for full map immersion.
 */
export function DockedMapInspector({
  customPoint,
  customPointData,
  selectedSite,
  scientificMapMode = 'topography',
  onClose,
  onSelectNearestSite,
}: DockedMapInspectorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'geometry' | 'volatiles'>('all');

  const hasCustomPoint = Boolean(customPoint || customPointData);
  const isVolatilesMode = scientificMapMode === 'volatiles' || scientificMapMode === 'temperature';

  if (!hasCustomPoint && !isVolatilesMode) return null;

  const coord = customPoint?.coord ?? (customPointData ? { latitudeDeg: -89.5, longitudeDeg: 0.0 } : null);
  const analysis = customPoint?.analysis ?? customPointData;
  const targetLat = coord ? coord.latitudeDeg : selectedSite ? selectedSite.coordinates.latitudeDeg : -90.0;
  const targetLon = coord ? coord.longitudeDeg : selectedSite ? selectedSite.coordinates.longitudeDeg : 0.0;
  const targetTitle = coord
    ? `Point (${Math.abs(coord.latitudeDeg).toFixed(3)}°S, ${coord.longitudeDeg.toFixed(3)}°E)`
    : selectedSite?.name ?? 'Target Location';

  const geometryNode = coord && analysis ? (
    <InspectorGeometryPanel
      coord={coord}
      distanceKm={analysis.distanceKm}
      sunElevationDeg={analysis.celestial.sunElevationDeg}
      sunAzimuthDeg={analysis.celestial.sunAzimuthDeg}
      earthElevationDeg={analysis.celestial.earthElevationDeg}
      earthAzimuthDeg={analysis.celestial.earthAzimuthDeg}
      nearestSite={analysis.nearestSite}
      nearestDistanceKm={analysis.nearestDistanceKm}
      onSelectNearest={onSelectNearestSite}
    />
  ) : null;

  const volatilesNode = (
    <InspectorVolatilesPanel latDeg={targetLat} lonDeg={targetLon} siteName={targetTitle} />
  );

  return (
    <aside
      data-testid="docked-map-inspector"
      role="region"
      aria-label="2D Map Inspector"
      className="w-full flex-shrink-0 bg-[var(--lm-color-surface-raised)]/95 backdrop-blur-md border-t border-[var(--lm-color-border)] select-text z-30 transition-all duration-200 text-left"
    >
      {isMinimized ? (
        <div className="flex items-center justify-between px-3 py-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            {hasCustomPoint ? <MapPin className="w-3.5 h-3.5 text-amber-400" /> : <Droplets className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="font-semibold text-[var(--lm-color-text-primary)]">{targetTitle}</span>
            {analysis && (
              <span className="text-[10px] text-[var(--lm-color-selected-site)]">
                ({analysis.distanceKm.toFixed(1)} km to {selectedSite?.code ?? 'Active'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--lm-color-surface-strong)] text-cyan-300 hover:text-white cursor-pointer"
            >
              <ChevronUp className="w-3 h-3" />
              <span>Expand</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector"
              className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2.5 sm:p-3 flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-1.5">
            <div className="flex items-center gap-2">
              {hasCustomPoint ? <MapPin className="w-3.5 h-3.5 text-amber-400" /> : <Droplets className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="text-xs font-bold text-[var(--lm-color-text-primary)] font-mono">{targetTitle}</span>
              {hasCustomPoint && isVolatilesMode && (
                <div className="hidden sm:flex items-center gap-1 ml-2 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${activeTab === 'all' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400'}`}
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('geometry')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${activeTab === 'geometry' ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'text-slate-400'}`}
                  >
                    Geometry
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('volatiles')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${activeTab === 'volatiles' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'text-slate-400'}`}
                  >
                    ISRU Volatiles
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize Inspector"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--lm-color-text-muted)] hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close inspector"
                className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            {hasCustomPoint && isVolatilesMode && activeTab === 'all' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--lm-color-border-subtle)]">
                {geometryNode}
                <div className="lg:pl-3 pt-2 lg:pt-0">{volatilesNode}</div>
              </div>
            ) : hasCustomPoint && (activeTab === 'geometry' || !isVolatilesMode) ? (
              geometryNode
            ) : (
              volatilesNode
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
