'use client';

import React from 'react';
import { Plus, Lock, Unlock, RefreshCw } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';
import { AnimatedActionButton } from './AnimatedActionButton';

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
          <img src="/app-icon.png" alt="N250 Icon" className="w-7 h-7 object-contain" />
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
          <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
        </div>
      </div>
    </header>
  );
};
