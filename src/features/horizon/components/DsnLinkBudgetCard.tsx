import React, { useMemo } from 'react';
import { Satellite, Signal, Globe2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  calculateRfLinkBudget,
  calculateDsnStationVisibilities,
  determineActiveDsnStation,
} from '@/domain/telecom/linkBudget';

interface DsnLinkBudgetCardProps {
  epochMs: number;
  earthDistanceKm: number;
  earthElevationDeg: number;
  isObstructed: boolean;
}

export function DsnLinkBudgetCard({
  epochMs,
  earthDistanceKm,
  earthElevationDeg,
  isObstructed,
}: DsnLinkBudgetCardProps) {
  const budget = useMemo(
    () =>
      calculateRfLinkBudget({
        earthDistanceKm,
        earthElevationDeg,
        isTerrainObstructed: isObstructed,
        band: 'xBandDownlink',
        transmitterPowerWatts: 15,
        dataRateMbps: 2.0,
      }),
    [earthDistanceKm, earthElevationDeg, isObstructed],
  );

  const stations = useMemo(() => calculateDsnStationVisibilities(epochMs), [epochMs]);
  const activeStation = useMemo(() => determineActiveDsnStation(stations), [stations]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)]">
      <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--lm-color-text-primary)]">
            NASA Deep Space Network (DSN) & RF Link Budget
          </span>
        </div>
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1.5 ${
            budget.linkState === 'locked'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : budget.linkState === 'marginal'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          {budget.linkState === 'locked' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {budget.linkState === 'locked'
            ? 'DSN Carrier Locked'
            : budget.linkState === 'marginal'
              ? 'Marginal SNR'
              : 'Loss of Signal (LOS)'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
          <div className="text-[10px] text-[var(--lm-color-text-muted)]">Carrier & Band</div>
          <div className="font-semibold text-cyan-300">X-Band (8.45 GHz)</div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] mt-0.5">2.0 Mbps Telemetry</div>
        </div>

        <div className="p-2.5 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
          <div className="text-[10px] text-[var(--lm-color-text-muted)]">Path Loss (FSPL)</div>
          <div className="font-semibold text-[var(--lm-color-text-primary)]">{budget.fsplDb} dB</div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] mt-0.5">Dist: {Math.round(earthDistanceKm).toLocaleString()} km</div>
        </div>

        <div className="p-2.5 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
          <div className="text-[10px] text-[var(--lm-color-text-muted)]">Received Power</div>
          <div className="font-semibold text-[var(--lm-color-text-primary)]">
            {Number.isFinite(budget.receivedPowerDbm) ? `${budget.receivedPowerDbm} dBm` : 'None'}
          </div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] mt-0.5">EIRP: {budget.eirpDbw} dBW</div>
        </div>

        <div className="p-2.5 rounded bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border-subtle)]">
          <div className="text-[10px] text-[var(--lm-color-text-muted)]">RF Link Margin</div>
          <div
            className={`font-bold ${
              budget.linkMarginDb >= 3.0
                ? 'text-emerald-400'
                : budget.linkMarginDb >= 0.0
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }`}
          >
            {Number.isFinite(budget.linkMarginDb) ? `+${budget.linkMarginDb} dB` : '0 dB (LOS)'}
          </div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] mt-0.5">Req: +{budget.requiredEbN0Db} dB</div>
        </div>
      </div>

      {budget.multipathWarning && (
        <div className="px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Terrain Grazing Multipath: Earth elevation is &lt;2.0° above terrain. Expect 1–3 dB diffraction fading.</span>
        </div>
      )}

      {/* DSN Ground Station Handover Status */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--lm-color-text-secondary)]">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active NASA Deep Space Complex Tracking:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {stations.map((s) => {
            const isActive = activeStation?.stationId === s.stationId;
            return (
              <div
                key={s.stationId}
                className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                    : s.isVisible
                      ? 'bg-[var(--lm-color-canvas)] border-[var(--lm-color-border-subtle)] text-[var(--lm-color-text-muted)]'
                      : 'bg-[var(--lm-color-canvas)] border-transparent text-slate-600 opacity-60'
                }`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-1.5">
                    {s.stationId === 'goldstone' ? '🇺🇸' : s.stationId === 'madrid' ? '🇪🇸' : '🇦🇺'}{' '}
                    {s.stationId.toUpperCase()}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">{s.dishName.split(' ')[0]}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono ${isActive ? 'text-cyan-300 font-bold' : ''}`}>
                    {s.elevationDeg > 0 ? `+${s.elevationDeg}°` : `${s.elevationDeg}°`}
                  </div>
                  <div className="text-[10px]">{s.isVisible ? 'IN VIEW' : 'BELOW MASK'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
