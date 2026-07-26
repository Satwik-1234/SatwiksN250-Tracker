'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FuelLog, DashboardMetrics } from '../types/fuel';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface AnalyticsViewProps {
  logs: FuelLog[];
  metrics: DashboardMetrics;
}

// Shared Plotly layout base for white/minimal style
const plotLayout = (overrides: object = {}) => ({
  autosize: true,
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  margin: { l: 44, r: 44, t: 12, b: 36 },
  font: { family: 'var(--font-jetbrains-mono, monospace)', size: 11, color: '#94a3b8' },
  xaxis: {
    gridcolor: '#f1f5f9',
    linecolor: '#e2e8f0',
    tickfont: { size: 10, color: '#94a3b8' },
    showgrid: true,
    zeroline: false,
  },
  yaxis: {
    gridcolor: '#f1f5f9',
    linecolor: '#e2e8f0',
    tickfont: { size: 10, color: '#94a3b8' },
    showgrid: true,
    zeroline: false,
  },
  hoverlabel: {
    bgcolor: '#0f172a',
    bordercolor: '#0f172a',
    font: { color: '#ffffff', family: 'system-ui', size: 12 },
  },
  showlegend: false,
  ...overrides,
});

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

  const dates = sorted.map((l) =>
    new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  );
  const mileages   = sorted.map((l) => l.mileageCalculated ?? null);
  const prices     = sorted.map((l) => l.pricePerLitre);
  const stations   = sorted.map((l) => l.stationName || '');

  // 1. Monthly Aggregation
  const monthlyData: Record<string, { spend: number; litres: number }> = {};
  sorted.forEach(log => {
    const d = new Date(log.date);
    const m = d.toLocaleString('en-US', { month: 'short' });
    const y = d.getFullYear().toString().slice(-2);
    const key = `${m} '${y}`;
    if (!monthlyData[key]) monthlyData[key] = { spend: 0, litres: 0 };
    monthlyData[key].spend += log.totalCost;
    monthlyData[key].litres += log.fuelAmount;
  });
  const months = Object.keys(monthlyData);
  const monthlySpend = months.map(m => monthlyData[m].spend);
  const monthlyLitres = months.map(m => monthlyData[m].litres);

  // 2. Brand Aggregation
  const brandData: Record<string, { fills: number; litres: number; spend: number }> = {};
  sorted.forEach(log => {
    const rawBrand = log.stationName?.split(' - ')[0] || log.stationName || 'Others';
    const brand = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara'].find(b => rawBrand.includes(b)) || 'Others';
    
    if (!brandData[brand]) brandData[brand] = { fills: 0, litres: 0, spend: 0 };
    brandData[brand].fills += 1;
    brandData[brand].litres += log.fuelAmount;
    brandData[brand].spend += log.totalCost;
  });
  
  const brands = Object.keys(brandData);
  const brandSpend = brands.map(b => brandData[b].spend);
  const BCOLORS: Record<string, string> = { "Jio-BP": "#f59e0b", "IOCL": "#3b82f6", "BPCL": "#22c55e", "HPCL": "#ef4444", "Shell": "#fbbf24", "Nayara": "#a855f7", "Others": "#94a3b8" };
  const brandColors = brands.map(b => BCOLORS[b] || BCOLORS['Others']);

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
          { label: 'Best Fill-up', value: `${Math.max(...(mileages.filter(Boolean) as number[])).toFixed(1)} km/L` },
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
        <SectionHeader
          title="Tank-to-Tank Mileage"
          sub={`Target benchmark: 40 km/L`}
        />
        <Plot
          data={[
            {
              x: dates, y: mileages,
              type: 'scatter', mode: 'lines+markers',
              name: 'km/L',
              marker: { color: '#f59e0b', size: 6, symbol: 'circle' },
              line: { color: '#f59e0b', width: 2, shape: 'spline' },
              text: stations,
              hovertemplate: '<b>%{x}</b><br>%{y:.2f} km/L<br>%{text}<extra></extra>',
            }
          ]}
          layout={plotLayout({ yaxis: { ...plotLayout().yaxis, range: [20, 58] } })}
          useResizeHandler
          className="w-full h-64"
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>

      <hr className="border-slate-100" />

      {/* Chart 2 + 3 side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Monthly Spend & Litres */}
        <div>
          <SectionHeader title="Monthly Spend & Litres" sub="Fuel consumption per month" />
          <Plot
            data={[
              {
                x: months, y: monthlySpend,
                type: 'bar',
                name: 'Spend',
                marker: { color: '#f59e0b', opacity: 0.8 },
                hovertemplate: '<b>%{x}</b><br>Spend: ₹%{y}<extra></extra>',
                yaxis: 'y1'
              },
              {
                x: months, y: monthlyLitres,
                type: 'bar',
                name: 'Litres',
                marker: { color: '#3b82f6', opacity: 0.55 },
                hovertemplate: '<b>%{x}</b><br>Litres: %{y:.2f} L<extra></extra>',
                yaxis: 'y2'
              }
            ]}
            layout={plotLayout({
              yaxis2: {
                overlaying: 'y',
                side: 'right',
                gridcolor: 'rgba(0,0,0,0)',
                tickfont: { size: 10, color: '#94a3b8' },
                zeroline: false,
              }
            })}
            useResizeHandler
            className="w-full h-64"
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* Brand Spend Doughnut */}
        <div>
          <SectionHeader title="Spend by Brand" sub="Total ₹ distributed across stations" />
          <Plot
            data={[{
              values: brandSpend,
              labels: brands,
              type: 'pie',
              hole: 0.68,
              marker: {
                colors: brandColors,
                line: { color: '#ffffff', width: 2 }
              },
              hovertemplate: '<b>%{label}</b><br>₹%{value}<br>%{percent}<extra></extra>',
              textinfo: 'none'
            }]}
            layout={plotLayout({
              margin: { l: 20, r: 20, t: 20, b: 20 },
              showlegend: true,
              legend: { orientation: 'h', y: -0.1, x: 0.5, xanchor: 'center', font: { size: 10 } }
            })}
            useResizeHandler
            className="w-full h-64"
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Brand Breakdown Table & Price Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Brand Table */}
        <div>
          <SectionHeader title="Brand Breakdown" sub="Fill-ups and Litres per Brand" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Brand</th>
                  <th className="text-center py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fills</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Litres</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Spent</th>
                  <th className="text-right py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">% Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {brands.sort((a, b) => brandData[b].spend - brandData[a].spend).map(brand => {
                  const data = brandData[brand];
                  const totalSpent = brandSpend.reduce((acc, curr) => acc + curr, 0);
                  const pct = ((data.spend / totalSpent) * 100).toFixed(1);
                  return (
                    <tr key={brand} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 flex items-center gap-2 text-slate-700 font-medium text-xs">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BCOLORS[brand] || BCOLORS['Others'] }} />
                        {brand}
                      </td>
                      <td className="py-3 text-center text-slate-600 font-mono text-xs">{data.fills}</td>
                      <td className="py-3 text-right text-slate-600 font-mono text-xs">{data.litres.toFixed(2)} L</td>
                      <td className="py-3 text-right text-slate-900 font-semibold font-mono text-xs">₹{data.spend}</td>
                      <td className="py-3 text-right text-slate-600 font-mono text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: BCOLORS[brand] || BCOLORS['Others'] }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fuel Price Trend */}
        <div>
          <SectionHeader title="Price per Litre Trend" sub="Fuel price over time" />
          <Plot
            data={[{
              x: dates, y: prices,
              type: 'scatter', mode: 'lines+markers',
              marker: { color: '#3b82f6', size: 5 },
              line: { color: '#3b82f6', width: 1.5 },
              text: stations,
              hovertemplate: '<b>%{x}</b><br>₹%{y:.2f}/L<extra></extra>',
            }]}
            layout={plotLayout()}
            useResizeHandler
            className="w-full h-64"
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      </div>

    </div>
  );
};
