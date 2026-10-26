import { TraversalPlan } from '@/domain/traversal/types';
import { BatteryCharging, Clock, Gauge, Radio, ShieldAlert, Sparkles, Server } from 'lucide-react';

interface TraverseTelemetryCardProps {
  plan: TraversalPlan;
  activeWaypointIndex: number | null;
  calculationSource?: 'nextrush_server' | 'local_analytical_fallback';
}

export function TraverseTelemetryCard({
  plan,
  activeWaypointIndex,
  calculationSource = 'nextrush_server',
}: TraverseTelemetryCardProps) {
  const activeWp =
    activeWaypointIndex !== null && plan.waypoints[activeWaypointIndex]
      ? plan.waypoints[activeWaypointIndex]
      : plan.waypoints[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
      {/* 1. Expedition Operational Telemetry */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-2">
          <span className="font-semibold uppercase tracking-wider text-[var(--lm-color-text-secondary)]">
            Expedition Metrics
          </span>
          <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
            <Server className="w-3 h-3" />
            {calculationSource === 'nextrush_server' ? 'NextRush :3001' : 'Local Domain'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[var(--lm-color-canvas)] p-2.5 rounded-lg border border-[var(--lm-color-border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--lm-color-text-muted)] text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              <span>Distance</span>
            </div>
            <div className="text-base font-bold text-[var(--lm-color-text-primary)] mt-1">
              {plan.totalDistanceKm} <span className="text-xs font-normal text-[var(--lm-color-text-muted)]">km</span>
            </div>
          </div>

          <div className="bg-[var(--lm-color-canvas)] p-2.5 rounded-lg border border-[var(--lm-color-border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--lm-color-text-muted)] text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Duration</span>
            </div>
            <div className="text-base font-bold text-[var(--lm-color-text-primary)] mt-1">
              {plan.estimatedDurationHours} <span className="text-xs font-normal text-[var(--lm-color-text-muted)]">hrs</span>
            </div>
          </div>

          <div className="bg-[var(--lm-color-canvas)] p-2.5 rounded-lg border border-[var(--lm-color-border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--lm-color-text-muted)] text-[11px]">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              <span>Battery SoC</span>
            </div>
            <div className="text-base font-bold text-emerald-400 mt-1">
              {plan.batteryMarginPct}% <span className="text-xs font-normal text-[var(--lm-color-text-muted)]">rem.</span>
            </div>
          </div>

          <div className="bg-[var(--lm-color-canvas)] p-2.5 rounded-lg border border-[var(--lm-color-border-subtle)]">
            <div className="flex items-center gap-1.5 text-[var(--lm-color-text-muted)] text-[11px]">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lander Comm</span>
            </div>
            <div className="text-base font-bold text-[var(--lm-color-text-primary)] mt-1">
              {plan.lineOfSightSummary.directPct}% <span className="text-xs font-normal text-[var(--lm-color-text-muted)]">direct</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Slope Gradient & Terrain Hazard Safety */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-2">
          <span className="font-semibold uppercase tracking-wider text-[var(--lm-color-text-secondary)]">
            Terrain Hazard Audit
          </span>
          <span className="text-xs text-[var(--lm-color-text-muted)]">
            Max: <strong className="text-rose-400">{plan.maxSlopeDeg}°</strong> | Avg: {plan.averageSlopeDeg}°
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Safe (&lt;10°)
            </span>
            <span className="font-bold">{plan.safeCount} waypoints ({plan.safePercentage}%)</span>
          </div>
          <div className="w-full h-2 rounded bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${(plan.safeCount / plan.waypoints.length) * 100}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${(plan.cautionCount / plan.waypoints.length) * 100}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${(plan.hazardCount / plan.waypoints.length) * 100}%` }} className="bg-rose-500 h-full" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--lm-color-text-muted)] pt-1">
            <span className="text-amber-400">Caution (10°-15°): {plan.cautionCount}</span>
            <span className="text-rose-400">Hazard (&gt;15°): {plan.hazardCount}</span>
          </div>
        </div>

        <div className="text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800 text-[var(--lm-color-text-secondary)] flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            {plan.hazardCount === 0
              ? 'Path is 100% traversable under Apollo/VIPER vehicle envelope limits.'
              : `${plan.hazardCount} waypoint segments exceed the 15° safe autonomous scarp threshold.`}
          </span>
        </div>
      </div>

      {/* 3. Selected Waypoint Telemetry Readout */}
      <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-2">
          <span className="font-semibold uppercase tracking-wider text-[var(--lm-color-text-secondary)]">
            Waypoint #{activeWp.index} Telemetry
          </span>
          {activeWp.isPsrColdTrap && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
              <Sparkles className="w-2.5 h-2.5 text-indigo-300" /> PSR Ice Trap
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[var(--lm-color-text-muted)]">Distance:</span>
            <div className="font-bold text-[var(--lm-color-text-primary)]">{activeWp.distanceFromStartKm} km</div>
          </div>
          <div>
            <span className="text-[var(--lm-color-text-muted)]">Elevation:</span>
            <div className="font-bold text-[var(--lm-color-text-primary)]">{activeWp.elevationMeters} m</div>
          </div>
          <div>
            <span className="text-[var(--lm-color-text-muted)]">Slope:</span>
            <div className={`font-bold ${activeWp.terrainSafety === 'hazard' ? 'text-rose-400' : activeWp.terrainSafety === 'caution' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeWp.slopeDeg}° ({activeWp.terrainSafety})
            </div>
          </div>
          <div>
            <span className="text-[var(--lm-color-text-muted)]">Comms LOS:</span>
            <div className={`font-bold ${activeWp.lineOfSightToLander === 'occluded' ? 'text-rose-400' : activeWp.lineOfSightToLander === 'grazing' ? 'text-amber-400' : 'text-sky-400'}`}>
              {activeWp.lineOfSightToLander.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="bg-[var(--lm-color-canvas)] p-2 rounded border border-[var(--lm-color-border-subtle)] flex items-center justify-between text-[11px]">
          <span className="text-[var(--lm-color-text-muted)]">Cumulative Energy:</span>
          <span className="font-bold text-[var(--lm-color-text-primary)]">{activeWp.cumulativeEnergyWh} Wh</span>
        </div>
      </div>
    </div>
  );
}
