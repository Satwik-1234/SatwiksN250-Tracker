'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDownRight, Fuel } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { VehicleReadinessCard } from '@/components/cards/VehicleReadinessCard';
import { JourneyCard } from '@/components/cards/JourneyCard';
import { FuelRangeCard } from '@/components/cards/FuelRangeCard';
import { ClusterGauge } from '@/components/ui/ClusterGauge';
import { ClusterTelltales, TelltaleItem } from '@/components/ui/ClusterTelltales';
import { CountUp, Reveal } from '@/components/ui/Motion';
import { computeFullTankSegments, sortLogsByDate, economyRating, estimateTank } from '@/lib/metrics';
import { CareState, markCareDone, consoleEntries, ensureBaselines, severityRank } from '@/lib/care';
import { mileageInsight } from '@/lib/insights';
import { StorageService } from '@/services/googleSheetsService';
import { saveCareToCloud, syncCareFromCloud } from '@/services/careService';
import { DashboardMetrics, FuelLog, Trip, ServiceLog, AccessoryGear } from '@/types/fuel';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentLogs: FuelLog[];
  recentTrips: Trip[];
  services?: ServiceLog[];
  accessories?: AccessoryGear[];
  onOpenLogModal: () => void;
  onNavigateTab: (tab: 'console' | 'analytics' | 'trips' | 'logs' | 'settings' | 'services' | 'accessories' | 'parts' | 'notes') => void;
  isOwnerMode: boolean;
  onLubeLogged?: () => void;
  onRequireOwner?: () => void;
  /** Logs a quick periodic-service record so the service light clears. */
  onQuickService?: (odometer: number) => void;
}


