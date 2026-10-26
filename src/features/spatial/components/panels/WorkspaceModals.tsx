import React from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { SiteComparisonMatrixModal } from '@/features/spatial/components/SiteComparisonMatrixModal';
import { CustomTargetStudioModal } from '@/features/spatial/target/CustomTargetStudioModal';
import { UseCustomTargetManagerResult } from '@/features/spatial/target/hooks/useCustomTargetManager';

export interface WorkspaceModalsProps {
  isComparisonModalOpen: boolean;
  onCloseComparison: () => void;
  selectedSiteId: string;
  onSelectSite: (site: CandidateSite) => void;
  targetManager: UseCustomTargetManagerResult;
}

export function WorkspaceModals({
  isComparisonModalOpen,
  onCloseComparison,
  selectedSiteId,
  onSelectSite,
  targetManager,
}: WorkspaceModalsProps) {
  return (
    <>
      <SiteComparisonMatrixModal
        isOpen={isComparisonModalOpen}
        onClose={onCloseComparison}
        selectedSiteId={selectedSiteId}
        onSelectSite={onSelectSite}
      />
      <CustomTargetStudioModal
        isOpen={targetManager.isStudioOpen}
        onClose={targetManager.closeStudio}
        onSaveTarget={targetManager.saveTarget}
        initialTarget={targetManager.customTarget}
      />
    </>
  );
}
