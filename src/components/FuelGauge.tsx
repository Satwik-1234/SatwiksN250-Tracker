'use client';

import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

interface FuelGaugeProps {
  value: number; // e.g. 38.65
  max?: number; // default 70
}

export const FuelGauge: React.FC<FuelGaugeProps> = ({ value, max = 70 }) => {
  const safeValue = Math.min(Math.max(value, 0), max);
  const remaining = max - safeValue;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
      <div style={{ width: 240, height: 180, position: 'relative' }}>
        <PieChart
          series={[
            {
              data: [
                { id: 0, value: safeValue, color: '#3b82f6' },
                { id: 1, value: remaining, color: '#f1f5f9' },
              ],
              innerRadius: 60,
              outerRadius: 100,
              paddingAngle: 3,
              cornerRadius: 5,
              startAngle: -45,
              endAngle: 225,
              cx: 120,
              cy: 110,
            }
          ]}
          height={180}
          width={240}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          slotProps={{ legend: { hidden: true } }}
          tooltip={{ trigger: 'none' }}
        />
        
        {/* Label overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <span className="text-3xl font-black text-slate-900 font-mono leading-none">
            {value.toFixed(1)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            AVG MILEAGE
          </span>
        </div>
      </div>
    </div>
  );
};
