'use client';

import React from 'react';
import { Database, ExternalLink, ShieldCheck } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';

interface FooterProps {
  config: GoogleSheetConfig;
  isOwnerMode: boolean;
  onOpenSetupModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isOwnerMode }) => {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">N</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">N250 Fuel Tracker</p>
            <p className="text-[11px] text-slate-400 font-mono">249cc · 14L tank · MY2025 · Bajaj Pulsar</p>
          </div>
        </div>

        {/* Right: Status + Sheet link */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className={`flex items-center gap-1 font-medium ${isOwnerMode ? 'text-emerald-600' : 'text-slate-400'}`}>
            <ShieldCheck className="h-3 w-3" />
            {isOwnerMode ? 'Owner Mode' : 'Read-Only'}
          </span>

          <a
            href="https://docs.google.com/spreadsheets/d/1jgRFISJ-K5YQ3ApcxKd0GFojMvRJdrncicYSNJAjrOs/edit"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Database className="h-3 w-3" />
            <span>Master Sheet</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>

          <span className="text-slate-300">© 2026 Satwik</span>
        </div>
      </div>
    </footer>
  );
};
