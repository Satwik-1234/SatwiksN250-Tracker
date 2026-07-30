'use client';

import React, { useEffect, useState, useRef } from 'react';

interface FuelEconomyGaugeProps {
  value: number;
  min?: number;
  max?: number;
}

export const FuelEconomyGauge: React.FC<FuelEconomyGaugeProps> = ({ 
  value, 
  min = 0, 
  max = 60 
}) => {
  const [animatedAngle, setAnimatedAngle] = useState(-90);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const clampedValue = Math.min(Math.max(value, min), max);
  const targetAngle = -90 + ((clampedValue - min) / (max - min)) * 180;

  useEffect(() => {
    startTimeRef.current = undefined;
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const duration = 1200;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAngle(-90 + eased * (targetAngle + 90));
      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [targetAngle]);

  // Color zones
  let statusColor = '#ef4444';
  let statusLabel = 'Poor';
  if (value >= 40) { statusColor = '#22c55e'; statusLabel = 'Excellent'; }
  else if (value >= 35) { statusColor = '#f59e0b'; statusLabel = 'Good'; }
  else if (value >= 25) { statusColor = '#eab308'; statusLabel = 'Average'; }

  // SVG arc helpers
  const cx = 100, cy = 100, r = 80;
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Tick marks
  const ticks = [0, 10, 20, 30, 40, 50, 60];

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 130">
        {/* Background arc */}
        <path d={describeArc(180, 360)} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
        
        {/* Color zones: Red → Yellow → Green */}
        <path d={describeArc(180, 240)} fill="none" stroke="#fecaca" strokeWidth="14" strokeLinecap="round" />
        <path d={describeArc(240, 300)} fill="none" stroke="#fef08a" strokeWidth="14" strokeLinecap="round" />
        <path d={describeArc(300, 360)} fill="none" stroke="#bbf7d0" strokeWidth="14" strokeLinecap="round" />

        {/* Filled progress arc */}
        {animatedAngle > -90 && (
          <path 
            d={describeArc(180, 180 + ((animatedAngle + 90) / 180) * 180)} 
            fill="none" 
            stroke={statusColor} 
            strokeWidth="14" 
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${statusColor}40)` }}
          />
        )}

        {/* Tick marks and labels */}
        {ticks.map(t => {
          const angle = 180 + (t / 60) * 180;
          const inner = polarToCartesian(cx, cy, r - 12, angle);
          const outer = polarToCartesian(cx, cy, r + 4, angle);
          const labelPos = polarToCartesian(cx, cy, r + 16, angle);
          return (
            <g key={t}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#94a3b8" strokeWidth="1.5" />
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">{t}</text>
            </g>
          );
        })}

        {/* Needle */}
        {(() => {
          const needleAngle = 180 + ((animatedAngle + 90) / 180) * 180;
          const tip = polarToCartesian(cx, cy, r - 18, needleAngle);
          return (
            <>
              <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="6" fill="#0f172a" />
              <circle cx={cx} cy={cy} r="3" fill="white" />
            </>
          );
        })()}
      </svg>

      {/* Value display */}
      <div className="text-center -mt-2">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {value.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400">km/L</span>
        </div>
        <span className="text-[10px] uppercase font-extrabold tracking-[0.2em] block mt-0.5" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
};
