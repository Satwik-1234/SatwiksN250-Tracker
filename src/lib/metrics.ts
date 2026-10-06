import { FuelLog } from '@/types/fuel';

/**
 * Single source of truth for fuel-economy math.
 * Units: km, litres, ₹, km/L. Mileage uses the standard
 * full-tank-to-full-tank method (fuel accumulated between two full fills).
 */

export const ECONOMY_THRESHOLDS = {
  excellent: 40,
  good: 35,
  average: 25,
} as const;

export type EconomyRating = 'Excellent' | 'Good' | 'Average' | 'Poor';

export function economyRating(kmpl: number): EconomyRating {
  if (kmpl >= ECONOMY_THRESHOLDS.excellent) return 'Excellent';
  if (kmpl >= ECONOMY_THRESHOLDS.good) return 'Good';
  if (kmpl >= ECONOMY_THRESHOLDS.average) return 'Average';
  return 'Poor';
}

export interface FuelSegment {
  distance: number;
  fuel: number;
  mileage?: number;
  startIndex: number;
  endIndex: number;
}

export function sortLogsByDate(logs: FuelLog[]): FuelLog[] {
  return [...logs].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
  });
}

/**
 * Walk logs chronologically and return closed full-tank-to-full-tank segments.
 * Fuel from partial fills between two full fills belongs to the closing segment.
 */
export function computeFullTankSegments(logs: FuelLog[]): FuelSegment[] {
  const sorted = sortLogsByDate(logs);
  const segments: FuelSegment[] = [];

  let lastFullTankOdo: number | null = null;
  let fuelSinceLastFull = 0;
  let startIndex = 0;

  sorted.forEach((log, i) => {
    const curOdo = Number(log.odometer) || 0;
    fuelSinceLastFull += Number(log.fuelAmount) || 0;

    if (log.isFullTank) {
      if (lastFullTankOdo !== null) {
        const distance = curOdo - lastFullTankOdo;
        if (distance > 0 && fuelSinceLastFull > 0) {
          segments.push({
            distance: Number(distance.toFixed(1)),
            fuel: Number(fuelSinceLastFull.toFixed(3)),
            mileage: Number((distance / fuelSinceLastFull).toFixed(2)),
            startIndex,
            endIndex: i,
          });
        }
      }
      lastFullTankOdo = curOdo;
      fuelSinceLastFull = 0;
      startIndex = i;
    }
  });

  return segments;
}

/**
 * Fuel-weighted average mileage: Σsegment distance / Σsegment fuel.
 * Returns 0 when there is no closed full-tank segment yet.
 */
export function averageMileage(logs: FuelLog[]): number {
  const segments = computeFullTankSegments(logs);
  if (segments.length === 0) return 0;
  const totalDistance = segments.reduce((s, seg) => s + seg.distance, 0);
  const totalFuel = segments.reduce((s, seg) => s + seg.fuel, 0);
  return totalFuel > 0 ? Number((totalDistance / totalFuel).toFixed(2)) : 0;
}

export function averagePricePerLitre(logs: FuelLog[]): number {
  let totalSpent = 0;
  let totalLitres = 0;
  logs.forEach((l) => {
    totalSpent += Number(l.totalCost) || 0;
    totalLitres += Number(l.fuelAmount) || 0;
  });
  return totalLitres > 0 ? Number((totalSpent / totalLitres).toFixed(2)) : 0;
}

/**
 * Cost per km computed from full-tank segments only, so the opening fill
 * (which was bought before the measured distance began) is excluded.
 */
export function segmentCostPerKm(logs: FuelLog[]): number {
  const sorted = sortLogsByDate(logs);
  const segments = computeFullTankSegments(sorted);
  if (segments.length === 0) return 0;

  let segmentCost = 0;
  let segmentDistance = 0;
  segments.forEach((seg) => {
    segmentDistance += seg.distance;
    for (let i = seg.startIndex; i <= seg.endIndex; i++) {
      segmentCost += Number(sorted[i]?.totalCost) || 0;
    }
  });
  return segmentDistance > 0 ? Number((segmentCost / segmentDistance).toFixed(2)) : 0;
}

/**
 * Fuel still "open" since the last full tank: distance run and fuel that
 * will belong to the next closed segment (previous partials + this fill).
 */
