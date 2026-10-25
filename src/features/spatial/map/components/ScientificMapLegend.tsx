import React from 'react';
import { Mountain, Layers, Sun, Activity, Eye, Info } from 'lucide-react';
import { ScientificMapLayerMode } from '@/features/spatial/model/spatialPreferences';

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
          <option value="hillshade">Hillshade (Analytical Relief)</option>
          <option value="slope">Slope Gradient (Hazard Map)</option>
          <option value="geology">Geology (Stratigraphic Units)</option>
          <option value="illumination">Illumination & PSRs</option>
          <option value="none">Natural / Satellite Albedo</option>
        </select>
      </div>

      {/* Dynamic Content Per Mode */}
      {mode === 'topography' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-300 text-[10px]">
            <span className="text-purple-300 font-semibold">-4,200 m (Floor)</span>
            <span className="text-slate-400">0 m (R=1737.4 km)</span>
            <span className="text-rose-300 font-semibold">+5,100 m (Massif)</span>
          </div>
          {/* Authentic NASA LOLA Rainbow Color Bar */}
          <div
            className="w-full h-2.5 rounded-sm border border-slate-700 shadow-inner"
            style={{
              background: 'linear-gradient(to right, #3b0764, #1d4ed8, #06b6d4, #10b981, #eab308, #ea580c, #fdf4ff)',
            }}
          />
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>NASA Goddard PGDA 78/90</span>
            <span className="text-emerald-400">±1.2 m precision</span>
          </div>
        </div>
      )}

      {mode === 'hillshade' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-300 text-[10px]">
            <span>Deep Polar Shadow (0.0)</span>
            <span>Illuminated Face (1.0)</span>
          </div>
          <div
            className="w-full h-2.5 rounded-sm border border-slate-700 shadow-inner"
            style={{
              background: 'linear-gradient(to right, #000000, #475569, #cbd5e1, #ffffff)',
            }}
          />
          <div className="text-[9px] text-slate-400">
            Low-sun grazing hillshade modeled at Az 315° / Alt 1.5°
          </div>
        </div>
      )}

      {mode === 'slope' && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-4 gap-1 text-[9px]">
            <span className="px-1 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-center">
              &lt;5° Safe
            </span>
            <span className="px-1 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-700/60 text-center">
              5°-12° Mod
            </span>
            <span className="px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 text-center">
              12°-18° Warn
            </span>
            <span className="px-1 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/60 text-center">
              &gt;25° Steep
            </span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center justify-between">
            <span>LOLA Altimetric Slope (GDR)</span>
            <span className="text-cyan-300">Rover Trafficability</span>
          </div>
        </div>
      )}

      {mode === 'geology' && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-3 gap-1 text-[9px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#78716c] shrink-0" />
              <span className="text-slate-300">pNb (SPA)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#b45309] shrink-0" />
              <span className="text-slate-300">Nb (Massif)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] shrink-0" />
              <span className="text-slate-300">Im (Plains)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#fbbf24] shrink-0" />
              <span className="text-slate-300">Cc (Rays)</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1e1b4b] border border-indigo-500/50 shrink-0" />
              <span className="text-indigo-300">PSR (Deep Traps)</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-400">
            LPI Lunar South Pole Atlas (Spudis et al., 2008)
          </div>
        </div>
      )}

      {mode === 'illumination' && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-300 text-[10px]">
            <span className="text-indigo-300">0% Permanent PSR</span>
            <span className="text-amber-300 font-semibold">86%+ Quasi-Permanent</span>
          </div>
          <div
            className="w-full h-2.5 rounded-sm border border-slate-700 shadow-inner"
            style={{
              background: 'linear-gradient(to right, #140e3c, #1e293b, #d97706, #fbbf24)',
            }}
          />
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>LRO Diviner + LOLA Horizon</span>
            <span className="text-cyan-300">Annual Climatology</span>
          </div>
        </div>
      )}

      {mode === 'none' && (
        <div className="text-[9px] text-slate-400 italic">
          Natural optical albedo (LROC NAC controlled regional base mosaic).
        </div>
      )}
    </aside>
  );
}
