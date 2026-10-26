import { useEffect, useState } from 'react';
import { missionServerClient } from '@/domain/services/missionServerClient';
import { VolatileProspectingResult } from '@/domain/volatiles/types';
import { Droplets, Thermometer, Sparkles, Pickaxe, Server, RefreshCw } from 'lucide-react';

interface VolatileProspectingCardProps {
  latDeg: number;
  lonDeg: number;
  siteName?: string;
  className?: string;
}

export function VolatileProspectingCard({
  latDeg,
  lonDeg,
  siteName = 'Target Coordinates',
  className = '',
}: VolatileProspectingCardProps) {
  const [data, setData] = useState<
    (VolatileProspectingResult & { source: 'nextrush_server' | 'local_analytical_fallback' }) | null
  >(null);
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
      <div className={`bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Evaluating LEND/Diviner Volatiles...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={`bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-xl p-3.5 flex flex-col gap-3 font-mono text-xs shadow-lg ${className}`}
      aria-label="Volatile Water-Ice Prospecting Intelligence"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-2">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider text-[var(--lm-color-text-primary)]">
            ISRU Volatile Prospector
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
          <Server className="w-3 h-3" />
          {data.source === 'nextrush_server' ? 'NextRush :3001' : 'Local Domain'}
        </div>
      </div>

      {/* Target & Feasibility Score */}
      <div className="flex items-center justify-between bg-[var(--lm-color-canvas)] p-2.5 rounded-lg border border-[var(--lm-color-border-subtle)]">
        <div>
          <span className="text-[11px] text-[var(--lm-color-text-muted)] block">Inspection Target</span>
          <span className="font-bold text-[var(--lm-color-text-primary)] truncate block max-w-[170px]">
            {siteName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[var(--lm-color-text-muted)] block">ISRU Feasibility</span>
          <span className={`text-sm font-black ${data.isruFeasibilityScore >= 60 ? 'text-cyan-400' : data.isruFeasibilityScore >= 35 ? 'text-amber-400' : 'text-slate-400'}`}>
            {data.isruFeasibilityScore} / 100
          </span>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Diviner Thermal */}
        <div className="bg-[var(--lm-color-canvas)]/70 p-2 rounded border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[var(--lm-color-text-muted)] text-[10px]">
            <Thermometer className="w-3 h-3 text-rose-400" />
            <span>Diviner Temp</span>
          </div>
          <span className={`text-xs font-bold ${data.divinerTempKelvin < 110 ? 'text-indigo-300' : 'text-amber-400'}`}>
            {data.divinerTempKelvin} K
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">
            {data.sublimationStability === 'perennially_stable' ? 'Perennial Cold Trap' : 'Sublimates'}
          </span>
        </div>

        {/* LEND Hydrogen Wt% */}
        <div className="bg-[var(--lm-color-canvas)]/70 p-2 rounded border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
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

        {/* Ice Yield Density */}
        <div className="bg-[var(--lm-color-canvas)]/70 p-2 rounded border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
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

        {/* Recommended Extraction Architecture */}
        <div className="bg-[var(--lm-color-canvas)]/70 p-2 rounded border border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--lm-color-text-muted)]">Architecture</span>
          <span className="text-xs font-bold text-purple-300 truncate">
            {data.extractionMethod === 'sublimation_tent' ? 'Sublimation Canopy' : data.extractionMethod === 'deep_thermal_coring' ? 'Thermal Core Drill' : 'Unviable'}
          </span>
          <span className="text-[10px] text-[var(--lm-color-text-muted)] truncate">
            {data.isPsr ? 'Permanently Shadowed' : 'Illuminated Terrain'}
          </span>
        </div>
      </div>
    </div>
  );
}
