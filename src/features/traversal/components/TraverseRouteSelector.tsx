import { PRESET_LUNAR_TRAVERSES } from '@/domain/traversal/presetRoutes';
import { PresetLunarTraverse } from '@/domain/traversal/types';
import { Route, Navigation } from 'lucide-react';

interface TraverseRouteSelectorProps {
  selectedRouteId: string;
  onSelectRoute: (route: PresetLunarTraverse) => void;
}

export function TraverseRouteSelector({
  selectedRouteId,
  onSelectRoute,
}: TraverseRouteSelectorProps) {
  const activeRoute =
    PRESET_LUNAR_TRAVERSES.find((r) => r.id === selectedRouteId) ||
    PRESET_LUNAR_TRAVERSES[0];

  return (
    <div className="bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-xl p-4 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[var(--lm-color-text-primary)]">
            EVA & Rover Traversal Corridors
          </h2>
        </div>
        <span className="text-xs font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-canvas)] px-2 py-0.5 rounded border border-[var(--lm-color-border-subtle)]">
          {PRESET_LUNAR_TRAVERSES.length} Canonical Traverses
        </span>
      </div>

      {/* Preset Corridor Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PRESET_LUNAR_TRAVERSES.map((route) => {
          const isSelected = route.id === selectedRouteId;
          return (
            <button
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`p-3 rounded-lg text-left transition-all border flex flex-col justify-between gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-[var(--lm-color-text-primary)] ring-1 ring-emerald-500/30'
                  : 'bg-[var(--lm-color-canvas)] border-[var(--lm-color-border-subtle)] hover:border-slate-500/40 text-[var(--lm-color-text-secondary)]'
              }`}
              type="button"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold truncate">{route.name}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
              <span className="text-[11px] text-[var(--lm-color-text-muted)] line-clamp-1">
                {route.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Route Investigation Brief */}
      <div className="bg-[var(--lm-color-canvas)]/60 rounded-lg p-3 border border-[var(--lm-color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Navigation className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-[var(--lm-color-text-primary)]">
              {activeRoute.originName} &rarr; {activeRoute.destinationName}
            </span>
            <p className="text-[var(--lm-color-text-muted)] text-[11px]">
              {activeRoute.description}
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 px-3 py-1.5 rounded text-[11px] font-mono">
          <span className="font-semibold text-emerald-200">Objective:</span> {activeRoute.scientificGoal}
        </div>
      </div>
    </div>
  );
}
