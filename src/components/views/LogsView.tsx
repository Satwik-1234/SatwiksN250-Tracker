'use client';

import React, { useState, useMemo } from 'react';
import { FuelLog } from '@/types/fuel';
import { averageMileage, averagePricePerLitre, economyRating, normalizeBrand, cleanStationName } from '@/lib/metrics';
import { downloadFuelCsv } from '@/utils/exportUtils';
import { Download, Trash2, Fuel } from 'lucide-react';
import { NextFillCard } from '@/components/cards/NextFillCard';
import { PageHeader, StatStrip, Chip, ChipRow, SearchInput, EmptyState } from '@/components/ui/Page';

interface LogsViewProps {
  logs: FuelLog[];
  onDeleteLog: (id: string) => void;
  isOwnerMode?: boolean;
  onRequireOwner?: () => void;
}

const BRANDS = ['ALL', 'IOCL', 'HPCL', 'BPCL', 'JIO-BP', 'SHELL', 'NAYARA'];
const BRAND_LABEL: Record<string, string> = {
  ALL: 'All brands',
  'JIO-BP': 'Jio-bp',
  SHELL: 'Shell',
  NAYARA: 'Nayara',
};

const mileageTone = (kmpl: number) => {
  const r = economyRating(kmpl);
  if (r === 'Excellent') return 'text-blue-600';
  if (r === 'Good') return 'text-ink-1';
  if (r === 'Average') return 'text-red-600';
  return 'text-red-600';
};

const fmtDate = (raw?: string, withYear = true) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
};

