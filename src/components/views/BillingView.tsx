'use client';

import React, { useState, useMemo } from 'react';
import { FuelLog, ServiceLog, AccessoryGear } from '@/types/fuel';
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/Page';

interface BillingViewProps {
  logs: FuelLog[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
}

// Month bucket ('YYYY-MM') built without timezone flips: a date-only string
// ('2026-09-30') parsed with new Date() lands on UTC midnight and can shift a
// day back/month over in some timezones — bucket on the string instead.
const monthBucketOf = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const BillingView: React.FC<BillingViewProps> = ({ logs, services, accessories }) => {
  // Open on the most recent month that actually has expenses, not an empty "today".
  const latestBucket = useMemo(() => {
    const buckets = [
      ...logs.map((l) => monthBucketOf(l.date)),
      ...services.map((s) => monthBucketOf(s.date)),
      ...accessories.map((a) => monthBucketOf(a.datePurchased)),
    ].filter((b): b is string => !!b);
    return buckets.length > 0 ? buckets.sort()[buckets.length - 1] : undefined;
  }, [logs, services, accessories]);

  const [picked, setPicked] = useState<{ month: number; year: number } | null>(null);
  const fallback = latestBucket
    ? { month: Number(latestBucket.slice(5, 7)) - 1, year: Number(latestBucket.slice(0, 4)) }
    : { month: new Date().getMonth(), year: new Date().getFullYear() };
  const selectedMonth = picked?.month ?? fallback.month;
  const selectedYear = picked?.year ?? fallback.year;
  const setSelectedMonth = (month: number) => setPicked({ month, year: selectedYear });
  const setSelectedYear = (year: number) => setPicked({ month: selectedMonth, year });
  const selectedBucket = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Generate available years from the data + current year
  const availableYears = useMemo(() => {
    const years = new Set<number>();

    const addFromRaw = (raw?: string) => {
      const bucket = monthBucketOf(raw);
      if (bucket) years.add(Number(bucket.slice(0, 4)));
    };

    years.add(new Date().getFullYear());
    logs.forEach(log => addFromRaw(log.date));
    services.forEach(svc => addFromRaw(svc.date));
    accessories.forEach(acc => addFromRaw(acc.datePurchased));

    return Array.from(years).sort((a, b) => b - a);
  }, [logs, services, accessories]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter items for the selected month/year
  const { filteredLogs, filteredServices, filteredAccessories } = useMemo(() => {
    return {
      filteredLogs: logs.filter(log => monthBucketOf(log.date) === selectedBucket),
      filteredServices: services.filter(svc => monthBucketOf(svc.date) === selectedBucket),
      filteredAccessories: accessories.filter(acc => monthBucketOf(acc.datePurchased) === selectedBucket)
    };
  }, [logs, services, accessories, selectedBucket]);

  const hasData = filteredLogs.length > 0 || filteredServices.length > 0 || filteredAccessories.length > 0;
  
  const monthlyFuel = filteredLogs.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const monthlyService = filteredServices.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const monthlyAccessory = filteredAccessories.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const monthlyTotal = monthlyFuel + monthlyService + monthlyAccessory;

  // Every expense of the month in one dated list.
  const lineItems = [
    ...filteredLogs.map((l) => ({
      id: `fuel-${l.id}`,
      date: l.date,
      title: l.stationName || l.brand || 'Refill',
      kind: 'Fuel',
      amount: Number(l.totalCost) || 0,
    })),
    ...filteredServices.map((s) => ({
      id: `svc-${s.id}`,
      date: s.date,
      title: s.serviceCenter || s.serviceType,
      kind: 'Service',
      amount: Number(s.totalCost) || 0,
    })),
    ...filteredAccessories.map((a) => ({
      id: `acc-${a.id}`,
      date: a.datePurchased,
      title: a.itemName,
      kind: 'Gear',
      amount: Number(a.cost) || 0,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const step = (dir: -1 | 1) => {
    const m = selectedMonth + dir;
    if (m < 0) setPicked({ month: 11, year: selectedYear - 1 });
    else if (m > 11) setPicked({ month: 0, year: selectedYear + 1 });
    else setPicked({ month: m, year: selectedYear });
  };

  const now = new Date();
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const share = (n: number) => (monthlyTotal > 0 ? `${(n / monthlyTotal) * 100}%` : '0%');

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Everything the bike cost you, month by month."
        action={
          <div className="flex items-center gap-1 card !rounded-[10px] p-1">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="w-8 h-8 rounded-md flex items-center justify-center text-ink-2 hover:bg-surface-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[124px] text-center text-sm font-medium text-ink-1 tabular">
              {months[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={isCurrentMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-md flex items-center justify-center text-ink-2 hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Month total + split */}
      <section className="card p-5 sm:p-6">
        <div className="text-[13px] text-ink-2">Total for {months[selectedMonth]}</div>
        <div className="mt-1 text-4xl font-semibold text-ink-1 tracking-tight tabular">{inr(monthlyTotal)}</div>

        {monthlyTotal > 0 && (
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-surface-2 gap-0.5">
            <div className="bg-blue-600" style={{ width: share(monthlyFuel) }} />
            <div className="bg-[var(--color-text-1)]" style={{ width: share(monthlyService) }} />
            <div className="bg-accent" style={{ width: share(monthlyAccessory) }} />
          </div>
        )}

        <dl className="mt-4 grid grid-cols-3 gap-3 tabular">
          {[
            { label: 'Fuel', value: monthlyFuel, dot: 'bg-blue-600' },
            { label: 'Service', value: monthlyService, dot: 'bg-[var(--color-text-1)]' },
            { label: 'Gear', value: monthlyAccessory, dot: 'bg-accent' },
          ].map((c) => (
            <div key={c.label}>
              <dt className="flex items-center gap-1.5 text-[13px] text-ink-2">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {c.label}
              </dt>
              <dd className="mt-0.5 text-base font-semibold text-ink-1">{inr(c.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {hasData ? (
        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 pb-3 text-[15px] font-semibold text-ink-1">
            {lineItems.length} {lineItems.length === 1 ? 'expense' : 'expenses'}
          </h2>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {lineItems.map((item) => {
              const d = new Date(item.date);
              const day = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-1 truncate">{item.title}</p>
                    <p className="text-[13px] text-ink-2 mt-0.5">
                      {[day, item.kind].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-1 tabular shrink-0">{inr(item.amount)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <EmptyState
          icon={Receipt}
          title={`Nothing spent in ${months[selectedMonth]} ${selectedYear}`}
          body="Use the arrows above to look at another month."
        />
      )}
    </div>
  );
};
