import React from 'react';
import { ChevronDown, ChevronUp, Sun, Thermometer } from 'lucide-react';
import { ScientificSiteInvestigation } from '@/domain/sites/scientificSiteInvestigation';

export interface InspectionIlluminationSectionProps {
  scientificData: ScientificSiteInvestigation | null;
  sunElevationDeg: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function InspectionIlluminationSection({
  scientificData,
  sunElevationDeg,
  isOpen,
  onToggle,
}: InspectionIlluminationSectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />
          <span>Solar Illumination & Thermal (Diviner)</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
          {scientificData ? (
            <>
              <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                <span className="text-slate-400">Annual Solar Exposure</span>
                <span className="text-[var(--lm-color-sun)] font-bold">
                  {scientificData.illuminationThermal.annualSolarExposurePercentage.toFixed(1)}%
                </span>
              </div>
              {/* Visual Exposure Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${scientificData.illuminationThermal.annualSolarExposurePercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="bg-[var(--lm-color-surface-strong)]/40 p-1.5 rounded">
                  <span className="text-slate-400 block">MAX DARKNESS</span>
                  <span className="text-amber-300 font-semibold">
                    {scientificData.illuminationThermal.maxContinuousDarknessHours} h
                  </span>
                </div>
                <div className="bg-[var(--lm-color-surface-strong)]/40 p-1.5 rounded">
                  <span className="text-slate-400 block">MAX SUNLIGHT</span>
                  <span className="text-emerald-400 font-semibold">
                    {scientificData.illuminationThermal.maxContinuousIlluminationHours} h
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-rose-400" /> Peak Summer:
                  </span>
                  <span className="text-rose-300 font-semibold">
                    {scientificData.illuminationThermal.peakSummerTemperatureKelvin} K
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-cyan-400" /> Min Shadow:
                  </span>
                  <span className="text-cyan-300 font-semibold">
                    {scientificData.illuminationThermal.minimumShadowTemperatureKelvin} K
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] py-1 border-t border-[var(--lm-color-border-subtle)]">
                <span className="text-slate-400">Permanently Shadowed Region (PSR):</span>
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                    scientificData.illuminationThermal.psrPresent
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {scientificData.illuminationThermal.psrPresent
                    ? `Yes (${scientificData.illuminationThermal.psrAreaKm2} km²)`
                    : 'None on summit'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] py-0.5 border-t border-[var(--lm-color-border-subtle)]">
                <span className="text-slate-400">Current Sun Elevation:</span>
                <span className={`font-semibold ${sunElevationDeg >= 0 ? 'text-[var(--lm-color-sun)]' : 'text-amber-400'}`}>
                  {sunElevationDeg >= 0 ? `+${sunElevationDeg.toFixed(2)}°` : `${sunElevationDeg.toFixed(2)}°`}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-[11px] py-0.5">
              <span className="text-slate-400">Sun Elevation:</span>
              <span className="text-amber-400">{sunElevationDeg.toFixed(2)}°</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
