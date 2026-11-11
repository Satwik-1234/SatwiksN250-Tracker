'use client';

import React from 'react';
import { useCountUp } from '@/components/ui/Motion';

const CX = 110;
const CY = 112;
const R = 90;
const START = 150; // degrees, bottom-left
const SWEEP = 240; // degrees, clockwise over the top

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

const ARC = (() => {
  const a = polar(START, R);
  const b = polar(START + SWEEP, R);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${R} ${R} 0 1 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
})();

/**
 * Dial in the style of the bike's cluster. On load the arc sweeps to the end
 * of the scale and settles on the reading, the way the needle does at ignition.
 */
export const ClusterGauge = ({
  value,
  max = 60,
  unit = 'km/L',
  caption,
}: {
  value: number;
  max?: number;
  unit?: string;
  caption?: string;
}) => {
  const shown = useCountUp(value, 900, 750);
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const steps = 6;

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 220 172" className="w-full h-auto" role="img" aria-label={`${value.toFixed(1)} ${unit}`}>
        <defs>
          <linearGradient id="gaugeStroke" gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="190" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path d={ARC} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" strokeLinecap="round" />

        {/* Reading */}
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          stroke="url(#gaugeStroke)"
          strokeWidth="10"
          strokeLinecap="round"
          className="gauge-arc"
          style={{ ['--gauge' as string]: pct }}
        />

        {/* Scale */}
        {Array.from({ length: steps + 1 }, (_, i) => {
          const deg = START + (SWEEP / steps) * i;
          const a = polar(deg, R - 14);
          const b = polar(deg, R - 20);
          const t = polar(deg, R - 32);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
              {i % 2 === 0 && (
                <text
                  x={t.x}
                  y={t.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.45)"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {Math.round((max / steps) * i)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Digital readout */}
      <div className="absolute inset-x-0 top-[36%] flex flex-col items-center pointer-events-none">
        <span className="font-display text-[64px] font-semibold italic leading-none tabular">
          {value > 0 ? shown.toFixed(1) : '—'}
        </span>
        <span className="mt-1.5 text-[13px] text-white/60">{unit}</span>
        {caption && <span className="mt-0.5 text-xs text-white/40">{caption}</span>}
      </div>
    </div>
  );
};
