'use client';

import React, { useState, useEffect } from 'react';
import { X, Fuel, IndianRupee, Gauge, Calendar, Clock, Check, Zap } from 'lucide-react';
import { FuelLog, TripType } from '../types/fuel';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: Omit<FuelLog, 'id' | 'synced'>) => void;
  latestOdometer: number;
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

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  latestOdometer,
}) => {
  const [odometer,   setOdometer]   = useState<number | ''>(latestOdometer ? latestOdometer + 240 : '');
  const [brand,      setBrand]      = useState('IOCL');
  const [station,    setStation]    = useState('Praveen Auto Centre');
  const [fuelAmount, setFuelAmount] = useState<number | ''>(10.5);
  const [totalCost,  setTotalCost]  = useState<number | ''>(1177.30);
  const [isFullTank, setIsFullTank] = useState(true);
  const [tripType,   setTripType]   = useState<TripType>('Commute');
  const [notes,      setNotes]      = useState('');

  const now = new Date();
  const [dateStr, setDateStr] = useState(now.toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState(now.toTimeString().slice(0, 5));

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numOdo || !numFuel || !numCost) return;
    const stationFull = brand ? `${brand} - ${station.trim()}` : station.trim();
    const dateIso = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    onSaveLog({
      date: dateIso,
      odometer: numOdo,
      fuelAmount: numFuel,
      totalCost: numCost,
      pricePerLitre,
      isFullTank,
      tripType,
      stationName: stationFull || 'Petrol Station',
      notes: notes.trim() || undefined,
      distanceCalculated: distance,
      mileageCalculated: mileagePreview,
      costPerKmCalculated: costPerKm,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Fuel className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Log Refill Stop</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live preview banner */}
        {distance > 0 && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">+{distance} km since last fill</span>
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
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">

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

          {/* Brand + Station */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Brand">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`${inputCls} pr-2`}
              >
                {['IOCL','Jio-BP','HPCL','BPCL','Nayara','Shell','Other'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Station Name">
                <input
                  type="text" required
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className={inputCls}
                  placeholder="Praveen Auto Centre"
                />
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
            <p className="text-xs text-slate-400 font-mono text-right -mt-2">
              Rate: <span className="text-slate-700 font-semibold">₹{pricePerLitre}/L</span>
            </p>
          )}

          {/* Full tank + trip type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsFullTank(!isFullTank)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                isFullTank
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <span>Full tank?</span>
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
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] mt-2"
          >
            Save to Cloud
          </button>
        </form>
      </div>
    </div>
  );
};
