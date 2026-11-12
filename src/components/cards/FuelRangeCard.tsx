'use client';

import React from 'react';
import { FuelLog } from '@/types/fuel';
import { estimateTank, TANK_LITRES } from '@/lib/metrics';

const KEY = 'n250_live_odo';

/**
 * How much petrol is probably left. It needs today's odometer (the app only
 * learns the odometer at refills), so there is a field to type it in.
 */
export const FuelRangeCard: React.FC<{ logs: FuelLog[]; avgMileage: number }> = ({ logs, avgMileage }) => {
  const [live, setLive] = React.useState('');
  const [draft, setDraft] = React.useState('');
  const [barsNow, setBarsNow] = React.useState('');
  const [dteNow, setDteNow] = React.useState('');

  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const v = localStorage.getItem(KEY) || '';
        setLive(v);
        setDraft(v);
        setBarsNow(localStorage.getItem('n250_live_bars') || '');
        setDteNow(localStorage.getItem('n250_live_dte') || '');
      } catch {
        /* no storage */
      }
    });
  }, []);

  const est = estimateTank(logs, { odometer: Number(live) || 0, bars: Number(barsNow) || 0 });
  // Use the pooled full-to-full average for range — one number everywhere
  const mileage = avgMileage > 0 ? avgMileage : (est && est.mileage > 0 ? est.mileage : 0);
  if (!est || mileage <= 0) return null;

  const odo = Number(live) || 0;
  const hasReading = odo >= est.lastOdometer;
  const left = est.litresNow;
  const sigma = est.sigmaL;
  const dn = Number(dteNow);
  const rangeLeft = Math.round(left * mileage);
  const refillBy = Math.max(0, Math.round((left - 2) * mileage)); // keep about 2 L in hand: the low-fuel bar blinks near there
  const pct = Math.round((left / TANK_LITRES) * 100);
  const low = hasReading && refillBy < 40;
  const confidence = sigma <= 0.8 ? 'High' : sigma <= 1.3 ? 'Good' : 'Rough';

  const save = () => {
    try {
      localStorage.setItem(KEY, draft);
    } catch {
      /* not saved */
    }
    try {
      localStorage.setItem('n250_live_bars', barsNow);
      localStorage.setItem('n250_live_dte', dteNow);
    } catch {
      /* not saved */
    }
    setLive(draft);
    window.dispatchEvent(new Event('n250:live'));
  };

  return (
    <section className="card px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink-1">Fuel left</h2>
          {hasReading ? (
            <p className={`text-[14px] mt-0.5 tabular ${low ? 'text-accent font-medium' : 'text-ink-2'}`}>
              About {left.toFixed(1)} L (±{(sigma * 1.6).toFixed(1)}), roughly {rangeLeft} km to empty. Refill within {refillBy} km{low ? ', soon.' : '.'}
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
          <input type="number" inputMode="numeric" min={1} max={8} value={barsNow} onChange={(e) => setBarsNow(e.target.value)} placeholder="Bars" aria-label="Fuel bars now" className="w-16 h-9 px-2 rounded-lg border border-[var(--color-border)] bg-surface text-[14px] text-ink-1 tabular outline-none focus:border-slate-500" />
          <input type="number" inputMode="numeric" value={dteNow} onChange={(e) => setDteNow(e.target.value)} placeholder="DTE km" aria-label="Distance to empty shown on the bike" className="w-20 h-9 px-2 rounded-lg border border-[var(--color-border)] bg-surface text-[14px] text-ink-1 tabular outline-none focus:border-slate-500" />
          <button type="button" onClick={save} className="btn btn-secondary btn-sm">Update</button>
        </div>
      </div>
      {hasReading && (
        <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${low ? 'bg-accent' : 'bg-[var(--color-data)]'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="mt-2 text-[12px] text-ink-3 tabular">
        Confidence {confidence} · {est.historyMileage} km/L pooled avg · this stretch {est.openMileage || est.historyMileage} km/L · estimate {est.mileage.toFixed(1)} km/L
        {est.barReadings > 0 && ` · ${est.barReadings} bar reading${est.barReadings > 1 ? 's' : ''} used`}
        {dn > 0 && ` · bike DTE ${dn} km vs ours ${Math.round(left * est.mileage)} km`}
        {est.barReadings > 0 && !est.barsAgree && ` · the bars disagree with your history (bars alone: ${est.barsMileage} km/L, history ${est.historyMileage}), so history is weighted more`}
      </p>
    </section>
  );
};
