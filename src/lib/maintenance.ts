import { ChainLubeRecord, ServiceLog } from '@/types/fuel';

export const N250_MAINTENANCE_SCHEDULE = [
  { id: 1, name: '1st Free Service', km: 750, range: '500 – 750 km (30–45d)', tasks: 'Engine oil replace (1300 ml 20W50), oil filter replace, strainer clean, chain slack (20-30 mm), valve clearance inspect' },
  { id: 2, name: '2nd Free Service', km: 5000, range: '4,500 – 5,000 km (240d)', tasks: 'Engine oil top-up, spark plug clean & gap (0.8-0.9 mm), air filter clean, brake pad check, chain lube & slack' },
  { id: 3, name: '3rd Free Service', km: 10000, range: '9,500 – 10,000 km (360d)', tasks: 'Engine oil replace (1300 ml) & oil filter replace, strainer clean, air filter replace, chain care' },
  { id: 4, name: '4th Paid Service', km: 15000, range: '14,500 – 15,000 km (480d)', tasks: 'Engine oil top-up, general chassis inspection, chain clean & lube, brake inspection' },
  { id: 5, name: '5th Paid Service', km: 20000, range: '19,500 – 20,000 km (600d)', tasks: 'Engine oil replace & filter replace, air filter replace, fuel filter inspect, valve clearance inspect' },
  { id: 6, name: '6th Paid Service', km: 25000, range: '24,500 – 25,000 km (720d)', tasks: 'Engine oil top-up, oil cooler fins clean, chain slider inspect, brake pad check' },
  { id: 7, name: '7th Paid Service', km: 30000, range: '29,500 – 30,000 km (840d)', tasks: 'Engine oil replace & filter replace, spark plug REPLACE (mandatory @ 30k km), brake fluid replace' },
  { id: 8, name: '8th Paid Service', km: 35000, range: '34,500 – 35,000 km (960d)', tasks: 'Engine oil top-up, general maintenance & chain care' },
  { id: 9, name: '9th Paid Service', km: 40000, range: '39,500 – 40,000 km (1080d)', tasks: 'Engine oil replace & filter replace, fuel pipe replace (every 40k km / 3 yrs), air filter replace' },
  { id: 10, name: '10th Paid Service', km: 45000, range: '44,500 – 45,000 km (1200d)', tasks: 'Engine oil top-up, drive chain & sprocket wear check' },
  { id: 11, name: '11th Paid Service', km: 50000, range: '49,500 – 50,000 km (1320d)', tasks: 'Engine oil replace & filter replace, air filter replace, valve clearance check' },
  { id: 12, name: '12th Paid Service', km: 55000, range: '54,500 – 55,000 km (1440d)', tasks: 'Engine oil top-up, general tune-up' },
  { id: 13, name: '13th Paid Service', km: 60000, range: '59,500 – 60,000 km (1560d)', tasks: 'Engine oil replace & filter replace, spark plug REPLACE (2nd replacement @ 60k km), air filter replace' },
  { id: 14, name: '14th Paid Service', km: 65000, range: '64,500 – 65,000 km (1680d)', tasks: 'Engine oil top-up, general chassis inspection' },
  { id: 15, name: '15th Paid Service', km: 70000, range: '69,500 – 70,000 km (1800d)', tasks: 'Engine oil replace & filter replace, air filter replace' },
  { id: 16, name: '16th Paid Service', km: 75000, range: '74,500 – 75,000 km (5 Yrs)', tasks: '5-Year / 75,000 km OEM Warranty completion milestone! Full overhaul inspection' },
];

const SERVICE_MILESTONES = [750, 4500, 10000, 15000, 20000, 25000];

export interface ServiceWindow {
  nextTargetKm: number;
  kmRemaining: number;
  intervalName: string;
  targetRange: string;
  progressPercent: number;
  isDue: boolean;
}

