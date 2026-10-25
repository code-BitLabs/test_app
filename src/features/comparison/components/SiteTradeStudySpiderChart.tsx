import React from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { getScientificSiteInvestigation } from '@/domain/sites/scientificSiteData';

export interface SiteTradeStudySpiderChartProps {
  sites: CandidateSite[];
  className?: string;
}

interface AxisMetric {
  key: string;
  label: string;
  getValue: (site: CandidateSite) => number; // 0 to 100
}

const AXIS_METRICS: AxisMetric[] = [
  {
    key: 'solar',
    label: 'Solar Power',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(10, inv?.illuminationThermal.annualSolarExposurePercentage ?? 75));
    },
  },
  {
    key: 'battery',
    label: 'Battery Endurance',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const maxDarkHours = inv?.illuminationThermal.maxContinuousDarknessHours ?? 72;
      // 0 dark hours = 100%, 354h (equatorial night) = 15%
      return Math.min(100, Math.max(15, Math.round(100 - (maxDarkHours / 354) * 85)));
    },
  },
  {
    key: 'dte',
    label: 'DTE Comm',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(0, inv?.missionConstraints.directToEarthVisibilityPercentage ?? 60));
    },
  },
  {
    key: 'traverse',
    label: 'Traversability',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      return Math.min(100, Math.max(20, inv?.topography.traversableSlopePercentage ?? 70));
    },
  },
  {
    key: 'ice',
    label: 'Volatile Proximity',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const psrPresent = inv?.illuminationThermal.psrPresent ?? false;
      const weh = inv?.resources.waterEquivalentHydrogenWtPct?.value ?? 0.1;
      return psrPresent ? Math.min(100, Math.round(weh * 140)) : 15;
    },
  },
  {
    key: 'safety',
    label: 'Landing Safety',
    getValue: (site) => {
      const inv = getScientificSiteInvestigation(site.id);
      const maxSlope = inv?.topography.maxSlopeDeg ?? 25;
      // Steeper max slope reduces landing safety
      return Math.min(100, Math.max(10, Math.round(100 - (maxSlope / 40) * 70)));
    },
  },
];

const SITE_COLORS = [
  { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.25)', label: 'text-cyan-400' },
  { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.25)', label: 'text-amber-400' },
  { stroke: '#10b981', fill: 'rgba(16,185,129,0.25)', label: 'text-emerald-400' },
];

export function SiteTradeStudySpiderChart({ sites, className = '' }: SiteTradeStudySpiderChartProps) {
  const displaySites = sites.slice(0, 3);
  const size = 320;
  const center = size / 2;
  const radius = 100;
  const numAxes = AXIS_METRICS.length;

  // Compute (x, y) coordinates for a given axis and value (0-100)
  function getCoordinates(axisIndex: number, valuePct: number): [number, number] {
    const angle = (axisIndex * 2 * Math.PI) / numAxes - Math.PI / 2;
    const r = (valuePct / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  }

  // Generate web rings (25%, 50%, 75%, 100%)
  const rings = [25, 50, 75, 100].map((ringPct) => {
    const points = AXIS_METRICS.map((_, i) => getCoordinates(i, ringPct).join(',')).join(' ');
    return points;
  });

  return (
    <div className={`flex flex-col items-center gap-3 p-3 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-md)] ${className}`}>
      <div className="flex items-center justify-between w-full pb-1 border-b border-[var(--lm-color-border-subtle)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lm-color-text-primary)] font-mono">
          Multi-Attribute Trade Study (Spider Chart)
        </span>
        <span className="text-[11px] text-[var(--lm-color-text-muted)] font-mono">
          6 Mission Axes
        </span>
      </div>

      <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Candidate Landing Sites Radar Comparison Chart"
        >
          {/* Background Concentric Rings */}
          {rings.map((points, idx) => (
            <polygon
              key={idx}
              points={points}
              fill={idx === 3 ? 'var(--lm-color-canvas)' : 'none'}
              stroke="var(--lm-color-border-subtle)"
              strokeWidth={idx === 3 ? '1.5' : '1'}
              strokeDasharray={idx < 3 ? '2 2' : undefined}
            />
          ))}

          {/* Radial Axis Spokes */}
          {AXIS_METRICS.map((axis, i) => {
            const [x, y] = getCoordinates(i, 100);
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="var(--lm-color-border-subtle)"
                strokeWidth="1"
              />
            );
          })}

          {/* Plotted Site Polygons */}
          {displaySites.map((site, siteIdx) => {
            const points = AXIS_METRICS.map((m, i) =>
              getCoordinates(i, m.getValue(site)).join(','),
            ).join(' ');
            const color = SITE_COLORS[siteIdx % SITE_COLORS.length];

            return (
              <g key={site.id}>
                <polygon
                  points={points}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                {AXIS_METRICS.map((m, i) => {
                  const [px, py] = getCoordinates(i, m.getValue(site));
                  return (
                    <circle
                      key={m.key}
                      cx={px}
                      cy={py}
                      r="3.5"
                      fill={color.stroke}
                      stroke="var(--lm-color-surface)"
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Axis Labels */}
          {AXIS_METRICS.map((axis, i) => {
            const [lx, ly] = getCoordinates(i, 118);
            const anchor = lx > center + 10 ? 'start' : lx < center - 10 ? 'end' : 'middle';
            return (
              <text
                key={axis.key}
                x={lx}
                y={ly + 4}
                textAnchor={anchor}
                className="text-[10px] font-mono fill-[var(--lm-color-text-muted)] font-medium"
              >
                {axis.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Comparison Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-1 w-full border-t border-[var(--lm-color-border-subtle)]">
        {displaySites.map((site, siteIdx) => {
          const color = SITE_COLORS[siteIdx % SITE_COLORS.length];
          return (
            <div key={site.id} className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color.stroke }}
              />
              <span className={`font-semibold ${color.label}`}>
                {site.code}
              </span>
              <span className="text-[var(--lm-color-text-secondary)] truncate max-w-[120px]">
                {site.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
