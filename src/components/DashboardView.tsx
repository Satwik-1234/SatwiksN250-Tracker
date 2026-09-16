'use client';

import React from 'react';
import {
  TrendingUp,
  Compass,
  ArrowRight,
  Fuel,
  Wallet,
  Gauge,
  CircleDollarSign,
  Route,
  Droplets,
  Calendar,
  Wrench,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatedActionButton } from './AnimatedActionButton';
import { FuelGauge } from './FuelGauge';
import { RoadCard } from './RoadCard';
import { DashboardMetrics, FuelLog, Trip, ServiceLog, AccessoryGear } from '../types/fuel';

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

// Minimalist Apple-style Metric Tile with original icon image support
const TelemetryTile = ({
  label,
  value,
  unit,
  subtext,
  iconSrc,
  icon: FallbackIcon,
  badge,
  hoverColor = 'bg-[#2563eb]',
  textColor = 'text-[#2563eb]',
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  iconSrc?: string;
  icon?: React.ElementType;
  badge?: string;
  hoverColor?: string;
  textColor?: string;
}) => {
  return (
    <div className="bg-white border border-slate-200/85 rounded-[1em] overflow-hidden relative group p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] z-0 flex flex-col justify-between h-full min-h-[140px] transition-all duration-300">
      
      <div className={`circle absolute h-[5em] w-[5em] -top-[2.5em] -right-[2.5em] rounded-full ${hoverColor} group-hover:scale-[1500%] duration-500 z-[-1] opacity-100 transition-all`} />

      <div className="flex items-center justify-between mb-3 z-10">
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white/90 uppercase tracking-wider font-mono transition-colors duration-300">
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-white/20 border border-slate-100 group-hover:border-white/30 flex items-center justify-center p-1.5 transition-all duration-300 shadow-xs z-10">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt={label}
              width={26}
              height={26}
              className="object-contain"
            />
          ) : FallbackIcon ? (
            <FallbackIcon className={`h-4 w-4 ${textColor} group-hover:text-white transition-colors duration-300`} />
          ) : null}
        </div>
      </div>
      
      <div className="z-10">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-white font-mono tracking-tight transition-colors duration-300">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-slate-400 group-hover:text-white/80 font-mono transition-colors duration-300">
              {unit}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          {subtext && (
            <p className="text-[11px] text-slate-400 group-hover:text-white/70 font-mono transition-colors duration-300">
              {subtext}
            </p>
          )}
          {badge && (
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 group-hover:bg-white/20 ${textColor} group-hover:text-white transition-colors duration-300`}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

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
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyFuelCost = recentLogs
    .filter((log) => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, log) => sum + log.totalCost, 0);

  const totalBikeOwnershipCost = totalFuelCost + totalServiceCost + totalAccessoryCost;

  const latestOdo =
    recentLogs.length > 0
      ? Math.max(...recentLogs.map((l) => l.odometer))
      : 0;

  // Senior dev addition: Pulsar N250 Scheduled Maintenance Progress
  const serviceMilestones = [750, 4500, 10000, 15000, 20000, 25000];
  const nextServiceKm =
    serviceMilestones.find((km) => km > latestOdo) ||
    Math.ceil((latestOdo + 1) / 4500) * 4500;
  const prevMilestone =
    [0, ...serviceMilestones].filter((km) => km < nextServiceKm).pop() || 0;
  const kmToNextService = Math.max(0, nextServiceKm - latestOdo);
  const serviceProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((latestOdo - prevMilestone) / (nextServiceKm - prevMilestone)) * 100))
  );

  return (
    <div className="animate-fade-up space-y-8">

      {/* ── HERO TELEMETRY COCKPIT ── */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
        {/* Subtle decorative mesh gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/60 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold uppercase tracking-wider font-mono">
                Bajaj Pulsar N250
              </span>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                Real-World Economy
              </span>
            </div>

            <div className="flex items-baseline gap-3.5">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {metrics.avgMileage ? Number(metrics.avgMileage).toFixed(1) : '—'}
              </span>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">km/L</span>
                <p className="text-xs text-slate-500 mt-1 font-mono font-medium">
                  Across {metrics.totalLogsCount} fill-ups · {metrics.totalDistance.toLocaleString('en-IN')} km tracked
                </p>
              </div>
            </div>
          </div>

          {/* Right Odometer & CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-4 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Current Odometer
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">
                {latestOdo > 0 ? latestOdo.toLocaleString('en-IN') : '—'}
                <span className="text-sm font-semibold text-slate-400 ml-1">km</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE TELEMETRY TILES (Original Custom PNG Icons Preserved) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Live Telematics & Running Cost
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Real-Time Instrument Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <TelemetryTile
            label="Fuel Price"
            value={metrics.latestFuelPrice > 0 ? `₹${metrics.latestFuelPrice.toFixed(2)}` : '—'}
            unit="/L"
            subtext="Latest pump price"
            iconSrc="/icons/fuel-fillup.png"
            badge="RATE"
            hoverColor="bg-[#475569]"
            textColor="text-[#475569]"
          />
          <TelemetryTile
            label="Current Trip"
            value={metrics.currentTripKm > 0 ? `${metrics.currentTripKm}` : '—'}
            unit="km"
            subtext="Since last refill"
            iconSrc="/icons/odometer.png"
            badge="TRIP"
            hoverColor="bg-[#2563eb]"
            textColor="text-[#2563eb]"
          />
          <TelemetryTile
            label="Avg Refill"
            value={metrics.avgFuelCost > 0 ? `₹${metrics.avgFuelCost.toFixed(0)}` : '—'}
            unit="INR"
            subtext="Cost per tank stop"
            iconSrc="/icons/fuel-economy.png"
            badge="AVG"
            hoverColor="bg-[#FF5800]"
            textColor="text-[#FF5800]"
          />
          <TelemetryTile
            label="Cost / km"
            value={metrics.costPerKm > 0 ? `₹${metrics.costPerKm.toFixed(2)}` : '—'}
            unit="/km"
            subtext="Running cost"
            iconSrc="/icons/mileage.png"
            badge="₹/KM"
            hoverColor="bg-[#475569]"
            textColor="text-[#475569]"
          />
          <TelemetryTile
            label="Fuel Spent"
            value={`₹${(metrics.totalSpent || 0).toLocaleString('en-IN')}`}
            unit="INR"
            subtext={`${(metrics.totalLitres || 0).toFixed(1)} L pumped`}
            iconSrc="/icons/wallet.png"
            badge="FUEL"
            hoverColor="bg-[#FF5800]"
            textColor="text-[#FF5800]"
          />
        </div>
      </div>

      {/* ── ROAD CARD SERVICE MILESTONE ── */}
      <div className="w-full">
        <RoadCard 
          title={nextServiceKm === 4500 ? '2nd Free Service Countdown' : 'Next Service Countdown'}
          value={kmToNextService > 0 ? `${kmToNextService.toLocaleString('en-IN')} km remaining` : 'Service Due!'}
          subtitle={`Target: ${nextServiceKm.toLocaleString('en-IN')} km`}
        />
      </div>


      {/* ── MAIN CONTENT (Recent Activity & Live Efficiency) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Cols: Recent Fill-ups */}
        <div className="lg:col-span-2 bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-blue-600" />
                <span>Recent Fuel Refills</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Chronological pump log records</p>
            </div>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {sortedLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Fuel className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No refill logs recorded yet.</p>
              <button
                onClick={onOpenLogModal}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Log your first refill →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="text-left pb-3">Date</th>
                    <th className="text-left pb-3">Odometer</th>
                    <th className="text-left pb-3 hidden sm:table-cell">Fuel Station</th>
                    <th className="text-right pb-3">Litres</th>
                    <th className="text-right pb-3">Amount</th>
                    <th className="text-right pb-3 hidden md:table-cell">km/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLogs.slice(0, 8).map((log) => {
                    const matchBrand = log.stationName?.match(/^(IOCL|HPCL|BPCL|Jio-BP|Shell|Nayara)/i);
                    const brandName = matchBrand ? matchBrand[0].toUpperCase() : 'Pump';
                    const cleanStation =
                      log.stationName?.replace(
                        /^(IOCL|HPCL|BPCL|Jio-BP|Shell|Nayara)\s*[-:]\s*/i,
                        ''
                      ) || log.stationName || 'Station';

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="py-3.5 text-slate-600 font-mono text-xs">
                          {new Date(log.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 text-xs">
                          {log.odometer.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">km</span>
                        </td>
                        <td className="py-3.5 text-slate-600 text-xs hidden sm:table-cell max-w-[140px] truncate">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono mr-1.5">
                            {brandName}
                          </span>
                          {cleanStation}
                        </td>
                        <td className="py-3.5 font-mono text-slate-700 text-xs text-right font-medium">
                          {log.fuelAmount} L
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 text-xs text-right">
                          ₹{log.totalCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-right hidden md:table-cell">
                          {log.mileageCalculated ? (
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                                log.mileageCalculated >= 42
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : log.mileageCalculated >= 35
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {log.mileageCalculated.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Efficiency & Performance Stats */}
        <div className="space-y-6">
          {/* Live Efficiency Gauge */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span>Live Efficiency</span>
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                Arc Meter
              </span>
            </div>
            <FuelGauge value={metrics.avgMileage || 0} />
          </div>

          {/* Quick Performance Summary */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>Performance Ledger</span>
            </h2>
            <div className="space-y-2.5">
              {[
                { label: 'Total Litres Consumed', value: `${(metrics.totalLitres || 0).toFixed(1)} L` },
                { label: 'Cumulative Distance', value: `${(metrics.totalDistance || 0).toLocaleString('en-IN')} km` },
                { label: 'Total Fuel Expense', value: `₹${(metrics.totalSpent || 0).toLocaleString('en-IN')}` },
                { label: 'Calculated Cost / km', value: `₹${(metrics.costPerKm || 0).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('analytics')}
              className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Detailed Analytics <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>

          {/* Trips Highlight */}
          {recentTrips.length > 0 && (
            <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-600" />
                  <span>Recent Rides</span>
                </h2>
                <button
                  onClick={() => onNavigateTab('trips')}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  All <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {recentTrips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {trip.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {trip.distanceCovered || trip.totalDistance || '—'} km · {trip.tripType}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      ₹{trip.totalFuelCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
