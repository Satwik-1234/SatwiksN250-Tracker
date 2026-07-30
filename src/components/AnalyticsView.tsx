'use client';

import React, { useEffect, useState } from 'react';
import { FuelLog, DashboardMetrics } from '../types/fuel';
import { 
  ResponsiveContainer, 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

interface AnalyticsViewProps {
  logs: FuelLog[];
  metrics: DashboardMetrics;
}

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</h3>
    {sub && <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{sub}</p>}
  </div>
);

// Custom Tooltip component for better aesthetics
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl">
        <p className="text-slate-300 text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill || '#3b82f6' }} />
            <span className="text-slate-400 text-xs">{entry.name}:</span>
            <span className="text-white text-sm font-mono font-bold">
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

  // 1. Mileage Trend Data (AreaChart)
  const mileageData = sorted.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    mileage: l.mileageCalculated ? Number(l.mileageCalculated.toFixed(2)) : null,
  })).filter(d => d.mileage !== null);

  // 2. Monthly Fillups (BarChart)
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara', 'Others'];
  const monthDataMap: Record<string, any> = {};
  
  monthsList.forEach(m => {
    monthDataMap[m] = { month: m, total: 0 };
    brandNames.forEach(b => monthDataMap[m][b] = 0);
  });

  sorted.forEach(log => {
    const m = new Date(log.date).toLocaleString('en-US', { month: 'short' });
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    
    if (monthDataMap[m]) {
      monthDataMap[m].total += 1;
      monthDataMap[m][brand] += 1;
    }
  });
  const monthlyData = monthsList.map(m => monthDataMap[m]).filter(d => d.total > 0);

  // 3. Brand Spread (PieChart)
  const brandDataMap: Record<string, { spend: number }> = {};
  sorted.forEach(log => {
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    if (!brandDataMap[brand]) brandDataMap[brand] = { spend: 0 };
    brandDataMap[brand].spend += log.totalCost;
  });
  
  const activeBrands = Object.keys(brandDataMap).filter(b => brandDataMap[b].spend > 0);
  const BCOLORS: Record<string, string> = { 
    "Jio-BP": "#f59e0b", "IOCL": "#3b82f6", "BPCL": "#22c55e", 
    "HPCL": "#ef4444", "Shell": "#fbbf24", "Nayara": "#a855f7", "Others": "#94a3b8" 
  };
  
  const pieData = activeBrands.map((b) => ({
    name: b,
    value: brandDataMap[b].spend,
  }));

  // 4. Scatter Data (Fill-up Cost)
  const scatterData = sorted.map((l, i) => {
    const rawBrand = l.stationName?.split(' - ')[0] || l.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    return {
      dateIndex: i + 1,
      dateStr: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      cost: l.totalCost,
      amount: l.fuelAmount,
      brand: brand,
      color: BCOLORS[brand] || BCOLORS['Others']
    };
  });

  if (!isClient) {
    return (
      <div className="py-24 text-center text-slate-300 text-xs font-mono animate-pulse">
        Loading interactive charts…
      </div>
    );
  }

  if (logs.length < 2) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-slate-400">Need at least 2 fill-ups to plot analytics.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-14 pb-12">
      
      {/* Gradients Definition */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </svg>

      {/* Summary strip */}
      <div className="py-6 border-b border-slate-100 flex flex-wrap gap-8">
        {[
          { label: 'Avg Mileage', value: `${metrics.avgMileage} km/L` },
          { label: 'Avg Refill', value: `₹${metrics.avgFuelCost}` },
          { label: 'Cost / km', value: `₹${metrics.costPerKm}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart 1: Mileage Trend */}
      <div>
        <SectionHeader title="Tank-to-Tank Mileage" sub="Fuel efficiency over time" />
        <div className="h-[300px] w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mileageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} km/L`} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="mileage" name="Mileage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMileage)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2 + 3 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Fillups */}
        <div>
          <SectionHeader title="Monthly Fill-ups" sub="Jio-BP vs IOCL fills per month" />
          <div className="h-[300px] w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                <Bar dataKey="Jio-BP" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} barSize={30} />
                <Bar dataKey="IOCL" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Spend Doughnut */}
        <div>
          <SectionHeader title="Spend by Brand" sub="Total ₹ distributed across stations" />
          <div className="h-[300px] w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BCOLORS[entry.name] || BCOLORS['Others']} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 4: Scatter Plot */}
      <div>
        <SectionHeader title="Fill-up Cost Over Time" sub="Cost vs Time (Size = Litres)" />
        <div className="h-[350px] w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="dateStr" name="Date" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis dataKey="cost" name="Cost" unit="₹" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl">
                        <p className="text-slate-300 text-xs font-semibold mb-2">{data.dateStr}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                          <span className="text-slate-400 text-xs">{data.brand}:</span>
                          <span className="text-white text-sm font-mono font-bold">₹{data.cost} ({data.amount}L)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Refills" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
