'use client';

import React, { useEffect, useState } from 'react';

interface FuelGaugeProps {
  value: number; // e.g. 38.65
  max?: number; // default 70
}

export const FuelGauge: React.FC<FuelGaugeProps> = ({ value, max = 70 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // ease-out-quart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedValue(value * ease);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  const radius = 90;
  const cx = 120;
  const cy = 110;
  const strokeWidth = 14;

  // Calculate arc angles (Math.PI to 2*Math.PI)
  // Our visual range is 0 to max km/l mapping to 0 to 180 degrees
  const valRatio = Math.min(Math.max(animatedValue / max, 0), 1);
  const angle = Math.PI + (valRatio * Math.PI); // Radians for the needle

  const needleLength = radius - 8;
  const needleX = cx + Math.cos(angle) * needleLength;
  const needleY = cy + Math.sin(angle) * needleLength;

  // Arc path generator
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = {
      x: x + Math.cos(startAngle) * r,
      y: y + Math.sin(startAngle) * r
    };
    const end = {
      x: x + Math.cos(endAngle) * r,
      y: y + Math.sin(endAngle) * r
    };
    return [
      "M", start.x, start.y,
      "A", r, r, 0, 0, 1, end.x, end.y
    ].join(" ");
  };

  // Ticks
  const ticks = [];
  for (let i = 0; i <= 7; i++) {
    const tickVal = i * (max / 7);
    const tickAngle = Math.PI + (i / 7) * Math.PI;
    const isMajor = i % 2 === 0;
    
    const r1 = radius + (isMajor ? 4 : 2);
    const r2 = radius - (isMajor ? 10 : 5);

    const x1 = cx + Math.cos(tickAngle) * r1;
    const y1 = cy + Math.sin(tickAngle) * r1;
    const x2 = cx + Math.cos(tickAngle) * r2;
    const y2 = cy + Math.sin(tickAngle) * r2;

    const labelR = radius - 26;
    const lx = cx + Math.cos(tickAngle) * labelR;
    const ly = cy + Math.sin(tickAngle) * labelR;

    ticks.push(
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? '#94a3b8' : '#cbd5e1'} strokeWidth={isMajor ? 1.5 : 1} />
        {isMajor && (
          <text x={lx} y={ly + 4} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
            {Math.round(tickVal)}
          </text>
        )}
      </g>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
      <svg width={240} height={130} className="drop-shadow-sm">
        {/* Background track */}
        <path 
          d={describeArc(cx, cy, radius, Math.PI, 2 * Math.PI)}
          fill="none" 
          stroke="#f1f5f9" 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
        />
        
        {/* Ticks */}
        {ticks}

        {/* Value track (Blue color) */}
        {animatedValue > 0 && (
          <path 
            d={describeArc(cx, cy, radius, Math.PI, angle)}
            fill="none" 
            stroke="#2563eb"
            strokeWidth={strokeWidth} 
            strokeLinecap="round"
            className="transition-all duration-75"
          />
        )}

        {/* Needle */}
        <line 
          x1={cx} y1={cy} 
          x2={needleX} y2={needleY} 
          stroke="#1e40af" 
          strokeWidth={3} 
          strokeLinecap="round" 
        />
        <circle cx={cx} cy={cy} r={6} fill="#1e40af" />
        
      </svg>

      <div className="absolute bottom-3 text-center">
        <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
          {animatedValue.toFixed(1)}
        </div>
        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
          km / L — avg mileage
        </div>
      </div>
    </div>
  );
};
