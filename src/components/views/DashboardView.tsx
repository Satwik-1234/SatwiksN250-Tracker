'use client';

import React from 'react';
import {
  TrendingUp,
  Compass,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatedActionButton } from '@/components/ui/AnimatedActionButton';
import { VehicleReadinessCard } from '@/components/cards/VehicleReadinessCard';
import { DashboardMetrics, FuelLog, Trip, ServiceLog, AccessoryGear } from '@/types/fuel';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentLogs: FuelLog[];
  recentTrips: Trip[];
  services?: ServiceLog[];
  accessories?: AccessoryGear[];
  onOpenLogModal: () => void;
  onNavigateTab: (tab: 'analytics' | 'trips' | 'logs' | 'settings' | 'services' | 'accessories') => void;
  isOwnerMode: boolean;
  onLubeLogged?: () => void;
  onRequireOwner?: () => void;
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
  services,
  onOpenLogModal,
  onNavigateTab,
  isOwnerMode,
  onLubeLogged,
  onRequireOwner,
}) => {
  const latestOdo =
    recentLogs && recentLogs.length > 0
      ? Math.max(...recentLogs.map((l) => Number(l.odometer) || 0))
      : 0;

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
                {metrics?.avgMileage ? Number(metrics.avgMileage).toFixed(1) : '—'}
              </span>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">km/L</span>
                <p className="text-xs text-slate-500 mt-1 font-mono font-medium">
                  Across {metrics?.totalLogsCount || 0} fill-ups · {(metrics?.totalDistance || 0).toLocaleString('en-IN')} km tracked
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
                {(latestOdo || 0) > 0 ? (latestOdo || 0).toLocaleString('en-IN') : '—'}
                <span className="text-sm font-semibold text-slate-400 ml-1">km</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE TELEMETRY TILES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Live Telematics & Running Cost
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Real-Time Instrument Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <TelemetryTile
            label="Fuel Price"
            value={(metrics?.latestFuelPrice || 0) > 0 ? `₹${(metrics.latestFuelPrice || 0).toFixed(2)}` : '—'}
            unit="/L"
            subtext="Latest pump rate"
            iconSrc="/icons/fuel-fillup.png"
            badge="RATE"
            hoverColor="bg-[#475569]"
            textColor="text-[#475569]"
          />
          <TelemetryTile
            label="Current Trip"
            value={(metrics?.currentTripKm || 0) > 0 ? `${metrics.currentTripKm}` : '—'}
            unit="km"
            subtext="Since last refill"
            iconSrc="/icons/odometer.png"
            badge="TRIP"
            hoverColor="bg-[#2563eb]"
            textColor="text-[#2563eb]"
          />
          <TelemetryTile
            label="Cost / km"
            value={(metrics?.costPerKm || 0) > 0 ? `₹${(metrics.costPerKm || 0).toFixed(2)}` : '—'}
            unit="/km"
            subtext="Running cost"
            iconSrc="/icons/wallet.png"
            badge="₹/KM"
            hoverColor="bg-[#475569]"
            textColor="text-[#475569]"
          />
          <TelemetryTile
            label="Fuel Spent"
            value={`₹${(metrics?.totalSpent || 0).toLocaleString('en-IN')}`}
            unit="INR"
            subtext={`${(metrics?.totalLitres || 0).toFixed(1)} L pumped`}
            iconSrc="/icons/wallet.png"
            badge="SPENT"
            hoverColor="bg-[#FF5800]"
            textColor="text-[#FF5800]"
          />
        </div>
      </div>

      {/* ── UNIFIED VEHICLE READINESS & HEALTH HUB ── */}
      <VehicleReadinessCard
        latestOdometer={latestOdo}
        services={services || []}
        isOwnerMode={isOwnerMode}
        onNavigateTab={onNavigateTab}
        onLubeLogged={onLubeLogged}
        onRequireOwner={onRequireOwner}
      />

      {/* ── MAIN CONTENT (Rides & Telematics) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Col: Rides Highlight */}
        <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>Recent Rides</span>
              </h2>
              {recentTrips.length > 0 && (
                <button
                  onClick={() => onNavigateTab('trips')}
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer font-mono"
                >
                  All Rides <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {recentTrips.length > 0 ? (
              <div className="space-y-3">
                {recentTrips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                        {trip.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {trip.distanceCovered || trip.totalDistance || '—'} km · {trip.tripType}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      ₹{(trip.totalFuelCost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-mono py-8 text-center">
                No rides recorded yet
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Detailed Analytics & Insights */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                Advanced Analytics & Insights
              </span>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Telemetry Intelligence</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed font-sans">
              Analyze multi-tank efficiency segments, dynamic cost-per-kilometer curves, fuel inflation trends, and pump brand performance.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
          >
            Open Performance Analytics <ArrowRight className="h-3.5 w-3.5 text-blue-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
