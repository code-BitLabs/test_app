import { useEffect, useState } from 'react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import {
  SelenographicLatitudeDeg,
  SelenographicLongitudeDeg,
} from '@/domain/coordinates/frames';
import { calculateCustomPointCelestial } from '@/domain/coordinates/projection';
import { sampleLolaTerrain } from '@/domain/terrain/lolaSouthPoleDemSampler';
import { calculateAstronautHudTelemetry } from '../model/astronautHudModel';
import { ShieldAlert, Sun, Globe as EarthIcon, BatteryCharging, Heart, Compass, X } from 'lucide-react';

export interface AstronautHelmetHudProps {
  site: CandidateSite;
  subSolarLatDeg: SelenographicLatitudeDeg;
  subSolarLonDeg: SelenographicLongitudeDeg;
  subEarthLatDeg: SelenographicLatitudeDeg;
  subEarthLonDeg: SelenographicLongitudeDeg;
  earthElevationDeg?: number | null;
  onExit: () => void;
}

export function AstronautHelmetHud({
  site,
  subSolarLatDeg,
  subSolarLonDeg,
  subEarthLatDeg,
  subEarthLonDeg,
  earthElevationDeg,
  onExit,
}: AstronautHelmetHudProps) {
  const [elapsedSec, setElapsedSec] = useState(3600);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const celestial = calculateCustomPointCelestial(
    site.coordinates,
    subSolarLatDeg,
    subSolarLonDeg,
    subEarthLatDeg,
    subEarthLonDeg
  );
  const slope = sampleLolaTerrain(site.coordinates.latitudeDeg, site.coordinates.longitudeDeg).slopeDeg;
  const sunElev = celestial.sunElevationDeg;
  const earthElev = earthElevationDeg ?? celestial.earthElevationDeg;

  const hud = calculateAstronautHudTelemetry({
    siteName: site.name,
    latDeg: site.coordinates.latitudeDeg,
    lonDeg: site.coordinates.longitudeDeg,
    elevationMeters: site.coordinates.elevationMeters ?? 0,
    slopeDeg: slope,
    sunElevationDeg: sunElev,
    earthElevationDeg: earthElev,
    missionElapsedSeconds: elapsedSec,
  });

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none select-none font-mono flex flex-col justify-between p-4 sm:p-6"
      role="region"
      aria-label="Astronaut Extravehicular Visor Head-Up Display"
    >
      {/* 1. Curved Helmet Visor Vignette Effect */}
      <div
        className="absolute inset-0 pointer-events-none border-[12px] sm:border-[20px] border-black/80 rounded-[40px] sm:rounded-[60px] shadow-[inset_0_0_80px_rgba(0,255,255,0.12)]"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(6, 182, 212, 0.15)',
        }}
      />

      {/* 2. Top Header HUD: Compass Heading & Exit Button */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs shadow-lg">
          <Compass className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span className="font-bold tracking-wider">xEMU HUD</span>
          <span className="text-slate-400">|</span>
          <span>{hud.siteName}</span>
        </div>

        {/* Center Heading Ribbon */}
        <div className="hidden md:flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-lg border border-cyan-500/30 text-xs text-cyan-300">
          <span className="text-slate-500">150°</span>
          <span className="text-slate-400">165°</span>
          <span className="font-bold text-cyan-400 border-b-2 border-cyan-400 px-1">180° S</span>
          <span className="text-slate-400">195°</span>
          <span className="text-slate-500">210°</span>
        </div>

        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-rose-950 border border-rose-500/50 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-lg"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit EVA Mode</span>
        </button>
      </div>

      {/* 3. Center Pitch Ladder & Artificial Horizon Crosshairs */}
      <div className="relative z-10 flex items-center justify-center my-auto pointer-events-none">
        <div className="relative w-48 h-32 flex flex-col items-center justify-center text-[10px] text-cyan-400/80">
          {/* Pitch +10 */}
          <div className="w-24 border-t border-cyan-500/40 flex justify-between px-1 mb-3">
            <span>+10</span>
            <span>+10</span>
          </div>
          {/* Pitch 0 Horizon Bar */}
          <div className="w-36 border-t-2 border-cyan-400 flex items-center justify-center relative">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          {/* Pitch -10 */}
          <div className="w-24 border-t border-dashed border-cyan-500/40 flex justify-between px-1 mt-3">
            <span>-10</span>
            <span>-10</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Left Life Support & Bottom Right Celestial Telemetry */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        {/* Life Support Telemetry */}
        <div className="bg-black/70 backdrop-blur-md p-3 rounded-lg border border-cyan-500/40 text-xs text-slate-200 flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 text-[11px] text-cyan-400 font-bold">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> PLSS Life Support</span>
            <span>{hud.evaElapsedFormatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">O2 Pressure:</span>
            <span className="font-bold text-emerald-400">{hud.suitPressurePsia} psia (100%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">O2 Reserve:</span>
            <span className="font-bold text-cyan-300">{hud.oxygenMarginPct}% rem.</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1"><BatteryCharging className="w-3 h-3 text-amber-400" /> Battery:</span>
            <span className="font-bold text-amber-400">{hud.suitBatteryPct}%</span>
          </div>
        </div>

        {/* Center Geodetics & Trafficability Warning */}
        <div className="bg-black/70 backdrop-blur-md p-3 rounded-lg border border-cyan-500/40 text-xs text-center flex flex-col gap-1 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Surface Geodesic Horizon</span>
          <div className="font-bold text-cyan-300">
            {hud.latFormatted}, {hud.lonFormatted} ({hud.elevationFormatted})
          </div>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-slate-400">Slope: {slope.toFixed(1)}°</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${hud.terrainHazardState === 'safe' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : hud.terrainHazardState === 'caution' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'}`}>
              {hud.terrainHazardState === 'scarp_danger' ? 'Scarp Hazard (>15°)' : hud.terrainHazardState.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Celestial & DTE Link Telemetry */}
        <div className="bg-black/70 backdrop-blur-md p-3 rounded-lg border border-cyan-500/40 text-xs text-slate-200 flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 text-[11px] text-cyan-400 font-bold">
            <span>Celestial Vectors</span>
            <span className="text-[10px] text-emerald-400">DSN Locked</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Sun Angle:</span>
            <span className={`font-bold ${hud.solarHazardState === 'grazing_glare' ? 'text-amber-300' : 'text-slate-200'}`}>
              {sunElev >= 0 ? '+' : ''}{sunElev.toFixed(1)}° {hud.solarHazardState === 'grazing_glare' && <span className="text-[10px] text-amber-400 font-normal">(Glare Alert)</span>}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1"><EarthIcon className="w-3 h-3 text-cyan-400" /> Earth Angle:</span>
            <span className={`font-bold ${hud.dteCommsState === 'occluded' ? 'text-rose-400' : 'text-cyan-300'}`}>
              {earthElev >= 0 ? '+' : ''}{earthElev.toFixed(1)}° ({hud.dteCommsState === 'dsn_nominal' ? 'Direct DTE' : hud.dteCommsState})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
