'use client';

import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, ShieldCheck, Bell, Settings } from 'lucide-react';
import { GoogleSheetConfig } from '../types/fuel';
import { StorageService } from '../services/googleSheetsService';
import { AnimatedActionButton } from './AnimatedActionButton';
import { parseDateKey } from '../utils/date';

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
  onOpenSetupModal,
  onOpenAuthModal,
  isOwnerMode,
  onLockOwnerMode,
  isSyncing,
  onOpenPreFlightModal,
  latestOdometer,
}) => {
  // `hasAlert` used to be computed on every odometer change and then never
  // rendered, and `onOpenPreFlightModal` was destructured but never called - so
  // the 384-line Pre-Flight modal (tyre guardian, chain forecast, cadence
  // editor) could not be opened by any user, and the maintenance-due warning
  // the header went to the trouble of deriving was invisible.
  const [alertReason, setAlertReason] = useState<string | null>(null);

  useEffect(() => {
    try {
      const chain = StorageService.getChainLube();
      const tyre = StorageService.getTyrePressure();
      const cadence = StorageService.getCadence();

      const odo = latestOdometer || chain.lastLubeOdometer || 0;
      const kmSinceLube = Math.max(0, odo - chain.lastLubeOdometer);
      const remainingKm = Math.max(0, 500 - kmSinceLube);

      // `lastCheckedDate` is a `YYYY-MM-DD` from a date input, so a plain
      // `new Date()` reads it as UTC midnight and inflates the day count by one
      // for anyone west of UTC.
      const daysSinceTyre = Math.floor(
        (Date.now() - parseDateKey(tyre.lastCheckedDate).getTime()) / 86_400_000
      );

      // `??` not `||`: a rider who genuinely rides 0 km on weekends must not be
      // silently swapped for the 140 km default.
      const weekendKm = cadence.weekendRideKm ?? 140;

      const reasons: string[] = [];
      if (daysSinceTyre >= 7) reasons.push(`Tyres unchecked for ${daysSinceTyre} days`);
      if (remainingKm <= weekendKm) reasons.push(`Chain lube due in ${remainingKm} km`);

      setAlertReason(reasons.length > 0 ? reasons.join(' · ') : null);
    } catch {
      setAlertReason(null);
    }
  }, [latestOdometer]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-3 select-none min-w-0">
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
              Telemetry &amp; Fuel Cockpit
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Realtime Sync indicator */}
          {isSyncing ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-mono">
              <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              <span className="hidden sm:inline font-medium">Syncing</span>
              <span className="sr-only">Syncing</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>Online</span>
            </div>
          )}

          {/* Maintenance alert -> Pre-Flight checklist */}
          {onOpenPreFlightModal && (
            <button
              type="button"
              onClick={onOpenPreFlightModal}
              title={alertReason ?? 'Pre-flight checklist'}
              aria-label={alertReason ? `Maintenance due: ${alertReason}. Open pre-flight checklist.` : 'Open pre-flight checklist'}
              className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                alertReason
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {alertReason && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          )}

          {/* Settings / sync setup */}
          <button
            type="button"
            onClick={onOpenSetupModal}
            title="Sync &amp; setup"
            aria-label="Sync and setup"
            className="hidden sm:flex w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Owner Mode Toggle */}
          {isOwnerMode ? (
            <button
              type="button"
              onClick={onLockOwnerMode}
              title="Signed in as Owner. Click to sign out."
              className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-3 py-1.5 hover:bg-emerald-100/80 transition-all shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span className="hidden sm:inline">Owner Unlocked</span>
              <span className="sm:hidden">Owner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              title="Read-Only Mode. Click to sign in."
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-xs"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
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