export function getServiceWindow(latestOdo: number): ServiceWindow {
  const nextTargetKm =
    SERVICE_MILESTONES.find((km) => km > latestOdo) ||
    Math.ceil((latestOdo + 1) / 5000) * 5000;
  const kmRemaining = Math.max(0, nextTargetKm - latestOdo);

  const interval =
    N250_MAINTENANCE_SCHEDULE.find((i) => i.km >= nextTargetKm) ||
    N250_MAINTENANCE_SCHEDULE[N250_MAINTENANCE_SCHEDULE.length - 1];

  // Progress must be measured across the CURRENT service interval — from the
  // previous completed service target (or 0 km for the first one) to the next
  // one — never from odometer zero (odo/intervalKm showed ~84% at 4,180 km
  // because the 5,000-km 2nd service barely started).
  const completedTargets = N250_MAINTENANCE_SCHEDULE
    .map((i) => i.km)
    .filter((km) => km <= latestOdo);
  const previousTargetKm = completedTargets.length > 0
    ? Math.max(...completedTargets)
    : 0;
  const intervalSpan = Math.max(1, interval.km - previousTargetKm);
  const progressRaw = Math.round(((latestOdo - previousTargetKm) / intervalSpan) * 100);

  return {
    nextTargetKm,
    kmRemaining,
    intervalName: interval.name,
    targetRange: interval.range.split('(')[0].trim(),
    progressPercent: Math.min(100, Math.max(0, progressRaw)),
    isDue: kmRemaining <= 500,
  };
}

export interface WarrantySummary {
  isActive: boolean;
  validUntil: string;
  kmCoveredRemaining: number;
  freeServicesRemaining: number;
}

export function getWarrantySummary(latestOdo: number, purchaseDate = '2026-05-24', services?: ServiceLog[]): WarrantySummary {
  const start = new Date(purchaseDate);
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 5);

  const freeIntervals = [750, 5000, 10000];
  return {
    isActive: new Date() <= end && latestOdo < 75000,
    validUntil: end.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    kmCoveredRemaining: Math.max(0, 75000 - latestOdo),
    freeServicesRemaining: services
      ? evaluateSchedule(latestOdo, services).slice(0, 3).filter((r) => r.state === 'due' || r.state === 'upcoming').length
      : freeIntervals.filter((km) => latestOdo < km).length,
  };
}

export interface ChainSummary {
  lastLubeOdometer: number;
  kmSinceLube: number;
  kmRemaining: number;
  status: 'healthy' | 'attention' | 'overdue';
}

export function getChainSummary(latestOdo: number, record: ChainLubeRecord): ChainSummary {
  const kmSinceLube = Math.max(0, latestOdo - record.lastLubeOdometer);
  const kmRemaining = Math.max(0, 500 - kmSinceLube);
  return {
    lastLubeOdometer: record.lastLubeOdometer,
    kmSinceLube,
    kmRemaining,
    status: kmSinceLube >= 500 ? 'overdue' : kmSinceLube >= 400 ? 'attention' : 'healthy',
  };
}


// ---------------------------------------------------------------------------
// Schedule evaluation (Pulsar N250 owner manual, "Periodic Maintenance Chart")
//  - Free services: 1st at 500-750 km, 2nd at 4,500-5,000 km, 3rd at 9,500-10,000 km.
//  - Paid services: every 5,000 km, and the warranty needs each one within
//    5,000 km or 120 days of the last service, whichever comes first.
//  - The warranty also needs the three free services "without lapse".
// ---------------------------------------------------------------------------

export const SERVICE_DAYS_LIMIT = 120;

export type ServiceState = 'done' | 'late' | 'missed' | 'due' | 'upcoming';

export interface ScheduleRow {
  interval: (typeof N250_MAINTENANCE_SCHEDULE)[number];
  /** Odometer window in which the manual wants this service done. */
  lo: number;
  hi: number;
  state: ServiceState;
  record?: ServiceLog;
}

/** A periodic service record, as opposed to a wash, repair or part change. */
export const isPeriodicService = (s: ServiceLog): boolean =>
  /service/i.test(s.serviceType || '') && !/wash/i.test(s.serviceType || '');

