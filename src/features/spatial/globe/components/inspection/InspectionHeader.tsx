import React from 'react';
import { MapPin, Download } from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ScientificSiteInvestigation } from '@/domain/sites/scientificSiteInvestigation';

export interface InspectionHeaderProps {
  site: CandidateSite;
  scientificData: ScientificSiteInvestigation | null;
  currentMode?: 'regional' | 'overview' | 'inspection' | 'global';
  onEnterLocalInspection?: () => void;
  onExportDossier: () => void;
}

export function InspectionHeader({
  site,
  scientificData,
  currentMode = 'overview',
  onEnterLocalInspection,
  onExportDossier,
}: InspectionHeaderProps) {
  const fmtElev = (m: number) => (m > 0 ? `+${m.toLocaleString()} m` : `${m.toLocaleString()} m`);

  return (
    <>
      {/* Header Banner */}
      <div className="p-3 border-b border-[var(--lm-color-border-subtle)] flex items-start justify-between gap-2 bg-gradient-to-b from-cyan-950/20 to-transparent">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-selected-site)] font-semibold">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>
              {scientificData?.code || site.code} • {scientificData?.featureType || site.officialRegionReference || 'Candidate Study Point'}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white tracking-tight mt-0.5">
            {scientificData?.name || site.name}
          </h2>
          <div className="text-[11px] font-mono text-[var(--lm-color-text-secondary)] mt-0.5">
            {site.coordinates.latitudeDeg.toFixed(3)}°S, {site.coordinates.longitudeDeg.toFixed(2)}°E • Elev:{' '}
            <span className="text-cyan-300 font-semibold">{fmtElev(site.coordinates.elevationMeters)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="btn-export-dossier"
            onClick={onExportDossier}
            className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-white/5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
            title="Export Scientific Site Dossier (JSON)"
          >
            <Download className="w-2.5 h-2.5 text-cyan-400" />
            <span>Export</span>
          </button>
          {currentMode !== 'inspection' && onEnterLocalInspection && (
            <button
              type="button"
              data-testid="btn-inspect-3d"
              onClick={onEnterLocalInspection}
              className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-selected-site)]/25 transition-colors whitespace-nowrap"
              title="Switch to Mode C: Local Inspection"
            >
              Inspect 3D
            </button>
          )}
        </div>
      </div>

      {/* Artemis Mission Suitability Scorecard */}
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-[var(--lm-color-surface-raised)]/60 border-b border-[var(--lm-color-border-subtle)] text-[10px] font-mono">
        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Elevation</span>
          <span className="text-cyan-300 font-semibold text-xs mt-0.5">
            {fmtElev(site.coordinates.elevationMeters)}
          </span>
          <span className="text-[8px] text-slate-500">LOLA ±1.2m</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Traversable</span>
          <span className="text-emerald-400 font-semibold text-xs mt-0.5">
            {scientificData?.topography.traversableSlopePercentage ?? 74}%
          </span>
          <span className="text-[8px] text-slate-500">&lt;15° slope</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Sunlight</span>
          <span className="text-amber-400 font-semibold text-xs mt-0.5">
            {scientificData?.illuminationThermal.annualSolarExposurePercentage ?? 86}%
          </span>
          <span className="text-[8px] text-slate-500">Annual</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">DTE Comm</span>
          <span className="text-sky-400 font-semibold text-xs mt-0.5">
            {scientificData?.missionConstraints.directToEarthVisibilityPercentage ?? 58}%
          </span>
          <span className="text-[8px] text-slate-500">Direct-Earth</span>
        </div>
      </div>
    </>
  );
}
