import React, { useMemo } from 'react';
import type { TopocentricHorizonRadar } from '@/domain/celestial/horizonProfile';

interface HorizonRadarSvgPlotProps {
  radar: TopocentricHorizonRadar;
}

export function HorizonRadarSvgPlot({ radar }: HorizonRadarSvgPlotProps) {
  const viewBoxWidth = 840;
  const viewBoxHeight = 320;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = viewBoxWidth - 2 * paddingX;
  const plotHeight = viewBoxHeight - 2 * paddingY;

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

  const terrainPath = useMemo(() => {
    if (!radar.terrainProfile.length) return '';
    const points = radar.terrainProfile.map(
      (p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.horizonElevationDeg).toFixed(1)}`,
    );
    const bottomY = toSvgY(minElevDeg);
    return `M ${paddingX},${bottomY} L ${points.join(' L ')} L ${toSvgX(360)},${bottomY} Z`;
  }, [radar.terrainProfile]);

  const sunWavePath = useMemo(() => {
    if (!radar.sunPath.length) return '';
    return 'M ' + radar.sunPath.map((p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.elevationDeg).toFixed(1)}`).join(' L ');
  }, [radar.sunPath]);

  const earthLoopPath = useMemo(() => {
    if (!radar.earthLibrationLoop.length) return '';
    return 'M ' + radar.earthLibrationLoop.map((p) => `${toSvgX(p.azimuthDeg).toFixed(1)},${toSvgY(p.elevationDeg).toFixed(1)}`).join(' L ');
  }, [radar.earthLibrationLoop]);

  const sunX = toSvgX(radar.currentSun.azimuthDeg);
  const sunY = toSvgY(radar.currentSun.elevationDeg);
  const earthX = toSvgX(radar.currentEarth.azimuthDeg);
  const earthY = toSvgY(radar.currentEarth.elevationDeg);

  return (
    <div className="w-full relative aspect-[21/9] sm:aspect-[24/9] min-h-[300px] bg-[#030712] rounded-[var(--lm-radius-md)] border border-slate-800 overflow-hidden flex items-center justify-center">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        role="img"
        aria-label="360 Degree Azimuth-Elevation Topocentric Horizon Sky Dome"
      >
        {/* Elevation Grid Lines */}
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
              <text x={paddingX - 8} y={y + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
                {elev > 0 ? `+${elev}°` : `${elev}°`}
              </text>
            </g>
          );
        })}

        {/* Azimuth Vertical Grid Lines */}
        {[
          { deg: 0, label: '0° (N)' },
          { deg: 90, label: '90° (E)' },
          { deg: 180, label: '180° (S)' },
          { deg: 270, label: '270° (W)' },
          { deg: 360, label: '360°' },
        ].map((col) => {
          const x = toSvgX(col.deg);
          return (
            <g key={col.deg}>
              <line x1={x} y1={paddingY} x2={x} y2={paddingY + plotHeight} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
              <text x={x} y={paddingY + plotHeight + 16} textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
                {col.label}
              </text>
            </g>
          );
        })}

        {/* Terrain Silhouette */}
        <path d={terrainPath} fill="rgba(30, 41, 59, 0.85)" stroke="#64748b" strokeWidth="2" />

        {/* Sun Trajectory Wave */}
        <path d={sunWavePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" className="opacity-80" />

        {/* Earth Libration Loop */}
        <path d={earthLoopPath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 3" className="opacity-80" />

        {/* Sun Marker */}
        <g className="transition-all duration-300">
          <circle cx={sunX} cy={sunY} r="10" fill="rgba(245, 158, 11, 0.25)" className="animate-pulse" />
          <circle cx={sunX} cy={sunY} r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          <text x={sunX} y={sunY - 12} textAnchor="middle" className="text-[11px] font-mono font-bold fill-amber-300 drop-shadow">
            Sun ({radar.currentSun.elevationDeg > 0 ? `+${radar.currentSun.elevationDeg}°` : `${radar.currentSun.elevationDeg}°`})
          </text>
        </g>

        {/* Earth Marker */}
        <g className="transition-all duration-300">
          <circle cx={earthX} cy={earthY} r="10" fill="rgba(6, 182, 212, 0.25)" className="animate-pulse" />
          <circle cx={earthX} cy={earthY} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
          <text x={earthX} y={earthY - 12} textAnchor="middle" className="text-[11px] font-mono font-bold fill-cyan-300 drop-shadow">
            Earth ({radar.currentEarth.elevationDeg > 0 ? `+${radar.currentEarth.elevationDeg}°` : `${radar.currentEarth.elevationDeg}°`})
          </text>
        </g>
      </svg>
    </div>
  );
}
