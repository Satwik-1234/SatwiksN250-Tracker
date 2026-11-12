'use client';

import React from 'react';

const DELIVERED = new Date('2026-05-24T00:00:00').getTime();
const WARRANTY_END = new Date('2031-05-24T00:00:00').getTime();

/** Warranty clock: time and distance left, whichever runs out first. */
export const OwnershipCard: React.FC<{ odometer: number }> = ({ odometer }) => {
  const now = Date.now();
  const timePct = Math.min(100, ((now - DELIVERED) / (WARRANTY_END - DELIVERED)) * 100);
  const kmPct = Math.min(100, (odometer / 75000) * 100);
  const daysLeft = Math.max(0, Math.ceil((WARRANTY_END - now) / 86400000));
  const bars: [string, number, string][] = [
    ['Time used', timePct, `${Math.floor(daysLeft / 365)} yr ${Math.floor((daysLeft % 365) / 30)} mo left`],
    ['Distance used', kmPct, `${Math.max(0, 75000 - odometer).toLocaleString('en-IN')} km left`],
  ];
  return (
    <section className="card p-5">
      <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">WARRANTY CLOCK</p>
      <h2 className="font-display italic font-bold text-[26px] text-ink-1 leading-tight">5 years or 75,000 km</h2>
      <div className="mt-3 space-y-3 tabular">
        {bars.map(([k, p, note]) => (
          <div key={k}>
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-2">{k}</span>
              <span className="text-ink-1 font-medium">{note}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-[var(--color-data)]" style={{ width: `${Math.max(1.5, p)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
