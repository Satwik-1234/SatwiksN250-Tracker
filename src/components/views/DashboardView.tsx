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

const MetricTile = ({
  label,
  value,
  unit,
  subtext,
  iconSrc,
  icon: FallbackIcon,
  accentColor = 'text-blue-600',
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  iconSrc?: string;
  icon?: React.ElementType;
  accentColor?: string;
}) => {
  return (
    <div className="bg-white border border-slate-200/85 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between h-full min-h-[130px] transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt={label}
              width={24}
              height={24}
              className="object-contain"
            />
          ) : FallbackIcon ? (
            <FallbackIcon className={`h-4 w-4 ${accentColor}`} />
          ) : null}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-400">
              {unit}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-1">
            {subtext}
          </p>
        )}
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

      {/* Hero — Average Mileage */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-semibold uppercase tracking-wider inline-block mb-3">
              Bajaj Pulsar N250
            </span>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-none">
                {metrics?.avgMileage ? Number(metrics.avgMileage).toFixed(1) : '—'}
              </span>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-blue-600">km/L</span>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics?.totalLogsCount || 0} fill-ups · {(metrics?.totalDistance || 0).toLocaleString('en-IN')} km
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-4 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Odometer
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                {(latestOdo || 0) > 0 ? (latestOdo || 0).toLocaleString('en-IN') : '—'}
                <span className="text-sm font-medium text-slate-400 ml-1">km</span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <AnimatedActionButton label="Log Refill" onClick={onOpenLogModal} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Running Stats
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <MetricTile
            label="Fuel Price"
            value={(metrics?.latestFuelPrice || 0) > 0 ? `₹${(metrics.latestFuelPrice || 0).toFixed(2)}` : '—'}
            unit="/L"
            subtext="Latest pump rate"
            iconSrc="/icons/fuel-fillup.png"
            accentColor="text-slate-600"
          />
          <MetricTile
            label="Trip"
            value={(metrics?.currentTripKm || 0) > 0 ? `${metrics.currentTripKm}` : '—'}
            unit="km"
            subtext="Since last refill"
            iconSrc="/icons/odometer.png"
            accentColor="text-blue-600"
          />
          <MetricTile
            label="Cost / km"
            value={(metrics?.costPerKm || 0) > 0 ? `₹${(metrics.costPerKm || 0).toFixed(2)}` : '—'}
            unit="/km"
            subtext="Running cost"
            iconSrc="/icons/wallet.png"
            accentColor="text-slate-600"
          />
          <MetricTile
            label="Total Spent"
            value={`₹${(metrics?.totalSpent || 0).toLocaleString('en-IN')}`}
            subtext={`${(metrics?.totalLitres || 0).toFixed(1)} L total`}
            iconSrc="/icons/wallet.png"
            accentColor="text-orange-600"
          />
        </div>
      </div>

      {/* Vehicle Readiness */}
      <VehicleReadinessCard
        latestOdometer={latestOdo}
        services={services || []}
        isOwnerMode={isOwnerMode}
        onNavigateTab={onNavigateTab}
        onLubeLogged={onLubeLogged}
        onRequireOwner={onRequireOwner}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>Recent Rides</span>
              </h2>
              {recentTrips.length > 0 && (
                <button
                  onClick={() => onNavigateTab('trips')}
                  className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
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
                    className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                        {trip.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {trip.distanceCovered || trip.totalDistance || '—'} km · {trip.tripType}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-600">
                      ₹{(trip.totalFuelCost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No rides recorded yet
              </p>
            )}
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Analytics
              </span>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Fuel Economy Analysis</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Full-tank mileage segments, cost trends, brand comparison, and economy charts.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            View Analytics <ArrowRight className="h-3.5 w-3.5 text-blue-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
