'use client';

import React from 'react';
import { Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { GoogleSheetConfig } from '@/types/fuel';

interface HeaderProps {
  config: GoogleSheetConfig;
  onOpenLogModal: () => void;
  onOpenSetupModal: () => void;
  onOpenAuthModal: () => void;
  isOwnerMode: boolean;
  onLockOwnerMode: () => void;
  isSyncing: boolean;
  onSyncCloud?: () => void;
  onToggleMobileMenu?: () => void;
}

/**
 * Phone-only top bar: brand on the left, sync + access on the right.
 * On desktop the sidebar carries all of this, so the bar is hidden.
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenAuthModal,
  isOwnerMode,
  onLockOwnerMode,
  isSyncing,
  onSyncCloud,
}) => {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="h-14 pl-4 pr-2 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- intentional raw <img>: images.unoptimized, CSS-sized local asset */}
        <img src="/n250-logo.png" alt="Bajaj Pulsar N250" className="h-6 w-auto object-contain" />

        <div className="flex items-center">
          {onSyncCloud && (
            <button
              type="button"
              onClick={onSyncCloud}
              disabled={isSyncing}
              aria-label={isSyncing ? 'Syncing' : 'Sync now'}
              className="w-11 h-11 rounded-full flex items-center justify-center text-slate-600 active:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin text-accent' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={isOwnerMode ? onLockOwnerMode : onOpenAuthModal}
            aria-label={isOwnerMode ? 'Owner mode on. Tap to lock.' : 'View only. Tap to unlock editing.'}
            className="w-11 h-11 rounded-full flex items-center justify-center active:bg-slate-100"
          >
            {isOwnerMode ? (
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <Lock className="h-5 w-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
