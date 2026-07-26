'use client';

import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';
import { StorageService } from '../services/googleSheetsService';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (config: GoogleSheetConfig) => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
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
              <p className="text-xs text-slate-400">Sync refuel logs directly to your Google Sheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
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
