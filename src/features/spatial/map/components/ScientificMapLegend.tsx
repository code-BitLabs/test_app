import React from 'react';
import { Layers } from 'lucide-react';
import { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';
import { ScientificColorScaleBar } from './ScientificColorScaleBar';
import { ScientificProvenanceBadge } from './ScientificProvenanceBadge';

export interface ScientificMapLegendProps {
  mode: ScientificMapLayerMode;
  onSelectMode: (mode: ScientificMapLayerMode) => void;
  className?: string;
}

export function ScientificMapLegend({
  mode,
  onSelectMode,
  className = '',
}: ScientificMapLegendProps) {
  return (
    <aside
      className={`bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] p-2 shadow-xl flex flex-col gap-2 font-mono text-[10px] pointer-events-auto select-none ${className}`}
      aria-label="Scientific Lunar Map Layer Legend"
      data-testid="scientific-map-legend"
    >
      {/* Layer Selector Bar */}
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-[var(--lm-color-border-subtle)]">
        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span>Scientific Map Product</span>
        </span>
        <select
          value={mode}
          onChange={(e) => onSelectMode(e.target.value as ScientificMapLayerMode)}
          data-testid="select-scientific-layer"
          className="bg-[var(--lm-color-surface-strong)] text-cyan-300 border border-[var(--lm-color-border)] rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="topography">Topography (LOLA Altimetry)</option>
          <option value="volatiles">Volatiles & Water-Ice (LEND)</option>
          <option value="temperature">Surface Temperature (Diviner)</option>
          <option value="hillshade">Hillshade (Analytical Relief)</option>
          <option value="slope">Slope Gradient (Hazard Map)</option>
          <option value="geology">Geology (Stratigraphic Units)</option>
          <option value="illumination">Illumination & PSRs</option>
          <option value="none">Natural / Satellite Albedo</option>
        </select>
      </div>

      {mode === 'topography' && (
        <ScientificColorScaleBar
          leftLabel="-9,000 m (Basin)"
          leftClass="text-purple-300 font-semibold"
          midLabel="0 m (Datum R=1737.4 km)"
          rightLabel="+9,000 m (Highlands)"
          rightClass="text-rose-300 font-semibold"
          gradient="linear-gradient(to right, #2b0057, #1d2382, #134ea3, #0d7ec4, #09a4b8, #10bba0, #1fc575, #4fd33e, #8ee124, #d0ea15, #f7e212, #fca916, #f6641d, #e62828, #f060c0)"
          subLeft="NASA SVS 3727 16-Color Ramp"
          subRight="LOLA Altimetry (-9km to +9km)"
          subRightClass="text-emerald-400"
        />
      )}

      {mode === 'volatiles' && (
        <ScientificColorScaleBar
          leftLabel="<0.05% H (Dry Regolith)"
          leftClass="text-slate-400"
          rightLabel=">0.45% H (>4% WEH Ice)"
          rightClass="text-cyan-300 font-semibold"
          gradient="linear-gradient(to right, #1e293b, #0d9488, #06b6d4, #e0f2fe)"
          subLeft="LRO LEND Neutron Suppression"
          subRight="Hydrogen Mass Wt%"
        />
      )}

      {mode === 'temperature' && (
        <ScientificColorScaleBar
          leftLabel="40K (Cold Trap)"
          leftClass="text-indigo-300 font-semibold"
          midLabel="110K (Ice Boundary)"
          midClass="text-emerald-400 font-semibold"
          rightLabel="260K (Sunlit)"
          rightClass="text-rose-300 font-semibold"
          gradient="linear-gradient(to right, #312e81, #1d4ed8, #10b981, #f59e0b, #e11d48)"
          subLeft="LRO Diviner Max Surface Temp"
          subRight="<110K Stable Ice"
          subRightClass="text-emerald-400"
        />
      )}

      {mode === 'hillshade' && (
        <ScientificColorScaleBar
          leftLabel="Deep Polar Shadow (0.0)"
          rightLabel="Illuminated Face (1.0)"
          gradient="linear-gradient(to right, #000000, #475569, #cbd5e1, #ffffff)"
          subLeft="Low-sun grazing relief"
          subRight="Az 315° / Alt 1.5°"
        />
      )}

      {mode === 'slope' && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-4 gap-1 text-[9px]">
            <span className="px-1 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-center">&lt;5° Safe</span>
            <span className="px-1 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-700/60 text-center">5°-12° Mod</span>
            <span className="px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 text-center">12°-15° Warn</span>
            <span className="px-1 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/60 text-center font-bold">&ge;15° Hazard</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center justify-between">
            <span>LOLA Altimetric Slope (GDR)</span>
            <span className="text-rose-400 font-medium">Tip-Over Limit (≥15°)</span>
          </div>
        </div>
      )}

      {mode === 'geology' && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-1 text-[9px]">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#78716c] shrink-0" /><span className="text-slate-300">pNb</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#b45309] shrink-0" /><span className="text-slate-300">Nb</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] shrink-0" /><span className="text-slate-300">Im</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#fbbf24] shrink-0" /><span className="text-slate-300">Cc</span></div>
            <div className="flex items-center gap-1 col-span-2"><span className="w-2.5 h-2.5 rounded-xs bg-[#1e1b4b] border border-indigo-500/50 shrink-0" /><span className="text-indigo-300">PSR (Cold Trap)</span></div>
          </div>
          <div className="text-[9px] text-slate-400">LPI Lunar South Pole Atlas</div>
        </div>
      )}

      {mode === 'illumination' && (
        <ScientificColorScaleBar
          leftLabel="0% Permanent PSR"
          leftClass="text-indigo-300"
          rightLabel="86%+ Quasi-Permanent"
          rightClass="text-amber-300 font-semibold"
          gradient="linear-gradient(to right, #140e3c, #1e293b, #d97706, #fbbf24)"
          subLeft="LRO Diviner + LOLA Horizon"
          subRight="Annual Climatology"
        />
      )}

      {mode === 'none' && (
        <div className="text-[9px] text-slate-400 italic">
          Natural optical albedo (LROC NAC controlled regional base mosaic).
        </div>
      )}

      {/* Layer Scientific Provenance Display */}
      <ScientificProvenanceBadge mode={mode} />
    </aside>
  );
}
