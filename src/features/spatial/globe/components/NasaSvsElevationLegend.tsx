import React from 'react';
import { NASA_SVS_COLOR_STOPS, NASA_SVS_LEGEND_TICKS } from '../../../../domain/terrain/nasaSvsColorRamp';

export interface NasaSvsElevationLegendProps {
  readonly isVisible?: boolean;
  readonly className?: string;
}

/**
 * Generates the CSS linear-gradient string matching the official 16-stop LOLA palette.
 * Direction: bottom-to-top (deep purple at bottom, magenta/pink at top).
 */
export function getNasaSvsElevationLegendGradient(): string {
  const stops = NASA_SVS_COLOR_STOPS;
  const gradientStops = stops.map((s, index) => {
    const pct = ((index / (stops.length - 1)) * 100).toFixed(1);
    return `${s.hex} ${pct}%`;
  });
  return `linear-gradient(to top, ${gradientStops.join(', ')})`;
}

/**
 * Docked NASA SVS 3727 LOLA Elevation Scale Bar (-8 km to +8 km).
 * Strictly complies with the NASA Scientific Visualization Studio hypsometric standard.
 */
export function NasaSvsElevationLegend({
  isVisible = true,
  className = '',
}: NasaSvsElevationLegendProps) {
  if (!isVisible) return null;

  const gradient = getNasaSvsElevationLegendGradient();

  return (
    <aside
      aria-label="NASA SVS 3727 LOLA Elevation Scale Bar"
      className={`absolute right-4 top-20 z-20 pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 shadow-2xl shadow-black/80 font-mono text-xs select-none transition-all duration-300 w-48 ${className}`}
    >
      <header className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2">
        <div>
          <h2 className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
            NASA SVS 3727
          </h2>
          <p className="text-[9px] text-slate-400 tracking-tight">
            LOLA Lunar Hypsometry
          </p>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 rounded">
          128 PPD
        </span>
      </header>

      <div className="flex items-stretch gap-3 h-48 py-1">
        {/* Continuous 16-stop Hypsometric Gradient Bar */}
        <div
          className="w-4 rounded-sm border border-slate-700/80 shadow-inner flex-shrink-0"
          style={{ background: gradient }}
        />

        {/* Elevation Tick Labels (-8 km to +8 km) */}
        <div className="flex flex-col justify-between text-[9px] leading-none text-slate-300 flex-1">
          {NASA_SVS_LEGEND_TICKS.slice()
            .reverse()
            .map((tick) => {
              const isDatum = tick.km === 0;
              return (
                <div
                  key={tick.km}
                  className={`flex items-center justify-between gap-1 ${
                    isDatum ? 'text-emerald-400 font-bold' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`inline-block h-[1px] w-2 ${
                        isDatum ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    <span>{tick.label}</span>
                  </span>
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{ backgroundColor: tick.hex }}
                  />
                </div>
              );
            })}
        </div>
      </div>

      <footer className="mt-2 pt-1.5 border-t border-slate-800 text-[8px] text-slate-500 flex justify-between">
        <span>Datum R₀ = 1737.4 km</span>
        <span className="text-cyan-500">LRO / NASA</span>
      </footer>
    </aside>
  );
}
