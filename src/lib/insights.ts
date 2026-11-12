import { FuelLog } from '@/types/fuel';
import { computeFullTankSegments, sortLogsByDate } from '@/lib/metrics';
import type { ConsoleEntry } from '@/lib/care';

export interface Insight {
  tone: 'warn' | 'good';
  title: string;
  body: string;
}

/** Upkeep items that visibly change fuel economy when they are neglected. */
const MILEAGE_LINKED = ['tyre-pressure', 'chain-lube', 'chain-slack', 'air-filter', 'spark-plug', 'throttle-body', 'engine-oil'];

const weighted = (segs: { distance: number; fuel: number }[]) => {
  const d = segs.reduce((s, x) => s + x.distance, 0);
  const f = segs.reduce((s, x) => s + x.fuel, 0);
  return f > 0 ? d / f : 0;
};

/**
 * Compares the last two full tanks with everything before them. If mileage moved by
 * 8% or more, say so, and name any overdue upkeep that is known to cost mileage.
 */
export function mileageInsight(logs: FuelLog[], entries: ConsoleEntry[]): Insight | null {
  const segs = computeFullTankSegments(sortLogsByDate(logs)).filter((s) => s.mileage);
  if (segs.length < 4) return null;

  const recent = weighted(segs.slice(-2));
  const before = weighted(segs.slice(0, -2));
  if (!recent || !before) return null;

  const change = (recent - before) / before;
  const pct = Math.round(Math.abs(change) * 100);

  if (change <= -0.08) {
    const linked = entries.filter((e) => MILEAGE_LINKED.includes(e.id) && (e.severity === 'overdue' || e.severity === 'warn'));
    const names = linked.map((e) => e.label.toLowerCase()).join(', ');
    return {
      tone: 'warn',
      title: `Mileage is down ${pct}%`,
      body:
        `The last two tanks gave ${recent.toFixed(1)} km/L, against ${before.toFixed(1)} before. ` +
        (linked.length > 0
          ? `Due on the console: ${names}. Neglected, these cost mileage.`
          : 'Nothing on the console is due, so check tyre pressure, wind, traffic and how you have been riding.'),
    };
  }
  if (change >= 0.08) {
    return {
      tone: 'good',
      title: `Mileage is up ${pct}%`,
      body: `The last two tanks gave ${recent.toFixed(1)} km/L, against ${before.toFixed(1)} before.`,
    };
  }
  return null;
}
