'use client';

import React from 'react';
import { TrendingUp, Compass, ArrowRight, Fuel } from 'lucide-react';
import Image from 'next/image';
import { AnimatedActionButton } from './AnimatedActionButton';
import { FuelGauge } from './FuelGauge';
import { DashboardMetrics, FuelLog, Trip, ServiceLog, AccessoryGear } from '../types/fuel';
import { Wrench, ShoppingBag, Wallet, ShieldCheck, Layers } from 'lucide-react';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentLogs: FuelLog[];
  recentTrips: Trip[];
  services?: ServiceLog[];
  accessories?: AccessoryGear[];
  onOpenLogModal: () => void;
  onNavigateTab: (tab: 'analytics' | 'trips' | 'logs' | 'settings' | 'services' | 'accessories') => void;
  isOwnerMode: boolean;
}

// 3D Metric Card
const MetricCard3D = ({
  label, value, unit, icon, badge,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  badge?: string;
}) => (
  <div className="metric-parent">
    <div className="metric-card">
      {/* Floating badge — like the date-box from uiverse */}
      <div className="metric-badge">
        <span className="metric-badge-icon">
          <Image src={icon} alt={label} width={24} height={24} />
        </span>
        {badge && <span className="metric-badge-text">{badge}</span>}
      </div>
      <div className="metric-content-box">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentLogs,
  recentTrips,
  services = [],
  accessories = [],
  onOpenLogModal,
  onNavigateTab,
}) => {
  const sortedLogs = [...recentLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalServiceCost = services.reduce((sum, s) => sum + s.totalCost, 0);
  const totalAccessoryCost = accessories.reduce((sum, a) => sum + a.cost, 0);
  const totalFuelCost = metrics.totalSpent || 0;
  const totalBikeOwnershipCost = totalFuelCost + totalServiceCost + totalAccessoryCost;

  return (
    <div className="animate-fade-up">

      {/* ── HERO ── */}
      <div className="py-8 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* N250 Logo */}
            <div className="mb-4">
              <Image
                src="/n250-logo.png"
                alt="Bajaj Pulsar N250"
                width={260}
                height={86}
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
              Average Fuel Efficiency
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-black text-slate-900 font-mono leading-none">
                {metrics.avgMileage || '—'}
              </span>
              <div>
                <span className="text-xl font-semibold text-slate-400">km/L</span>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {metrics.totalLogsCount} fill-ups · {metrics.totalDistance} km total
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-mono">Latest odometer</p>
              <p className="text-lg font-black text-slate-900 font-mono">
                {recentLogs.length > 0
                  ? Math.max(...recentLogs.map((l) => l.odometer)).toLocaleString('en-IN')
                  : '—'} <span className="text-sm font-medium text-slate-400">km</span>
              </p>
            </div>
            <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
          </div>
        </div>
      </div>

      {/* ── 3D METRIC CARDS ── */}
      <div className="py-8 border-b border-slate-50">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-5">Live Telemetry</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard3D
            label="Fuel Price"
            value={`₹${metrics.latestFuelPrice}`}
            unit="per litre"
            icon="/icons/fuel-fillup.png"
            badge="RATE"
          />
          <MetricCard3D
            label="Current Trip"
            value={metrics.currentTripKm}
            unit="kilometres"
            icon="/icons/odometer.png"
            badge="TRIP"
          />
          <MetricCard3D
            label="Avg Refill"
            value={`₹${metrics.avgFuelCost}`}
            unit="per stop"
            icon="/icons/fuel-economy.png"
            badge="AVG"
          />
          <MetricCard3D
            label="Cost / km"
            value={`₹${metrics.costPerKm}`}
            unit="running cost"
            icon="/icons/mileage.png"
            badge="₹/KM"
          />
          <MetricCard3D
            label="Fuel Spent"
            value={`₹${metrics.totalSpent}`}
            unit="fuel total"
            icon="/icons/wallet.png"
            badge="FUEL"
          />
        </div>
      </div>

      {/* ── TOTAL BIKE OWNERSHIP & INVESTMENT BREAKDOWN WIDGET ── */}
      <div className="py-6 border-b border-slate-100">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-600/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bike Ownership Investment</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black font-mono mt-1 text-white">
                ₹{totalBikeOwnershipCost.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Combined lifetime cost across Fuel, Services & Accessories
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
              {/* Fuel Spent */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fuel Total</span>
                <span className="text-sm sm:text-base font-bold text-amber-400 block mt-0.5">₹{totalFuelCost.toLocaleString('en-IN')}</span>
              </div>

              {/* Service Total */}
              <button 
                onClick={() => onNavigateTab('services')}
                className="bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-3 text-left transition-colors group"
              >
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block group-hover:text-blue-400">Services</span>
                <span className="text-sm sm:text-base font-bold text-blue-400 block mt-0.5">₹{totalServiceCost.toLocaleString('en-IN')}</span>
              </button>

              {/* Accessories Total */}
              <button 
                onClick={() => onNavigateTab('accessories')}
                className="bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl p-3 text-left transition-colors group"
              >
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block group-hover:text-emerald-400">Accessories</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 block mt-0.5">₹{totalAccessoryCost.toLocaleString('en-IN')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8 pb-12">

        {/* Recent Logs Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-slate-400" />
              Recent Fill-ups
            </h2>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
            >
              All logs <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {sortedLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Fuel className="h-8 w-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No refill logs yet.</p>
              <button
                onClick={onOpenLogModal}
                className="mt-4 text-xs text-blue-600 font-medium hover:underline"
              >
                Log your first refill →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Odometer</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Station</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Litres</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cost</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">km/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 text-slate-600 font-mono text-xs">
                      {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 font-mono font-semibold text-slate-900 text-xs">
                      {log.odometer.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-slate-500 text-xs hidden sm:table-cell max-w-[120px] truncate">
                      {log.stationName?.replace(/^(IOCL|HPCL|BPCL|Jio-BP|Shell|Nayara) - /, '') || '—'}
                    </td>
                    <td className="py-3 font-mono text-slate-700 text-xs text-right">{log.fuelAmount}L</td>
                    <td className="py-3 font-mono font-semibold text-slate-900 text-xs text-right">₹{log.totalCost}</td>
                    <td className="py-3 text-right hidden md:table-cell">
                      {log.mileageCalculated ? (
                        <span className={`text-xs font-mono font-semibold ${log.mileageCalculated >= 40 ? 'text-emerald-600' : log.mileageCalculated >= 34 ? 'text-amber-600' : 'text-red-500'}`}>
                          {log.mileageCalculated.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">

          {/* Fuel Gauge */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              Live Efficiency
            </h2>
            <FuelGauge value={metrics.avgMileage || 0} />
          </div>

          {/* Quick Stats */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              Performance
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Total Litres', value: `${metrics.totalLitres} L` },
                { label: 'Total Distance', value: `${metrics.totalDistance} km` },
                { label: 'Total Spent', value: `₹${metrics.totalSpent}` },
                { label: 'Cost / km', value: `₹${metrics.costPerKm}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-mono font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="mt-4 w-full py-2 border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-xs font-medium text-slate-600 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              View Full Analytics <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Trips */}
          {recentTrips.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Compass className="h-4 w-4 text-slate-400" />
                Trips
              </h2>
              <div className="space-y-3">
                {recentTrips.slice(0, 3).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div>
                      <p className="text-xs font-medium text-slate-900">{trip.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{trip.totalDistance} km</p>
                    </div>
                    <span className="text-xs font-mono text-slate-600">₹{trip.totalFuelCost}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateTab('trips')}
                className="mt-4 text-xs text-blue-600 hover:underline font-medium flex items-center gap-0.5"
              >
                All trips <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
