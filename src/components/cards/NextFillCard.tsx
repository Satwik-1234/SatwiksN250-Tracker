'use client';

import React from 'react';
import { FuelLog } from '@/types/fuel';
import { sortLogsByDate } from '@/lib/metrics';

const DAY = 86400000;

/** Days since the last fill, how often you usually fill, and when the next one is likely. */
export const NextFillCard: React.FC<{ logs: FuelLog[] }> = ({ logs }) => {
  const [nowMs] = React.useState(() => Date.now());
  const s = sortLogsByDate(logs).filter((l) => l.date);
  if (s.length < 3) return null;
  const t = s.map((l) => new Date(l.date).getTime());
  const gaps = t.slice(1).map((v, i) => (v - t[i]) / DAY).filter((g) => g > 0);
  if (!gaps.length) return null;
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const since = Math.max(0, Math.floor((nowMs - t[t.length - 1]) / DAY));
  const left = Math.round(avgGap - since);
  const next = new Date(t[t.length - 1] + avgGap * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const pct = Math.min(100, Math.round((since / avgGap) * 100));

  return (
    <section className="card p-5">
      <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">FILL RHYTHM</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="font-display italic font-bold text-[28px] text-ink-1 leading-tight">{since} days since last fill</h2>
        <span className="text-[13px] text-ink-2 tabular text-right shrink-0">
          you fill every
          <br />
          <b className="text-ink-1">{avgGap.toFixed(1)} days</b>
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-accent' : 'bg-[var(--color-data)]'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-ink-2 tabular">
        {left > 0 ? `Next fill likely around ${next} (in about ${left} days).` : `Due about now. Your usual gap is ${avgGap.toFixed(0)} days.`}
      </p>
    </section>
  );
};
