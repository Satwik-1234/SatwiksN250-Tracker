'use client';

import React from 'react';
import { FuelLog } from '@/types/fuel';
import { computeFullTankSegments } from '@/lib/metrics';
import { shareRideCard } from '@/lib/shareCard';
import { Share2 } from 'lucide-react';

const DELIVERED = new Date('2026-05-24T00:00:00');
const STOPS = [0, 500, 1000, 2500, 5000, 7500, 10000];

/** Road from delivery to the next big km mark, with the bike where you are now and what the ride has cost so far. */
export const JourneyCard: React.FC<{ logs: FuelLog[]; odometer: number }> = ({ logs, odometer }) => {
  const days = Math.max(1, Math.floor((Date.now() - DELIVERED.getTime()) / 86400000));
  const nextIdx = Math.max(1, STOPS.findIndex((m) => m > odometer));
  const stops = STOPS.slice(0, (nextIdx === -1 ? STOPS.length - 1 : nextIdx) + 1);
  const end = stops[stops.length - 1];
  const pos = Math.min(100, (odometer / end) * 100);

  const spent = logs.reduce((a, l) => a + (Number(l.totalCost) || 0), 0);
  const best = computeFullTankSegments(logs).reduce((m, s) => Math.max(m, s.mileage || 0), 0);
  const perKm = odometer > 0 ? spent / odometer : 0;
  const segs = computeFullTankSegments(logs).filter((s) => (s.mileage || 0) > 0);
  const avgMileage = segs.length ? segs.reduce((a, s) => a + s.distance, 0) / segs.reduce((a, s) => a + s.fuel, 0) : 0;
  const perDay = spent / days;

  return (
    <section className="card p-5 sm:p-6 overflow-hidden">
      <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">THE ROAD SO FAR</p>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display italic font-bold text-[26px] sm:text-[32px] leading-tight text-ink-1 mt-1">
          {days} days. {odometer.toLocaleString('en-IN')} km.
        </h2>
        <button
          type="button"
          onClick={() => shareRideCard({ days, km: odometer, fills: logs.length, mileage: avgMileage, perKm })}
          className="btn btn-secondary btn-sm shrink-0 mt-1"
          aria-label="Share ride card"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {/* Road with checkpoints */}
      <div className="relative mt-7 mb-9 h-2 rounded-full bg-[var(--color-text-1)]">
        <div className="absolute inset-y-[3px] left-0 right-0 border-t-2 border-dashed border-white/50" aria-hidden="true" />
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pos}%` }} />
        {stops.map((m) => (
          <div key={m} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(m / end) * 100}%` }}>
            <span className={`w-3.5 h-3.5 rounded-full border-2 ${odometer >= m ? 'bg-accent border-accent' : 'bg-surface border-[var(--color-text-1)]'}`} />
            <span className="absolute top-5 text-[11px] text-ink-2 tabular whitespace-nowrap">{m >= 1000 ? `${m / 1000}k` : m}</span>
          </div>
        ))}
        <div className="absolute -top-[26px] -translate-x-1/2 text-[11px] font-semibold text-accent tabular whitespace-nowrap" style={{ left: `${pos}%` }}>▼ you</div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] rounded-xl overflow-hidden tabular">
        {[
          ['Spent on fuel', `₹${Math.round(spent).toLocaleString('en-IN')}`],
          ['Cost per km', perKm ? `₹${perKm.toFixed(2)}` : '—'],
          ['Per day', `₹${Math.round(perDay)}`],
          ['Best tank', best ? `${best.toFixed(1)} km/L` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-surface px-3.5 py-3">
            <dt className="text-[12px] text-ink-2">{k}</dt>
            <dd className="font-display italic font-bold text-[22px] text-ink-1 leading-tight">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
