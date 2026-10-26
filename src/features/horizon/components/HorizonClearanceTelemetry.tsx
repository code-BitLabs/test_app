import React from 'react';
import { Sun, Radio, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { TopocentricHorizonRadar } from '@/domain/celestial/horizonProfile';

interface HorizonClearanceTelemetryProps {
  currentSun: TopocentricHorizonRadar['currentSun'];
  currentEarth: TopocentricHorizonRadar['currentEarth'];
}

export function HorizonClearanceTelemetry({ currentSun, currentEarth }: HorizonClearanceTelemetryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      {/* Sun Telemetry Card */}
      <div className="p-3 bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-md)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-500/10 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-[var(--lm-color-text-primary)]">
              Sun Telemetry
            </div>
            <div className="text-xs font-mono text-[var(--lm-color-text-muted)]">
              Elev: {currentSun.elevationDeg}° • Az: {currentSun.azimuthDeg}°
            </div>
          </div>
        </div>
        <div className="text-right font-mono">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
              currentSun.isObstructed
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
            }`}
          >
            {currentSun.isObstructed ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                Obstructed ({currentSun.clearanceDeg}°)
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3" />
                Clear (+{currentSun.clearanceDeg}°)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Earth Telemetry Card */}
      <div className="p-3 bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-md)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-[var(--lm-color-text-primary)]">
              Earth (DTE Line of Sight)
            </div>
            <div className="text-xs font-mono text-[var(--lm-color-text-muted)]">
              Elev: {currentEarth.elevationDeg}° • Az: {currentEarth.azimuthDeg}°
            </div>
          </div>
        </div>
        <div className="text-right font-mono">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
              currentEarth.isObstructed
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
            }`}
          >
            {currentEarth.isObstructed ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                Blocked by Terrain ({currentEarth.clearanceDeg}°)
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3" />
                Direct Link (+{currentEarth.clearanceDeg}°)
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
