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
  <div className="mb-4">
    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
    {sub && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{sub}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-slate-500 text-[10px] font-semibold mb-2 tracking-widest uppercase">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill || '#3b82f6' }} />
            <span className="text-slate-400 text-xs">{entry.name}:</span>
            <span className="text-slate-900 text-sm font-mono font-bold">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, metrics }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 1. Mileage Trend Data
  const mileageData = sorted.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    mileage: l.mileageCalculated ? Number(l.mileageCalculated.toFixed(1)) : null,
  })).filter(d => d.mileage !== null);

  // 2. Monthly Expenditure
  const monthDataMap: Record<string, number> = {};
  sorted.forEach(log => {
    const m = new Date(log.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthDataMap[m] = (monthDataMap[m] || 0) + log.totalCost;
  });
  const monthlySpendData = Object.entries(monthDataMap).map(([month, spend]) => ({ month, spend: Math.round(spend) }));

  // 3. Brand Spread
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara', 'Others'];
  const brandCountMap: Record<string, number> = {};
  sorted.forEach(log => {
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    brandCountMap[brand] = (brandCountMap[brand] || 0) + 1;
  });
  
  const BCOLORS: Record<string, string> = { 
    "Jio-BP": "#f59e0b", "IOCL": "#3b82f6", "BPCL": "#22c55e", 
    "HPCL": "#ef4444", "Shell": "#eab308", "Nayara": "#a855f7", "Others": "#94a3b8" 
  };
  
  const pieData = Object.entries(brandCountMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalFillups = pieData.reduce((s, d) => s + d.value, 0);

  // 4. Fuel Price Trend
  const priceData = sorted.map(l => ({
    date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    price: Number((l.totalCost / l.fuelAmount).toFixed(2))
  }));

  if (!isClient) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono animate-pulse">
        Loading analytics…
      </div>
    );
  }

  if (logs.length < 2) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-slate-400">Need at least 2 fill-ups to show analytics.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6 pb-12">
      
      {/* SVG Defs */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="gMileage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
          </linearGradient>
          <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.15}/>
          </linearGradient>
        </defs>
      </svg>

      {/* ── HERO: GAUGE + STATS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Gauge */}
          <FuelEconomyGauge value={parseFloat(String(metrics.avgMileage)) || 0} />

          {/* Stat Cards */}
          <div className="flex-1 grid grid-cols-3 gap-4 w-full">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">₹{(metrics.totalSpent || 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost / km</p>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">₹{metrics.costPerKm}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fill-ups</p>
              <p className="text-xl font-black text-blue-600 font-mono mt-1">{metrics.totalLogsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART 1: MILEAGE TREND ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title="Fuel Efficiency Curve" sub="Tank-to-tank mileage over time" />
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mileageData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} km/L`} />} />
              <Area 
                type="monotone" 
                dataKey="mileage" 
                name="Mileage"
                stroke="#3b82f6" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#gMileage)" 
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW: MONTHLY SPEND + BRAND PIE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Bar Chart — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <SectionHeader title="Monthly Expenditure" sub="Total ₹ spent per month" />
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />} />
                <Bar dataKey="spend" name="Spent" fill="url(#gSpend)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <SectionHeader title="Fuel Brands" sub="Fill-up frequency" />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BCOLORS[entry.name] || BCOLORS['Others']} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} fill-ups`} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom legend below */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BCOLORS[d.name] || BCOLORS['Others'] }} />
                  <span className="text-[11px] text-slate-500 font-medium">{d.name}</span>
                  <span className="text-[11px] text-slate-300 font-mono">{Math.round((d.value / totalFillups) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART 4: FUEL PRICE TREND ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title="Fuel Price Trend" sub="Price per litre (₹/L) over time" />
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `₹${v} /L`} />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                name="Price/L"
                stroke="#f43f5e" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
