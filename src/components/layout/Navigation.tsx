'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Compass,
  Fuel,
  User,
  Wrench,
  ShoppingBag,
  ReceiptText,
  X,
  ShieldCheck,
  Lock,
  Plus,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
  Gauge,
  FolderOpen,
  NotebookPen,
  Cog,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type TabType =
  | 'dashboard'
  | 'console'
  | 'documents'
  | 'notes'
  | 'parts'
  | 'trips'
  | 'logs'
  | 'services'
  | 'accessories'
  | 'billing'
  | 'analytics'
  | 'profile';

export interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  /** Mobile "More" sheet open state. */
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  /** Kept for backwards compatibility; the sidebar no longer collapses. */
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onOpenLogModal?: () => void;
  isOwnerMode?: boolean;
  isSyncing?: boolean;
  onSyncCloud?: () => void;
  onOpenAuthModal?: () => void;
  onLockOwnerMode?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const NAV: Record<TabType, NavItem> = {
  dashboard:   { id: 'dashboard',   label: 'Home',      description: 'Overview of your bike',     icon: LayoutDashboard },
  console:     { id: 'console',     label: 'Console',   description: 'Warning lamps and upkeep',  icon: Gauge },
  documents:   { id: 'documents',   label: 'Documents', description: 'RC, insurance and papers',  icon: FolderOpen },
  parts:       { id: 'parts',       label: 'Parts',     description: 'Tyres, chain and pads',     icon: Cog },
  notes:       { id: 'notes',       label: 'Notes',     description: 'Breakdowns and experiences', icon: NotebookPen },
  analytics:   { id: 'analytics',   label: 'Analytics', description: 'Mileage and cost trends',   icon: TrendingUp },
  logs:        { id: 'logs',        label: 'Fuel',      description: 'Every refill',              icon: Fuel },
  trips:       { id: 'trips',       label: 'Trips',     description: 'Rides and tours',           icon: Compass },
  services:    { id: 'services',    label: 'Service',   description: 'Maintenance and invoices',  icon: Wrench },
  accessories: { id: 'accessories', label: 'Gear',      description: 'Accessories and upgrades',  icon: ShoppingBag },
  billing:     { id: 'billing',     label: 'Expenses',  description: 'Monthly spend and receipts', icon: ReceiptText },
  profile:     { id: 'profile',     label: 'My bike',   description: 'Specs, settings and data',  icon: User },
};

const SIDEBAR_GROUPS: { title: string | null; items: TabType[] }[] = [
  { title: null,      items: ['dashboard', 'console', 'analytics'] },
  { title: 'Records', items: ['logs', 'trips', 'services', 'accessories', 'parts', 'documents', 'notes'] },
  { title: 'Money',   items: ['billing'] },
];

