import React from 'react';
import { ChevronDown, ChevronUp, Mountain, ExternalLink } from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ScientificSiteInvestigation } from '@/domain/sites/scientificSiteInvestigation';
import { ElevationProfileTransect } from './ElevationProfileTransect';

export interface InspectionTopographySectionProps {
  site: CandidateSite;
  scientificData: ScientificSiteInvestigation | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function InspectionTopographySection({
  site,
  scientificData,
  isOpen,
  onToggle,
}: InspectionTopographySectionProps) {
  const fmtElev = (m: number) => (m > 0 ? `+${m.toLocaleString()} m` : `${m.toLocaleString()} m`);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mountain className="w-3.5 h-3.5 text-cyan-400" />
          <span>Topography & Slopes (NASA LOLA)</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
          {scientificData ? (
            <>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                  <span className="text-slate-400 block">SUMMIT</span>
                  <span className="text-white font-semibold">{fmtElev(scientificData.topography.summitElevationMeters)}</span>
                </div>
                <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                  <span className="text-slate-400 block">RELIEF SPAN</span>
                  <span className="text-cyan-300 font-semibold">{scientificData.topography.reliefSpanMeters.toLocaleString()} m</span>
                </div>
                <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                  <span className="text-slate-400 block">MEAN SLOPE</span>
                  <span className="text-emerald-400 font-semibold">{scientificData.topography.meanSlopeDeg.toFixed(1)}°</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                  <span className="text-slate-400">Max Slope:</span>
                  <span className="text-amber-400 font-semibold">{scientificData.topography.maxSlopeDeg.toFixed(1)}°</span>
                </div>
                <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                  <span className="text-slate-400">Traversable (&lt;15°):</span>
                  <span className="text-emerald-400 font-semibold">{scientificData.topography.traversableSlopePercentage}%</span>
                </div>
              </div>

              {/* Altimetric Cross-Section Profile */}
              <ElevationProfileTransect
                profile={scientificData.topography.elevationProfile}
                uncertaintyMeters={scientificData.topography.elevationUncertaintyMeters}
                meanSlopeDeg={scientificData.topography.meanSlopeDeg}
                maxSlopeDeg={scientificData.topography.maxSlopeDeg}
              />

              <div className="text-[10px] text-slate-400 font-sans border-t border-[var(--lm-color-border-subtle)] pt-1.5 flex flex-col gap-1">
                <div>
                  <span className="font-semibold text-slate-300">Data Source:</span> {scientificData.topography.demSourceAttribution}
                </div>
                {scientificData.dataProvenance.nasaProductUrls && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[9px] font-mono">
                    <a
                      href={scientificData.dataProvenance.nasaProductUrls.lolaDem}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline"
                    >
                      <span>NASA PGDA 78 (20m DEM)</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
                    <a
                      href={scientificData.dataProvenance.nasaProductUrls.lpiAtlas}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline"
                    >
                      <span>LPI South Pole Atlas</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-[11px] font-sans text-slate-400">
              LOLA 128ppd Elevation: {fmtElev(site.coordinates.elevationMeters)} (±1.2 m vertical precision).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
