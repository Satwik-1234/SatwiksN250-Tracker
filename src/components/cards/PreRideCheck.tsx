'use client';

import React from 'react';
import { Check } from 'lucide-react';

const ITEMS = [
  ['Tyres', 'Pressure and cuts'],
  ['Controls', 'Brake and clutch feel'],
  ['Lights', 'Head, tail, indicators'],
  ['Oil', 'Level and leaks'],
  ['Chain', 'Slack and lube'],
  ['Stands', 'Side stand up, fuel enough'],
];
const KEY = 'n250_preride';
const today = () => new Date().toISOString().split('T')[0];

/** 30-second walk-around before riding. Ticks reset every day. */
export const PreRideCheck: React.FC = () => {
  const [done, setDone] = React.useState<number[]>([]);

  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) || '{}');
        if (v.day === today()) setDone(v.done || []);
      } catch {
        /* no storage */
      }
    });
  }, []);

  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((d) => d !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify({ day: today(), done: next }));
    } catch {
      /* not saved */
    }
    if (next.length === ITEMS.length) {
      try {
        navigator.vibrate?.([20, 40, 20]);
      } catch {
        /* unsupported */
      }
    }
  };
  const ready = done.length === ITEMS.length;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display italic font-bold text-[13px] tracking-[0.2em] text-accent">PRE-RIDE</p>
          <h2 className="font-display italic font-bold text-[24px] text-ink-1 leading-tight">{ready ? 'Clear to ride.' : '30-second walk-around'}</h2>
        </div>
        <span className={`font-display italic font-bold text-[22px] tabular ${ready ? 'text-[var(--color-data)]' : 'text-ink-3'}`}>
          {done.length}/{ITEMS.length}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ITEMS.map(([t, s], i) => {
          const on = done.includes(i);
          return (
            <li key={t}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={on}
                className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-2.5 transition ${on ? 'border-[var(--color-data)] bg-info-bg' : 'border-[var(--color-border)]'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-[var(--color-data)] text-white' : 'border-2 border-[var(--color-border)]'}`}>
                  {on && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-ink-1">{t}</span>
                  <span className="block text-[11px] text-ink-2 truncate">{s}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
