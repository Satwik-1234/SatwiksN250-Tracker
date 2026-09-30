'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FuelLog, DashboardMetrics } from '../types/fuel';
import { FuelEconomyGauge } from './FuelEconomyGauge';
import { computeMileageTotals, costPerKm, groupTotals } from '@/utils/mileage';
import { 
  Fuel, 
  TrendingUp, 
  IndianRupee, 
  Gauge, 
  PieChart as PieIcon, 
  MapPin, 
  BarChart3,
  Award,
  Layers
} from 'lucide-react';

// Dynamically import Plotly with SSR disabled for Next.js App Router
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400 text-xs font-mono animate-pulse">
      Loading interactive chart...
    </div>
  )
});

interface AnalyticsViewProps {
  logs: FuelLog[];
  metrics: DashboardMetrics;
}

const SectionHeader = ({ title, sub, icon: Icon }: { title: string; sub?: string; icon?: any }) => (
  <div className="mb-4 flex items-center justify-between">
    <div>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />}
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      {sub && <p className="text-xs text-slate-400 font-mono mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, metrics }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs font-mono animate-pulse">
        Initializing analytics engine…
      </div>
    );
  }

  if (logs.length < 2) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md mx-auto">
        <Fuel className="h-10 w-10 text-blue-500 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-800">More Telemetry Needed</h3>
        <p className="text-xs text-slate-500 mt-1">Please log at least 2 fill-ups to generate Plotly interactive charts and brand analytics.</p>
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // -------------------------------------------------------------
  // DATA PREPARATION FOR BRAND BREAKDOWN
  // -------------------------------------------------------------
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara'];

  const brandOf = (stationName?: string): string => {
    const sName = (stationName || '').toUpperCase();
    for (const b of brandNames) {
      if (sName.includes(b.toUpperCase())) return b;
    }
    return 'Other';
  };

  // Litres / spend / ₹-per-litre are exact per-brand aggregates. A per-brand
  // km/L is not: a full-tank segment's fuel routinely spans fills from two or
  // more brands, so its economy cannot be attributed to one without
  // double-counting distance. Reporting that number here was the bug.
  const brandTotals = groupTotals(sorted, (l) => brandOf(l.stationName));

  const totalLitresAll = sorted.reduce((sum, l) => sum + l.fuelAmount, 0);
  const totalSpentAll  = sorted.reduce((sum, l) => sum + l.totalCost, 0);

  const brandStatsList = Array.from(brandTotals.entries())
    .map(([name, t]) => ({
      name,
      fillCount: t.fills,
      totalLitres: t.litres,
      totalSpent: t.spent,
      percentLitres: t.litresShare,
      percentSpent: t.spentShare,
      avgPrice: t.costPerLitre,
    }))
    .sort((a, b) => b.totalLitres - a.totalLitres);

  // Single source of truth for overall economy, shared with LogsView.
  const overallMileage = computeMileageTotals(sorted);
  const runningCostPerKm = costPerKm(sorted);

  // Colors for Brands
  const BRAND_COLORS: Record<string, string> = {
    'Jio-BP': '#f59e0b',
    'IOCL': '#3b82f6',
    'BPCL': '#10b981',
    'HPCL': '#ef4444',
    'Shell': '#eab308',
    'Nayara': '#8b5cf6',
    'Other': '#64748b',
  };

  // -------------------------------------------------------------
  // CHART DATA: BRAND DONUT CHART (FUEL VOLUME & SPEND SHARE)
  // -------------------------------------------------------------
  const brandLabels = brandStatsList.map(b => b.name);
  const brandLitres = brandStatsList.map(b => b.totalLitres);
  const brandColorsList = brandStatsList.map(b => BRAND_COLORS[b.name] || '#64748b');

  // -------------------------------------------------------------
  // CHART DATA: MILEAGE TREND & MOVING AVERAGE
  // -------------------------------------------------------------
  const mileageDates: string[] = [];
  const mileageValues: number[] = [];
  sorted.forEach((l) => {
    const v = l.mileageCalculated;
    // Skip rows with no valid measurement. `Number(undefined?.toFixed(1))`
    // evaluates to NaN, and NaN then poisons the whole rolling average because
    // one bad entry makes every subsequent window average NaN.
    if (v === null || v === undefined || !Number.isFinite(v) || v <= 0) return;
    mileageDates.push(new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    mileageValues.push(Number(v.toFixed(1)));
  });

  // Compute moving average for mileage
  const movingAvgMileage: number[] = [];
  mileageValues.forEach((val, i) => {
    const window = mileageValues.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((s, v) => s + v, 0) / window.length;
    movingAvgMileage.push(Number(avg.toFixed(1)));
  });

  // -------------------------------------------------------------
  // CHART DATA: FUEL PRICE TREND AT EACH FILL
  // -------------------------------------------------------------
  const priceDates = sorted.map(l => new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }));
  const priceValues = sorted.map(l => l.pricePerLitre);
  const priceStations = sorted.map(l => l.stationName || 'Petrol Pump');

  // -------------------------------------------------------------
  // CHART DATA: TRIP TYPE BREAKDOWN
  // -------------------------------------------------------------
  const tripTypeTotals = groupTotals(sorted, (l) => l.tripType || 'Commute');

  const tripTypesList = Array.from(tripTypeTotals.entries())
    .map(([type, t]) => ({
      type,
      cost: Math.round(t.spent),
      litres: t.litres,
      fills: t.fills,
      costPerLitre: t.costPerLitre,
      litresShare: t.litresShare,
    }))
    .sort((a, b) => b.litres - a.litres);

  // Common Plotly Layout Defaults
  const commonLayoutConfig = {
    autosize: true,
    responsive: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, system-ui, sans-serif', size: 11, color: '#475569' },
    margin: { l: 45, r: 15, t: 25, b: 35 },
  };

  const plotlyConfig = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
  };

  return (
    <div className="animate-fade-up space-y-6 pb-12">

      {/* ── TOP HERO: GAUGE & TELEMETRY SUMMARY ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <FuelEconomyGauge value={overallMileage.kmPerLitre} />

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Spent</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5 block">₹{(metrics.totalSpent || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Running Cost</span>
              {/* Guarded: a confident "₹0.00 /km" in green reads as a real
                  measurement when it actually means "not enough data". */}
              <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono mt-0.5 block">
                {runningCostPerKm !== null ? `₹${runningCostPerKm}` : '—'} <span className="text-[10px] text-emerald-700 font-normal">/km</span>
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Fuel</span>
              <span className="text-lg sm:text-xl font-black text-blue-600 font-mono mt-0.5 block">
                {metrics.totalLitres > 0 ? metrics.totalLitres.toFixed(1) : '—'} <span className="text-[10px] text-blue-700 font-normal">Litres</span>
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Refill Stops</span>
              <span className="text-lg sm:text-xl font-black text-purple-600 font-mono mt-0.5 block">{metrics.totalLogsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PLOTLY CHART 1: MILEAGE TREND & MOVING AVERAGE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <SectionHeader 
          title="Fuel Efficiency & Mileage Trend" 
          sub="Interactive segment mileage (km/L) per full tank with 3-stop moving average"
          icon={Gauge}
        />
        <div className="h-[280px] w-full relative">
          <Plot
            data={[
              {
                x: mileageDates,
                y: mileageValues,
                type: 'bar',
                name: 'Segment Mileage',
                marker: { color: '#3b82f6', opacity: 0.7, cornerradius: 4 },
                hovertemplate: '%{x}: <b>%{y} km/L</b><extra></extra>',
              },
              {
                x: mileageDates,
                y: movingAvgMileage,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Moving Avg',
                line: { color: '#2563eb', width: 3, shape: 'spline' },
                marker: { size: 6, color: '#1d4ed8' },
                hovertemplate: '%{x} Trend: <b>%{y} km/L</b><extra></extra>',
              }
            ]}
            layout={{
              ...commonLayoutConfig,
              yaxis: { title: 'km/L', gridcolor: '#f1f5f9', zeroline: false },
              xaxis: { gridcolor: '#f1f5f9' },
              legend: { orientation: 'h', x: 0, y: 1.15, font: { size: 10 } },
            }}
            config={plotlyConfig}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* ── GRID ROW 2: BRAND FUEL VOLUME % DONUT & BRAND BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Brand Share Donut Chart — 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <SectionHeader 
            title="Percent Fuel Filled by Brand" 
            sub="Volume distribution (% of total Litres)"
            icon={PieIcon}
          />
          <div className="h-[240px] w-full relative flex items-center justify-center">
            <Plot
              data={[
                {
                  labels: brandLabels,
                  values: brandLitres,
                  type: 'pie',
                  hole: 0.6,
                  marker: { colors: brandColorsList },
                  textinfo: 'label+percent',
                  textposition: 'inside',
                  hoverinfo: 'label+value+percent',
                  hovertemplate: '<b>%{label}</b><br>%{value:.1f} Litres (%{percent})<extra></extra>',
                }
              ]}
              layout={{
                ...commonLayoutConfig,
                margin: { l: 10, r: 10, t: 10, b: 10 },
                showlegend: false,
              }}
              config={plotlyConfig}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Custom Brand Pills Summary below Donut */}
          <div className="flex flex-wrap gap-2 pt-2 justify-center border-t border-slate-100">
            {brandStatsList.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.name] || '#64748b' }} />
                <span className="text-xs font-semibold text-slate-700">{b.name}</span>
                <span className="text-xs font-mono font-bold text-slate-900">{b.percentLitres}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Brand Telemetry Cards & Table — 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <SectionHeader 
            title="Brand-Wise Breakup & Stats" 
            sub="Comparison of mileage, cost & volume by petrol brand"
            icon={Award}
          />
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2">Brand</th>
                  <th className="pb-2 text-right">Litres</th>
                  <th className="pb-2 text-right">Spent</th>
                  <th className="pb-2 text-right">Avg ₹/L</th>
                  <th className="pb-2 text-right">Vol. Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-mono">
                {brandStatsList.map((b) => (
                  <tr key={b.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.name] || '#64748b' }} />
                      {b.name}
                      <span className="text-[10px] font-normal text-slate-400 font-sans">({b.fillCount} fills)</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">{b.totalLitres.toFixed(1)}L</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">₹{Math.round(b.totalSpent)}</td>
                    <td className="py-2.5 text-right text-slate-600">{b.avgPrice !== null ? `₹${b.avgPrice}` : '—'}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">
                      {b.percentLitres.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── PLOTLY CHART 3: FUEL PRICE AT EACH FILL & TREND ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <SectionHeader 
          title="Fuel Price at Each Fill & Trend" 
          sub="Historical petrol price (₹/Litre) tracked over fill dates"
          icon={IndianRupee}
        />
        <div className="h-[260px] w-full relative">
          <Plot
            data={[
              {
                x: priceDates,
                y: priceValues,
                text: priceStations,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Price (₹/L)',
                line: { color: '#ef4444', width: 2.5, shape: 'spline' },
                marker: { size: 7, color: '#dc2626' },
                hovertemplate: 'Date: %{x}<br><b>Price: ₹%{y}/L</b><br>Station: %{text}<extra></extra>',
              }
            ]}
            layout={{
              ...commonLayoutConfig,
              yaxis: { title: '₹ / Litre', gridcolor: '#f1f5f9', zeroline: false },
              xaxis: { gridcolor: '#f1f5f9' },
            }}
            config={plotlyConfig}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* ── TRIP TYPE ANALYSIS: CITY VS HIGHWAY VS COMMUTE VS TOUR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <SectionHeader
          title="Riding Category Breakdown"
          sub="Volume, expense and rate split by trip type"
          icon={Layers}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tripTypesList.map((t) => (
            <div key={t.type} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{t.type}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">{t.fills} fills</span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Total Spent:</span>
                  <span className="font-bold text-slate-900">₹{t.cost}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Fuel Consumed:</span>
                  <span className="font-bold text-slate-900">{t.litres} L</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/50">
                  <span>Avg Rate:</span>
                  <span className="font-black text-emerald-600">{t.costPerLitre !== null ? `₹${t.costPerLitre}/L` : '—'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Volume Share:</span>
                  <span className="font-bold text-slate-700">{t.litresShare.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
