'use client';

import React, { useState, useMemo } from 'react';
import { FuelLog } from '../types/fuel';
import { Search, Download, Trash2 } from 'lucide-react';

interface LogsViewProps {
  logs: FuelLog[];
  onDeleteLog: (id: string) => void;
}

const inputCls = 'px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-shadow';

export const LogsView: React.FC<LogsViewProps> = ({ logs, onDeleteLog }) => {
  const [search,   setSearch]   = useState('');
  const [typeFilter, setType]   = useState('ALL');

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

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Date','Odometer','Distance','Fuel(L)','Cost(₹)','Rate(₹/L)','Mileage(km/L)','Cost/km','FullTank','Type','Station','Notes'];
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
      l.tripType,
      `"${l.stationName ?? ''}"`,
      `"${l.notes ?? ''}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `N250_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="animate-fade-up pb-12">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-6 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">All Refill Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{filtered.length} of {logs.length} entries</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className={`${inputCls} pl-8 w-40`}
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            <option value="ALL">All types</option>
            <option value="Commute">Commute</option>
            <option value="Highway">Highway</option>
            <option value="City">City</option>
            <option value="Tour">Tour</option>
          </select>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">No logs found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                {['Date','Odometer','Dist.','Litres','Cost','Rate','Mileage','₹/km','Station',''].map((h) => (
                  <th key={h} className={`py-3 pr-4 text-left font-semibold text-[11px] text-slate-400 uppercase tracking-wider ${h === '' ? 'text-right pr-0' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3 pr-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900">
                    {log.odometer.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-500">
                    {log.distanceCalculated ? `${log.distanceCalculated}` : '—'}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-700">{log.fuelAmount}L</td>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900">₹{log.totalCost}</td>
                  <td className="py-3 pr-4 font-mono text-slate-500">₹{log.pricePerLitre}</td>
                  <td className="py-3 pr-4">
                    {log.mileageCalculated ? (
                      <span className={`font-mono font-semibold ${log.mileageCalculated >= 40 ? 'text-emerald-600' : log.mileageCalculated >= 34 ? 'text-amber-600' : 'text-red-500'}`}>
                        {log.mileageCalculated.toFixed(1)}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-500">
                    {log.costPerKmCalculated ? `₹${log.costPerKmCalculated}` : '—'}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 max-w-[140px] truncate">
                    <span>{log.stationName || '—'}</span>
                    {log.isFullTank && (
                      <span className="ml-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1 py-0.5 rounded font-medium">Full</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
