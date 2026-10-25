import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowUpDown,
  Sun,
  Radio,
  Mountain,
  ShieldCheck,
  Compass,
  Download,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CANDIDATE_SITES, ARTEMIS_III_2024_REGION_IDS } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { getSiteInvestigation } from '@/domain/sites/siteInvestigationRegistry';

export interface SiteComparisonMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSiteId: string;
  onSelectSite: (site: CandidateSite) => void;
}

type SortField = 'sunlight' | 'dte' | 'traversable' | 'elevation' | 'code';
type CatalogTab = 'artemis-2024' | 'all';

export function SiteComparisonMatrixModal({
  isOpen,
  onClose,
  selectedSiteId,
  onSelectSite,
}: SiteComparisonMatrixModalProps) {
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('artemis-2024');
  const [sortField, setSortField] = useState<SortField>('sunlight');
  const [sortAsc, setSortAsc] = useState(false);

  // Keyboard shortcut: Escape closes modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const candidateList = useMemo(() => {
    let list = CANDIDATE_SITES;
    if (catalogTab === 'artemis-2024') {
      list = list.filter((s) => ARTEMIS_III_2024_REGION_IDS.includes(s.id));
    }

    const decorated = list.map((site) => {
      const inv = getSiteInvestigation(site.id, site.name, site.coordinates.elevationMeters);
      return { site, inv };
    });

    decorated.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (sortField) {
        case 'sunlight':
          valA = a.inv.annualIlluminationPct;
          valB = b.inv.annualIlluminationPct;
          break;
        case 'dte':
          valA = a.inv.directToEarthPct;
          valB = b.inv.directToEarthPct;
          break;
        case 'traversable':
          valA = a.inv.traversableAreaPct;
          valB = b.inv.traversableAreaPct;
          break;
        case 'elevation':
          valA = a.site.coordinates.elevationMeters ?? 0;
          valB = b.site.coordinates.elevationMeters ?? 0;
          break;
        case 'code':
          return sortAsc ? a.site.code.localeCompare(b.site.code) : b.site.code.localeCompare(a.site.code);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return decorated;
  }, [catalogTab, sortField, sortAsc]);

  if (!isOpen) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Site Code',
      'Site Name',
      'Latitude (°S)',
      'Longitude (°E)',
      'Elevation (m)',
      'Annual Sunlight (%)',
      'Direct-Earth Comm (%)',
      'Traversable Area (%)',
      'Peak Slope (°)',
      'Suitability Tier',
      'Official Region Reference',
    ];

    const rows = candidateList.map(({ site, inv }) => [
      site.code,
      `"${site.name}"`,
      site.coordinates.latitudeDeg.toFixed(3),
      site.coordinates.longitudeDeg.toFixed(2),
      site.coordinates.elevationMeters ?? 0,
      inv.annualIlluminationPct.toFixed(1),
      inv.directToEarthPct.toFixed(1),
      inv.traversableAreaPct,
      inv.maxSlopeDeg.toFixed(1),
      `"${inv.hlsLandingRating}"`,
      `"${site.officialRegionReference || inv.regionalContext}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NASA_Artemis_Landing_Sites_${catalogTab === 'artemis-2024' ? 'Oct2024_9Regions' : 'All_14Sites'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-strong)] rounded-[var(--lm-radius-lg)] shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--lm-color-border)] bg-[var(--lm-color-surface-strong)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Lunar Landing Site Navigator & Comparison Matrix
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  NASA SPACE APPS 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-criteria assessment for Artemis landing safety, solar power generation, and Direct-to-Earth communication.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-[var(--lm-color-border-subtle)] bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px] uppercase">Candidate Scope:</span>
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setCatalogTab('artemis-2024')}
                className={`px-3 py-1 rounded font-medium text-[11px] transition-colors ${
                  catalogTab === 'artemis-2024'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Artemis III (Oct 2024 — 9 Regions)
              </button>
              <button
                type="button"
                onClick={() => setCatalogTab('all')}
                className={`px-3 py-1 rounded font-medium text-[11px] transition-colors ${
                  catalogTab === 'all'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Polar Candidates (14 Sites)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 font-mono text-[11px] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV Matrix</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase">
                <th className="pb-2 pl-2">Site / Entity</th>
                <th className="pb-2">Coordinates</th>
                <th className="pb-2 cursor-pointer hover:text-white" onClick={() => handleSort('elevation')}>
                  <div className="flex items-center gap-1">
                    <span>Elevation</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-2 cursor-pointer hover:text-white" onClick={() => handleSort('sunlight')}>
                  <div className="flex items-center gap-1 text-amber-300">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Sunlight %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-2 cursor-pointer hover:text-white" onClick={() => handleSort('dte')}>
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    <span>DTE Comm %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-2 cursor-pointer hover:text-white" onClick={() => handleSort('traversable')}>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Traversable</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-2">Artemis Status</th>
                <th className="pb-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {candidateList.map(({ site, inv }) => {
                const isSelected = site.id === selectedSiteId;
                return (
                  <tr
                    key={site.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-2 font-sans">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="font-mono text-cyan-300 text-[11px]">{site.code}</span>
                        <span>{site.name}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-700/60">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.badgeType} • {inv.stratigraphicUnit.split(' ')[0]}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">
                      <div>{site.coordinates.latitudeDeg.toFixed(3)}°S</div>
                      <div className="text-slate-400 text-[10px]">{site.coordinates.longitudeDeg.toFixed(1)}°E</div>
                    </td>
                    <td className="py-2.5 font-semibold text-cyan-300">
                      +{site.coordinates.elevationMeters?.toLocaleString() ?? '—'} m
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300">{inv.annualIlluminationPct.toFixed(1)}%</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${inv.annualIlluminationPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        Peak: {(inv.maxContinuousDaylightHours / 24).toFixed(0)}d continuous
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-cyan-300">{inv.directToEarthPct.toFixed(1)}%</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${inv.directToEarthPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        {inv.directToEarthPct > 75 ? 'Direct High-Band' : 'Periodic Relay'}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-300">{inv.traversableAreaPct}%</span>
                        <span className="text-[10px] text-slate-400">&lt;15°</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        Peak slope: {inv.maxSlopeDeg.toFixed(1)}°
                      </div>
                    </td>
                    <td className="py-2.5 font-sans">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          inv.hlsLandingRating.includes('Primary')
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-600/40'
                        }`}
                      >
                        {inv.hlsLandingRating}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSite(site);
                          onClose();
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Inspect 3D'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[var(--lm-color-border)] bg-[var(--lm-color-surface-strong)] flex items-center justify-between text-xs text-slate-400 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Data Sources:</span>
            <span>NASA Goddard LOLA PGDA 78/90 (20m DEM) • LRO Diviner DLRE • LEND Neutron Flux • NASA Oct 2024 Artemis III Regions</span>
          </div>
          <div>
            Showing <strong className="text-white">{candidateList.length}</strong> Candidate Landing Sites
          </div>
        </div>
      </div>
    </div>
  );
}
