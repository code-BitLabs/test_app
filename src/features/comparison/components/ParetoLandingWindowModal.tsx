import { useState } from 'react';
import { missionServerClient } from '@/domain/services/missionServerClient';
import { ParetoOptimizationResult, RankedLandingWindow } from '@/domain/windows/types';
import { Sparkles, X, Server, RefreshCw, AlertTriangle } from 'lucide-react';
import { RankedWindowItem } from './RankedWindowItem';

interface ParetoLandingWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  onSelectWindow: (window: RankedLandingWindow) => void;
}

export function ParetoLandingWindowModal({
  isOpen,
  onClose,
  siteId,
  siteName,
  onSelectWindow,
}: ParetoLandingWindowModalProps) {
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [stayDays, setStayDays] = useState<number>(14);
  const [minSunlightPct, setMinSunlightPct] = useState<number>(50);
  const [maxShadowH, setMaxShadowH] = useState<number>(48);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    (ParetoOptimizationResult & { source: 'nextrush_server' | 'local_analytical_fallback' }) | null
  >(null);

  if (!isOpen) return null;

  async function handleSolve() {
    setLoading(true);
    try {
      const res = await missionServerClient.optimizeLandingWindows({
        siteId,
        startEpochMs: Date.UTC(targetYear, 0, 1),
        endEpochMs: Date.UTC(targetYear, 11, 31),
        stayDurationDays: stayDays,
        minSunlightPct,
        maxContinuousShadowHours: maxShadowH,
        topN: 4,
      });
      setResult(res);
    } catch {
      // Handled by client fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-4 font-mono text-xs shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Pareto-Optimal Landing Window Solver"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--lm-color-text-primary)]">
                Pareto-Optimal Landing Window Solver
              </h2>
              <span className="text-[11px] text-[var(--lm-color-text-muted)]">
                Automated multi-objective optimization for {siteName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Solver Configuration Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--lm-color-canvas)] p-3 rounded-lg border border-[var(--lm-color-border-subtle)]">
          <div>
            <label className="text-[10px] text-[var(--lm-color-text-muted)] block mb-1">Target Year</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded px-2 py-1 text-cyan-300"
            >
              <option value={2026}>2026 (Artemis III)</option>
              <option value={2027}>2027 (CLPS Peak)</option>
              <option value={2028}>2028 (Base Camp)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--lm-color-text-muted)] block mb-1">Stay Duration</label>
            <select
              value={stayDays}
              onChange={(e) => setStayDays(Number(e.target.value))}
              className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded px-2 py-1 text-cyan-300"
            >
              <option value={7}>7 Days (Short Stay)</option>
              <option value={14}>14 Days (Nominal)</option>
              <option value={28}>28 Days (Lunar Day)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--lm-color-text-muted)] block mb-1">Min Sunlight</label>
            <select
              value={minSunlightPct}
              onChange={(e) => setMinSunlightPct(Number(e.target.value))}
              className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded px-2 py-1 text-cyan-300"
            >
              <option value={40}>&gt;40% Daylight</option>
              <option value={50}>&gt;50% Daylight</option>
              <option value={70}>&gt;70% Daylight</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[var(--lm-color-text-muted)] block mb-1">Max Shadow</label>
            <select
              value={maxShadowH}
              onChange={(e) => setMaxShadowH(Number(e.target.value))}
              className="w-full bg-[var(--lm-color-surface)] border border-[var(--lm-color-border)] rounded px-2 py-1 text-cyan-300"
            >
              <option value={24}>&lt;24h (1 Day)</option>
              <option value={48}>&lt;48h (2 Days)</option>
              <option value={96}>&lt;96h (4 Days)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSolve}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'Evaluating Ephemeris & Terrain Grids...' : 'Solve Pareto Frontier'}</span>
        </button>

        {/* Results Stream */}
        {result && (
          <div className="flex flex-col gap-2.5 mt-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--lm-color-text-muted)]">
              <span>Evaluated {result.totalWindowsEvaluated} windows in {targetYear}</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <Server className="w-3 h-3" />
                {result.source === 'nextrush_server' ? 'NextRush :3001' : 'Local Domain Engine'}
              </span>
            </div>

            {result.topWindows.length === 0 ? (
              <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300 text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>No landing windows meet these strict constraints in {targetYear}. Relax shadow or sunlight threshold.</span>
              </div>
            ) : (
              result.topWindows.map((win) => (
                <RankedWindowItem
                  key={win.rank}
                  win={win}
                  onSelect={(selected) => {
                    onSelectWindow(selected);
                    onClose();
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
