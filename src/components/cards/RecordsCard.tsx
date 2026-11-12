'use client';

import React from 'react';
import { FuelLog } from '@/types/fuel';
import { computeFullTankSegments } from '@/lib/metrics';

/** Personal bests and worsts from the fill-up history. */
export const RecordsCard: React.FC<{ logs: FuelLog[] }> = ({ logs }) => {
  const seg = computeFullTankSegments(logs).filter((s) => (s.mileage || 0) > 0 && !s.suspect);
  const rates = logs
    // The rate printed at the pump, when logged, beats cost / litres (litres are often rounded).
    .map((l) => Number(l.pricePerLitre) || ((Number(l.fuelAmount) || 0) > 0 ? (Number(l.totalCost) || 0) / Number(l.fuelAmount) : 0))
    .filter((r) => r > 50);
  const big = Math.max(0, ...logs.map((l) => Number(l.fuelAmount) || 0));
  const items: [string, string, string][] = [];
  if (seg.length) {
    items.push(['Best tank', Math.max(...seg.map((s) => s.mileage || 0)).toFixed(1), 'km/L']);
    items.push(['Worst tank', Math.min(...seg.map((s) => s.mileage || 0)).toFixed(1), 'km/L']);
    items.push(['Longest on one tank', String(Math.round(Math.max(...seg.map((s) => s.distance)))), 'km']);
  }
  if (big > 0) items.push(['Biggest fill', big.toFixed(1), 'L']);
  if (rates.length) {
    items.push(['Cheapest petrol', `₹${Math.min(...rates).toFixed(2)}`, '/L']);
    items.push(['Dearest petrol', `₹${Math.max(...rates).toFixed(2)}`, '/L']);
  }
  if (!items.length) return null;
  return (
    <section className="card p-5">
      <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">PERSONAL RECORDS</p>
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-px bg-[var(--color-border)] rounded-xl overflow-hidden tabular">
        {items.map(([k, v, u]) => (
          <div key={k} className="bg-surface px-3.5 py-3">
            <dt className="text-[12px] text-ink-2">{k}</dt>
            <dd className="font-display italic font-bold text-[24px] text-ink-1 leading-tight">
              {v}
              <span className="text-[13px] text-ink-2 font-medium not-italic ml-1">{u}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
