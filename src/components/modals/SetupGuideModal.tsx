'use client';

import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, ShieldCheck, RefreshCw, CloudUpload, Download, FileJson } from 'lucide-react';
import { GoogleSheetConfig, FuelLog, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '@/types/fuel';
import { StorageService } from '@/services/googleSheetsService';
import { SheetSyncResult } from '@/services/sheetsSyncService';
import {
  downloadFuelCsv,
  downloadTripsCsv,
  downloadServicesCsv,
  downloadAccessoriesCsv,
  downloadFullBackup,
} from '@/utils/exportUtils';

export interface ExportEntities {
  logs: FuelLog[];
  trips: Trip[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  chainLube: ChainLubeRecord | null;
}

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (config: GoogleSheetConfig) => void;
  onSyncNow?: () => void;
  syncStatus?: SheetSyncResult | null;
  exportEntities?: ExportEntities;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncNow,
  syncStatus,
  exportEntities,
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = StorageService.getGoogleAppsScriptCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      webAppUrl: url.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">0-Rupee Google Sheet Integration</h3>
              <p className="text-xs text-slate-400">Full two-way backup: Fuel, Trips, Services, Accessories & Chain Care tabs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Sync status & manual trigger */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Sync Status</span>
                <span className="text-[11px] text-slate-400 font-mono block truncate">
                  {config.lastSyncedAt
                    ? `Last rewritten: ${new Date(config.lastSyncedAt).toLocaleString('en-IN')}`
                    : 'Never synced yet'}
                </span>
              </div>
              <button
                type="button"
                onClick={onSyncNow}
                disabled={!config.webAppUrl || !onSyncNow}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shrink-0"
              >
                <CloudUpload className="h-3.5 w-3.5" />
                Sync now
              </button>
            </div>
            {syncStatus && (
              <p className={`text-[11px] font-mono ${syncStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {syncStatus.ok ? '✓' : '✗'} {syncStatus.message}
                {syncStatus.counts
                  ? ` · ${syncStatus.counts.fuelLogs} fuels, ${syncStatus.counts.trips} trips, ${syncStatus.counts.services} services, ${syncStatus.counts.accessories} accessories`
                  : ''}
              </p>
            )}
            {config.autoSync && config.webAppUrl && (
              <p className="text-[10px] text-slate-500">Auto-rewrite is ON — every add/edit/delete rewrites all tabs ~3s after the change.</p>
            )}
          </div>

          {/* Local exports (works offline, no server needed) */}
          {exportEntities && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
              <span className="text-xs font-bold text-white block">Local Export</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => downloadFuelCsv(exportEntities.logs)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" /> Fuel CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadTripsCsv(exportEntities.trips)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" /> Trips CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadServicesCsv(exportEntities.services)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" /> Services CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadAccessoriesCsv(exportEntities.accessories)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" /> Accessories CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadFullBackup(exportEntities)}
                  className="col-span-2 sm:col-span-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-cyan-800 text-cyan-300 hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <FileJson className="h-3.5 w-3.5" /> Full JSON Backup (all 5 entities)
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Open Google Sheet & Apps Script */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                1
              </span>
              <span>Open Google Sheet & Apps Script</span>
            </div>
            <p className="text-xs text-slate-300 pl-8">
              Open your Google Sheet (
              <a
                href="https://docs.google.com/spreadsheets/d/1jgRFISJ-K5YQ3ApcxKd0GFojMvRJdrncicYSNJAjrOs/edit"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline inline-flex items-center space-x-1"
              >
                <span>N 250 fuel Tracker</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              ). In the top menu, click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
            </p>
          </div>

          {/* Step 2: Paste Script Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                  2
                </span>
                <span>Copy & Paste Free Apps Script Code</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 text-xs font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied Code!' : 'Copy Script Code'}</span>
              </button>
            </div>

            <div className="pl-8">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-cyan-300 max-h-40 overflow-y-auto no-scrollbar">
                {scriptCode}
              </pre>
              <p className="text-[11px] text-amber-400/90 mt-2 flex items-start gap-1.5">
                <RefreshCw className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  v2 script rewrites <strong>5 tabs</strong> (Fuel Logs, Trips, Service Logs, Accessories, Chain Care).
                  If you deployed an older version, re-copy this code, replace it in Apps Script, then <strong>Deploy &gt; Manage deployments &gt; Edit &gt; Version: New version</strong>.
                </span>
              </p>
            </div>
          </div>

          {/* Step 3: Deploy as Web App */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                3
              </span>
              <span>Deploy as Web App & Get Web App URL</span>
            </div>
            <div className="text-xs text-slate-300 pl-8 space-y-1">
              <p>1. In Apps Script, click <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</p>
              <p>2. Choose type: <strong>Web app</strong>.</p>
              <p>3. Set <em>Execute as</em>: <strong>Me</strong>.</p>
              <p>4. Set <em>Who has access</em>: <strong>Anyone</strong>.</p>
              <p>5. Click <strong>Deploy</strong> and copy your Web App URL!</p>
            </div>
          </div>

          {/* Step 4: Save Web App URL */}
          <form onSubmit={handleSave} className="pl-8 space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Paste your Web App URL below:
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-cyan-500 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => onSaveConfig({ ...config, autoSync: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-slate-600 bg-slate-900"
              />
              <span>Auto-rewrite sheet on every change</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 border border-emerald-300/30"
            >
              Save & Activate Google Sheet Sync
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
