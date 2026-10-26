import React, { useState, useEffect } from 'react';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import { loadCustomLandingTargets } from '@/domain/target/customTargetStorage';
import { CustomLandingTarget } from '@/domain/target/customTargetModel';

export interface CandidateRibbonProps {
  onSelectCustomTarget?: (target: CustomLandingTarget) => void;
  selectedCustomTargetId?: string | null;
  onOpenMissionDossier?: () => void;
}

/** Site picker shared by the standard and fullscreen workspace footers. */
export function CandidateRibbon({
  onSelectCustomTarget,
  selectedCustomTargetId,
  onOpenMissionDossier,
}: CandidateRibbonProps) {
  const { site: selectedSite } = useScenarioModel();
  const { selectSite } = useScenarioCommands();
  const [savedTargets, setSavedTargets] = useState<CustomLandingTarget[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavedTargets(loadCustomLandingTargets(window.localStorage));
    }
  }, []);

  return (
    <footer className="pt-2.5 border-t border-[var(--lm-color-border-subtle)] flex items-center gap-2 overflow-x-auto shrink-0 select-none">
      <span className="text-[11px] font-mono text-[var(--lm-color-text-muted)] shrink-0 uppercase tracking-wider">
        Candidate Sites:
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {CANDIDATE_SITES.map((site) => {
          const isSelected = !selectedCustomTargetId && site.id === selectedSite.id;
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => selectSite(site.id)}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors ${
                isSelected
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                  : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
              }`}
            >
              {site.name}
            </button>
          );
        })}

        {savedTargets.map((target) => {
          const isSelected = selectedCustomTargetId === target.id;
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => onSelectCustomTarget?.(target)}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors flex items-center gap-1 ${
                isSelected
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-400 font-semibold shadow-xs'
                  : 'bg-amber-950/30 text-amber-200/80 border border-amber-500/30 hover:text-amber-100 hover:bg-amber-900/50'
              }`}
            >
              <span>📍</span>
              <span>{target.name}</span>
            </button>
          );
        })}
      </div>

      {onOpenMissionDossier && (
        <button
          type="button"
          onClick={onOpenMissionDossier}
          title="Export Aerospace Mission Dossier for Active Target"
          className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-sm)] border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-colors cursor-pointer"
        >
          <span>📑</span>
          <span>Export Dossier</span>
        </button>
      )}
    </footer>
  );
}
