import { FuelLog } from '@/types/fuel';

export type MileageTotals = {
  /** Odometer distance covered in complete full-tank-to-full-tank segments. */
  distance: number;
  /** Fuel burned across those same segments. */
  litres: number;
  /** distance / litres, or null when there is not enough data to measure. */
  kmPerLitre: number | null;
  /** Number of measurable segments. */
  segments: number;
};

/**
 * Full-tank-to-full-tank fuel economy.
 *
 * The denominator must be the fuel burned *between* two full tanks, which is not
 * the same as summing a single row's `distanceCalculated` against its own
 * `fuelAmount`. `distanceCalculated` is the gap since the previous fill of any
 * kind, so mixing it with full-tank-only litres is a unit mismatch that
 * overstates economy.
 *
 * Partial top-ups in the middle of a segment are included in `litres` because
 * that fuel really was burned during that segment - the tank is topped back up
 * to full at each end, so the delta is known.
 */
export function computeMileageTotals(logs: FuelLog[]): MileageTotals {
  const empty: MileageTotals = { distance: 0, litres: 0, kmPerLitre: null, segments: 0 };
  if (!logs || logs.length < 2) return empty;

  const sorted = [...logs].sort((a, b) => {
    const t = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (!Number.isNaN(t) && t !== 0) return t;
    return a.odometer - b.odometer;
  });

  let lastFullTankOdo: number | null = null;
  let fuelSinceLastFull = 0;
  let distance = 0;
  let litres = 0;
  let segments = 0;

  for (const log of sorted) {
    fuelSinceLastFull += log.fuelAmount;

    if (log.isFullTank) {
      if (lastFullTankOdo !== null) {
        const segmentDist = log.odometer - lastFullTankOdo;
        if (segmentDist > 0 && fuelSinceLastFull > 0) {
          distance += segmentDist;
          litres += fuelSinceLastFull;
          segments += 1;
        }
      }
      lastFullTankOdo = log.odometer;
      fuelSinceLastFull = 0;
    }
  }

  return {
    distance: Number(distance.toFixed(2)),
    litres: Number(litres.toFixed(3)),
    kmPerLitre: litres > 0 ? Number((distance / litres).toFixed(2)) : null,
    segments,
  };
}

export type GroupTotals = {
  fills: number;
  litres: number;
  spent: number;
  /** spend / litres. Exact - unlike a per-group economy figure, this needs no
   *  segment attribution. */
  costPerLitre: number | null;
  litresShare: number;
  spentShare: number;
};

/**
 * Splits logs by a key and returns spend/volume aggregates.
 *
 * Deliberately does NOT report a per-group km/L. A full-tank segment's fuel can
 * span several fills from different brands or trip types, so there is no way to
 * attribute that segment's economy to a single group without double-counting
 * distance. Litres, spend and cost-per-litre are exact, so those are reported
 * instead of a number that looks meaningful but is not.
 */
export function groupTotals(
  logs: FuelLog[],
  keyOf: (log: FuelLog) => string
): Map<string, GroupTotals> {
  const map = new Map<string, GroupTotals>();
  let totalLitres = 0;
  let totalSpent = 0;

  for (const log of logs) {
    const key = keyOf(log);
    const entry = map.get(key) ?? {
      fills: 0,
      litres: 0,
      spent: 0,
      costPerLitre: null,
      litresShare: 0,
      spentShare: 0,
    };
    entry.fills += 1;
    entry.litres += log.fuelAmount;
    entry.spent += log.totalCost;
    map.set(key, entry);
    totalLitres += log.fuelAmount;
    totalSpent += log.totalCost;
  }

  for (const entry of map.values()) {
    entry.litres = Number(entry.litres.toFixed(2));
    entry.spent = Number(entry.spent.toFixed(2));
    entry.costPerLitre = entry.litres > 0 ? Number((entry.spent / entry.litres).toFixed(2)) : null;
    entry.litresShare = totalLitres > 0 ? Number(((entry.litres / totalLitres) * 100).toFixed(1)) : 0;
    entry.spentShare = totalSpent > 0 ? Number(((entry.spent / totalSpent) * 100).toFixed(1)) : 0;
  }

  return map;
}

/** Total cost per km across the whole log, using odometer span. */
export function costPerKm(logs: FuelLog[]): number | null {
  if (!logs || logs.length < 2) return null;

  const sorted = [...logs].sort((a, b) => a.odometer - b.odometer);
  const distance = sorted[sorted.length - 1].odometer - sorted[0].odometer;
  if (!(distance > 0)) return null;

  const spent = sorted.reduce((sum, l) => sum + l.totalCost, 0);
  return Number((spent / distance).toFixed(2));
}
