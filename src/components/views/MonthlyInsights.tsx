'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FuelLog, ServiceLog, AccessoryGear } from '@/types/fuel';
import { computeFullTankSegments, sortLogsByDate } from '@/lib/metrics';

interface Props {
  logs: FuelLog[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
}

const GRID = 'rgba(128,128,140,0.18)';
const AXIS = '#8b93a1';
const BLUE = '#1f4fd8';
const RED = '#e2231a';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const monthKey = (raw?: string): string | null => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

interface MonthRow {
  key: string;
  label: string;
  fuel: number;
  service: number;
  gear: number;
  total: number;
  distance: number;
  segDist: number;
  segFuel: number;
  mileage: number | null;
}

/** Small up/down chip for a month-over-month change. */
const Delta = ({ value, unit, goodWhenUp }: { value: number | null; unit: string; goodWhenUp: boolean }) => {
  if (value === null || Math.abs(value) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[12px] text-ink-3 tabular">
        <Minus className="w-3 h-3" /> —
      </span>
    );
  }
  const up = value > 0;
  const good = up === goodWhenUp;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium tabular ${good ? 'text-emerald-600' : 'text-accent'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: unit === '₹' ? 0 : 1 })}
      {unit !== '₹' && unit}
    </span>
  );
};

export const MonthlyInsights: React.FC<Props> = ({ logs, services, accessories }) => {
  const sorted = React.useMemo(() => sortLogsByDate(logs), [logs]);

  const { months, lifetime, byCategory } = React.useMemo(() => {
    const map = new Map<string, MonthRow>();
    const ensure = (key: string): MonthRow => {
      let r = map.get(key);
      if (!r) {
        r = { key, label: monthLabel(key), fuel: 0, service: 0, gear: 0, total: 0, distance: 0, segDist: 0, segFuel: 0, mileage: null };
        map.set(key, r);
      }
      return r;
    };

    sorted.forEach((l) => {
      const k = monthKey(l.date);
      if (!k) return;
      const r = ensure(k);
      r.fuel += Number(l.totalCost) || 0;
      r.distance += Number(l.distanceCalculated) || 0;
    });

    // Attribute each full-tank segment to the month its closing fill lands in.
    computeFullTankSegments(sorted).forEach((seg) => {
      const closing = sorted[seg.endIndex];
      const k = monthKey(closing?.date);
      if (!k) return;
      const r = ensure(k);
      r.segDist += seg.distance;
      r.segFuel += seg.fuel;
    });

    services.forEach((s) => {
      const k = monthKey(s.date);
      if (!k) return;
      ensure(k).service += Number(s.totalCost) || 0;
    });

    accessories.forEach((a) => {
      const k = monthKey(a.datePurchased);
      if (!k) return;
      ensure(k).gear += Number(a.cost) || 0;
    });

    const rows = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    rows.forEach((r) => {
      r.total = r.fuel + r.service + r.gear;
      r.mileage = r.segFuel > 0 ? Number((r.segDist / r.segFuel).toFixed(1)) : null;
    });

    const totalFuel = rows.reduce((s, r) => s + r.fuel, 0);
    const totalService = rows.reduce((s, r) => s + r.service, 0);
    const totalGear = rows.reduce((s, r) => s + r.gear, 0);
    const totalAll = totalFuel + totalService + totalGear;
    const odoVals = sorted.map((l) => Number(l.odometer) || 0).filter((n) => n > 0);
    // Use the odometer reading as-is — one number everywhere
    const lifetimeKm = odoVals.length > 0 ? Math.max(...odoVals) : 0;

    const catMap = new Map<string, number>();
    accessories.forEach((a) => {
      const c = (a.category || 'Other').trim() || 'Other';
      catMap.set(c, (catMap.get(c) || 0) + (Number(a.cost) || 0));
    });
    const byCategory = [...catMap.entries()]
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);

    return {
      months: rows,
      lifetime: {
        fuel: totalFuel,
        service: totalService,
        gear: totalGear,
        total: totalAll,
        km: lifetimeKm,
        costPerKm: lifetimeKm > 0 ? totalAll / lifetimeKm : 0,
      },
      byCategory,
    };
  }, [sorted, services, accessories]);

  if (months.length === 0) return null;

  const recent = months.slice(-8);
  const chartData = recent.map((r) => ({ label: r.label, spend: Math.round(r.total), mileage: r.mileage }));
  const maxCat = Math.max(...byCategory.map((c) => c.cost), 1);

  const share = (v: number) => (lifetime.total > 0 ? `${(v / lifetime.total) * 100}%` : '0%');

  return (
    <>
      {/* Lifecycle cost */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-ink-1">Lifecycle cost</h2>
          <p className="text-[13px] text-ink-2 mt-0.5">Everything the bike has cost you, and what that works out to per km.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-5 sm:gap-8 items-end">
          <div>
            <div className="text-[13px] text-ink-2">Total cost of ownership</div>
            <div className="mt-1 font-display text-4xl sm:text-5xl font-semibold text-ink-1 tabular">{inr(lifetime.total)}</div>
            <div className="mt-4 flex h-2.5 rounded-full overflow-hidden bg-surface-2">
              <div style={{ width: share(lifetime.fuel), background: BLUE }} />
              <div style={{ width: share(lifetime.service), background: 'var(--color-text-1)' }} />
              <div style={{ width: share(lifetime.gear), background: RED }} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3 tabular">
              {[
                { label: 'Fuel', value: lifetime.fuel, dot: BLUE },
                { label: 'Service', value: lifetime.service, dot: 'var(--color-text-1)' },
                { label: 'Gear', value: lifetime.gear, dot: RED },
              ].map((c) => (
                <div key={c.label}>
                  <dt className="flex items-center gap-1.5 text-[13px] text-ink-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                    {c.label}
                  </dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-ink-1">{inr(c.value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[var(--color-border)] pt-4 sm:pt-0 sm:pl-8">
            <div className="text-[13px] text-ink-2">Cost per km</div>
            <div className="mt-1 font-display text-4xl font-semibold text-ink-1 tabular">
              ₹{lifetime.costPerKm.toFixed(2)}
            </div>
            <div className="mt-1 text-[13px] text-ink-3">over {lifetime.km.toLocaleString('en-IN')} km</div>
          </div>
        </div>
      </section>

      {/* Month to month */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-ink-1">Month to month</h2>
          <p className="text-[13px] text-ink-2 mt-0.5">Spend (bars) and mileage (line), and how each month jumped from the last.</p>
        </div>

        <div className="h-60 w-full -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={8} />
              <YAxis
                yAxisId="spend"
                tick={{ fontSize: 12, fill: AXIS }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
              />
              <YAxis yAxisId="mileage" orientation="right" tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={false} width={34} />
              <Tooltip
                cursor={{ fill: 'rgba(128,128,140,0.08)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e4e7ec', fontSize: 12, padding: '8px 10px', color: '#0b1220' }}
                formatter={(value, name) =>
                  name === 'spend' ? [inr(Number(value)), 'Spent'] : [`${value} km/L`, 'Mileage']
                }
              />
              <Bar yAxisId="spend" dataKey="spend" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={34} isAnimationActive={false} />
              <Line
                yAxisId="mileage"
                type="monotone"
                dataKey="mileage"
                stroke={RED}
                strokeWidth={2}
                dot={{ r: 2.5, fill: RED, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left tabular">
            <thead>
              <tr className="border-y border-[var(--color-border)] text-[13px] text-ink-2">
                <th className="py-2.5 pr-4 font-medium">Month</th>
                <th className="py-2.5 px-4 font-medium text-right">Distance</th>
                <th className="py-2.5 px-4 font-medium text-right">Mileage</th>
                <th className="py-2.5 px-4 font-medium text-right">Jump</th>
                <th className="py-2.5 px-4 font-medium text-right">Spent</th>
                <th className="py-2.5 pl-4 font-medium text-right">Jump</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recent
                .map((r, i) => {
                  const prev = i > 0 ? recent[i - 1] : null;
                  const mileageJump = r.mileage !== null && prev?.mileage != null ? Number((r.mileage - prev.mileage).toFixed(1)) : null;
                  const spendJump = prev ? Math.round(r.total - prev.total) : null;
                  return { r, mileageJump, spendJump };
                })
                .reverse()
                .map(({ r, mileageJump, spendJump }) => (
                  <tr key={r.key}>
                    <td className="py-2.5 pr-4 font-medium text-ink-1 whitespace-nowrap">{r.label}</td>
                    <td className="py-2.5 px-4 text-right text-ink-2 whitespace-nowrap">{Math.round(r.distance).toLocaleString('en-IN')} km</td>
                    <td className="py-2.5 px-4 text-right text-ink-1 whitespace-nowrap">{r.mileage !== null ? `${r.mileage} km/L` : '—'}</td>
                    <td className="py-2.5 px-4 text-right"><Delta value={mileageJump} unit="" goodWhenUp /></td>
                    <td className="py-2.5 px-4 text-right text-ink-1 whitespace-nowrap">{inr(r.total)}</td>
                    <td className="py-2.5 pl-4 text-right"><Delta value={spendJump} unit="₹" goodWhenUp={false} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Accessories by category */}
      {byCategory.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-ink-1">Gear spend by category</h2>
            <p className="text-[13px] text-ink-2 mt-0.5">Where your accessory money has gone.</p>
          </div>
          <ul className="space-y-3">
            {byCategory.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[13px] text-ink-1 capitalize truncate">{c.name.toLowerCase()}</span>
                <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.cost / maxCat) * 100}%`, background: RED }} />
                </div>
                <span className="w-20 text-right text-[13px] font-semibold text-ink-1 tabular">{inr(c.cost)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};
