import { RankedLandingWindow } from '@/domain/windows/types';
import { Check } from 'lucide-react';

interface RankedWindowItemProps {
  win: RankedLandingWindow;
  onSelect: (win: RankedLandingWindow) => void;
}

export function RankedWindowItem({ win, onSelect }: RankedWindowItemProps) {
  return (
    <div className="bg-[var(--lm-color-canvas)] p-3 rounded-lg border border-[var(--lm-color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center justify-center font-bold text-[10px]">
            #{win.rank}
          </span>
          <span className="font-bold text-[var(--lm-color-text-primary)]">
            {win.startDateIso.slice(0, 10)} &rarr; {win.endDateIso.slice(0, 10)}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
              win.feasibilityVerdict === 'optimal'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
            }`}
          >
            {win.feasibilityVerdict}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--lm-color-text-muted)]">
          <span>
            Sunlight: <strong className="text-cyan-300">{win.sunlightPercentage}%</strong> (
            {win.continuousSunlightHours}h cont.)
          </span>
          <span>
            Max Shadow: <strong className="text-rose-300">{win.maxShadowHours}h</strong>
          </span>
          <span>
            DTE: <strong className="text-emerald-300">{win.dteAvailabilityPercentage}%</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-[10px] text-[var(--lm-color-text-muted)] block">Score</span>
          <span className="text-base font-black text-cyan-400">{win.paretoScore}</span>
        </div>
        <button
          onClick={() => onSelect(win)}
          className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 flex items-center gap-1 font-semibold text-xs cursor-pointer transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>
      </div>
    </div>
  );
}
