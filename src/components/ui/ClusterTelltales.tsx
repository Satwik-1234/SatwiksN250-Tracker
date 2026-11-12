'use client';

import React from 'react';
import type { CareSeverity } from '@/lib/care';

export interface TelltaleItem {
  id: string;
  label: string;
  icon: React.ElementType;
  severity: CareSeverity;
  /** Marks the task done (owner); sends the lamp back to green. */
  onAck?: () => void;
}

// Progressive warning colours, like a real cluster ramping up a fault.
const RAMP: Record<CareSeverity, { color: string; glow: string; border: string; bg: string; word: string }> = {
  good:    { color: '#34d27b', glow: 'rgba(52,210,123,0.30)', border: 'rgba(52,210,123,0.40)', bg: 'rgba(52,210,123,0.10)', word: 'good' },
  fair:    { color: '#facc15', glow: 'rgba(250,204,21,0.34)', border: 'rgba(250,204,21,0.45)', bg: 'rgba(250,204,21,0.12)', word: 'getting there' },
  warn:    { color: '#fb923c', glow: 'rgba(251,146,60,0.40)', border: 'rgba(251,146,60,0.5)', bg: 'rgba(251,146,60,0.14)', word: 'due soon' },
  overdue: { color: '#ff4b40', glow: 'rgba(255,75,64,0.5)', border: 'rgba(255,75,64,0.55)', bg: 'rgba(255,75,64,0.16)', word: 'overdue' },
};

/**
 * A row of instrument-cluster telltale lamps. Each lamp ramps green → yellow →
 * orange → red as its task comes due, and pulses once it is overdue. Tapping a
 * lamp marks that task done, sending it back to green — like clearing a fault.
 */
export const ClusterTelltales: React.FC<{ items: TelltaleItem[] }> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5" role="group" aria-label="Maintenance warning lights">
      {items.map((item) => {
        const r = RAMP[item.severity] ?? RAMP.good;
        const overdue = item.severity === 'overdue';
        const Icon = item.icon;

        const title = `${item.label} — ${r.word}${item.onAck ? ' · tap to mark done' : ''}`;

        const lamp = (
          <span className={`glyph is-lit ${overdue ? 'is-pulsing' : ''}`}>
            <Icon className="w-8 h-8" />
          </span>
        );

        if (item.onAck) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onAck}
              title={title}
              aria-label={title}
              data-sev={item.severity}
              className="glyph-tile shrink-0 rounded-lg p-1 active:scale-95 transition-transform"
            >
              {lamp}
            </button>
          );
        }
        return (
          <span key={item.id} title={title} aria-label={title} data-sev={item.severity} className="glyph-tile shrink-0 p-1">
            {lamp}
          </span>
        );
      })}
    </div>
  );
};
