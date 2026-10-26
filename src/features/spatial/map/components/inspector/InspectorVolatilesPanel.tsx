import React, { useEffect, useState } from 'react';
import { Droplets, Pickaxe, RefreshCw, Server, Sparkles, Thermometer } from 'lucide-react';
import { missionServerClient } from '@/domain/services/missionServerClient';
import type { VolatileProspectingResult } from '@/domain/volatiles/types';

export interface InspectorVolatilesPanelProps {
  latDeg: number;
  lonDeg: number;
  siteName?: string;
  className?: string;
}

type VolatileData = VolatileProspectingResult & {
  source: 'nextrush_server' | 'local_analytical_fallback';
};

/**
 * Docked readout panel for multi-spectral volatile and water-ice prospecting.
 * Directly integrates LEND epithermal neutron flux, Diviner surface temperature,
 * ISRU feasibility scoring, and extraction architecture evaluation.
 */
export function InspectorVolatilesPanel({
  latDeg,
  lonDeg,
  siteName = 'Target Coordinates',
  className = '',
}: InspectorVolatilesPanelProps) {
  const [data, setData] = useState<VolatileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    missionServerClient
      .getVolatileProspect({ latDeg, lonDeg })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [latDeg, lonDeg]);

  if (!data && loading) {
    return (
      <div
        data-testid="inspector-volatiles-panel"
        className={`bg-[var(--lm-color-canvas)]/60 border border-[var(--lm-color-border-subtle)] rounded p-2.5 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 ${className}`}
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Evaluating LEND/Diviner Volatiles ({latDeg.toFixed(2)}°, {lonDeg.toFixed(2)}°)...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      data-testid="inspector-volatiles-panel"
      className={`flex flex-col gap-2 font-mono text-xs ${className}`}
    >
      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {/* Diviner Thermal */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px] text-[var(--lm-color-text-muted)]">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-rose-400" />
              <span>Diviner Temp</span>
            </span>
            <span className={`text-[10px] font-bold ${data.isruFeasibilityScore >= 60 ? 'text-cyan-400' : 'text-amber-400'}`}>
              ISRU {data.isruFeasibilityScore}/100
            </span>
          </div>
          <span className={`text-xs font-bold ${data.divinerTempKelvin < 110 ? 'text-indigo-300' : 'text-amber-400'}`}>
            {data.divinerTempKelvin} K
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">
            {data.sublimationStability === 'perennially_stable' ? 'Perennial Cold Trap' : 'Sublimates'}
          </span>
        </div>

        {/* LEND Hydrogen Wt% */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[var(--lm-color-text-muted)] text-[10px]">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Hydrogen wt%</span>
          </div>
          <span className="text-xs font-bold text-cyan-400">
            {data.hydrogenWeightPct}% <span className="text-[10px] font-normal text-slate-400">({data.waterEquivalentHydrogenPct}% WEH)</span>
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">
            Flux: {data.epithermalNeutronFluxCps} cps
          </span>
        </div>

        {/* Ice Density Yield */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[var(--lm-color-text-muted)] text-[10px]">
            <Pickaxe className="w-3 h-3 text-emerald-400" />
            <span>Ice Density</span>
          </div>
          <span className="text-xs font-bold text-emerald-400">
            {data.estimatedIceDensityKgPerM3} kg/m³
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">
            ~{data.iceYieldMetricTonsPerHectare} t / ha (1m depth)
          </span>
        </div>

        {/* Extraction Architecture */}
        <div className="bg-[var(--lm-color-canvas)]/80 p-2 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px] text-[var(--lm-color-text-muted)]">
            <span>Architecture</span>
            <span className="flex items-center gap-0.5 text-[9px] text-cyan-300">
              <Server className="w-2.5 h-2.5" />
              {data.source === 'nextrush_server' ? ':3001' : 'Local'}
            </span>
          </div>
          <span className="text-xs font-bold text-purple-300 truncate">
            {data.extractionMethod === 'sublimation_tent'
              ? 'Sublimation Canopy'
              : data.extractionMethod === 'deep_thermal_coring'
              ? 'Thermal Core Drill'
              : 'Unviable'}
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)] truncate">
            {data.isPsr ? 'Permanently Shadowed' : 'Illuminated Terrain'}
          </span>
        </div>
      </div>
    </div>
  );
}
