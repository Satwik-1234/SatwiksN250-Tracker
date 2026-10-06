'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Fuel, IndianRupee, Gauge, Calendar, Clock, Check, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { FuelLog, TripType } from '@/types/fuel';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: Omit<FuelLog, 'id' | 'synced'>) => void;
  latestOdometer: number;
  previousLogs?: FuelLog[];
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-shadow placeholder-slate-300';

const BRAND_LIST = ['IOCL', 'Jio-BP', 'HPCL', 'BPCL', 'Nayara', 'Shell', 'Other'];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  latestOdometer,
  previousLogs = [],
}) => {
  const [odometer,   setOdometer]   = useState<number | ''>(latestOdometer ? latestOdometer + 240 : '');
  const [brand,      setBrand]      = useState('IOCL');
  const [station,    setStation]    = useState('Praveen Auto Centre');
  const [fuelBars,   setFuelBars]   = useState<number>(8); // 8-bar digital LCD cluster level
  const [fuelAmount, setFuelAmount] = useState<number | ''>(10.5);
  const [totalCost,  setTotalCost]  = useState<number | ''>(1177.30);
  const [isFullTank, setIsFullTank] = useState(true);
  const [tripType,   setTripType]   = useState<TripType>('Commute');
  const [notes,      setNotes]      = useState('');

  const now = new Date();
  const [dateStr, setDateStr] = useState(now.toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState(now.toTimeString().slice(0, 5));

  // Extract unique past stations and brand mappings
  const stationSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    previousLogs.forEach((l) => {
      const s = (l.stationName || '').trim();
      if (s) {
        const b = l.brand || (s.includes(' ') ? s.split(' ')[0] : 'IOCL');
        map.set(s, b);
      }
    });
    // Defaults if empty
    if (!map.has('Praveen Auto Centre')) map.set('Praveen Auto Centre', 'IOCL');
    if (!map.has('Reliance BP Mobility')) map.set('Reliance BP Mobility', 'Jio-BP');
    if (!map.has('Raj Petroleum')) map.set('Raj Petroleum', 'HPCL');
    if (!map.has('Saraswati Petroleum')) map.set('Saraswati Petroleum', 'IOCL');
    if (!map.has('Vijayshree Nyara Petroleum')) map.set('Vijayshree Nyara Petroleum', 'Nayara');
    return Array.from(map.entries()).map(([name, b]) => ({ name, brand: b }));
  }, [previousLogs]);

  // Auto-detect brand from station name
  const handleStationChange = (val: string) => {
    setStation(val);
    const trimmed = val.trim();
    if (!trimmed) return;

    // Check exact or partial match in station history
    const match = stationSuggestions.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase() ||
             trimmed.toLowerCase().includes(s.name.toLowerCase())
    );
    if (match && BRAND_LIST.includes(match.brand)) {
      setBrand(match.brand);
      return;
    }

    // Heuristic detection based on station keywords
    const lower = trimmed.toLowerCase();
    if (lower.includes('jio') || lower.includes('reliance')) {
      setBrand('Jio-BP');
    } else if (lower.includes('praveen') || lower.includes('saraswati') || lower.includes('iocl') || lower.includes('indian oil')) {
      setBrand('IOCL');
    } else if (lower.includes('raj') || lower.includes('hpcl') || lower.includes('hindustan')) {
      setBrand('HPCL');
    } else if (lower.includes('konduskar') || lower.includes('bpcl') || lower.includes('bharat')) {
      setBrand('BPCL');
    } else if (lower.includes('nayara') || lower.includes('nyara') || lower.includes('vijayshree')) {
      setBrand('Nayara');
    } else if (lower.includes('shell')) {
      setBrand('Shell');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (latestOdometer > 0) setOdometer(latestOdometer + 240);
  }, [latestOdometer]);

  if (!isOpen) return null;

  const numOdo  = typeof odometer   === 'number' ? odometer   : 0;
  const numFuel = typeof fuelAmount === 'number' ? fuelAmount : 0;
  const numCost = typeof totalCost  === 'number' ? totalCost  : 0;

  const pricePerLitre  = numFuel > 0 ? Number((numCost / numFuel).toFixed(2)) : 0;
  const distance       = latestOdometer > 0 && numOdo > latestOdometer ? numOdo - latestOdometer : 0;
  const mileagePreview = distance > 0 && numFuel > 0 ? Number((distance / numFuel).toFixed(2)) : 0;
  const costPerKm      = distance > 0 && numCost > 0 ? Number((numCost / distance).toFixed(2)) : 0;

  const handleBarsChange = (bars: number) => {
    setFuelBars(bars);
    if (bars === 8) {
      setIsFullTank(true);
    } else if (bars <= 6) {
      setIsFullTank(false);
    }
  };

  const handleFullTankToggle = () => {
    const nextVal = !isFullTank;
    setIsFullTank(nextVal);
    if (nextVal) {
      setFuelBars(8);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numOdo || !numFuel || !numCost) return;
    const dateIso = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    onSaveLog({
      date: dateIso,
      odometer: numOdo,
      fuelAmount: numFuel,
      totalCost: numCost,
      pricePerLitre,
      isFullTank,
      tripType,
      brand: brand.trim(),
      stationName: station.trim() || 'Petrol Station',
      fuelBars,
      notes: notes.trim() || undefined,
      distanceCalculated: distance,
      mileageCalculated: mileagePreview,
      costPerKmCalculated: costPerKm,
    });
    onClose();
  };

  const getFuelBarInfo = (bars: number) => {
    if (bars >= 8) return { label: 'Full Tank', percent: 100, volume: '~14.0 L', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (bars === 7) return { label: '7/8 Tank', percent: 87.5, volume: '~12.2 L', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (bars === 6) return { label: '6/8 Tank', percent: 75.0, volume: '~10.5 L', color: 'text-teal-600', bg: 'bg-teal-500' };
    if (bars === 5) return { label: '5/8 Tank', percent: 62.5, volume: '~8.7 L', color: 'text-cyan-600', bg: 'bg-cyan-500' };
    if (bars === 4) return { label: 'Half Tank', percent: 50.0, volume: '~7.0 L', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (bars === 3) return { label: '3/8 Tank', percent: 37.5, volume: '~5.2 L', color: 'text-amber-600', bg: 'bg-amber-500' };
    if (bars === 2) return { label: 'Low Fuel', percent: 25.0, volume: '~3.5 L', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Reserve Tank', percent: 12.5, volume: '~1.7 L', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const barInfo = getFuelBarInfo(fuelBars);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Fuel className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block">Log Refill Stop</span>
              <span className="text-[10px] text-slate-400 font-mono">Telemetry & 8-Bar Fuel Level</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live preview banner */}
        {distance > 0 && (
          <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-blue-700">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">+{distance} km since last fill</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold font-mono ${mileagePreview >= 40 ? 'text-emerald-600' : mileagePreview >= 34 ? 'text-amber-600' : 'text-red-500'}`}>
                {mileagePreview} km/L
              </span>
              <p className="text-[10px] text-slate-500 font-mono">₹{costPerKm}/km</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 space-y-3.5 overflow-y-auto grow">

          {/* Odometer */}
          <Field label="Odometer Reading (km)">
            <div className="relative">
              <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
              <input
                type="number" step="0.1" required
                min={latestOdometer || 0}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value ? Number(e.target.value) : '')}
                className={`${inputCls} pl-9`}
                placeholder="e.g. 2019.5"
              />
            </div>
            {latestOdometer > 0 && (
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Previous: {latestOdometer.toLocaleString('en-IN')} km
              </p>
            )}
          </Field>

          {/* ── 8-BAR DIGITAL FUEL GAUGE SLIDER (Bajaj N250 Cluster) ── */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Fuel className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
                  N250 Fuel Gauge
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold font-mono ${barInfo.color}`}>
                  {fuelBars}/8 Bars
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {barInfo.label} ({barInfo.percent}%)
                </span>
              </div>
            </div>

            {/* Segmented LCD Display Bars */}
            <div className="grid grid-cols-8 gap-1.5 mb-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                const isLit = bar <= fuelBars;
                let activeColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
                if (bar === 1) activeColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
                else if (bar <= 3) activeColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
                else if (bar <= 5) activeColor = 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]';

                return (
                  <button
                    key={bar}
                    type="button"
                    onClick={() => handleBarsChange(bar)}
                    className={`h-7 rounded-sm transition-all duration-150 flex flex-col justify-end p-0.5 cursor-pointer hover:opacity-90 ${
                      isLit ? activeColor : 'bg-slate-800/80 border border-slate-700/50'
                    }`}
                    title={`Set to ${bar}/8 bars`}
                  >
                    <span className={`text-[8px] font-mono font-bold text-center block ${isLit ? 'text-slate-900' : 'text-slate-600'}`}>
                      {bar}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Range Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={fuelBars}
                onChange={(e) => handleBarsChange(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                  1 (Reserve ~1.7L)
                </span>
                <span>4 (Half 50%)</span>
                <span className="text-emerald-400 font-bold">8 (Full ~14L)</span>
              </div>
            </div>
          </div>

          {/* Brand + Station with Auto-Fill */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Brand">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`${inputCls} pr-2`}
              >
                {BRAND_LIST.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Station Name">
                <div className="relative">
                  <input
                    type="text" required
                    list="station-list"
                    value={station}
                    onChange={(e) => handleStationChange(e.target.value)}
                    className={inputCls}
                    placeholder="Praveen Auto Centre"
                  />
                  <datalist id="station-list">
                    {stationSuggestions.map((s, idx) => (
                      <option key={idx} value={s.name}>{s.brand}</option>
                    ))}
                  </datalist>
                </div>
              </Field>
            </div>
          </div>

          {/* Qty + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Litres Filled">
              <div className="relative">
                <Fuel className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                <input
                  type="number" step="0.001" required
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value ? Number(e.target.value) : '')}
                  className={`${inputCls} pl-9`}
                  placeholder="12.82"
                />
              </div>
            </Field>
            <Field label="Amount Paid (₹)">
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                <input
                  type="number" step="0.01" required
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value ? Number(e.target.value) : '')}
                  className={`${inputCls} pl-9`}
                  placeholder="1438.14"
                />
              </div>
            </Field>
          </div>

          {/* Rate display */}
          {pricePerLitre > 0 && (
            <p className="text-xs text-slate-400 font-mono text-right -mt-1.5">
              Rate: <span className="text-slate-700 font-semibold">₹{pricePerLitre}/L</span>
            </p>
          )}

          {/* Full tank + trip type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleFullTankToggle}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                isFullTank
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <span>Full tank? (8/8 Bars)</span>
              {isFullTank && <Check className="h-3.5 w-3.5" />}
            </button>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value as TripType)}
              className={inputCls}
            >
              <option value="Commute">Commute</option>
              <option value="Highway">Highway</option>
              <option value="City">City</option>
              <option value="Tour">Tour</option>
            </select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-300" />
                <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)}
                  className={`${inputCls} pl-9`} />
              </div>
            </Field>
            <Field label="Time">
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-300" />
                <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)}
                  className={`${inputCls} pl-9`} />
              </div>
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes (optional)">
            <input
              type="text" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
              placeholder="e.g. Highway run, oil topped up"
            />
          </Field>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] mt-2 shadow-md shadow-blue-500/20"
          >
            Save to Cloud
          </button>
        </form>
      </div>
    </div>
  );
};
