import React, { useState, useMemo } from 'react';
import { X, Compass, Download } from 'lucide-react';
import { CANDIDATE_SITES, ARTEMIS_III_2024_REGION_IDS } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { getSiteInvestigation } from '@/domain/sites/siteInvestigationRegistry';
import {
  SiteComparisonMatrixTable,
  SortField,
} from './SiteComparisonMatrixTable';
import {
  SiteComparisonToolbar,
  CatalogTab,
} from './SiteComparisonToolbar';


export interface SiteComparisonMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSiteId: string;
  onSelectSite: (site: CandidateSite) => void;
}

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
        <SiteComparisonToolbar
          catalogTab={catalogTab}
          onSelectCatalogTab={setCatalogTab}
          candidateList={candidateList}
        />


        {/* Data Table */}
        <SiteComparisonMatrixTable
          candidateList={candidateList}
          selectedSiteId={selectedSiteId}
          onSelectSite={onSelectSite}
          onClose={onClose}
          onSort={handleSort}
        />

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
