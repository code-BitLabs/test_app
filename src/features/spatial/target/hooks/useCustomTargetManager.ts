/**
 * Custom Target Manager Hook
 *
 * Manages custom target state, storage persistence, and analytical
 * delta evaluations without cluttering UI presentation components.
 */

import { useState, useCallback, useMemo } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import {
  computeTargetComparisonDeltas,
  CustomLandingTarget,
  CustomTargetEvaluation,
  evaluateCustomTargetConditions,
  TargetComparisonDeltas,
} from '@/domain/target/customTargetModel';
import {
  loadCustomLandingTargets,
  saveCustomLandingTarget,
  deleteCustomLandingTarget,
  KeyValueStorage,
} from '@/domain/target/customTargetStorage';

export interface UseCustomTargetManagerResult {
  customTarget: CustomLandingTarget | null;
  savedTargets: CustomLandingTarget[];
  isStudioOpen: boolean;
  isPinpointMode: boolean;
  evaluation: CustomTargetEvaluation | null;
  deltas: TargetComparisonDeltas | null;
  openStudio: (target?: CustomLandingTarget | null) => void;
  closeStudio: () => void;
  togglePinpoint: () => void;
  setCustomTarget: (target: CustomLandingTarget | null) => void;
  saveTarget: (target: CustomLandingTarget) => void;
  deleteTarget: (targetId: string) => void;
  clearTarget: () => void;
}

export function useCustomTargetManager(
  selectedSite: CandidateSite,
  epochMs: number,
  storage?: KeyValueStorage | null,
): UseCustomTargetManagerResult {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isPinpointMode, setIsPinpointMode] = useState(false);
  const [customTarget, setCustomTarget] = useState<CustomLandingTarget | null>(null);

  const [savedTargets, setSavedTargets] = useState<CustomLandingTarget[]>(() => {
    return loadCustomLandingTargets(storage);
  });

  const openStudio = useCallback((target?: CustomLandingTarget | null) => {
    if (target) setCustomTarget(target);
    setIsStudioOpen(true);
  }, []);

  const closeStudio = useCallback(() => {
    setIsStudioOpen(false);
  }, []);

  const togglePinpoint = useCallback(() => {
    setIsPinpointMode((prev) => !prev);
  }, []);

  const saveTarget = useCallback(
    (target: CustomLandingTarget) => {
      setCustomTarget(target);
      const updated = saveCustomLandingTarget(target, storage);
      setSavedTargets(updated);
    },
    [storage],
  );

  const deleteTarget = useCallback(
    (targetId: string) => {
      if (customTarget?.id === targetId) {
        setCustomTarget(null);
      }
      const updated = deleteCustomLandingTarget(targetId, storage);
      setSavedTargets(updated);
    },
    [customTarget, storage],
  );

  const clearTarget = useCallback(() => {
    setCustomTarget(null);
  }, []);

  const evaluation = useMemo(() => {
    if (!customTarget) return null;
    return evaluateCustomTargetConditions(customTarget, epochMs);
  }, [customTarget, epochMs]);

  const deltas = useMemo(() => {
    if (!evaluation || !selectedSite) return null;
    return computeTargetComparisonDeltas(evaluation, selectedSite, epochMs);
  }, [evaluation, selectedSite, epochMs]);

  return {
    customTarget,
    savedTargets,
    isStudioOpen,
    isPinpointMode,
    evaluation,
    deltas,
    openStudio,
    closeStudio,
    togglePinpoint,
    setCustomTarget,
    saveTarget,
    deleteTarget,
    clearTarget,
  };
}