export function evaluateSchedule(odometer: number, services: ServiceLog[]): ScheduleRow[] {
  const records = services.filter(isPeriodicService).sort((a, b) => (a.odometer || 0) - (b.odometer || 0));
  const all = N250_MAINTENANCE_SCHEDULE;
  return all.map((interval, i) => {
    const lo = interval.id === 1 ? 500 : interval.km - 500;
    const hi = interval.id === 1 ? 750 : interval.km;
    const nextLo = i < all.length - 1 ? all[i + 1].km - 500 : Infinity;
    const record = records.find((r) => (r.odometer || 0) >= lo && (r.odometer || 0) < nextLo);
    let state: ServiceState;
    if (record) state = (record.odometer || 0) <= hi ? 'done' : 'late';
    else if (odometer > hi) state = 'missed';
    else if (odometer >= lo) state = 'due';
    else state = 'upcoming';
    return { interval, lo, hi, state, record };
  });
}

export interface ServiceStatus {
  severity: 'good' | 'fair' | 'warn' | 'overdue';
  headline: string;
  detail: string;
  /** Km to the end of the next window (negative once past it). */
  kmLeft: number | null;
  daysLeft: number | null;
  progress: number;
  next: ScheduleRow | null;
  missed: ScheduleRow | null;
}

const dayDiff = (fromIso: string, to: Date) => {
  const a = new Date(fromIso.slice(0, 10) + 'T00:00:00').getTime();
  return isNaN(a) ? 0 : Math.max(0, Math.round((to.getTime() - a) / 86400000));
};
const fmtKm = (n: number) => n.toLocaleString('en-IN');

export function serviceStatus(odometer: number, services: ServiceLog[], now: Date = new Date()): ServiceStatus {
  const rows = evaluateSchedule(odometer, services);
  const missed = rows.find((r) => r.state === 'missed') || null;
  const next = rows.find((r) => r.state === 'due' || r.state === 'upcoming') || null;

  // The 120-day rule applies to the paid services, i.e. once the free ones are on record.
  const freeOnRecord = rows.slice(0, 3).every((r) => r.record);
  const last = rows.filter((r) => r.record).pop()?.record;
  const daysLeft = freeOnRecord && last?.date ? SERVICE_DAYS_LIMIT - dayDiff(last.date, now) : null;

  if (missed) {
    return {
      severity: 'overdue',
      headline: `${missed.interval.name} not logged`,
      detail: `Its window (${fmtKm(missed.lo)}-${fmtKm(missed.hi)} km) has passed. Log it if it was done, or ask your dealer.`,
      kmLeft: missed.hi - odometer,
      daysLeft,
      progress: 100,
      next,
      missed,
    };
  }
  if (!next) {
    return { severity: 'good', headline: 'Schedule complete', detail: 'All 16 services are on record.', kmLeft: null, daysLeft, progress: 100, next: null, missed: null };
  }

  const toWindow = next.lo - odometer;
  let severity: ServiceStatus['severity'] = next.state === 'due' ? 'warn' : toWindow <= 500 ? 'fair' : 'good';
  if (daysLeft !== null) {
    if (daysLeft <= 0) severity = 'overdue';
    else if (daysLeft <= 15) severity = 'warn';
    else if (daysLeft <= 30 && severity === 'good') severity = 'fair';
  }
  const prev = rows[rows.indexOf(next) - 1];
  const prevHi = prev ? prev.hi : 0;
  const progress = Math.max(0, Math.min(100, Math.round(((odometer - prevHi) / Math.max(1, next.hi - prevHi)) * 100)));
  return {
    severity,
    headline: next.interval.name,
    detail: `Window ${fmtKm(next.lo)}-${fmtKm(next.hi)} km${daysLeft !== null ? ` or within ${SERVICE_DAYS_LIMIT} days of the last service` : ''}`,
    kmLeft: next.hi - odometer,
    daysLeft,
    progress,
    next,
    missed: null,
  };
}


/** Which scheduled service (1-16) an odometer reading falls in, or null if before the first window. */
export function serviceNumberForOdometer(odometer: number): number | null {
  const all = N250_MAINTENANCE_SCHEDULE;
  for (let i = 0; i < all.length; i++) {
    const lo = all[i].id === 1 ? 500 : all[i].km - 500;
    const nextLo = i < all.length - 1 ? all[i + 1].km - 500 : Infinity;
    if (odometer >= lo && odometer < nextLo) return all[i].id;
  }
  return null;
}

/** Delivery date of the bike (owner's purchase date). */
export const BIKE_PURCHASE_DATE = '2026-05-24';
