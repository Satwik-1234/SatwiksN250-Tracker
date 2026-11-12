'use client';

import React, { useSyncExternalStore } from 'react';
import { FuelLog, DashboardMetrics, ServiceLog, AccessoryGear } from '@/types/fuel';
import { computeFullTankSegments, economyRating } from '@/lib/metrics';
import { Fuel } from 'lucide-react';
import {
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RecordsCard } from '@/components/cards/RecordsCard';
import { PageHeader, StatStrip, EmptyState } from '@/components/ui/Page';
import { MonthlyInsights } from '@/components/views/MonthlyInsights';

interface AnalyticsViewProps {
  logs: FuelLog[];
  metrics: DashboardMetrics;
  services?: ServiceLog[];
  accessories?: AccessoryGear[];
}

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-4">
    <h2 className="text-[15px] font-semibold text-ink-1">{title}</h2>
    {sub && <p className="text-[13px] text-ink-2 mt-0.5">{sub}</p>}
  </div>
);

const emptySubscribe = () => () => {};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs, metrics, services = [], accessories = [] }) => {
  // true on the client, false during SSR/prerender — no setState-in-effect needed
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) {
    return <div className="py-24 text-center text-ink-3 text-sm">Loading…</div>;
  }

  if (logs.length < 2) {
    return (
      <div className="space-y-5">
        <PageHeader title="Analytics" />
        <EmptyState
          icon={Fuel}
          title="Not enough refills yet"
          body="Log at least two refills to see mileage trends and brand comparisons."
        />
      </div>
    );
  }

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // -------------------------------------------------------------
  // DATA PREPARATION FOR BRAND BREAKDOWN
  // -------------------------------------------------------------
  const brandNames = ['Jio-BP', 'IOCL', 'BPCL', 'HPCL', 'Shell', 'Nayara'];
  
  interface BrandStats {
    name: string;
    fillCount: number;
    totalLitres: number;
    totalSpent: number;
    mileageDistSum: number;
    mileageFuelSum: number;
  }

  // Resolve like LogsView does: the explicit brand field wins; the station
  // name is only a fallback. Analytics previously ignored `l.brand` entirely,
  // so an "IOCL" fill labelled "Shetimal Filling Station" was bucketed as
  // Other here but as IOCL in the Log Book.
  const normalizeBrand = (raw?: string): string => {
    const clean = (raw || '').trim();
    if (!clean || clean === '-') return '';
    const named = brandNames.find(b => clean.toUpperCase().includes(b.toUpperCase()));
    return named || clean;
  };

  const resolveBrand = (l: FuelLog): string => {
    return normalizeBrand(l.brand) || ((): string => {
      const sName = (l.stationName || '').toUpperCase();
      for (const b of brandNames) {
        if (sName.includes(b.toUpperCase())) return b;
      }
      return '';
    })() || 'Other';
  };

  const brandMap: Record<string, BrandStats> = {};

  sorted.forEach((l) => {
    const brand = resolveBrand(l);

    if (!brandMap[brand]) {
      brandMap[brand] = {
        name: brand,
        fillCount: 0,
        totalLitres: 0,
        totalSpent: 0,
        mileageDistSum: 0,
        mileageFuelSum: 0,
      };
    }

    brandMap[brand].fillCount += 1;
    brandMap[brand].totalLitres += l.fuelAmount;
    brandMap[brand].totalSpent += l.totalCost;
  });

  // Attribute each full-tank segment to the brand of its closing fill, so
  // partial fills between full tanks never skew a brand's average mileage.
  computeFullTankSegments(sorted).forEach((seg) => {
    const closingLog = sorted[seg.endIndex];
    if (!closingLog) return;
    const brand = resolveBrand(closingLog);
    if (!brandMap[brand]) return;
    brandMap[brand].mileageDistSum += seg.distance;
    brandMap[brand].mileageFuelSum += seg.fuel;
  });

  const totalLitresAll = sorted.reduce((sum, l) => sum + l.fuelAmount, 0);
  const totalSpentAll  = sorted.reduce((sum, l) => sum + l.totalCost, 0);

  const brandStatsList = Object.values(brandMap).map((b) => ({
    ...b,
    percentLitres: Number(((b.totalLitres / totalLitresAll) * 100).toFixed(1)),
    percentSpent: Number(((b.totalSpent / totalSpentAll) * 100).toFixed(1)),
    avgPrice: b.totalLitres > 0 ? Number((b.totalSpent / b.totalLitres).toFixed(2)) : 0,
    avgMileage: b.mileageFuelSum > 0 ? Number((b.mileageDistSum / b.mileageFuelSum).toFixed(2)) : null,
  })).sort((a, b) => b.totalLitres - a.totalLitres);

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
  const mileageLogs = sorted.filter(l => l.mileageCalculated && l.mileageCalculated > 0);
  const mileageDates = mileageLogs.map(l => new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const mileageValues = mileageLogs.map(l => Number(l.mileageCalculated?.toFixed(1)));
  
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
  const tripTypeMap: Record<string, { dist: number; cost: number; litres: number }> = {};
  sorted.forEach((l) => {
    const type = l.tripType || 'Commute';
    if (!tripTypeMap[type]) tripTypeMap[type] = { dist: 0, cost: 0, litres: 0 };
    tripTypeMap[type].dist += l.distanceCalculated || 0;
    tripTypeMap[type].cost += l.totalCost;
    tripTypeMap[type].litres += l.fuelAmount;
  });

  const tripTypesList = Object.entries(tripTypeMap).map(([type, stats]) => ({
    type,
    dist: Number(stats.dist.toFixed(1)),
    cost: Math.round(stats.cost),
    litres: Number(stats.litres.toFixed(1)),
    avgKmpl: stats.litres > 0 && stats.dist > 0 ? Number((stats.dist / stats.litres).toFixed(1)) : 0,
  }));

  const mileageData = mileageDates.map((date, i) => ({
    date,
    mileage: mileageValues[i],
    trend: movingAvgMileage[i],
  }));
  const priceData = priceDates.map((date, i) => ({
    date,
    price: priceValues[i],
    station: priceStations[i],
  }));

  const bestBrand = [...brandStatsList]
    .filter((b) => b.avgMileage)
    .sort((a, b) => (b.avgMileage || 0) - (a.avgMileage || 0))[0];
  const maxLitres = Math.max(...brandLitres, 1);

  const axisTick = { fontSize: 12, fill: '#8b93a1' };
  const tooltipStyle = {
    borderRadius: 10,
    border: '1px solid #e4e7ec',
    boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
    fontSize: 12,
    padding: '8px 10px',
  };

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader title="Analytics" subtitle={`Based on ${metrics.totalLogsCount} refills.`} />

      <RecordsCard logs={logs} />

      <StatStrip
        items={[
          {
            label: 'Average mileage',
            value: Number(metrics.avgMileage) > 0 ? Number(metrics.avgMileage).toFixed(1) : '—',
            unit: 'km/L',
            hint: Number(metrics.avgMileage) > 0 ? economyRating(Number(metrics.avgMileage)) : undefined,
          },
          { label: 'Running cost', value: `₹${metrics.costPerKm}`, unit: '/km' },
          { label: 'Total spent', value: `₹${(metrics.totalSpent || 0).toLocaleString('en-IN')}` },
          { label: 'Total fuel', value: metrics.totalLitres, unit: 'L' },
        ]}
      />

      {/* Lifecycle cost, month-to-month jumps, gear by category */}
      <MonthlyInsights logs={logs} services={services} accessories={accessories} />

      {/* Mileage per tank */}
      <section className="card p-5 sm:p-6">
        <SectionHeader
          title="Mileage per tank"
          sub="Bars are each full tank. The line is the average of the last three."
        />
        {mileageData.length >= 2 ? (
          <div className="h-64 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mileageData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} domain={[0, 'auto']} />
                <Tooltip
                  cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [`${value} km/L`, name === 'trend' ? '3-tank average' : 'This tank']}
                />
                <Bar dataKey="mileage" fill="#bfdbfe" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#1f4fd8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-ink-2">Fill to full a few more times to see the trend.</p>
        )}
      </section>

      {/* Petrol brands */}
      <section className="card overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6">
          <SectionHeader
            title="Petrol brands"
            sub={
              bestBrand
                ? `Best mileage so far: ${bestBrand.name} at ${bestBrand.avgMileage} km/L.`
                : 'Which pumps you use and what you get from them.'
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left tabular">
            <thead>
              <tr className="border-y border-[var(--color-border)] text-[13px] text-ink-2">
                <th className="py-2.5 pl-5 sm:pl-6 pr-4 font-medium">Brand</th>
                <th className="py-2.5 px-4 font-medium w-[32%] min-w-[140px]">Share of fuel</th>
                <th className="py-2.5 px-4 font-medium text-right">Spent</th>
                <th className="py-2.5 px-4 font-medium text-right">Price</th>
                <th className="py-2.5 pl-4 pr-5 sm:pr-6 font-medium text-right">Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {brandStatsList.map((b) => (
                <tr key={b.name}>
                  <td className="py-3 pl-5 sm:pl-6 pr-4 whitespace-nowrap">
                    <div className="font-medium text-ink-1">{b.name}</div>
                    <div className="text-[13px] text-ink-2">
                      {b.fillCount} {b.fillCount === 1 ? 'refill' : 'refills'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${(b.totalLitres / maxLitres) * 100}%` }}
                        />
                      </div>
                      <span className="text-[13px] text-ink-2 w-11 text-right">{b.percentLitres}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-ink-1 whitespace-nowrap">
                    ₹{Math.round(b.totalSpent).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap">₹{b.avgPrice}</td>
                  <td
                    className={`py-3 pl-4 pr-5 sm:pr-6 text-right font-semibold whitespace-nowrap ${
                      bestBrand && b.name === bestBrand.name ? 'text-blue-600' : 'text-ink-1'
                    }`}
                  >
                    {b.avgMileage ? `${b.avgMileage} km/L` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Petrol price */}
        <section className="card p-5 sm:p-6">
          <SectionHeader title="Petrol price" sub="What you paid per litre at each refill." />
          <div className="h-56 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(v) => `₹${Math.round(Number(v))}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`₹${Number(value).toFixed(2)} /L`, 'Price']}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.station ? `${label} · ${payload[0].payload.station}` : label
                  }
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#15171c"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#15171c', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Ride type */}
        <section className="card overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 sm:pt-6">
            <SectionHeader title="By ride type" sub="How each kind of riding affects mileage." />
          </div>
          <table className="w-full text-sm text-left tabular">
            <thead>
              <tr className="border-y border-[var(--color-border)] text-[13px] text-ink-2">
                <th className="py-2.5 pl-5 sm:pl-6 pr-4 font-medium">Type</th>
                <th className="py-2.5 px-4 font-medium text-right">Distance</th>
                <th className="py-2.5 px-4 font-medium text-right">Spent</th>
                <th className="py-2.5 pl-4 pr-5 sm:pr-6 font-medium text-right">Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {tripTypesList.map((t) => (
                <tr key={t.type}>
                  <td className="py-3 pl-5 sm:pl-6 pr-4 font-medium text-ink-1">{t.type}</td>
                  <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap">
                    {t.dist.toLocaleString('en-IN')} km
                  </td>
                  <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap">
                    ₹{t.cost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pl-4 pr-5 sm:pr-6 text-right font-semibold text-ink-1 whitespace-nowrap">
                    {t.avgKmpl > 0 ? `${t.avgKmpl} km/L` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};
