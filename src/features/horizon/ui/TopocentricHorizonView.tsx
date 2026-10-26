import React, { useMemo } from 'react';
import { Compass } from 'lucide-react';
import { useScenario, useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import { CANDIDATE_SITES, getSiteById } from '@/domain/sites/catalog';
import { generateTopocentricHorizonRadar } from '@/domain/celestial/horizonProfile';
import { HorizonRadarSvgPlot } from '../components/HorizonRadarSvgPlot';
import { HorizonClearanceTelemetry } from '../components/HorizonClearanceTelemetry';
import { DsnLinkBudgetCard } from '../components/DsnLinkBudgetCard';

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

  // Approximate lunar-Earth distance (nominal 384,400 km adjusted for topocentric libration)
  const earthDistanceKm = 384400;

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

        {/* 360-Degree Radar Svg Plot */}
        <HorizonRadarSvgPlot radar={radar} />

        {/* Real-time Clearance Telemetry (Sun & Earth) */}
        <HorizonClearanceTelemetry
          currentSun={radar.currentSun}
          currentEarth={radar.currentEarth}
        />
      </div>

      {/* DSN Link Budget & Ground Station Handover Tracker Card */}
      <DsnLinkBudgetCard
        epochMs={epochMs}
        earthDistanceKm={earthDistanceKm}
        earthElevationDeg={radar.currentEarth.elevationDeg}
        isObstructed={radar.currentEarth.isObstructed}
      />
    </div>
  );
}
