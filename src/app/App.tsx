import { useEffect, useState } from 'react';
import { Header } from '@/app/header/Header';
import { NavTab } from '@/app/header/config/navTabs';
import { SpatialWorkspace } from '@/features/spatial/ui/SpatialWorkspace';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';
import { ComparisonMatrix } from '@/features/comparison/ui/ComparisonMatrix';
import { TopocentricHorizonView } from '@/features/horizon/ui/TopocentricHorizonView';
import { RoverTraverseView } from '@/features/traversal/ui/RoverTraverseView';
import { MethodAndDataView } from '@/features/methodology/ui/MethodAndDataView';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';

export default function App() {
  const isInitial3D =
    typeof window !== 'undefined' &&
    (window.location.pathname.includes('3d-lab') ||
      window.location.hash.includes('3d-lab') ||
      window.location.search.includes('3d-lab'));

  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [spatialViewMode, setSpatialViewMode] = useState<SpatialViewMode>(
    isInitial3D ? 'globe3d' : 'map2d'
  );

  useEffect(() => {
    const checkAndApply3DRoute = () => {
      const path = typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '';
      if (path.includes('3d-lab')) {
        setActiveTab('explore');
        setSpatialViewMode('globe3d');
      }
    };

    const handleActivate3D = () => {
      setActiveTab('explore');
      setSpatialViewMode('globe3d');
    };

    window.addEventListener('popstate', checkAndApply3DRoute);
    window.addEventListener('hashchange', checkAndApply3DRoute);
    window.addEventListener('lm-activate-3d-moon', handleActivate3D);

    if (isInitial3D) {
      checkAndApply3DRoute();
    }

    return () => {
      window.removeEventListener('popstate', checkAndApply3DRoute);
      window.removeEventListener('hashchange', checkAndApply3DRoute);
      window.removeEventListener('lm-activate-3d-moon', handleActivate3D);
    };
  }, [isInitial3D]);

  const { epochIsoUtc } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  function handleSelectSiteForExplore(site: CandidateSite) {
    selectSite(site.id);
    setActiveTab('explore');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)]">
      {/* 1. Global Authoritative Application Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} isDemoMode={false} />

      {/* 2. Main Content Area in Normal Document Flow */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0">
        {activeTab === 'explore' && (
          <div className="flex flex-col gap-6 w-full min-w-0">
            {/* Integrated Spatial Flight Deck: Viewport, Docked Time Explorer, Streamlined Passport, and Candidate Sites */}
            <SpatialWorkspace
              initialViewMode={spatialViewMode}
              onViewModeChange={setSpatialViewMode}
              onOpenMethodDetails={() => setActiveTab('method')}
              onNavigateHorizon={() => setActiveTab('horizon')}
            />
          </div>
        )}

        {activeTab === 'compare' && (
          <section className="w-full min-w-0" aria-label="Candidate Sites Comparison Matrix">
            <ComparisonMatrix onSelectSiteForExplore={handleSelectSiteForExplore} />
          </section>
        )}

        {activeTab === 'horizon' && (
          <section className="w-full min-w-0" aria-label="Topocentric Horizon Radar and Sky Dome">
            <TopocentricHorizonView />
          </section>
        )}

        {activeTab === 'traverse' && (
          <section className="w-full min-w-0" aria-label="Surface Rover Traversal and EVA Route Planner">
            <RoverTraverseView />
          </section>
        )}

        {activeTab === 'method' && (
          <section className="w-full min-w-0" aria-label="Scientific Methodology and Data Specifications">
            <MethodAndDataView />
          </section>
        )}
      </main>

      {/* 3. Authoritative Application Footer */}
      <footer className="w-full border-t border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface)] py-3 px-4 sm:px-6 mt-auto shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[var(--lm-color-text-muted)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--lm-color-text-secondary)] font-medium">LunaMission Observatory</span>
            <span>•</span>
            <span>NASA JPL DE421 Ephemeris Engine</span>
            <span>•</span>
            <span>LRO LOLA DEM 128ppd</span>
            <span>•</span>
            <span>IAU 2015 Lunar Reference Frame</span>
          </div>
          <div>
            Canonical Epoch: <span className="text-[var(--lm-color-selected-site)] font-semibold">{epochIsoUtc}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
