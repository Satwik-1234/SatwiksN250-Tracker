'use client';

import React, { useEffect, useState } from 'react';

interface FuelEconomyGaugeProps {
  value: number; // e.g., current mileage
  min?: number;
  max?: number;
}

export const FuelEconomyGauge: React.FC<FuelEconomyGaugeProps> = ({ 
  value, 
  min = 0, 
  max = 60 
}) => {
  const [animatedValue, setAnimatedValue] = useState(min);

  useEffect(() => {
    // Animate the needle on mount
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Clamp the value to ensure it stays within bounds
  const clampedValue = Math.min(Math.max(animatedValue, min), max);
  
  // Calculate the rotation degree (-90 to 90)
  // min = -90deg, max = 90deg
  const percentage = (clampedValue - min) / (max - min);
  const rotation = -90 + (percentage * 180);

  // Determine color based on economy
  let statusColor = '#ef4444'; // Red (Poor)
  if (value >= 35) statusColor = '#eab308'; // Yellow (Average)
  if (value >= 40) statusColor = '#22c55e'; // Green (Excellent)

  return (
    <div className="relative flex flex-col items-center justify-center group cursor-default">
      {/* ── GAUGE BACKGROUND ── */}
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Outer Ring */}
        <div className="absolute top-0 left-0 w-32 h-32 border-[12px] border-slate-100 rounded-full" />
        
        {/* Gradient/Colored Segment */}
        <div 
          className="absolute top-0 left-0 w-32 h-32 border-[12px] rounded-full transition-all duration-1000 ease-out"
          style={{
            borderColor: `${statusColor} ${statusColor} transparent transparent`,
            transform: `rotate(${rotation - 45}deg)`,
          }}
        />

        {/* ── NEEDLE ── */}
        <div 
          className="absolute bottom-0 left-1/2 w-[3px] h-[48px] bg-slate-800 origin-bottom transition-transform duration-1000 ease-out z-10 rounded-full"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        >
          {/* Needle Base */}
          <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-slate-900 rounded-full border-4 border-white shadow-sm" />
        </div>
      </div>

      {/* ── DATA DISPLAY ── */}
      <div className="mt-4 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
            {value.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400">km/L</span>
        </div>
        <span 
          className="text-[10px] uppercase font-extrabold tracking-widest mt-0.5 block"
          style={{ color: statusColor }}
        >
          {value >= 40 ? 'Excellent' : value >= 35 ? 'Average' : 'Poor'}
        </span>
      </div>
    </div>
  );
};
