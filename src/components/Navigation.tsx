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
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'analytics'
  | 'trips'
  | 'logs'
  | 'services'
  | 'accessories'
  | 'billing'
  | 'profile';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const allTabs: { id: TabType; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
  { id: 'trips', label: 'Trips', shortLabel: 'Trips', icon: Compass },
  { id: 'logs', label: 'Fuel Logs', shortLabel: 'Fuel', icon: FileText },
  { id: 'services', label: 'Services', shortLabel: 'Service', icon: Wrench },
  { id: 'accessories', label: 'Accessories', shortLabel: 'Gear', icon: ShoppingBag },
  { id: 'billing', label: 'Billing', shortLabel: 'Bill', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: TrendingUp },
  { id: 'profile', label: 'Profile', shortLabel: 'Owner', icon: User },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <>
      {/* ── DESKTOP NAVIGATION (Top Bar) ── */}
      <div className="hidden md:block bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-16 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2 overflow-x-auto no-scrollbar">
            {allTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 select-none
                    ${
                      isActive
                        ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-150 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── MOBILE NATIVE DOCK (Bottom Floating Navigation Bar) ── */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
        <nav className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_32px_rgba(0,0,0,0.10)] rounded-2xl px-1.5 py-2 flex items-center justify-around safe-area-bottom">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl
                  transition-all duration-150 active:scale-95 select-none
                  ${isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}
                `}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-transform duration-150 ${
                      isActive ? 'text-blue-600 stroke-[2.5] -translate-y-0.5' : 'stroke-[1.75]'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