/** Tabs shown directly in the phone tab bar; everything else lives under More. */
const TABBAR_LEFT: TabType[] = ['dashboard', 'console'];
const TABBAR_RIGHT: TabType[] = ['logs'];
const MORE_ITEMS: TabType[] = ['trips', 'services', 'accessories', 'parts', 'documents', 'notes', 'billing', 'analytics', 'profile'];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen,
  onOpenLogModal,
  isOwnerMode = false,
  isSyncing = false,
  onSyncCloud,
  onOpenAuthModal,
  onLockOwnerMode,
}) => {
  const select = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileOpen?.(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  const sidebarLink = (id: TabType) => {
    const { label, icon: Icon } = NAV[id];
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => select(id)}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm text-left transition-colors ${
          isActive
            ? 'bg-white/10 text-white font-semibold'
            : 'text-white/60 font-medium hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-white/40'}`} />
        <span className="truncate flex-1">{label}</span>
        {isActive && <span className="nav-slash" aria-hidden="true" />}
      </button>
    );
  };

  const tabButton = (id: TabType) => {
    const { label, icon: Icon } = NAV[id];
    const isActive = activeTab === id && !isMobileOpen;
    return (
      <button
        key={id}
        type="button"
        onClick={() => select(id)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
          isActive ? 'text-[var(--color-text-1)]' : 'text-[var(--color-text-2)]'
        }`}
      >
        <Icon key={String(isActive)} className={`h-5 w-5 ${isActive ? 'tab-pop' : ''}`} strokeWidth={isActive ? 2.25 : 1.75} />
        <span>{label}</span>
      </button>
    );
  };

  const isMoreActive = isMobileOpen || MORE_ITEMS.includes(activeTab);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen bg-[#15171c] text-white">
        {/* Brand */}
        <div className="px-3 pt-4 pb-4 shrink-0">
          <div className="h-12 px-3 rounded-xl bg-white flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- intentional raw <img>: images.unoptimized, CSS-sized local asset */}
            <img src="/n250-logo.png" alt="Bajaj Pulsar N250" className="h-6 w-auto object-contain" />
          </div>
        </div>

        {/* Primary action */}
        {onOpenLogModal && (
          <div className="px-3 pb-3">
            <button type="button" onClick={onOpenLogModal} className="btn btn-accent w-full">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Log refill</span>
            </button>
          </div>
        )}

        {/* Links */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-1 space-y-5" aria-label="Main">
          {SIDEBAR_GROUPS.map((group, i) => (
            <div key={group.title ?? i} className="space-y-0.5">
              {group.title && (
                <div className="px-3 pb-1.5 text-xs font-medium text-white/35">{group.title}</div>
              )}
              {group.items.map(sidebarLink)}
            </div>
          ))}
        </nav>

        {/* Bottom: bike, sync, access */}
        <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
          {sidebarLink('profile')}

          {onSyncCloud && (
            <button
              type="button"
              onClick={onSyncCloud}
              disabled={isSyncing}
              className="w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 text-white/40 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing…' : 'Sync now'}</span>
            </button>
          )}

          <ThemeToggle variant="rail" />

          <button
            type="button"
            onClick={isOwnerMode ? onLockOwnerMode : onOpenAuthModal}
            title={isOwnerMode ? 'Signed in as owner. Click to lock.' : 'View only. Click to unlock editing.'}
            className="w-full flex items-center gap-3 h-9 px-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            {isOwnerMode ? (
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            ) : (
              <Lock className="h-4 w-4 text-white/40" />
            )}
            <span className="flex-1 text-left">{isOwnerMode ? 'Owner mode' : 'View only'}</span>
            <span className="text-xs text-white/35">{isOwnerMode ? 'Lock' : 'Unlock'}</span>
          </button>
        </div>
      </aside>

      {/* ── PHONE: BOTTOM TAB BAR ── */}
      <nav
        aria-label="Main"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-safe"
      >
        <div className="flex items-stretch h-[var(--tabbar-h)] px-1">
          {TABBAR_LEFT.map(tabButton)}

          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenLogModal}
              aria-label="Log refill"
              className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition-transform"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>

          {TABBAR_RIGHT.map(tabButton)}

          <button
            type="button"
            onClick={() => setIsMobileOpen?.(!isMobileOpen)}
            aria-expanded={isMobileOpen}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors ${
              isMoreActive ? 'text-[var(--color-text-1)]' : 'text-[var(--color-text-2)]'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={isMoreActive ? 2.25 : 1.75} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── PHONE: "MORE" SHEET ── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label="More">
          <div
            className="absolute inset-0 bg-slate-900/40 animate-fade-in"
            onClick={() => setIsMobileOpen?.(false)}
          />
          <div className="relative w-full bg-[var(--color-surface)] rounded-t-3xl shadow-2xl animate-sheet-up pb-safe">
            <div className="flex items-center justify-between pl-5 pr-3 pt-4 pb-2">
              <h2 className="text-base font-semibold text-[var(--color-text-1)]">More</h2>
              <button
                type="button"
                onClick={() => setIsMobileOpen?.(false)}
                aria-label="Close"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-3 pb-3">
              {MORE_ITEMS.map((id) => {
                const { label, description, icon: Icon } = NAV[id];
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => select(id)}
                    className="w-full flex items-center gap-3.5 px-2 py-2.5 rounded-xl text-left active:bg-[var(--color-surface-2)]"
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[var(--color-text-1)] text-[var(--color-surface)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-2)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-medium text-[var(--color-text-1)]">{label}</span>
                      <span className="block text-[13px] text-[var(--color-text-2)] truncate">{description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-3)]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
