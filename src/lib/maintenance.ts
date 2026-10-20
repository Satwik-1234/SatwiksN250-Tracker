import { ChainLubeRecord } from '@/types/fuel';

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

  return {
    nextTargetKm,
    kmRemaining,
    intervalName: interval.name,
    targetRange: interval.range.split('(')[0].trim(),
    progressPercent: Math.min(100, Math.max(0, Math.round((latestOdo / interval.km) * 100))),
    isDue: kmRemaining <= 500,
  };
}

export interface WarrantySummary {
  isActive: boolean;
  validUntil: string;
  kmCoveredRemaining: number;
  freeServicesRemaining: number;
}

export function getWarrantySummary(latestOdo: number, purchaseDate = '2026-05-24'): WarrantySummary {
  const start = new Date(purchaseDate);
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 5);

  const freeIntervals = [750, 5000, 10000];
  return {
    isActive: new Date() <= end && latestOdo < 75000,
    validUntil: end.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    kmCoveredRemaining: Math.max(0, 75000 - latestOdo),
    freeServicesRemaining: freeIntervals.filter((km) => latestOdo < km).length,
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
