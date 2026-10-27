import { useEffect, useMemo, useState } from 'react';
import { PRESET_LUNAR_TRAVERSES } from '@/domain/traversal/presetRoutes';
import { PresetLunarTraverse, TraversalPlan } from '@/domain/traversal/types';
import { missionServerClient } from '@/domain/services/missionServerClient';
import { TraverseRouteSelector } from '../components/TraverseRouteSelector';
import { TraverseElevationTransect } from '../components/TraverseElevationTransect';
import { TraverseTelemetryCard } from '../components/TraverseTelemetryCard';
import { Compass, RefreshCw } from 'lucide-react';
import { useScenario } from '@/app/scenario/context/scenarioContext';
import { getSiteById, CANDIDATE_SITES } from '@/domain/sites/catalog';

export function RoverTraverseView() {
  const { selectedSiteId, customTarget } = useScenario();

  const customRoute: PresetLunarTraverse | null = useMemo(() => {
    if (!customTarget) return null;
    const site = getSiteById(selectedSiteId) ?? CANDIDATE_SITES[0];
    return {
      id: `custom-target-${customTarget.id}`,
      name: `Custom Target: ${customTarget.name}`,
      subtitle: `Lander (${site.name}) to Custom Target (${customTarget.latitudeDeg.toFixed(2)}°, ${customTarget.longitudeDeg.toFixed(2)}°)`,
      description: `A* slope-optimized traverse from ${site.name} to designated target coordinates ${customTarget.name}.`,
      originName: site.name,
      originLatDeg: site.coordinates.latitudeDeg,
      originLonDeg: site.coordinates.longitudeDeg,
      destinationName: customTarget.name,
      destinationLatDeg: customTarget.latitudeDeg,
      destinationLonDeg: customTarget.longitudeDeg,
      scientificGoal: 'Geotechnical surface inspection, regolith sample collection, and PSR boundary approach.',
    };
  }, [customTarget, selectedSiteId]);

  const availableRoutes = useMemo(() => {
    return customRoute ? [customRoute, ...PRESET_LUNAR_TRAVERSES] : PRESET_LUNAR_TRAVERSES;
  }, [customRoute]);

  const [selectedRoute, setSelectedRoute] = useState<PresetLunarTraverse>(() => {
    if (customRoute) return customRoute;
    const match = PRESET_LUNAR_TRAVERSES.find((r) =>
      r.id.toLowerCase().includes(selectedSiteId.replace(/-rim|-massif|-plateau/g, '')) ||
      r.originName.toLowerCase().includes(selectedSiteId.replace(/-/g, ' ')),
    );
    return match ?? PRESET_LUNAR_TRAVERSES[0];
  });

  const [activeWaypointIndex, setActiveWaypointIndex] = useState<number | null>(0);
  const [plan, setPlan] = useState<
    (TraversalPlan & { source: 'nextrush_server' | 'local_analytical_fallback' }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customRoute) {
      setSelectedRoute(customRoute);
      return;
    }
    const match = PRESET_LUNAR_TRAVERSES.find((r) =>
      r.id.toLowerCase().includes(selectedSiteId.replace(/-rim|-massif|-plateau/g, '')) ||
      r.originName.toLowerCase().includes(selectedSiteId.replace(/-/g, ' ')),
    );
    if (match) {
      setSelectedRoute(match);
    }
  }, [selectedSiteId, customRoute]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    missionServerClient
      .getTraversalPlan({
        originLatDeg: selectedRoute.originLatDeg,
        originLonDeg: selectedRoute.originLonDeg,
        destinationLatDeg: selectedRoute.destinationLatDeg,
        destinationLonDeg: selectedRoute.destinationLonDeg,
        maxWaypoints: 35,
      })
      .then((res) => {
        if (!cancelled) {
          setPlan(res);
          setActiveWaypointIndex(0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoute]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0" aria-label="Surface Rover Traversal Console">
      {/* Top Banner & Mode Brief */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--lm-color-text-primary)] tracking-tight">
              Surface Rover Traversal & EVA Route Planner
            </h1>
            <p className="text-xs text-[var(--lm-color-text-muted)] mt-0.5">
              Topographic pathfinding from illuminated rim landing plateaus into permanently shadowed cold traps
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40 shrink-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Calculating Geodesic DEM...</span>
          </div>
        )}
      </div>

      {/* Preset Traversal Corridor Selector */}
      <TraverseRouteSelector
        selectedRouteId={selectedRoute.id}
        onSelectRoute={setSelectedRoute}
        routes={availableRoutes}
      />

      {/* Altimetry Transect Profile */}
      {plan && (
        <TraverseElevationTransect
          plan={plan}
          activeWaypointIndex={activeWaypointIndex}
          onSelectWaypoint={setActiveWaypointIndex}
        />
      )}

      {/* Telemetry and Waypoint Inspector */}
      {plan && (
        <TraverseTelemetryCard
          plan={plan}
          activeWaypointIndex={activeWaypointIndex}
          calculationSource={plan.source}
        />
      )}
    </div>
  );
}
