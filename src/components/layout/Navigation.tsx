'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Compass,
  FileText,
  User,
  Wrench,
  ShoppingBag,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  X,
  Fuel,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
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
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onOpenLogModal?: () => void;
  isOwnerMode?: boolean;
}

interface NavItem {
  id: TabType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const allTabs: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',   description: 'Cockpit & telemetry',    icon: LayoutDashboard },
  { id: 'trips',       label: 'Trips',       description: 'Highway & tour logs',    icon: Compass },
  { id: 'logs',        label: 'Fuel Logs',   description: 'Refill telemetry & km/L',icon: FileText },
  { id: 'services',    label: 'Services',    description: 'Maintenance & oil',      icon: Wrench },
  { id: 'accessories', label: 'Accessories', description: 'Upgrades & gear',        icon: ShoppingBag },
  { id: 'billing',     label: 'Billing',     description: 'Expenses & receipts',    icon: ReceiptText },
  { id: 'analytics',   label: 'Analytics',   description: 'Fuel economy graphs',    icon: TrendingUp },
  { id: 'profile',     label: 'Profile',     description: 'Bike specs & owner',     icon: User },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen,
  isCollapsed = false,
  setIsCollapsed,
  onOpenLogModal,
  isOwnerMode = false,
}) => {
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* ── MOBILE COLLAPSIBLE DRAWER (Vertical Slide-out Drawer) ── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen?.(false)}
          />

          {/* Slide-out Sidebar Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-right border-r border-slate-200">
            {/* Header in Drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- intentional raw <img>: images.unoptimized, CSS-sized local asset */}
                <img
                  src="/n250-logo.png"
                  alt="N250"
                  className="h-6 w-auto object-contain"
                />
                <div>
                  <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-800 block">
                    Pulsar N250
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Telemetry Cockpit
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen?.(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close Navigation Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Button inside Mobile Drawer */}
            {onOpenLogModal && (
              <div className="p-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen?.(false);
                    onOpenLogModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                  <Fuel className="h-4 w-4" />
                  <span>Log Refill Stop</span>
                </button>
              </div>
            )}

            {/* Vertical Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Menu
              </div>
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left
                      transition-all duration-150 select-none
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }
                    `}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{tab.label}</div>
                      <div className="text-[10px] text-slate-400 truncate font-normal">
                        {tab.description}
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Status */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Mode</span>
                <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${isOwnerMode ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {isOwnerMode ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Owner Unlocked
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      Read-Only
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP COLLAPSIBLE VERTICAL SIDEBAR ── */}
      <aside
        className={`
          hidden md:flex flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)]
          transition-all duration-200 z-30 shrink-0
          ${isCollapsed ? 'w-20' : 'w-56'}
        `}
      >
        {/* Navigation Items (Vertical) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 no-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Cockpit Navigation
            </div>
          )}

          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                title={isCollapsed ? tab.label : undefined}
                className={`
                  relative w-full flex items-center rounded-xl text-left transition-all duration-150 select-none
                  ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2.5'}
                  ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }
                `}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? 'text-blue-600 scale-110' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-xs truncate">{tab.label}</span>
                )}
                {isActive && (
                  <span
                    className={`absolute bg-blue-600 rounded-full ${
                      isCollapsed
                        ? 'left-1 top-1/2 -translate-y-1/2 w-1 h-5'
                        : 'right-2 w-1.5 h-1.5'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Collapse/Expand Toggle Button at Bottom */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            className={`
              w-full flex items-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors p-2 text-xs font-semibold
              ${isCollapsed ? 'justify-center' : 'justify-between px-3'}
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!isCollapsed && (
              <span className="text-[11px] font-mono text-slate-500">Collapse</span>
            )}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
