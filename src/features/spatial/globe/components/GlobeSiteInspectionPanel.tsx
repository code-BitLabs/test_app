import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  Sun,
  Radio,
  ExternalLink,
  ShieldAlert,
  Info,
  Camera,
  Mountain,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  BookOpen,
  Download,
} from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { ResultAvailability } from '@/domain/celestial/availability';
import { TopocentricElevationDeg } from '@/domain/coordinates/frames';
import { availableValue } from '@/shared/formatting/availability';
import { getArchivalImagesForSite } from '@/domain/sites/imageryGallery';
import { getScientificSiteInvestigation } from '@/domain/sites/scientificSiteData';
import { ElevationProfilePoint } from '@/domain/sites/scientificSiteInvestigation';

export interface GlobeSiteInspectionPanelProps {
  site: CandidateSite;
  epochIsoUtc: string;
  sunElevationDeg?: number;
  sunAzimuthDeg?: number;
  earthElevationDeg?: ResultAvailability<TopocentricElevationDeg>;
  earthDistanceKm?: number;
  lightTimeSeconds?: number;
  isCompact?: boolean;
  onClose?: () => void;
  onEnterLocalInspection?: () => void;
  currentMode?: 'regional' | 'overview' | 'inspection' | 'global';
}

function ElevationProfileTransect({
  profile,
  uncertaintyMeters,
  meanSlopeDeg = 8.5,
  maxSlopeDeg = 28.0,
}: {
  profile: ElevationProfilePoint[];
  uncertaintyMeters: number;
  meanSlopeDeg?: number;
  maxSlopeDeg?: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!profile || profile.length < 2) return null;

  const width = 340;
  const height = 125;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 26;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minD = profile[0].distanceKm;
  const maxD = profile[profile.length - 1].distanceKm;
  const distSpan = Math.max(1, maxD - minD);

  const elevs = profile.map((p) => p.elevationMeters);
  const minE = Math.min(...elevs);
  const maxE = Math.max(...elevs);
  const elevSpan = Math.max(100, maxE - minE);

  const getX = (d: number) => padLeft + ((d - minD) / distSpan) * plotW;
  const getY = (e: number) => padTop + plotH - ((e - minE) / elevSpan) * plotH;

  const activePoint = hoveredIdx !== null ? profile[hoveredIdx] : null;

  // Local slope estimate for hovered point
  let activeSlope = meanSlopeDeg;
  if (hoveredIdx !== null) {
    if (hoveredIdx > 0 && hoveredIdx < profile.length - 1) {
      const pPrev = profile[hoveredIdx - 1];
      const pNext = profile[hoveredIdx + 1];
      const dDistKm = Math.abs(pNext.distanceKm - pPrev.distanceKm);
      const dElevM = Math.abs(pNext.elevationMeters - pPrev.elevationMeters);
      if (dDistKm > 0.001) {
        activeSlope = (Math.atan(dElevM / (dDistKm * 1000)) * 180) / Math.PI;
      }
    } else if (profile[hoveredIdx].elevationMeters === maxE || profile[hoveredIdx].elevationMeters === minE) {
      activeSlope = maxSlopeDeg;
    }
  }

  // Generate gridline levels
  const gridLevels: number[] = [];
  const step = elevSpan > 4000 ? 2000 : elevSpan > 1500 ? 1000 : 500;
  const startLevel = Math.ceil(minE / step) * step;
  for (let lvl = startLevel; lvl <= maxE; lvl += step) {
    gridLevels.push(lvl);
  }

  const polyPoints = [
    `${padLeft},${padTop + plotH}`,
    ...profile.map((p) => `${getX(p.distanceKm).toFixed(1)},${getY(p.elevationMeters).toFixed(1)}`),
    `${padLeft + plotW},${padTop + plotH}`,
  ].join(' ');

  const pathD = profile
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.distanceKm).toFixed(1)} ${getY(p.elevationMeters).toFixed(1)}`)
    .join(' ');

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRel = e.clientX - rect.left;
    const xSvg = (xRel / rect.width) * width;
    if (xSvg < padLeft || xSvg > padLeft + plotW) {
      setHoveredIdx(null);
      return;
    }
    const dTarget = minD + ((xSvg - padLeft) / plotW) * distSpan;

    // Find nearest point
    let closestIdx = 0;
    let closestDist = Infinity;
    profile.forEach((p, idx) => {
      const diff = Math.abs(p.distanceKm - dTarget);
      if (diff < closestDist) {
        closestDist = diff;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  return (
    <div className="bg-[var(--lm-color-surface-strong)]/85 p-3 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)] shadow-inner">
      <div className="flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b border-[var(--lm-color-border-subtle)]">
        <span className="font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>Altimetric Transect Analyzer</span>
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>LOLA Precision: ±{uncertaintyMeters.toFixed(1)} m</span>
          <span>•</span>
          <span className="text-cyan-400">20 m/px</span>
        </div>
      </div>

      {/* Floating Telemetry Pill on Scrub */}
      <div className="h-6 flex items-center justify-between text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 mb-1.5">
        {activePoint ? (
          <>
            <span className="text-slate-300">
              Dist: <strong className="text-white">{activePoint.distanceKm.toFixed(1)} km</strong>
            </span>
            <span className="text-slate-300">
              Elev:{' '}
              <strong className={activePoint.elevationMeters >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {activePoint.elevationMeters > 0 ? `+${activePoint.elevationMeters.toLocaleString()}` : activePoint.elevationMeters.toLocaleString()} m
              </strong>
            </span>
            <span className="text-slate-300">
              Slope: <strong className={activeSlope > 20 ? 'text-rose-400' : activeSlope > 10 ? 'text-amber-400' : 'text-emerald-400'}>{activeSlope.toFixed(1)}°</strong>
            </span>
            <span className={`px-1 rounded text-[9px] font-semibold ${
              activeSlope > 20 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
              activeSlope > 10 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {activePoint.label || (activeSlope > 20 ? 'Wall Scarp' : activeSlope > 10 ? 'Moderate Ridge' : 'Nominal Flank')}
            </span>
          </>
        ) : (
          <span className="text-slate-400 italic flex items-center gap-1 w-full justify-center">
            <span>Hover or drag crosshair across profile to inspect elevation & slope metrics</span>
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto text-[8px] font-mono overflow-visible cursor-crosshair select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoveredIdx(null)}
        aria-label="Interactive Altimetric Transect Profile"
      >
        <defs>
          <linearGradient id="transectGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Elevation Grid Lines */}
        {gridLevels.map((lvl) => {
          const y = getY(lvl);
          const isZero = lvl === 0;
          return (
            <g key={lvl}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + plotW}
                y2={y}
                stroke={isZero ? '#94a3b8' : '#334155'}
                strokeDasharray={isZero ? '4,3' : '2,3'}
                strokeWidth={isZero ? '1.0' : '0.6'}
                strokeOpacity={isZero ? '0.85' : '0.45'}
              />
              <text x={padLeft - 4} y={y + 3} fill={isZero ? '#e2e8f0' : '#94a3b8'} textAnchor="end" fontSize="7.5">
                {lvl > 0 ? `+${(lvl / 1000).toFixed(1)}k` : `${(lvl / 1000).toFixed(1)}k`}
              </text>
            </g>
          );
        })}

        {/* Shaded Area Under Terrain */}
        <polygon points={polyPoints} fill="url(#transectGradient)" />

        {/* Topographic Surface Line */}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.0" strokeLinejoin="round" />

        {/* Profile Points & Badges */}
        {profile.map((p, idx) => {
          const cx = getX(p.distanceKm);
          const cy = getY(p.elevationMeters);
          const isExtreme = p.elevationMeters === maxE || p.elevationMeters === minE;
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 4.5 : isExtreme ? 3.0 : 2.0}
                fill={p.elevationMeters === maxE ? '#34d399' : p.elevationMeters === minE ? '#f43f5e' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth={isHovered ? '1.5' : '0.8'}
              />
              {p.label && !isHovered && (
                <text
                  x={cx}
                  y={cy - 6}
                  fill="#cbd5e1"
                  textAnchor={idx === 0 ? 'start' : idx === profile.length - 1 ? 'end' : 'middle'}
                  fontSize="7.5"
                  fontWeight="600"
                >
                  {p.label.split(' ')[0]}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover Crosshair & Vertical Indicator */}
        {activePoint && (
          <g>
            <line
              x1={getX(activePoint.distanceKm)}
              y1={padTop}
              x2={getX(activePoint.distanceKm)}
              y2={padTop + plotH}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="3,2"
            />
            <circle
              cx={getX(activePoint.distanceKm)}
              cy={getY(activePoint.elevationMeters)}
              r="5"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* X Axis Distance Scale */}
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={padLeft + plotW}
          y2={padTop + plotH}
          stroke="#475569"
          strokeWidth="1.0"
        />
        <text x={padLeft} y={height - 8} fill="#94a3b8" textAnchor="start" fontSize="8">
          0 km
        </text>
        <text x={padLeft + plotW / 2} y={height - 8} fill="#64748b" textAnchor="middle" fontSize="7.5">
          Horizontal Transect Distance
        </text>
        <text x={padLeft + plotW} y={height - 8} fill="#94a3b8" textAnchor="end" fontSize="8">
          {maxD.toFixed(0)} km
        </text>

        {/* Color-Coded Traversability Footprint Band at bottom of plot */}
        <rect
          x={padLeft}
          y={padTop + plotH + 2}
          width={plotW * 0.45}
          height={3}
          fill="#10b981"
          opacity="0.8"
        >
          <title>Safe Traversal (&lt;10°)</title>
        </rect>
        <rect
          x={padLeft + plotW * 0.45}
          y={padTop + plotH + 2}
          width={plotW * 0.3}
          height={3}
          fill="#f59e0b"
          opacity="0.8"
        >
          <title>Moderate Slopes (10°-20°)</title>
        </rect>
        <rect
          x={padLeft + plotW * 0.75}
          y={padTop + plotH + 2}
          width={plotW * 0.25}
          height={3}
          fill="#ef4444"
          opacity="0.8"
        >
          <title>Hazard Wall (&gt;20°)</title>
        </rect>
      </svg>

      {/* Legend Footer for Traversability Zones */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
            <span>&lt;10° Safe</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" />
            <span>10°-20° Caution</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-rose-500 inline-block" />
            <span>&gt;20° Hazard Wall</span>
          </span>
        </div>
        <span className="text-cyan-400">Mean Slope: {meanSlopeDeg.toFixed(1)}°</span>
      </div>
    </div>
  );
}

export function GlobeSiteInspectionPanel({
  site,
  epochIsoUtc,
  sunElevationDeg = -1.29,
  sunAzimuthDeg = 52.9,
  earthElevationDeg,
  earthDistanceKm = 390853,
  lightTimeSeconds = 1.3,
  isCompact = false,
  onEnterLocalInspection,
  currentMode = 'overview',
}: GlobeSiteInspectionPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'topo' | 'geology' | 'illum' | 'volatiles' | 'mission'>('all');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    topography: true,
    geology: false,
    illumination: false,
    volatiles: false,
    mission: false,
    imagery: false,
  });

  const scientificData = getScientificSiteInvestigation(site.id);
  const siteImages = getArchivalImagesForSite(site.id);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const earthElevVal = earthElevationDeg !== undefined ? availableValue(earthElevationDeg) : 1.1;
  const isEarthVisible = earthElevVal !== null && earthElevVal > 0;

  // Formatting helpers
  const fmtElev = (m: number) => (m > 0 ? `+${m.toLocaleString()} m` : `${m.toLocaleString()} m`);

  const handleExportDossier = () => {
    if (!scientificData) return;
    const jsonBlob = new Blob([JSON.stringify(scientificData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunamission-${scientificData.id}-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      className={`bg-[var(--lm-color-surface)]/95 backdrop-blur-md border border-[var(--lm-color-border)] rounded-[var(--lm-radius-md)] shadow-2xl flex flex-col pointer-events-auto transition-all duration-200 ${
        isCompact ? 'w-80' : 'w-96'
      }`}
      aria-label="Scientific Candidate Site Inspection Panel"
    >
      {/* Header Banner */}
      <div className="p-3 border-b border-[var(--lm-color-border-subtle)] flex items-start justify-between gap-2 bg-gradient-to-b from-cyan-950/20 to-transparent">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-selected-site)] font-semibold">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>
              {scientificData?.code || site.code} • {scientificData?.featureType || site.officialRegionReference || 'Candidate Study Point'}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white tracking-tight mt-0.5">
            {scientificData?.name || site.name}
          </h2>
          <div className="text-[11px] font-mono text-[var(--lm-color-text-secondary)] mt-0.5">
            {site.coordinates.latitudeDeg.toFixed(3)}°S, {site.coordinates.longitudeDeg.toFixed(2)}°E • Elev:{' '}
            <span className="text-cyan-300 font-semibold">{fmtElev(site.coordinates.elevationMeters)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="btn-export-dossier"
            onClick={handleExportDossier}
            className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-white/5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
            title="Export Scientific Site Dossier (JSON)"
          >
            <Download className="w-2.5 h-2.5 text-cyan-400" />
            <span>Export</span>
          </button>
          {currentMode !== 'inspection' && onEnterLocalInspection && (
            <button
              type="button"
              data-testid="btn-inspect-3d"
              onClick={onEnterLocalInspection}
              className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-selected-site)]/25 transition-colors whitespace-nowrap"
              title="Switch to Mode C: Local Inspection"
            >
              Inspect 3D
            </button>
          )}
        </div>
      </div>

      {/* Artemis Mission Suitability Scorecard */}
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-[var(--lm-color-surface-raised)]/60 border-b border-[var(--lm-color-border-subtle)] text-[10px] font-mono">
        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Elevation</span>
          <span className="text-cyan-300 font-semibold text-xs mt-0.5">
            {fmtElev(site.coordinates.elevationMeters)}
          </span>
          <span className="text-[8px] text-slate-500">LOLA ±1.2m</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Traversable</span>
          <span className="text-emerald-400 font-semibold text-xs mt-0.5">
            {scientificData?.topography.traversableSlopePercentage ?? 74}%
          </span>
          <span className="text-[8px] text-slate-500">&lt;15° slope</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Sunlight</span>
          <span className="text-amber-400 font-semibold text-xs mt-0.5">
            {scientificData?.illuminationThermal.annualSolarExposurePercentage ?? 86}%
          </span>
          <span className="text-[8px] text-slate-500">Annual</span>
        </div>

        <div className="bg-slate-900/70 p-1.5 rounded border border-slate-800 flex flex-col">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider">DTE Comm</span>
          <span className="text-sky-400 font-semibold text-xs mt-0.5">
            {scientificData?.missionConstraints.directToEarthVisibilityPercentage ?? 58}%
          </span>
          <span className="text-[8px] text-slate-500">Direct-Earth</span>
        </div>
      </div>

      {/* Quick Navigation Filter Pills */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface-raised)]/50 overflow-x-auto text-[10px] font-mono scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('topo');
            setOpenSections((prev) => ({ ...prev, topography: true }));
          }}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'topo'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Topography
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('geology');
            setOpenSections((prev) => ({ ...prev, geology: true }));
          }}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'geology'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Geology
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('illum');
            setOpenSections((prev) => ({ ...prev, illumination: true }));
          }}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'illum'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Solar/Thermal
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('volatiles');
            setOpenSections((prev) => ({ ...prev, volatiles: true }));
          }}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'volatiles'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Volatiles
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('mission');
            setOpenSections((prev) => ({ ...prev, mission: true }));
          }}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'mission'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Constraints
        </button>
      </div>

      {/* Accordion Sections Container */}
      <div className="flex flex-col divide-y divide-[var(--lm-color-border-subtle)] max-h-[64vh] overflow-y-auto">
        {/* 1. Overview & Provenance */}
        {(activeTab === 'all' || activeTab === 'topo') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('overview')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
                <span>Overview & Scientific Provenance</span>
              </div>
              {openSections.overview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.overview && (
              <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
                <p className="text-[11px] leading-relaxed font-sans text-[var(--lm-color-text-secondary)]">
                  {site.description}
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                  <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                    <span className="text-[var(--lm-color-text-muted)] block">CATALOG REFERENCE</span>
                    <span className="text-[var(--lm-color-text-primary)] font-semibold">
                      {site.catalogVersion || '2024.1 (NASA Artemis Candidate)'}
                    </span>
                  </div>
                  <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                    <span className="text-[var(--lm-color-text-muted)] block">VERTICAL DATUM</span>
                    <span className="text-cyan-300 font-semibold">
                      {scientificData?.coordinates.coordinateFrame || 'IAU 2000 ME (R=1737.4 km)'}
                    </span>
                  </div>
                </div>
                {site.missionContextNote && (
                  <div className="text-[10px] text-[var(--lm-color-text-muted)] font-sans border-l-2 border-[var(--lm-color-selected-site)]/60 pl-2 mt-1">
                    {site.missionContextNote}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Topography & Altimetry (LOLA) */}
        {(activeTab === 'all' || activeTab === 'topo') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('topography')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Topography & Slopes (NASA LOLA)</span>
              </div>
              {openSections.topography ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.topography && (
              <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
                {scientificData ? (
                  <>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                        <span className="text-slate-400 block">SUMMIT</span>
                        <span className="text-white font-semibold">{fmtElev(scientificData.topography.summitElevationMeters)}</span>
                      </div>
                      <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                        <span className="text-slate-400 block">RELIEF SPAN</span>
                        <span className="text-cyan-300 font-semibold">{scientificData.topography.reliefSpanMeters.toLocaleString()} m</span>
                      </div>
                      <div className="bg-[var(--lm-color-surface-strong)]/60 p-1.5 rounded">
                        <span className="text-slate-400 block">MEAN SLOPE</span>
                        <span className="text-emerald-400 font-semibold">{scientificData.topography.meanSlopeDeg.toFixed(1)}°</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                        <span className="text-slate-400">Max Slope:</span>
                        <span className="text-amber-400 font-semibold">{scientificData.topography.maxSlopeDeg.toFixed(1)}°</span>
                      </div>
                      <div className="flex items-center justify-between bg-[var(--lm-color-surface-strong)]/40 p-1 rounded">
                        <span className="text-slate-400">Traversable (&lt;15°):</span>
                        <span className="text-emerald-400 font-semibold">{scientificData.topography.traversableSlopePercentage}%</span>
                      </div>
                    </div>

                    {/* Altimetric Cross-Section Profile */}
                    <ElevationProfileTransect
                      profile={scientificData.topography.elevationProfile}
                      uncertaintyMeters={scientificData.topography.elevationUncertaintyMeters}
                      meanSlopeDeg={scientificData.topography.meanSlopeDeg}
                      maxSlopeDeg={scientificData.topography.maxSlopeDeg}
                    />

                    <div className="text-[10px] text-slate-400 font-sans border-t border-[var(--lm-color-border-subtle)] pt-1.5 flex flex-col gap-1">
                      <div>
                        <span className="font-semibold text-slate-300">Data Source:</span> {scientificData.topography.demSourceAttribution}
                      </div>
                      {scientificData.dataProvenance.nasaProductUrls && (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[9px] font-mono">
                          <a
                            href={scientificData.dataProvenance.nasaProductUrls.lolaDem}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline"
                          >
                            <span>NASA PGDA 78 (20m DEM)</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span>•</span>
                          <a
                            href={scientificData.dataProvenance.nasaProductUrls.lpiAtlas}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline"
                          >
                            <span>LPI South Pole Atlas</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] font-sans text-slate-400">
                    LOLA 128ppd Elevation: {fmtElev(site.coordinates.elevationMeters)} (±1.2 m vertical precision).
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Geology & Stratigraphy */}
        {(activeTab === 'all' || activeTab === 'geology') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('geology')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Geology & Stratigraphic Unit</span>
              </div>
              {openSections.geology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.geology && (
              <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
                {scientificData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-500/50 text-purple-200 font-bold text-[10px]">
                          {scientificData.geology.stratigraphicUnitCode}
                        </span>
                        <span className="text-white font-semibold text-[11px]">
                          {scientificData.geology.geologicalEpoch}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{scientificData.geology.estimatedAgeBillionYears}</span>
                    </div>

                    <div className="text-[11px] font-sans text-slate-300 leading-snug">
                      <span className="font-semibold text-purple-300">{scientificData.geology.stratigraphicUnitName}: </span>
                      {scientificData.geology.lithologyInterpretation}
                    </div>

                    <div className="bg-[var(--lm-color-surface-strong)]/50 p-2 rounded text-[10px] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mapping Confidence:</span>
                        <span className="text-cyan-300">{scientificData.geology.mappingConfidence}</span>
                      </div>
                      <p className="text-slate-400 font-sans text-[10px]">{scientificData.geology.regionalContext}</p>
                    </div>

                    <div className="text-[9px] text-slate-400 font-sans border-t border-[var(--lm-color-border-subtle)] pt-1 flex items-start gap-1">
                      <BookOpen className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                      <span>{scientificData.geology.sourceCitation}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] font-sans text-slate-400">
                    Regional Pre-Nectarian megaregolith unit within South Pole-Aitken (SPA) interior basin.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Solar Illumination & Thermal Environment (Diviner) */}
        {(activeTab === 'all' || activeTab === 'illum') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('illumination')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-[var(--lm-color-sun)]" />
                <span>Solar Illumination & Thermal (Diviner)</span>
              </div>
              {openSections.illumination ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.illumination && (
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
        )}

        {/* 5. Volatiles & Water Resources (LEND / LCROSS) */}
        {(activeTab === 'all' || activeTab === 'volatiles') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('volatiles')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Volatiles & Water Equivalent Hydrogen</span>
              </div>
              {openSections.volatiles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.volatiles && (
              <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
                {scientificData ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                      <span className="text-slate-400">Evidence Classification</span>
                      <span className="text-cyan-300 font-semibold text-[10px] text-right">
                        {scientificData.resources.volatileEvidenceStatus}
                      </span>
                    </div>

                    {scientificData.resources.waterEquivalentHydrogenWtPct && (
                      <div className="bg-[var(--lm-color-surface-strong)]/60 p-2 rounded flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[10px] block">ESTIMATED WEH (WATER EQUIV. HYDROGEN)</span>
                          <span className="text-white text-sm font-bold">
                            {scientificData.resources.waterEquivalentHydrogenWtPct.value.toFixed(2)} wt%{' '}
                            <span className="text-slate-400 text-xs font-normal">
                              ±{scientificData.resources.waterEquivalentHydrogenWtPct.uncertainty.toFixed(2)}%
                            </span>
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
                          LEND Epithermal
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] font-sans text-slate-300 leading-snug">
                      {scientificData.resources.subsurfaceIceInterpretation}
                    </div>

                    <div className="bg-[var(--lm-color-surface-strong)]/40 p-1.5 rounded text-[10px]">
                      <span className="text-slate-400 block">Thermal Stability Depth:</span>
                      <span className="text-emerald-300">{scientificData.resources.coldTrapStabilityDepthCm}</span>
                    </div>

                    {/* Scientific Cautionary Notice */}
                    <div className="text-[10px] text-amber-300/90 font-sans bg-amber-950/30 border border-amber-600/30 p-2 rounded flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-200">Scientific Caution:</strong> {scientificData.resources.cautionaryNotice}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-400 font-sans border-t border-[var(--lm-color-border-subtle)] pt-1">
                      {scientificData.resources.citationText}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] font-sans text-slate-400">
                    Epithermal neutron suppression maps indicate localized hydrogen enrichment in adjacent PSRs.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Mission Suitability & Operational Constraints */}
        {(activeTab === 'all' || activeTab === 'mission') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('mission')}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mission Suitability & Operational Constraints</span>
              </div>
              {openSections.mission ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {openSections.mission && (
              <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
                {scientificData ? (
                  <>
                    <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[var(--lm-color-border-subtle)]">
                      <span className="text-slate-400">Landing Suitability</span>
                      <span className="text-emerald-400 font-bold text-[10px]">
                        {scientificData.missionConstraints.overallSuitabilityRating}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="bg-[var(--lm-color-surface-strong)]/40 p-1.5 rounded">
                        <span className="text-slate-400 block">SLOPE STATUS</span>
                        <span className="text-white font-semibold">{scientificData.missionConstraints.slopeConstraintStatus}</span>
                      </div>
                      <div className="bg-[var(--lm-color-surface-strong)]/40 p-1.5 rounded">
                        <span className="text-slate-400 block">TRAFFICABILITY</span>
                        <span className="text-cyan-300 font-semibold">{scientificData.missionConstraints.surfaceTrafficability}</span>
                      </div>
                    </div>

                    {/* Direct to Earth Sightline */}
                    <div className="bg-[var(--lm-color-surface-strong)]/40 p-2 rounded flex flex-col gap-1 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-cyan-400" /> DTE Visibility Window:
                        </span>
                        <span className="text-white font-bold">
                          {scientificData.missionConstraints.directToEarthVisibilityPercentage.toFixed(1)}% (Libration Cycle)
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--lm-color-border-subtle)] pt-1 text-[10px]">
                        <span className="text-slate-400">Geometric Sightline:</span>
                        <span className={`font-semibold ${isEarthVisible ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {isEarthVisible ? 'Clear Line-of-Sight' : 'Below Horizon'} ({earthElevVal !== null ? `${earthElevVal >= 0 ? '+' : ''}${earthElevVal.toFixed(2)}°` : '—'})
                        </span>
                      </div>
                    </div>

                    {/* Identified Operational Hazards */}
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-rose-400" /> Identified Operational Hazards:
                      </span>
                      <ul className="list-disc list-inside text-[10px] font-sans text-slate-400 space-y-0.5">
                        {scientificData.missionConstraints.identifiedHazards.map((hazard, hIdx) => (
                          <li key={hIdx}>{hazard}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] font-sans text-slate-400">
                    Sightline Status: {isEarthVisible ? 'Clear Line of Sight' : 'Below Horizon'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 7. Archival Orbital Imagery Gallery */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('imagery')}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-cyan-300" />
              <span>Orbital Imagery ({siteImages.length})</span>
            </div>
            {openSections.imagery ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {openSections.imagery && (
            <div className="px-3 pb-3 text-xs flex flex-col gap-2 font-mono text-[var(--lm-color-text-muted)] bg-[var(--lm-color-surface-raised)]/30">
              {siteImages.length === 0 ? (
                <p className="text-[11px] font-sans text-slate-400 py-1">
                  No individual high-resolution orbital frames cataloged for this coordinate in current build.
                </p>
              ) : (
                siteImages.map((img) => (
                  <div
                    key={img.id}
                    className="border border-[var(--lm-color-border-subtle)] rounded p-2 bg-[var(--lm-color-surface-strong)]/40 flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-white text-[11px] font-sans">{img.title}</span>
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                        {img.instrument}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">PRODUCT ID</span>
                        <span className="text-slate-300">{img.productId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ACQUIRED (UTC)</span>
                        <span className="text-slate-300">{img.observationEpochIsoUtc.slice(0, 10)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">RESOLUTION</span>
                        <span className="text-slate-300">{img.groundResolutionMetersPerPixel.toFixed(2)} m/px</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SOLAR PHASE</span>
                        <span className="text-slate-300">{img.solarPhaseAngleDeg.toFixed(1)}°</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-sans text-slate-400 leading-snug">{img.caption}</p>
                    <div className="text-[9px] font-sans text-amber-300/80 border-t border-slate-800 pt-1">
                      {img.isArchiveNotice}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
