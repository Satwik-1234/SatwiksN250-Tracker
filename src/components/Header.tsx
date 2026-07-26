'use client';

import React from 'react';
import { Plus, Lock, Unlock, RefreshCw } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';

interface HeaderProps {
  config: GoogleSheetConfig;
  onOpenLogModal: () => void;
  onOpenSetupModal: () => void;
  onOpenAuthModal: () => void;
  isOwnerMode: boolean;
  onLockOwnerMode: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogModal,
  onOpenAuthModal,
  isOwnerMode,
  onLockOwnerMode,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Wordmark */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">N</span>
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">
            250<span className="text-blue-600">.</span>
          </span>
          <span className="hidden sm:block text-[11px] font-medium text-slate-400 border-l border-slate-200 pl-2 ml-1">
            Fuel Tracker
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Sync spinner */}
          {isSyncing && (
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
          )}

          {/* Owner Mode Toggle */}
          {isOwnerMode ? (
            <button
              onClick={onLockOwnerMode}
              title="Click to sign out"
              className="flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Owner</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sign in to log refills"
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-200 transition-colors"
            >
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Read-Only</span>
            </button>
          )}

          {/* Primary CTA */}
          <button
            onClick={onOpenLogModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Log Refill</span>
          </button>
        </div>
      </div>
    </header>
  );
};
