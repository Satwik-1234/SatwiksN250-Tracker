'use client';

import React, { useEffect, useState } from 'react';
import { FuelLog, DashboardMetrics } from '../types/fuel';
import { FuelEconomyGauge } from './FuelEconomyGauge';
import { 
  ResponsiveContainer, 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface AnalyticsViewProps {
  logs: FuelLog[];
  metrics: DashboardMetrics;
}

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5 flex flex-col gap-1">
    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">{title}</h3>
    {sub && <p className="text-[11px] text-slate-400 font-mono">{sub}</p>}
  </div>
);

// Custom Tooltip component for dark mode glowing aesthetic
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800 p-4 rounded-xl shadow-2xl">
        <p className="text-slate-400 text-xs font-semibold mb-3 tracking-widest uppercase">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color || entry.payload.fill || '#3b82f6', boxShadow: `0 0 10px ${entry.color || entry.payload.fill || '#3b82f6'}` }} />
              <span className="text-slate-300 text-xs font-medium">{entry.name}:</span>
              <span className="text-white text-sm font-mono font-bold">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, metrics }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 1. Mileage Trend Data (AreaChart)
  const mileageData = sorted.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    mileage: l.mileageCalculated ? Number(l.mileageCalculated.toFixed(2)) : null,
    station: l.stationName || 'Unknown'
  })).filter(d => d.mileage !== null);

  // 2. Monthly Expenditure (BarChart)
  const monthDataMap: Record<string, number> = {};
  sorted.forEach(log => {
    const m = new Date(log.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthDataMap[m] = (monthDataMap[m] || 0) + log.totalCost;
  });
  const monthlySpendData = Object.entries(monthDataMap).map(([month, spend]) => ({ month, spend: Math.round(spend) }));

  // 3. Brand Spread (PieChart)
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara', 'Others'];
  const brandDataMap: Record<string, number> = {};
  sorted.forEach(log => {
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    brandDataMap[brand] = (brandDataMap[brand] || 0) + 1;
  });
  
  const activeBrands = Object.keys(brandDataMap).filter(b => brandDataMap[b] > 0);
  const BCOLORS: Record<string, string> = { 
    "Jio-BP": "#f59e0b", "IOCL": "#3b82f6", "BPCL": "#22c55e", 
    "HPCL": "#ef4444", "Shell": "#fbbf24", "Nayara": "#a855f7", "Others": "#64748b" 
  };
  
  const pieData = activeBrands.map((b) => ({
    name: b,
    value: brandDataMap[b],
  })).sort((a, b) => b.value - a.value);

  // 4. Fuel Price Trend (LineChart)
  const priceData = sorted.map(l => ({
    date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    price: Number((l.totalCost / l.fuelAmount).toFixed(2))
  }));

  if (!isClient) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs font-mono animate-pulse">
        Initializing Engine Telemetry...
      </div>
    );
  }

  if (logs.length < 2) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-slate-500">Need at least 2 fill-ups to calculate telemetry data.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-8 pb-12">
      
      {/* SVG Definitions for Gradients */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.3}/>
          </linearGradient>
        </defs>
      </svg>

      {/* ── HERO SECTION: STATS & GAUGE ── */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex-1 flex justify-center md:justify-start relative z-10">
          <FuelEconomyGauge value={parseFloat(metrics.avgMileage) || 0} />
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4 w-full relative z-10">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fuel Spent</p>
            <p className="text-2xl font-black text-white font-mono">₹{(metrics.totalSpent || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-600 transition-colors">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Running Cost</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">₹{metrics.costPerKm} <span className="text-sm text-slate-500">/km</span></p>
          </div>
        </div>
      </div>

      {/* ── CHART 1: EFFICIENCY TREND (AREA) ── */}
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-lg">
        <SectionHeader title="Fuel Efficiency Curve" sub="Tank-to-Tank mileage fluctuations" />
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mileageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} dy={10} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} km/L`} />} />
              <Area 
                type="monotone" 
                dataKey="mileage" 
                name="Avg Mileage"
                stroke="#06b6d4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMileage)" 
                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#083344', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── GRID: EXPENSE ANALYSIS & FUEL BRANDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 2: MONTHLY SPENDING (BAR) */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-lg">
          <SectionHeader title="Monthly Expenditure" sub="Total ₹ spent per month" />
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} />
                <Tooltip cursor={{ fill: '#1e293b', opacity: 0.5 }} content={<CustomTooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />} />
                <Bar 
                  dataKey="spend" 
                  name="Spent"
                  fill="url(#colorSpend)" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: BRAND SPREAD (DONUT) */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col">
          <SectionHeader title="Fuel Brand Preference" sub="Fill-up frequency per brand" />
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BCOLORS[entry.name] || BCOLORS['Others']} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} fill-ups`} />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── CHART 4: FUEL PRICE TREND (LINE) ── */}
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-lg">
        <SectionHeader title="Fuel Inflation Curve" sub="Price paid per Litre over time" />
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} dy={10} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip formatter={(val: number) => `₹${val} /L`} />} />
              <Line 
                type="stepAfter" 
                dataKey="price" 
                name="Price"
                stroke="#f43f5e" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
