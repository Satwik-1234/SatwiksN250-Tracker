'use client';

import React, { useEffect, useState } from 'react';
import { FuelLog, DashboardMetrics } from '../types/fuel';

// MUI Chart Imports
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

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

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, metrics }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper arrays for simple charts
  const dates = sorted.map((l) => new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const mileages = sorted.map((l) => l.mileageCalculated ?? null);

  // 1. Monthly Aggregation for RadialBarChart
  // The user wanted: "total fillups and the most fillup brands in the months"
  // Let's create an array of 12 months for the RadialBarChart
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Count fillups per brand per month
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara', 'Others'];
  const monthData: Record<string, Record<string, number>> = {};
  monthsList.forEach(m => { monthData[m] = { total: 0 }; brandNames.forEach(b => monthData[m][b] = 0); });

  sorted.forEach(log => {
    const m = new Date(log.date).toLocaleString('en-US', { month: 'short' });
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    
    if (monthData[m]) {
      monthData[m].total += 1;
      monthData[m][brand] += 1;
    }
  });

  const totalFillupsPerMonth = monthsList.map(m => monthData[m].total === 0 ? null : monthData[m].total);
  // Just take the top 2 brands overall to stack in the radial chart for clarity
  const jioFills = monthsList.map(m => monthData[m]['Jio-BP'] === 0 ? null : monthData[m]['Jio-BP']);
  const ioclFills = monthsList.map(m => monthData[m]['IOCL'] === 0 ? null : monthData[m]['IOCL']);

  // 2. Brand Aggregation for PieChart & Table
  const brandData: Record<string, { fills: number; litres: number; spend: number }> = {};
  sorted.forEach(log => {
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    
    if (!brandData[brand]) brandData[brand] = { fills: 0, litres: 0, spend: 0 };
    brandData[brand].fills += 1;
    brandData[brand].litres += log.fuelAmount;
    brandData[brand].spend += log.totalCost;
  });
  
  const activeBrands = Object.keys(brandData).filter(b => brandData[b].spend > 0);
  const BCOLORS: Record<string, string> = { "Jio-BP": "#f59e0b", "IOCL": "#3b82f6", "BPCL": "#22c55e", "HPCL": "#ef4444", "Shell": "#fbbf24", "Nayara": "#a855f7", "Others": "#94a3b8" };
  
  const pieData = activeBrands.map((b, i) => ({
    id: i,
    value: brandData[b].spend,
    label: b,
    color: BCOLORS[b] || BCOLORS['Others']
  }));

  // 3. Scatter Chart Data
  const scatterData = sorted.map((l, i) => {
    const rawBrand = l.stationName?.split(' - ')[0] || l.stationName || 'Others';
    const brand = brandNames.find(b => rawBrand.includes(b)) || 'Others';
    return {
      id: i.toString(),
      dateIndex: i, // X-axis
      cost: l.totalCost, // Y-axis
      amount: l.fuelAmount, // Size
      brand: brand // Color
    };
  });

  if (!isClient) {
    return (
      <div className="py-24 text-center text-slate-300 text-xs font-mono animate-pulse">
        Loading charts…
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

      {/* Chart 1: Mileage Trend (MUI LineChart) */}
      <div>
        <SectionHeader title="Tank-to-Tank Mileage" sub="Fuel efficiency over time" />
        <LineChart
          height={300}
          series={[
            {
              data: mileages,
              label: 'Mileage (km/L)',
              curve: 'natural',
              showMark: true,
              color: '#3b82f6',
            },
          ]}
          xAxis={[{ scaleType: 'point', data: dates }]}
          grid={{ vertical: true, horizontal: true }}
          margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
        />
      </div>

      <hr className="border-slate-100" />

      {/* Chart 2 + 3 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Monthly Fillups (MUI BarChart) */}
        <div>
          <SectionHeader title="Monthly Fill-ups" sub="Total fills & Top Brands per month" />
          <BarChart
            height={300}
            series={[
              { data: totalFillupsPerMonth, label: 'Total Fills', color: '#cbd5e1' },
              { data: jioFills, label: 'Jio-BP', stack: 'brand', color: '#f59e0b' },
              { data: ioclFills, label: 'IOCL', stack: 'brand', color: '#3b82f6' },
            ]}
            xAxis={[{ scaleType: 'band', data: monthsList }]}
            margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
          />
        </div>

        {/* Brand Spend Doughnut (MUI PieChart) */}
        <div>
          <SectionHeader title="Spend by Brand" sub="Total ₹ distributed across stations" />
          <PieChart
            series={[
              {
                data: pieData,
                innerRadius: 60,
                outerRadius: 100,
                paddingAngle: 2,
                cornerRadius: 4,
              }
            ]}
            height={300}
            margin={{ top: 20, bottom: 20, left: 20, right: 120 }}
            slotProps={{
              legend: {
                direction: 'column',
                position: { vertical: 'middle', horizontal: 'right' },
              }
            }}
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Chart 4: Fillup Amount by Brand ScatterChart */}
      <div>
        <SectionHeader title="Fill-up Cost by Brand" sub="Cost distribution over time" />
        <ScatterChart
          height={350}
          dataset={scatterData}
          series={[
            {
              id: 'data',
              colorAxisId: 'brandAxis',
              sizeAxisId: 'amountAxis',
              datasetKeys: { x: 'dateIndex', y: 'cost' },
            },
          ]}
          xAxis={[{
            scaleType: 'point', 
            data: dates,
            label: 'Timeline' 
          }]}
          yAxis={[{ label: 'Total Cost (₹)' }]}
          zAxis={[
            {
              id: 'brandAxis',
              dataKey: 'brand',
              colorMap: {
                type: 'ordinal',
                values: activeBrands,
                colors: activeBrands.map(b => BCOLORS[b] || BCOLORS['Others']),
              },
            },
            {
              id: 'amountAxis',
              dataKey: 'amount',
              sizeMap: {
                type: 'continuous',
                min: 0,
                max: 15, // max tank size ~14L
                size: [5, 20],
              },
            },
          ]}
          grid={{ horizontal: true, vertical: true }}
          margin={{ left: 60, right: 20, top: 20, bottom: 50 }}
        />
      </div>

    </div>
  );
};
