'use client';

import React from 'react';
import { Award, CalendarDays, Flag, Fuel, Gauge, Medal, Route, type LucideIcon } from 'lucide-react';

const DELIVERED = new Date('2026-05-24T00:00:00').getTime();

interface Trophy {
  icon: LucideIcon;
  title: string;
  hint: string;
  got: boolean;
}

/** Garage trophies: milestones that unlock as the bike racks up km, days and fill-ups. */
export const TrophyCard: React.FC<{ odometer: number; fills: number }> = ({ odometer, fills }) => {
  const days = Math.floor((Date.now() - DELIVERED) / 86400000);
  const trophies: Trophy[] = [
    { icon: Fuel, title: 'First fill', hint: 'Log a refill', got: fills >= 1 },
    { icon: Flag, title: 'Break-in done', hint: '1,000 km', got: odometer >= 1000 },
    { icon: CalendarDays, title: '100 days', hint: 'Own it 100 days', got: days >= 100 },
    { icon: Route, title: 'Fuel diary', hint: '25 fill-ups', got: fills >= 25 },
    { icon: Gauge, title: 'Half a ton', hint: '5,000 km', got: odometer >= 5000 },
    { icon: Medal, title: 'Ten thousand', hint: '10,000 km', got: odometer >= 10000 },
    { icon: Award, title: 'Long haul', hint: '25,000 km', got: odometer >= 25000 },
  ];
  const earned = trophies.filter((t) => t.got).length;

  return (
    <section className="card p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">GARAGE TROPHIES</p>
          <h2 className="font-display italic font-bold text-[26px] text-ink-1 leading-tight">{earned} of {trophies.length} unlocked</h2>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2.5">
        {trophies.map(({ icon: Icon, title, hint, got }) => (
          <li key={title} className="text-center" title={hint}>
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center border-2 ${got ? 'border-accent bg-accent text-white shadow-md shadow-accent/30' : 'border-dashed border-[var(--color-border)] text-ink-3'}`}>
              <Icon className="w-6 h-6" strokeWidth={got ? 2.2 : 1.6} />
            </div>
            <p className={`mt-1.5 text-[11px] leading-tight ${got ? 'text-ink-1 font-semibold' : 'text-ink-3'}`}>{title}</p>
            {!got && <p className="text-[10px] text-ink-3 leading-tight">{hint}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};