export const LogsView: React.FC<LogsViewProps> = ({ logs, onDeleteLog, isOwnerMode = false, onRequireOwner }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]
  );

  const filtered = useMemo(() =>
    sorted.filter((log) => {
      const q = search.toLowerCase();
      const normBrand = normalizeBrand(log.brand, log.stationName);
      const cleanStation = cleanStationName(log.stationName);
      const matchSearch =
        !q ||
        log.odometer.toString().includes(q) ||
        normBrand.toLowerCase().includes(q) ||
        cleanStation.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || log.tripType === typeFilter;
      const matchBrand =
        brandFilter === 'ALL' ||
        normBrand.toUpperCase() === brandFilter.toUpperCase();

      return matchSearch && matchType && matchBrand;
    }),
    [sorted, search, typeFilter, brandFilter]
  );

  // Compute summary stats for filtered logs
  const stats = useMemo(() => {
    const totalSpent = filtered.reduce((sum, l) => sum + l.totalCost, 0);
    const totalLitres = filtered.reduce((sum, l) => sum + l.fuelAmount, 0);

    // Fuel-weighted full-tank-to-full-tank mileage (same math as dashboard gauge)
    const avgMileage = averageMileage(filtered);
    const avgRate = averagePricePerLitre(filtered);

    return { totalSpent, totalLitres, avgMileage, avgRate };
  }, [filtered]);

  const exportCSV = () => {
    if (!isOwnerMode) {
      onRequireOwner?.();
      return;
    }
    if (!logs.length) return;
    downloadFuelCsv(logs);
  };

  const isFiltered = search !== '' || typeFilter !== 'ALL' || brandFilter !== 'ALL';

  // Derived per-row display values, shared by the phone list and the desktop table.
  const rows = filtered.map((log, index) => {
    const brandName = normalizeBrand(log.brand, log.stationName);
    let station = cleanStationName(log.stationName);
    if (brandName && station.toUpperCase().startsWith(brandName.toUpperCase())) {
      station = station.substring(brandName.length).replace(/^[\s-]+/, '') || station;
    }
    const prev = filtered[index + 1];
    const delta =
      log.mileageCalculated && prev?.mileageCalculated
        ? Number((log.mileageCalculated - prev.mileageCalculated).toFixed(1))
        : null;
    return { log, brandName, station: station || brandName || 'Refill', delta };
  });

  const deleteButton = (id: string) =>
    isOwnerMode ? (
      <button
        type="button"
        onClick={() => onDeleteLog(id)}
        aria-label="Delete refill"
        title="Delete refill"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-3 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    ) : null;

  return (
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Fuel"
        subtitle={
          isFiltered
            ? `${filtered.length} of ${logs.length} refills`
            : `${logs.length} ${logs.length === 1 ? 'refill' : 'refills'}`
        }
        action={
          <button
            type="button"
            onClick={exportCSV}
            title={isOwnerMode ? 'Download all refills as a CSV file' : 'Unlock owner mode to export'}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <NextFillCard logs={logs} />

      <StatStrip
        items={[
          { label: 'Spent', value: `₹${Math.round(stats.totalSpent).toLocaleString('en-IN')}` },
          { label: 'Fuel', value: stats.totalLitres.toFixed(1), unit: 'L' },
          { label: 'Average mileage', value: stats.avgMileage > 0 ? stats.avgMileage : '—', unit: 'km/L' },
          { label: 'Average price', value: `₹${stats.avgRate}`, unit: '/L' },
        ]}
      />

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search station, odometer, notes"
            className="flex-1 sm:max-w-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Ride type"
            className="h-10 px-3 bg-surface border border-[var(--color-border)] rounded-[10px] text-sm text-ink-2 outline-none focus:border-blue-500"
          >
            <option value="ALL">All rides</option>
            <option value="Commute">Commute</option>
            <option value="Highway">Highway</option>
            <option value="City">City</option>
            <option value="Tour">Tour</option>
          </select>
        </div>
        <ChipRow>
          {BRANDS.map((b) => (
            <Chip key={b} active={brandFilter === b} onClick={() => setBrandFilter(b)}>
              {BRAND_LABEL[b] ?? b}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title={logs.length === 0 ? 'No refills yet' : 'No refills match'}
          body={
            logs.length === 0
              ? 'Log a refill and it will show up here.'
              : 'Try a different search or clear the filters.'
          }
          action={
            isFiltered ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('ALL');
                  setBrandFilter('ALL');
                }}
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Phone: one row per refill */}
          <ul className="md:hidden card overflow-hidden divide-y divide-[var(--color-border)]">
            {rows.map(({ log, brandName, station, delta }) => (
              <li key={log.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-ink-1 truncate">{station}</p>
                    <p className="text-[13px] text-ink-2 mt-0.5 tabular">
                      {fmtDate(log.date)} · {brandName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-semibold text-ink-1 tabular">
                      ₹{Math.round(log.totalCost || 0).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[13px] text-ink-2 mt-0.5 tabular">
                      {(log.fuelAmount || 0).toFixed(2)} L{log.isFullTank ? ' · Full' : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3 text-[13px] tabular">
                  <span className="text-ink-2">
                    {(log.odometer || 0).toLocaleString('en-IN')} km
                    {log.distanceCalculated && log.distanceCalculated > 0 ? ` · +${log.distanceCalculated} km` : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    {log.mileageCalculated ? (
                      <span className={`font-semibold ${mileageTone(log.mileageCalculated)}`}>
                        {log.mileageCalculated.toFixed(1)} km/L
                        {log.mileageSuspect && <span title="This tank was probably not filled to the brim. The next tank reads low to match; the average over both is right."> *</span>}
                      </span>
                    ) : (
                      <span className="text-ink-3">Partial fill</span>
                    )}
                    {deleteButton(log.id)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left tabular">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[13px] text-ink-2">
                    <th className="py-3 pl-5 pr-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Station</th>
                    <th className="py-3 px-4 font-medium text-right">Odometer</th>
                    <th className="py-3 px-4 font-medium text-right">Fuel</th>
                    <th className="py-3 px-4 font-medium text-right">Price</th>
                    <th className="py-3 px-4 font-medium text-right">Cost</th>
                    <th className="py-3 px-4 font-medium text-right">Mileage</th>
                    <th className="py-3 px-4 font-medium text-right hidden lg:table-cell">Cost/km</th>
                    <th className="py-3 pl-2 pr-3 w-12">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {rows.map(({ log, brandName, station, delta }) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-5 pr-4 text-ink-2 whitespace-nowrap">{fmtDate(log.date)}</td>
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="font-medium text-ink-1 truncate" title={station}>
                          {station}
                        </div>
                        <div className="text-[13px] text-ink-2 mt-0.5">
                          {brandName}
                          {log.isFullTank ? ' · Full tank' : ''}
                          {log.fuelBars ? ` · ${log.fuelBars}/8 bars` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="text-ink-1">{(log.odometer || 0).toLocaleString('en-IN')} km</div>
                        <div className="text-[13px] text-ink-2 mt-0.5">
                          {log.distanceCalculated && log.distanceCalculated > 0 ? `+${log.distanceCalculated} km` : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-ink-1 whitespace-nowrap">
                        {(log.fuelAmount || 0).toFixed(2)} L
                      </td>
                      <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap">
                        ₹{(log.pricePerLitre || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-ink-1 whitespace-nowrap">
                        ₹{(log.totalCost || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.mileageCalculated ? (
                          <>
                            <div className={`font-semibold ${mileageTone(log.mileageCalculated)}`}>
                              {log.mileageCalculated.toFixed(1)} km/L
                              {log.mileageSuspect && <span title="This tank was probably not filled to the brim. The next tank reads low to match; the average over both is right."> *</span>}
                            </div>
                            <div
                              className={`text-[13px] mt-0.5 ${
                                delta === null ? 'text-ink-3' : delta >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}
                              title={delta === null ? undefined : 'Change from the previous refill'}
                            >
                              {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta}`}
                            </div>
                          </>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-ink-2 whitespace-nowrap hidden lg:table-cell">
                        {log.costPerKmCalculated ? `₹${log.costPerKmCalculated.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 pl-2 pr-3 text-right">{deleteButton(log.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
