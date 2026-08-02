'use client';

import React, { useState, useMemo } from 'react';
import { FuelLog } from '../types/fuel';
import { 
  Search, 
  Download, 
  Trash2, 
  Fuel, 
  Gauge, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  Filter, 
  Sparkles,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';

interface LogsViewProps {
  logs: FuelLog[];
  onDeleteLog: (id: string) => void;
}

const inputCls = 'px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-all shadow-sm';

const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'JIO-BP': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'IOCL':   { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'BPCL':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'HPCL':   { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'SHELL':  { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  'NAYARA': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'DEFAULT': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
};

const getBrandStyle = (stationName?: string) => {
  if (!stationName) return BRAND_COLORS.DEFAULT;
  const upper = stationName.toUpperCase();
  for (const key of Object.keys(BRAND_COLORS)) {
    if (upper.includes(key)) return BRAND_COLORS[key];
  }
  return BRAND_COLORS.DEFAULT;
};

export const LogsView: React.FC<LogsViewProps> = ({ logs, onDeleteLog }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs]
  );

  const filtered = useMemo(() =>
    sorted.filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        log.odometer.toString().includes(q) ||
        log.stationName?.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || log.tripType === typeFilter;
      return matchSearch && matchType;
    }),
    [sorted, search, typeFilter]
  );

  // Compute summary stats for filtered logs
  const stats = useMemo(() => {
    const totalSpent = filtered.reduce((sum, l) => sum + l.totalCost, 0);
    const totalLitres = filtered.reduce((sum, l) => sum + l.fuelAmount, 0);
    
    // Average mileage calculated from full tank logs in set
    let mileageDistSum = 0;
    let mileageFuelSum = 0;
    filtered.forEach(l => {
      if (l.mileageCalculated && l.distanceCalculated && l.distanceCalculated > 0) {
        mileageDistSum += l.distanceCalculated;
        mileageFuelSum += l.fuelAmount;
      }
    });

    const avgMileage = mileageFuelSum > 0 ? Number((mileageDistSum / mileageFuelSum).toFixed(2)) : 0;
    const avgRate = totalLitres > 0 ? Number((totalSpent / totalLitres).toFixed(2)) : 0;

    return { totalSpent, totalLitres, avgMileage, avgRate };
  }, [filtered]);

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Date','Odometer (km)','Distance (km)','Fuel (L)','Cost (₹)','Rate (₹/L)','Mileage (km/L)','Cost/km (₹)','Full Tank','Trip Type','Station','Notes'];
    const rows = logs.map((l) => [
      new Date(l.date).toLocaleDateString('en-IN'),
      l.odometer,
      l.distanceCalculated ?? '',
      l.fuelAmount,
      l.totalCost,
      l.pricePerLitre,
      l.mileageCalculated?.toFixed(2) ?? '',
      l.costPerKmCalculated ?? '',
      l.isFullTank ? 'Yes' : 'No',
      l.tripType || 'Commute',
      `"${l.stationName ?? ''}"`,
      `"${l.notes ?? ''}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `N250_Fuel_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="animate-fade-up space-y-6 pb-12">

      {/* ── FILTERED SUMMARY TELEMETRY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <IndianRupee className="h-3.5 w-3.5 text-blue-600" />
            <span>Filtered Expense</span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">₹{Math.round(stats.totalSpent).toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Fuel className="h-3.5 w-3.5 text-purple-600" />
            <span>Total Fuel Volume</span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{stats.totalLitres.toFixed(1)} <span className="text-xs text-slate-400 font-normal">L</span></p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Gauge className="h-3.5 w-3.5 text-emerald-600" />
            <span>Average Mileage</span>
          </div>
          <p className="text-xl font-black text-emerald-600 font-mono mt-1">{stats.avgMileage > 0 ? `${stats.avgMileage}` : '—'} <span className="text-xs font-normal">km/L</span></p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-amber-500" />
            <span>Average Price</span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">₹{stats.avgRate} <span className="text-xs text-slate-400 font-normal">/L</span></p>
        </div>
      </div>

      {/* ── TOOLBAR & SEARCH CONTROLS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Fuel Refill Logs</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Showing {filtered.length} of {logs.length} telemetry records</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station, odo, notes…"
              className={`${inputCls} pl-8.5 w-full`}
            />
          </div>

          {/* Type Filter Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={inputCls}
            >
              <option value="ALL">All Categories</option>
              <option value="Commute">Commute</option>
              <option value="Highway">Highway</option>
              <option value="City">City</option>
              <option value="Tour">Tour</option>
            </select>
          </div>

          {/* CSV Export Button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── LOGS TABLE & CARDS ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Fuel className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No matching fuel logs found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Odometer</th>
                  <th className="py-3.5 px-4">Distance</th>
                  <th className="py-3.5 px-4">Station</th>
                  <th className="py-3.5 px-4 text-right">Fuel (L)</th>
                  <th className="py-3.5 px-4 text-right">Price / L</th>
                  <th className="py-3.5 px-4 text-right">Cost</th>
                  <th className="py-3.5 px-4 text-right">Mileage</th>
                  <th className="py-3.5 px-4 text-right">Cost / km</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((log) => {
                  const bStyle = getBrandStyle(log.stationName);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>

                      {/* Odometer */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.odometer.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-slate-400">km</span>
                      </td>

                      {/* Distance Calculated */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {log.distanceCalculated && log.distanceCalculated > 0 ? (
                          <span className="font-semibold text-slate-700">+{log.distanceCalculated} km</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Station Name & Badges */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2 max-w-[180px] sm:max-w-none">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>
                            {log.stationName?.split(' ')[0] || 'Fuel'}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate" title={log.stationName}>
                            {log.stationName || 'Petrol Station'}
                          </span>
                          {log.isFullTank && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                              Full
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Qty Litres */}
                      <td className="py-3.5 px-4 text-right text-slate-700 font-bold">
                        {log.fuelAmount.toFixed(2)} L
                      </td>

                      {/* Price / Litre */}
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        ₹{log.pricePerLitre.toFixed(2)}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        ₹{log.totalCost.toFixed(2)}
                      </td>

                      {/* Mileage calculated */}
                      <td className="py-3.5 px-4 text-right">
                        {log.mileageCalculated ? (
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                            log.mileageCalculated >= 42 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : log.mileageCalculated >= 35 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {log.mileageCalculated.toFixed(1)} km/L
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Cost per km */}
                      <td className="py-3.5 px-4 text-right text-slate-600 font-semibold">
                        {log.costPerKmCalculated ? `₹${log.costPerKmCalculated.toFixed(2)}` : '—'}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                          title="Delete Refill Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
