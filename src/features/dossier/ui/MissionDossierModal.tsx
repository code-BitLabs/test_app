/**
 * Mission Dossier Modal
 *
 * Publication-ready aerospace briefing viewer, copy-to-clipboard, file exporter,
 * and print/PDF generation dialog.
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Printer, X, Check, Server, ShieldCheck } from 'lucide-react';
import { requestMissionDossier, type DossierApiResponse } from '../services/dossierApiClient';

export interface MissionDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  catalogId?: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationKm?: number;
  epochMs: number;
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const MissionDossierModal: React.FC<MissionDossierModalProps> = ({
  isOpen,
  onClose,
  targetName,
  catalogId,
  latitudeDeg,
  longitudeDeg,
  elevationKm,
  epochMs,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'json'>('markdown');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<DossierApiResponse | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setLoading(true);
    requestMissionDossier({ targetName, catalogId, latitudeDeg, longitudeDeg, elevationKm, epochMs }).then((res) => {
      if (!isCancelled) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [isOpen, targetName, catalogId, latitudeDeg, longitudeDeg, elevationKm, epochMs]);

  if (!isOpen) return null;

  const currentContent = activeTab === 'markdown' ? data?.markdown ?? '' : data?.jsonTelemetry ?? '';
  const isServer = data?.provenance.source === 'nextrush_server';

  const handleCopy = async () => {
    if (!currentContent || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const cleanName = targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (activeTab === 'markdown') {
      downloadFile(`lunamission-${cleanName}-briefing.md`, data.markdown, 'text/markdown;charset=utf-8');
    } else {
      downloadFile(`lunamission-${cleanName}-telemetry.json`, data.jsonTelemetry, 'application/json;charset=utf-8');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md print:bg-transparent print:p-0">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide text-white">Executive Mission Dossier</h2>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    isServer ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isServer ? <Server className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  {isServer ? 'NextRush Backend' : 'Offline Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {targetName} ({latitudeDeg.toFixed(2)}°, {longitudeDeg.toFixed(2)}°)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 rounded text-xs font-semibold ${activeTab === 'markdown' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              Markdown Briefing
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded text-xs font-semibold ${activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              JSON Telemetry
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Epoch: {new Date(epochMs).toUTCString()}</span>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-300 select-text print:bg-white print:text-black print:p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p>Synthesizing multi-domain mission dossier...</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-5 break-words print:text-black print:text-[10pt]">
              {currentContent}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !currentContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !currentContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download (.{activeTab === 'markdown' ? 'md' : 'json'})
            </button>
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
