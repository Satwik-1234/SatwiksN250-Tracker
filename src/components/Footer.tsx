'use client';

import React from 'react';
import { Database, ExternalLink, ShieldCheck, Settings2, Heart } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';

interface FooterProps {
  config: GoogleSheetConfig;
  isOwnerMode: boolean;
  onOpenSetupModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isOwnerMode, onOpenSetupModal }) => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-gradient-to-r from-white to-gray-50">
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-black">N</span>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-slate-900">N250 Fuel Tracker</p>
            <p className="text-[11px] text-slate-400 font-mono">249cc · 14L tank · MY2025 · Bajaj Pulsar</p>
          </div>
        </div>

        {/* Center links */}
        <div className="flex items-center gap-6 text-sm">
          <button
            onClick={onOpenSetupModal}
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            <span>Setup</span>
          </button>
          <a
            href="https://github.com/satwik/N250-Tracker"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a
            href="https://docs.google.com/spreadsheets/d/1jgRFISJ-K5YQ3ApcxKd0GFojMvRJdrncicYSNJAjrOs/edit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Master Sheet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Status badge */}
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${isOwnerMode ? 'text-emerald-600' : 'text-slate-400'}`}>
          <ShieldCheck className="h-4 w-4" />
          {isOwnerMode ? 'Owner Mode' : 'Read‑Only'}
        </span>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Heart className="w-3 h-3 text-red-400 animate-pulse" />
          <span>Made with love by Satwik • © 2026</span>
        </div>
      </div>
    </footer>
  );
};
