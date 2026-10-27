import React from 'react';
import { ArrowUpDown, Sun, Radio, ShieldCheck } from 'lucide-react';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { DecoratedSiteCandidate } from './SiteComparisonToolbar';

export type SortField = 'sunlight' | 'dte' | 'traversable' | 'elevation' | 'code';

export interface SiteComparisonMatrixTableProps {
  candidateList: DecoratedSiteCandidate[];
  selectedSiteId: string;
  onSelectSite: (site: CandidateSite) => void;
  onClose: () => void;
  onSort: (field: SortField) => void;
}

export function SiteComparisonMatrixTable({
  candidateList,
  selectedSiteId,
  onSelectSite,
  onClose,
  onSort,
}: SiteComparisonMatrixTableProps) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <table className="w-full text-left text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-[10px] uppercase">
            <th className="pb-2 pl-2">Site / Entity</th>
            <th className="pb-2">Coordinates</th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('elevation')}>
              <div className="flex items-center gap-1">
                <span>Elevation</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('sunlight')}>
              <div className="flex items-center gap-1 text-amber-300">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Sunlight %</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('dte')}>
              <div className="flex items-center gap-1 text-cyan-300">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>DTE Comm %</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="pb-2 cursor-pointer hover:text-white" onClick={() => onSort('traversable')}>
              <div className="flex items-center gap-1 text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Traversable</span>
                <ArrowUpDown className="w-3 h-3" />
              </div>
            </th>
            <th className="pb-2">Artemis Status</th>
            <th className="pb-2 pr-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {candidateList.map(({ site, inv }) => {
            const isSelected = site.id === selectedSiteId;
            return (
              <tr
                key={site.id}
                className={`hover:bg-slate-800/40 transition-colors ${
                  isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                }`}
              >
                <td className="py-2.5 pl-2 font-sans">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="font-mono text-cyan-300 text-[11px]">{site.code}</span>
                    <span>{site.name}</span>
                    {isSelected && (
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-700/60">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {inv.badgeType} • {inv.stratigraphicUnit.split(' ')[0]}
                  </div>
                </td>
                <td className="py-2.5 text-slate-300">
                  <div>{site.coordinates.latitudeDeg.toFixed(3)}°S</div>
                  <div className="text-slate-400 text-[10px]">{site.coordinates.longitudeDeg.toFixed(1)}°E</div>
                </td>
                <td className="py-2.5 font-semibold text-cyan-300">
                  +{site.coordinates.elevationMeters?.toLocaleString() ?? '—'} m
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-300">{inv.annualIlluminationPct.toFixed(1)}%</span>
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${inv.annualIlluminationPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans">
                    Peak: {(inv.maxContinuousDaylightHours / 24).toFixed(0)}d continuous
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-cyan-300">{inv.directToEarthPct.toFixed(1)}%</span>
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${inv.directToEarthPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans">
                    {inv.directToEarthPct > 75 ? 'Direct High-Band' : 'Periodic Relay'}
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-300">{inv.traversableAreaPct}%</span>
                    <span className="text-[10px] text-slate-400">&lt;15°</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans">
                    Peak slope: {inv.maxSlopeDeg.toFixed(1)}°
                  </div>
                </td>
                <td className="py-2.5 font-sans">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      inv.hlsLandingRating.includes('Primary')
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                        : 'bg-indigo-950/60 text-indigo-300 border-indigo-600/40'
                    }`}
                  >
                    {inv.hlsLandingRating}
                  </span>
                </td>
                <td className="py-2.5 pr-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSite(site);
                      onClose();
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-default'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  >
                    {isSelected ? 'Viewing' : 'Inspect 3D'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
