import React from 'react';
import {
  CustomLandingTarget,
  CustomTargetEvaluation,
  FeasibilityGrade,
  TargetComparisonDeltas,
} from '@/domain/target/customTargetModel';

export interface CustomTargetCompareCardProps {
  target: CustomLandingTarget;
  evaluation: CustomTargetEvaluation;
  deltas: TargetComparisonDeltas;
  onClearTarget?: () => void;
  onEditTarget?: () => void;
}

const GRADE_STYLES: Record<FeasibilityGrade, { bg: string; text: string; label: string }> = {
  EXCELLENT: { bg: 'bg-emerald-950/70 border-emerald-500/40', text: 'text-emerald-300', label: 'EXCELLENT' },
  VIABLE: { bg: 'bg-cyan-950/70 border-cyan-500/40', text: 'text-cyan-300', label: 'VIABLE' },
  CONSTRAINED: { bg: 'bg-amber-950/70 border-amber-500/40', text: 'text-amber-300', label: 'CONSTRAINED' },
  HAZARDOUS: { bg: 'bg-red-950/70 border-red-500/40', text: 'text-red-300', label: 'HAZARDOUS' },
};

function formatDelta(val: number, unit = '°'): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}${unit}`;
}

export function CustomTargetCompareCard({
  target,
  evaluation,
  deltas,
  onClearTarget,
  onEditTarget,
}: CustomTargetCompareCardProps) {
  const grade = GRADE_STYLES[deltas.feasibilityGrade];

  return (
    <div className="bg-[var(--lm-color-surface)] border border-amber-500/40 rounded-xl p-4 shadow-xl text-xs space-y-3">
      {/* Header with Title and Feasibility Grade */}
      <div className="flex items-start justify-between gap-2 border-b border-[var(--lm-color-border-subtle)] pb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 truncate">
            <span>📍</span>
            <span className="truncate">{target.name}</span>
          </div>
          <div className="text-[11px] font-mono text-[var(--lm-color-text-secondary)] mt-0.5">
            {target.latitudeDeg.toFixed(2)}°S, {target.longitudeDeg.toFixed(2)}°E • {evaluation.elevationMeters.toFixed(0)}m
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${grade.bg} ${grade.text}`}>
            {grade.label}
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-amber-400">{deltas.feasibilityScore}</span>
            <span className="text-[10px] text-gray-500">/100</span>
          </div>
        </div>
      </div>

      {/* Benchmark Candidate Delta Header */}
      <div className="text-[11px] text-gray-300">
        Benchmark vs <span className="font-semibold text-white">{deltas.nearestSiteName}</span>{' '}
        <span className="text-gray-400">({deltas.distanceKm.toFixed(1)} km away)</span>
      </div>

      {/* Delta Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded p-2 text-center">
          <span className="block text-[10px] text-gray-400">Δ Sun</span>
          <span className={`font-mono font-bold ${deltas.deltaSunElevationDeg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatDelta(deltas.deltaSunElevationDeg)}
          </span>
        </div>
        <div className="bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded p-2 text-center">
          <span className="block text-[10px] text-gray-400">Δ Earth</span>
          <span className={`font-mono font-bold ${deltas.deltaEarthElevationDeg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatDelta(deltas.deltaEarthElevationDeg)}
          </span>
        </div>
        <div className="bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded p-2 text-center">
          <span className="block text-[10px] text-gray-400">Δ Slope</span>
          <span className={`font-mono font-bold ${deltas.deltaSlopeDeg <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatDelta(deltas.deltaSlopeDeg)}
          </span>
        </div>
        <div className="bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded p-2 text-center">
          <span className="block text-[10px] text-gray-400">Δ H₂O</span>
          <span className={`font-mono font-bold ${deltas.deltaIcePercent >= 0 ? 'text-cyan-400' : 'text-gray-400'}`}>
            {formatDelta(deltas.deltaIcePercent, '%')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1 text-[11px]">
        {onEditTarget && (
          <button
            type="button"
            onClick={onEditTarget}
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            ✏️ Edit Target
          </button>
        )}
        {onClearTarget && (
          <button
            type="button"
            onClick={onClearTarget}
            className="text-gray-400 hover:text-red-400 transition-colors ml-auto"
          >
            ✕ Remove Pin
          </button>
        )}
      </div>
    </div>
  );
}