export function pendingSegment(logs: FuelLog[]): { lastFullTankOdo: number | null; fuelSinceFull: number } {
  const sorted = sortLogsByDate(logs);
  let lastFullTankOdo: number | null = null;
  let fuelSinceLastFull = 0;

  for (const log of sorted) {
    fuelSinceLastFull += Number(log.fuelAmount) || 0;
    if (log.isFullTank) {
      lastFullTankOdo = Number(log.odometer) || 0;
      fuelSinceLastFull = 0;
    }
  }
  return { lastFullTankOdo, fuelSinceFull: fuelSinceLastFull };
}

/**
 * Preview mileage for a not-yet-saved fill: distance since the last full
 * tank over fuel burnt since that fill (previous partials + this fill).
 * Mirrors recalculateDerivedFields so the modal shows what will be stored.
 */
export function previewMileage(logs: FuelLog[], newOdometer: number, newFuel: number): number {
  const { lastFullTankOdo, fuelSinceFull } = pendingSegment(logs);
  const totalFuel = fuelSinceFull + (Number(newFuel) || 0);
  const distance = lastFullTankOdo !== null ? newOdometer - lastFullTankOdo : 0;
  if (distance > 0 && totalFuel > 0) return Number((distance / totalFuel).toFixed(2));
  return 0;
}

/**
 * Clean leading dashes, bullets, and whitespace from station name.
 * e.g. "- Reliance BP Mobility limited karad" -> "Reliance BP Mobility limited karad"
 */
export function cleanStationName(stationName?: string | null): string {
  if (!stationName) return 'Petrol Station';
  return stationName.replace(/^[-—•\s]+/, '').trim() || 'Petrol Station';
}

/**
 * Normalizes fuel station brand names according to real-world Indian pump networks.
 * Reliance and Jio-BP are the exact same brand ('Jio-BP').
 */
export function normalizeBrand(brand?: string | null, stationName?: string | null): string {
  const combined = `${brand || ''} ${stationName || ''}`.trim().toLowerCase();

  // Reliance and Jio-BP are the same entity
  if (combined.includes('jio') || combined.includes('reliance')) {
    return 'Jio-BP';
  }
  if (
    combined.includes('iocl') ||
    combined.includes('indian oil') ||
    combined.includes('praveen') ||
    combined.includes('saraswati')
  ) {
    return 'IOCL';
  }
  if (
    combined.includes('nayara') ||
    combined.includes('nyara') ||
    combined.includes('vijayshree') ||
    combined.includes('raj')
  ) {
    return 'Nayara';
  }
  if (
    combined.includes('bpcl') ||
    combined.includes('bharat petroleum') ||
    combined.includes('konduskar')
  ) {
    return 'BPCL';
  }
  if (combined.includes('hpcl') || combined.includes('hindustan petroleum')) {
    return 'HPCL';
  }
  if (combined.includes('shell')) {
    return 'Shell';
  }

  // If explicit brand was provided (and not a dash/empty)
  const clean = (brand || '').replace(/^[-—\s]+/, '').trim();
  if (clean && clean !== '-') {
    return clean;
  }

  // Extract from cleaned station name
  const stn = cleanStationName(stationName);
  const first = stn.split(/\s+/)[0];
  if (first && first !== '-' && first !== 'Petrol') {
    return first;
  }

  return 'Jio-BP';
}

/**
 * Deduplicate an array of fuel logs by unique odometer reading and ID.
 * Since a motorcycle odometer strictly increases with each fill-up, duplicate entries
 * sharing the same odometer reading are collapsed to the best/most complete record.
 */
export function deduplicateLogs(logs: FuelLog[]): FuelLog[] {
  if (!Array.isArray(logs) || logs.length === 0) return [];
  const map = new Map<string, FuelLog>();

  for (const log of logs) {
    const odo = Math.round((Number(log.odometer) || 0) * 10) / 10;
    const key = odo > 0 ? `odo:${odo}` : `id:${log.id || 'unknown'}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, log);
    } else {
      // Score richness to keep the most complete entry
      const existingScore =
        (existing.brand && existing.brand !== '-' ? 3 : 0) +
        (existing.stationName && !existing.stationName.startsWith('-') ? 2 : 0) +
        (Number(existing.totalCost) > 0 ? 1 : 0);
      const newScore =
        (log.brand && log.brand !== '-' ? 3 : 0) +
        (log.stationName && !log.stationName.startsWith('-') ? 2 : 0) +
        (Number(log.totalCost) > 0 ? 1 : 0);

      if (newScore > existingScore) {
        map.set(key, log);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
  });
}
