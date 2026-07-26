'use client';

import React from 'react';
import { LayoutDashboard, TrendingUp, Compass, FileText, User } from 'lucide-react';

export type TabType = 'dashboard' | 'analytics' | 'trips' | 'logs' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics' as TabType, label: 'Analytics', icon: TrendingUp },
  { id: 'trips' as TabType, label: 'Trips', icon: Compass },
  { id: 'logs' as TabType, label: 'Logs', icon: FileText },
  { id: 'profile' as TabType, label: 'Profile', icon: User },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center space-x-1.5 px-4 py-3.5 text-sm font-medium
                  whitespace-nowrap transition-colors duration-150
                  ${isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : ''}`} />
                <span>{tab.label}</span>
                {/* Underline indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
