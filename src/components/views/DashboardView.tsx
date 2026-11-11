'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Fuel, Compass } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { VehicleReadinessCard } from '@/components/cards/VehicleReadinessCard';
import { ClusterGauge } from '@/components/ui/ClusterGauge';
import { CountUp, Reveal } from '@/components/ui/Motion';
import { computeFullTankSegments, sortLogsByDate, economyRating } from '@/lib/metrics';
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

/** Pulsar N250 tank capacity in litres. */
const TANK_LITRES = 14;

const inr = (n: number, digits = 0) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const shortDate = (raw?: string) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** One readout on the cluster's bottom row. */
const Readout = ({
  label,
  children,
  unit,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  unit?: string;
  hint?: string;
}) => (
  <div className="bg-[#1b1e25] px-5 py-4 sm:px-6 min-w-0">
    <div className="text-[13px] text-white/50">{label}</div>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="font-display text-[28px] leading-none font-semibold tabular">{children}</span>
      {unit && <span className="text-[13px] text-white/50">{unit}</span>}
    </div>
    {hint && <div className="mt-0.5 text-xs text-white/35 truncate">{hint}</div>}
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  icon: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) => (
  <section className="card overflow-hidden h-full">
    <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
      <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="group text-[13px] font-medium text-slate-900 hover:text-accent flex items-center gap-1"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
    {children}
  </section>
);

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
  const logs = React.useMemo(() => sortLogsByDate(recentLogs || []), [recentLogs]);

  const latestOdo = logs.length > 0 ? Math.max(...logs.map((l) => Number(l.odometer) || 0)) : 0;
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;

  // Tank-to-tank mileage history drives the trend line and the "last tank" delta.
  const trend = React.useMemo(
    () =>
      computeFullTankSegments(logs)
        .filter((seg) => typeof seg.mileage === 'number')
        .map((seg) => ({ date: shortDate(logs[seg.endIndex]?.date), mileage: seg.mileage as number })),
    [logs]
  );

  const avg = Number(metrics?.avgMileage) || 0;
  const lastTank = trend.length > 0 ? trend[trend.length - 1].mileage : 0;
  const delta = avg > 0 && lastTank > 0 ? lastTank - avg : 0;
  const fullTankRange = avg > 0 ? Math.round(avg * TANK_LITRES) : 0;
  const latestFills = [...logs].reverse().slice(0, 4);

  return (
    <div className="stagger space-y-5 md:space-y-6">
      {/* Page title */}
      <div>
        <h1 className="page-title text-slate-900">Pulsar N250</h1>
        <p className="text-[15px] text-slate-500 mt-1.5">
          {lastLog ? `Last refill ${shortDate(lastLog.date)}` : 'No refills logged yet'}
          {(metrics?.totalLogsCount || 0) > 0 && ` · ${metrics.totalLogsCount} fill-ups tracked`}
        </p>
      </div>

      {/* Instrument cluster */}
      <section className="cluster">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] items-center gap-2 lg:gap-6 px-5 sm:px-8 pt-6 pb-5">
          <ClusterGauge value={avg} caption="average" />

          <div className="min-w-0">
            {avg > 0 ? (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2 text-[13px]">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white/10 text-white font-medium">
                  {economyRating(avg)}
                </span>
                {lastTank > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/60">
                    Last tank
                    <span className="font-semibold text-white tabular">{lastTank.toFixed(1)}</span>
                    {Math.abs(delta) >= 0.1 && (
                      <span
                        className={`inline-flex items-center font-medium tabular ${
                          delta > 0 ? 'text-blue-400' : 'text-red-400'
                        }`}
                      >
                        {delta > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-white/60 text-center lg:text-left">
                Fill the tank to full twice and your real mileage shows up here.
              </p>
            )}

            {/* Tank-to-tank trend */}
            <div className="h-28 lg:h-36 mt-3 -mx-1">
              {trend.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 8, right: 6, bottom: 0, left: 6 }}>
                    <defs>
                      <linearGradient id="mileageFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin - 4', 'dataMax + 4']} />
                    <Tooltip
                      cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '3 3' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: 'none',
                        background: '#fff',
                        color: '#0b1220',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                        fontSize: 12,
                        padding: '6px 10px',
                      }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                      formatter={(value) => [`${Number(value).toFixed(1)} km/L`, 'Tank']}
                    />
                    <Area
                      type="monotone"
                      dataKey="mileage"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fill="url(#mileageFill)"
                      dot={{ r: 2.5, fill: '#ffffff', strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: '#e2231a', stroke: '#fff', strokeWidth: 1.5 }}
                      animationDuration={1200}
                      animationBegin={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[13px] text-white/40">
                  Mileage trend appears after a few full tanks
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cluster-road" aria-hidden="true" />

        {/* 1px gaps over a faint backdrop draw the dividers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          <Readout label="Odometer" unit="km" hint={`${(metrics?.totalDistance || 0).toLocaleString('en-IN')} km tracked`}>
            {latestOdo > 0 ? (
              <span className="odo" aria-label={`${latestOdo.toLocaleString('en-IN')} kilometres`}>
                {String(Math.round(latestOdo)).padStart(6, '0').split('').map((d, i) => (
                  <span key={i} aria-hidden="true">{d}</span>
                ))}
              </span>
            ) : (
              '—'
            )}
          </Readout>
          <Readout
            label="Range on a full tank"
            unit="km"
            hint={`${TANK_LITRES} L at your average`}
          >
            {fullTankRange > 0 ? <CountUp value={fullTankRange} delay={380} /> : '—'}
          </Readout>
          <Readout
            label="Running cost"
            unit="/km"
            hint={`${inr(metrics?.totalSpent || 0)} on ${(metrics?.totalLitres || 0).toFixed(1)} L`}
          >
            {(metrics?.costPerKm || 0) > 0 ? (
              <CountUp value={metrics.costPerKm} decimals={2} prefix="₹" delay={460} />
            ) : (
              '—'
            )}
          </Readout>
          <Readout label="Petrol price" unit="/L" hint="At your last refill">
            {(metrics?.latestFuelPrice || 0) > 0 ? (
              <CountUp value={metrics.latestFuelPrice} decimals={2} prefix="₹" delay={540} />
            ) : (
              '—'
            )}
          </Readout>
        </div>
      </section>

      {/* Bike health: service, chain, warranty */}
      <Reveal>
        <VehicleReadinessCard
          latestOdometer={latestOdo}
          services={services || []}
          isOwnerMode={isOwnerMode}
          onNavigateTab={onNavigateTab}
          onLubeLogged={onLubeLogged}
          onRequireOwner={onRequireOwner}
        />
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Recent refills */}
        <Reveal>
          <SectionCard
            title="Recent refills"
            icon={Fuel}
            actionLabel={latestFills.length > 0 ? 'All refills' : undefined}
            onAction={() => onNavigateTab('logs')}
          >
            {latestFills.length > 0 ? (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {latestFills.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {log.stationName || log.brand || 'Refill'}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-0.5 tabular">
                        {shortDate(log.date)} · {Number(log.fuelAmount || 0).toFixed(2)} L
                        {log.isFullTank ? ' · Full tank' : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900 tabular">{inr(log.totalCost)}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5 tabular">
                        {log.mileageCalculated ? `${Number(log.mileageCalculated).toFixed(1)} km/L` : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 pb-8 pt-4 text-center">
                <p className="text-sm text-slate-500">No refills yet.</p>
                <button type="button" onClick={onOpenLogModal} className="btn btn-secondary btn-sm mt-3">
                  Log your first refill
                </button>
              </div>
            )}
          </SectionCard>
        </Reveal>

        {/* Recent rides */}
        <Reveal delay={80}>
          <SectionCard
            title="Recent rides"
            icon={Compass}
            actionLabel={recentTrips.length > 0 ? 'All rides' : undefined}
            onAction={() => onNavigateTab('trips')}
          >
            {recentTrips.length > 0 ? (
              <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                {recentTrips.slice(0, 4).map((trip) => {
                  const km = trip.distanceCovered || trip.totalDistance;
                  const economy = trip.calculatedFuelEconomy || trip.avgFuelEconomy || trip.avgMileage;
                  return (
                    <li key={trip.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{trip.name}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5 tabular">
                          {km ? `${Number(km).toLocaleString('en-IN')} km` : '—'} · {trip.tripType}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900 tabular">{inr(trip.totalFuelCost)}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5 tabular">
                          {economy ? `${Number(economy).toFixed(1)} km/L` : '—'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-6 pb-8 pt-4 text-center">
                <p className="text-sm text-slate-500">No rides recorded yet.</p>
                <button type="button" onClick={() => onNavigateTab('trips')} className="btn btn-secondary btn-sm mt-3">
                  Add a ride
                </button>
              </div>
            )}
          </SectionCard>
        </Reveal>
      </div>
    </div>
  );
};
