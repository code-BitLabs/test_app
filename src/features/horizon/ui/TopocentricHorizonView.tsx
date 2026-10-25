import React, { useMemo } from 'react';
import { Eye, Sun, Radio, Mountain, ShieldCheck, AlertTriangle, Compass } from 'lucide-react';
import { useScenario, useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import { CANDIDATE_SITES, getSiteById } from '@/domain/sites/catalog';
import { generateTopocentricHorizonRadar } from '@/domain/celestial/horizonProfile';

export function TopocentricHorizonView() {
  const { selectedSiteId, calculationMode } = useScenario();
  const { epochMs } = useScenarioModel();
  const { selectSite } = useScenarioCommands();

  const currentSite = useMemo(
    () => getSiteById(selectedSiteId) ?? CANDIDATE_SITES[0],
    [selectedSiteId],
  );

  const radar = useMemo(
    () => generateTopocentricHorizonRadar(currentSite, new Date(epochMs), calculationMode),
    [currentSite, epochMs, calculationMode],
  );

  // SVG Chart Geometry
  const viewBoxWidth = 840;
  const viewBoxHeight = 320;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = viewBoxWidth - 2 * paddingX;
  const plotHeight = viewBoxHeight - 2 * paddingY;

  // Elevation range: -5° to +35° (40° total span)
  const minElevDeg = -5;
  const maxElevDeg = 35;
  const elevSpan = maxElevDeg - minElevDeg;

  function toSvgX(azimuthDeg: number): number {
    return paddingX + (azimuthDeg / 360) * plotWidth;
  }

  function toSvgY(elevationDeg: number): number {
    const clamped = Math.max(minElevDeg, Math.min(maxElevDeg, elevationDeg));
    const normalized = (clamped - minElevDeg) / elevSpan;
    return paddingY + (1 - normalized) * plotHeight;
  }

  // Terrain silhouette SVG polygon path
  const terrainPath = useMemo(() => {
    if (!radar.terrainProfile.length) return '';
    const points = radar.terrainProfile.map(
      (p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.horizonElevationDeg).toFixed(1)}`,
    );
    const bottomY = toSvgY(minElevDeg);
    return `M ${paddingX},${bottomY} L ${points.join(' L ')} L ${toSvgX(360)},${bottomY} Z`;
  }, [radar.terrainProfile]);

  // Sun diurnal wave SVG path
  const sunWavePath = useMemo(() => {
    if (!radar.sunPath.length) return '';
    return 'M ' + radar.sunPath.map((p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.elevationDeg).toFixed(1)}`).join(' L ');
  }, [radar.sunPath]);

  // Earth libration loop SVG path
  const earthLoopPath = useMemo(() => {
    if (!radar.earthLibrationLoop.length) return '';
    return 'M ' + radar.earthLibrationLoop.map((p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.elevationDeg).toFixed(1)}`).join(' L ');
  }, [radar.earthLibrationLoop]);

  const sunX = toSvgX(radar.currentSun.azimuthDeg);
  const sunY = toSvgY(radar.currentSun.elevationDeg);

  const earthX = toSvgX(radar.currentEarth.azimuthDeg);
  const earthY = toSvgY(radar.currentEarth.elevationDeg);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[var(--lm-radius-sm)] bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--lm-color-text-primary)] font-mono flex items-center gap-2">
              Topocentric Horizon Radar & Sky Dome
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                360° LOLA Terrain Profile
              </span>
            </h1>
            <p className="text-xs text-[var(--lm-color-text-muted)]">
              Evaluates Sun grazing diurnal wave and Earth libration loop relative to the local terrain silhouette.
            </p>
          </div>
        </div>

        {/* Site Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="radar-site-select" className="text-xs font-mono text-[var(--lm-color-text-secondary)]">
            Site:
          </label>
          <select
            id="radar-site-select"
            value={selectedSiteId}
            onChange={(e) => selectSite(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] text-[var(--lm-color-text-primary)] focus:outline-none focus:border-cyan-500"
          >
            {CANDIDATE_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} • {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Sky Dome Radar Canvas */}
      <div className="flex flex-col bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-6 gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--lm-color-border-subtle)]">
          <span className="text-xs font-mono font-semibold uppercase text-[var(--lm-color-text-primary)]">
            360° Azimuth vs Elevation Canvas ({currentSite.name})
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Sun Path (29.5d)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Earth Libration Loop (27.3d)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 bg-slate-600 border border-slate-400" />
              LOLA Horizon Silhouette
            </span>
          </div>
        </div>

        {/* SVG Sky Dome Plot */}
        <div className="w-full relative aspect-[21/9] sm:aspect-[24/9] min-h-[300px] bg-[#030712] rounded-[var(--lm-radius-md)] border border-slate-800 overflow-hidden flex items-center justify-center">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-full"
            role="img"
            aria-label="360 Degree Azimuth-Elevation Topocentric Horizon Sky Dome"
          >
            {/* Elevation Horizontal Grid Lines */}
            {[-5, 0, 10, 20, 30].map((elev) => {
              const y = toSvgY(elev);
              return (
                <g key={elev}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={paddingX + plotWidth}
                    y2={y}
                    stroke={elev === 0 ? '#38bdf8' : '#1e293b'}
                    strokeWidth={elev === 0 ? '1.5' : '1'}
                    strokeDasharray={elev === 0 ? undefined : '2 3'}
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {elev > 0 ? `+${elev}°` : `${elev}°`}
                  </text>
                </g>
              );
            })}

            {/* Azimuth Vertical Grid Lines (0°, 90°, 180°, 270°, 360°) */}
            {[
              { deg: 0, label: '0° (N / Earth Prime)' },
              { deg: 90, label: '90° (E)' },
              { deg: 180, label: '180° (S)' },
              { deg: 270, label: '270° (W)' },
              { deg: 360, label: '360°' },
            ].map((col) => {
              const x = toSvgX(col.deg);
              return (
                <g key={col.deg}>
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={paddingY + plotHeight}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={x}
                    y={paddingY + plotHeight + 16}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {col.label}
                  </text>
                </g>
              );
            })}

            {/* Filled Terrain Silhouette (LOLA Topography) */}
            <path
              d={terrainPath}
              fill="rgba(30, 41, 59, 0.85)"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Sun Diurnal Trajectory Wave */}
            <path
              d={sunWavePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="opacity-80"
            />

            {/* Earth Monthly Libration Loop */}
            <path
              d={earthLoopPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="opacity-80"
            />

            {/* Current Sun Marker ☀️ */}
            <g className="transition-all duration-300">
              <circle
                cx={sunX}
                cy={sunY}
                r="10"
                fill="rgba(245, 158, 11, 0.25)"
                className="animate-pulse"
              />
              <circle
                cx={sunX}
                cy={sunY}
                r="5"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={sunX}
                y={sunY - 12}
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-amber-300 drop-shadow"
              >
                Sun ({radar.currentSun.elevationDeg > 0 ? `+${radar.currentSun.elevationDeg}°` : `${radar.currentSun.elevationDeg}°`})
              </text>
            </g>

            {/* Current Earth Marker 🌍 */}
            <g className="transition-all duration-300">
              <circle
                cx={earthX}
                cy={earthY}
                r="10"
                fill="rgba(6, 182, 212, 0.25)"
                className="animate-pulse"
              />
              <circle
                cx={earthX}
                cy={earthY}
                r="5"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={earthX}
                y={earthY - 12}
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-cyan-300 drop-shadow"
              >
                Earth ({radar.currentEarth.elevationDeg > 0 ? `+${radar.currentEarth.elevationDeg}°` : `${radar.currentEarth.elevationDeg}°`})
              </text>
            </g>
          </svg>
        </div>

        {/* Real-time Clearance Telemetry Grid */}
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
                  Elev: {radar.currentSun.elevationDeg}° • Az: {radar.currentSun.azimuthDeg}°
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  radar.currentSun.isObstructed
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                    : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                }`}
              >
                {radar.currentSun.isObstructed ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Obstructed ({radar.currentSun.clearanceDeg}°)
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Clear (+{radar.currentSun.clearanceDeg}°)
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
                  Elev: {radar.currentEarth.elevationDeg}° • Az: {radar.currentEarth.azimuthDeg}°
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  radar.currentEarth.isObstructed
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400'
                    : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                }`}
              >
                {radar.currentEarth.isObstructed ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Blocked by Terrain ({radar.currentEarth.clearanceDeg}°)
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Direct Link (+{radar.currentEarth.clearanceDeg}°)
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
