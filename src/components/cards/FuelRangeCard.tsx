'use client';

import React from 'react';
import { FuelLog } from '@/types/fuel';
import { sortLogsByDate } from '@/lib/metrics';

const TANK_LITRES = 14;
const KEY = 'n250_live_odo';

/**
 * How much petrol is probably left. It needs today's odometer (the app only
 * learns the odometer at refills), so there is a field to type it in.
 */
export const FuelRangeCard: React.FC<{ logs: FuelLog[]; avgMileage: number }> = ({ logs, avgMileage }) => {
  const [live, setLive] = React.useState('');
  const [draft, setDraft] = React.useState('');

  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const v = localStorage.getItem(KEY) || '';
        setLive(v);
        setDraft(v);
      } catch {
        /* no storage */
      }
    });
  }, []);

  const last = sortLogsByDate(logs).slice(-1)[0];
  if (!last || avgMileage <= 0) return null;

  const odo = Number(live) || 0;
  const hasReading = odo >= last.odometer;
  const used = hasReading ? odo - last.odometer : 0;
  const left = Math.max(0, TANK_LITRES - used / avgMileage);
  const rangeLeft = Math.round(left * avgMileage);
  const pct = Math.round((left / TANK_LITRES) * 100);
  const low = hasReading && rangeLeft < 80;

  const save = () => {
    try {
      localStorage.setItem(KEY, draft);
    } catch {
      /* not saved */
    }
    setLive(draft);
  };

  return (
    <section className="card px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink-1">Fuel left</h2>
          {!last.isFullTank ? (
            <p className="text-[13px] text-ink-2 mt-0.5">Your last refill was not a full tank, so I cannot estimate. Fill to full next time.</p>
          ) : hasReading ? (
            <p className={`text-[14px] mt-0.5 tabular ${low ? 'text-accent font-medium' : 'text-ink-2'}`}>
              About {left.toFixed(1)} L, roughly {rangeLeft} km to empty{low ? '. Refill soon.' : '.'}
            </p>
          ) : (
            <p className="text-[13px] text-ink-2 mt-0.5">Type today&apos;s odometer to see how far you can go.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Odometer now"
            aria-label="Odometer now"
            className="w-36 h-9 px-3 rounded-lg border border-[var(--color-border)] bg-surface text-[14px] text-ink-1 tabular outline-none focus:border-slate-500"
          />
          <button type="button" onClick={save} className="btn btn-secondary btn-sm">Update</button>
        </div>
      </div>
      {last.isFullTank && hasReading && (
        <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${low ? 'bg-accent' : 'bg-[var(--color-data)]'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </section>
  );
};
