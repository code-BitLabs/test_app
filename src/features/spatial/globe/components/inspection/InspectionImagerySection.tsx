import React from 'react';
import { ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { ArchivalOrbitalImage } from '@/domain/sites/imageryGallery';

export interface InspectionImagerySectionProps {
  siteImages: ArchivalOrbitalImage[];
  isOpen: boolean;
  onToggle: () => void;
}

export function InspectionImagerySection({
  siteImages,
  isOpen,
  onToggle,
}: InspectionImagerySectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-cyan-300" />
          <span>Orbital Imagery ({siteImages.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
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
  );
}