/** Pulsar N250 tank capacity in litres. */
import { TANK_LITRES } from '@/lib/bikeConstants';

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
      <h2 className="text-[15px] font-semibold text-ink-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink-3" />
        {title}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="group text-[13px] font-medium text-ink-1 hover:text-accent flex items-center gap-1"
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
  onQuickService,
}) => {
  const logs = React.useMemo(() => sortLogsByDate(recentLogs || []), [recentLogs]);

  const latestOdo = logs.length > 0 ? Math.max(...logs.map((l) => Number(l.odometer) || 0)) : 0;
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;

  // Care state is owned here so the telltale lamps and the Routine-care card
  // always agree. Marking a lamp done updates both at once.
  const [careState, setCareState] = React.useState<CareState>(() => StorageService.getCareState());
  React.useEffect(() => {
    queueMicrotask(() => {
      const local = StorageService.getCareState();
      setCareState(local);
      syncCareFromCloud(local).then(({ state }) => {
        StorageService.saveCareState(state);
        setCareState(state);
      });
    });
  }, []);
  // Baselines use the live odometer, so wait until it stops changing.
  React.useEffect(() => {
    if (latestOdo <= 0) return;
    const t = setTimeout(() => {
      const fresh = StorageService.getCareState();
      const seeded = ensureBaselines(fresh, latestOdo);
      if (seeded !== fresh) {
        StorageService.saveCareState(seeded);
        setCareState(seeded);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [latestOdo]);

  const markDone = React.useCallback(
    (taskId: string) => {
      const next = markCareDone(careState, taskId, latestOdo);
      setCareState(next);
      StorageService.saveCareState(next);
      void saveCareToCloud(next, { taskId, date: new Date().toISOString().split('T')[0], odometer: latestOdo || null });
      onLubeLogged?.();
    },
    [careState, latestOdo, onLubeLogged]
  );

  // Lamps: most urgent first, so a fault is never hidden behind a healthy lamp.
  const lampEntries = React.useMemo(
    () => consoleEntries(careState, latestOdo, services || []),
    [careState, latestOdo, services]
  );
  const insight = React.useMemo(() => mileageInsight(logs, lampEntries), [logs, lampEntries]);
  const telltales: TelltaleItem[] = [...lampEntries]
    .sort((x, y) => severityRank(y.severity) - severityRank(x.severity) || y.progress - x.progress)
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      label: e.label,
      icon: e.icon,
      severity: e.severity,
      onAck: () =>
        isOwnerMode ? (e.kind === 'service' ? onQuickService?.(latestOdo) : markDone(e.id)) : onRequireOwner?.(),
    }));

  // Tank-to-tank mileage history drives the trend line and the "last tank" delta.
  const trend = React.useMemo(
    () =>
      computeFullTankSegments(logs)
        .filter((seg) => typeof seg.mileage === 'number')
        .map((seg) => ({ date: shortDate(logs[seg.endIndex]?.date), mileage: seg.mileage as number })),
    [logs]
  );

  // Today's odometer and bars typed into the Fuel left card (kept in this browser) feed the estimate too.
  const [liveVals, setLiveVals] = React.useState<{ odometer: number; bars: number }>({ odometer: 0, bars: 0 });
  React.useEffect(() => {
    const read = () => {
      try {
        setLiveVals({ odometer: Number(localStorage.getItem('n250_live_odo')) || 0, bars: Number(localStorage.getItem('n250_live_bars')) || 0 });
      } catch {
        /* no storage */
      }
    };
    queueMicrotask(read);
    window.addEventListener('n250:live', read);
    return () => window.removeEventListener('n250:live', read);
  }, []);

  // Partial fills do not close a tank, so the closed-tank average alone would sit still until the next
  // full fill. The estimate also counts the open stretch (history + bars), so it moves with every entry.
  const est = React.useMemo(() => estimateTank(logs, liveVals), [logs, liveVals]);
  const closedAvg = Number(metrics?.avgMileage) || 0;
  // Estimator blends history + bars + current odo — use it when available
  const avg = est && est.mileage > 0 ? est.mileage : closedAvg;
  const openTank = est && est.openKm > 0 && est.openMileage > 0 ? est.openMileage : 0;
  const lastTank = openTank || (trend.length > 0 ? trend[trend.length - 1].mileage : 0);
  const delta = closedAvg > 0 && lastTank > 0 ? lastTank - closedAvg : 0;
  const shownOdo = latestOdo;
  const fullTankRange = avg > 0 ? Math.round(avg * TANK_LITRES) : 0;
  const latestFills = [...logs].reverse().slice(0, 4);

  return (
    <div className="stagger space-y-5 md:space-y-6">
      {insight && (
        <section className="card px-5 py-4 flex items-start gap-3.5">
          <span
            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${insight.tone === 'warn' ? 'bg-accent' : 'bg-[var(--color-data)]'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink-1">{insight.title}</h2>
            <p className="text-[14px] text-ink-2 mt-0.5 leading-relaxed">{insight.body}</p>
          </div>
          {insight.tone === 'warn' && (
            <button
              type="button"
              onClick={() => onNavigateTab('console')}
              className="text-[13px] font-medium text-ink-1 hover:text-accent shrink-0 mt-0.5"
            >
              Open console
            </button>
          )}
        </section>
      )}

      {/* Instrument cluster */}
      <section className="cluster">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] items-center gap-2 lg:gap-6 px-5 sm:px-8 pt-6 pb-5">
          <ClusterGauge value={avg} caption={openTank ? 'average, incl. this tank' : 'average'} />

          <div className="min-w-0">
            {avg > 0 ? (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2 text-[13px]">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white/10 text-white font-medium">
                  {economyRating(avg)}
                </span>
                {lastTank > 0 && (
                  <span className="inline-flex items-center gap-1 text-white/60">
                    {openTank ? 'This tank, so far' : 'Last tank'}
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

        {/* Telltale warning lights — glow when upkeep is due, dark when okay */}
        <div className="px-5 sm:px-8 pb-5 flex items-center justify-between gap-4">
          <ClusterTelltales items={telltales} />
          <button
            type="button"
            onClick={() => onNavigateTab('console')}
            className="text-[12px] text-white/60 hover:text-white flex items-center gap-1 shrink-0"
          >
            Open console <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="cluster-road" aria-hidden="true" />

        {/* 1px gaps over a faint backdrop draw the dividers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          <Readout label="Odometer" unit="km" hint={`${(metrics?.totalDistance || 0).toLocaleString('en-IN')} km on the clock`}>
            {shownOdo > 0 ? (
              <span className="odo" aria-label={`${shownOdo.toLocaleString('en-IN')} kilometres`}>
                {String(Math.round(shownOdo)).padStart(6, '0').split('').map((d, i) => (
                  <span key={i} aria-hidden="true">{d}</span>
                ))}
              </span>
            ) : (
              '—'
            )}
          </Readout>
          <Readout
            label={est && avg > 0 ? 'Range left' : 'Range on a full tank'}
            unit="km"
            hint={est && avg > 0 ? `about ${est.litresNow.toFixed(1)} L in the tank · ${fullTankRange} km when full` : `${TANK_LITRES} L at your average`}
          >
            {est && avg > 0 ? <CountUp value={Math.round(est.litresNow * avg)} delay={380} /> : fullTankRange > 0 ? <CountUp value={fullTankRange} delay={380} /> : '—'}
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

      {/* Bike health: next service + warranty */}
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

      <Reveal delay={20}>
        <JourneyCard logs={logs} odometer={latestOdo} />
      </Reveal>

      <Reveal delay={40}>
        <FuelRangeCard logs={logs} avgMileage={avg} />
      </Reveal>

    </div>
  );
};
