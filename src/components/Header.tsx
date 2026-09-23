'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, ShieldCheck, Bell } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';
import { StorageService } from '../services/googleSheetsService';
import { AnimatedActionButton } from './AnimatedActionButton';

interface HeaderProps {
  config: GoogleSheetConfig;
  onOpenLogModal: () => void;
  onOpenSetupModal: () => void;
  onOpenAuthModal: () => void;
  isOwnerMode: boolean;
  onLockOwnerMode: () => void;
  isSyncing: boolean;
  onOpenPreFlightModal?: () => void;
  latestOdometer?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogModal,
  onOpenAuthModal,
  isOwnerMode,
  onLockOwnerMode,
  isSyncing,
  onOpenPreFlightModal,
  latestOdometer,
}) => {
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    try {
      const chain = StorageService.getChainLube();
      const tyre = StorageService.getTyrePressure();
      const cadence = StorageService.getCadence();

      const odo = latestOdometer || chain.lastLubeOdometer;
      const kmSinceLube = Math.max(0, odo - chain.lastLubeOdometer);
      const remainingKm = Math.max(0, 500 - kmSinceLube);

      const daysSinceTyre = Math.floor(
        (Date.now() - new Date(tyre.lastCheckedDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const isDue = daysSinceTyre >= 7 || remainingKm <= (cadence.weekendRideKm || 140);
      setHasAlert(isDue);
    } catch {
      setHasAlert(false);
    }
  }, [latestOdometer]);
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-3 select-none">
          <div className="relative flex items-center justify-center">
            <img
              src="/n250-logo.png"
              alt="Bajaj Pulsar N250"
              className="h-7 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>
          <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-800 font-mono">
              Pulsar N250
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              Telemetry & Fuel Cockpit
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Realtime Sync indicator */}
          {isSyncing ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-mono">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline font-medium">Syncing</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </div>
          )}

          {/* Owner Mode Toggle */}
          {isOwnerMode ? (
            <button
              onClick={onLockOwnerMode}
              title="Signed in as Owner. Click to sign out."
              className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 hover:bg-emerald-100/80 transition-all shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Owner Unlocked</span>
              <span className="sm:hidden">Owner</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Read-Only Mode. Click to sign in."
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-xs"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Read-Only</span>
              <span className="sm:hidden">Lock</span>
            </button>
          )}

          {/* Primary CTA (Preserving exact POS button animation) */}
          <div className="hidden sm:block">
            <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
          </div>
        </div>
      </div>
    </header>
  );
};
