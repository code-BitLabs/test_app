import { useCallback, useMemo, useState } from 'react';
import { Download, Layers, Sparkles } from 'lucide-react';
import { CandidateSite, SiteCategory } from '@/domain/sites/candidateSite';
import { CANDIDATE_SITES, getSitesByCategory, getFilteredCandidateSites } from '@/domain/sites/catalog';
import { useScenario, useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import {
  DEFAULT_COMPARISON_SITE_IDS,
  MAX_COMPARISON_SITES,
  addComparisonSite,
  buildComparisonColumns,
  comparisonSitesToAdd,
  removeComparisonSite,
} from '@/features/comparison/model/comparisonColumns';
import { generateComparisonCsv } from '@/features/comparison/model/generateComparisonCsv';
import { ComparisonHeader } from '@/features/comparison/components/ComparisonHeader';
import { ComparisonTableHead } from '@/features/comparison/components/table/ComparisonTableHead';
import { ComparisonLocationRows, ComparisonTerrainRows } from '@/features/comparison/components/rows/ComparisonSiteRows';
import { ComparisonSunRows } from '@/features/comparison/components/rows/ComparisonSunRows';
import { ComparisonEarthRows } from '@/features/comparison/components/rows/ComparisonEarthRows';
import { ComparisonPolicyNotice } from '@/features/comparison/components/ComparisonPolicyNotice';
import { SiteTradeStudySpiderChart } from '@/features/comparison/components/SiteTradeStudySpiderChart';
import { MissionDateWindowSelector } from '@/features/comparison/components/MissionDateWindowSelector';
import { ParetoLandingWindowModal } from '@/features/comparison/components/ParetoLandingWindowModal';

interface ComparisonMatrixProps {
  onSelectSiteForExplore: (site: CandidateSite) => void;
}

type CatalogCategoryTab = 'artemis-2024' | 'polar-benchmark' | 'clps' | 'historic' | 'all';

export function ComparisonMatrix({ onSelectSiteForExplore }: ComparisonMatrixProps) {
  const { calculationMode, customTarget } = useScenario();
  const { epochMs, epochIsoUtc } = useScenarioModel();
  const { setEpoch } = useScenarioCommands();

  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([...DEFAULT_COMPARISON_SITE_IDS]);
  const [catalogTab, setCatalogTab] = useState<CatalogCategoryTab>('artemis-2024');
  const [durationDays, setDurationDays] = useState(14);
  const [isParetoModalOpen, setIsParetoModalOpen] = useState(false);

  const columns = useMemo(
    () => buildComparisonColumns(selectedSiteIds, epochMs, calculationMode),
    [selectedSiteIds, epochMs, calculationMode],
  );

  const sitesToAdd = useMemo(() => comparisonSitesToAdd(selectedSiteIds), [selectedSiteIds]);

  const activeSites = useMemo(
    () => columns.map((col) => col.site),
    [columns],
  );

  const handleAddSite = useCallback((siteId: string) => {
    setSelectedSiteIds((prev) => addComparisonSite(prev, siteId));
  }, []);

  const handleRemoveSite = useCallback((siteId: string) => {
    setSelectedSiteIds((prev) => removeComparisonSite(prev, siteId));
  }, []);

  const handleExportCsv = useCallback(() => {
    const encodedUri = encodeURI(generateComparisonCsv(columns));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LunaMission_Landing_Site_Matrix_${epochIsoUtc.slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [columns, epochIsoUtc]);

  return (
    <div className="flex flex-col gap-6 py-2 w-full min-w-0">
      {/* 1. Mission Date Window Evaluator */}
      <MissionDateWindowSelector
        selectedDate={new Date(epochMs)}
        durationDays={durationDays}
        onSelectDate={(date) => setEpoch(date.getTime())}
        onSelectDuration={setDurationDays}
        onOpenParetoSolver={() => setIsParetoModalOpen(true)}
      />

      <ParetoLandingWindowModal
        isOpen={isParetoModalOpen}
        onClose={() => setIsParetoModalOpen(false)}
        siteId={activeSites[0]?.id || 'shackleton-ridge'}
        siteName={activeSites[0]?.name || 'Shackleton Ridge'}
        onSelectWindow={(win) => setEpoch(win.startEpochMs)}
      />

      {/* 2. Category Quick Add Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-md)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[var(--lm-color-text-secondary)] uppercase flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Quick Add:
          </span>

          {[
            { id: 'artemis-2024', label: 'Artemis III (9)' },
            { id: 'polar-benchmark', label: 'Polar Benchmarks (5)' },
            { id: 'clps', label: 'CLPS Landers (3)' },
            { id: 'historic', label: 'Historic (3)' },
            { id: 'all', label: 'All Sites (20)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCatalogTab(tab.id as CatalogCategoryTab)}
              className={`px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] border transition-colors cursor-pointer ${
                catalogTab === tab.id
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-semibold'
                  : 'bg-[var(--lm-color-surface-elevated)] border-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {customTarget && (
            <button
              type="button"
              onClick={() => onSelectSiteForExplore({
                id: customTarget.id,
                code: 'TARGET',
                name: customTarget.name,
                coordinates: {
                  latitudeDeg: customTarget.latitudeDeg,
                  longitudeDeg: customTarget.longitudeDeg,
                  elevationMeters: customTarget.elevationKm * 1000,
                },
                category: 'polar-benchmark',
                priority: 'high',
              } as unknown as CandidateSite)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              <span>🎯 Target: {customTarget.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Matrix</span>
          </button>
        </div>
      </div>

      {/* 3. Main Comparison Grid: Table on Left + Spider Chart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
          <ComparisonHeader
            formattedEpoch={epochIsoUtc.replace('T', ' ').replace('Z', ' UTC')}
            sitesToAdd={sitesToAdd}
            canAddSite={selectedSiteIds.length < MAX_COMPARISON_SITES}
            onAddSite={handleAddSite}
          />

          <div className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] overflow-x-auto shadow-sm">
            <table className="w-full min-w-[680px] text-left border-collapse font-mono-num text-xs">
              <ComparisonTableHead
                sites={columns.map((column) => column.site)}
                onRemoveSite={handleRemoveSite}
                onInspectSite={onSelectSiteForExplore}
              />
              <tbody className="divide-y divide-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-secondary)]">
                <ComparisonLocationRows columns={columns} />
                <ComparisonSunRows columns={columns} columnCount={columns.length + 1} />
                <ComparisonEarthRows columns={columns} columnCount={columns.length + 1} />
                <ComparisonTerrainRows columns={columns} />
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Side-by-Side Trade Study Spider Chart */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
          <SiteTradeStudySpiderChart sites={activeSites} />
        </div>
      </div>

      <ComparisonPolicyNotice />
    </div>
  );
}
