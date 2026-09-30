'use client';

import React, { useEffect, useState } from 'react';
import { X, Fuel, IndianRupee, Gauge, Calendar, Clock, Check, Zap, AlertCircle } from 'lucide-react';
import { FuelLog, TripType } from '../types/fuel';
import { Modal } from './ui/Modal';
import { Field, inputCls } from './ui/Field';
import { toDateKey, toTimeInput, localDateTimeToIso } from '../utils/date';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: Omit<FuelLog, 'id' | 'synced'>) => void;
  latestOdometer: number;
}

const BRANDS = ['IOCL', 'Jio-BP', 'HPCL', 'BPCL', 'Nayara', 'Shell', 'Other'];
const TRIP_TYPES: TripType[] = ['Commute', 'Highway', 'City', 'Tour'];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  latestOdometer,
}) => {
  // Every field starts empty. This form previously pre-filled the odometer with
  // `latestOdometer + 240`, 10.5 L, ₹1177.30 and a named pump - so a user who
  // pressed "Save" without editing persisted an invented odometer reading, and
  // every derived figure downstream (distance, economy, cost/km, the running
  // total, and the seed for the *next* open) became wrong with no way to edit
  // a log afterwards. Guessing is fine as a suggestion; it is not fine as a
  // pre-filled value.
  const [odometer, setOdometer] = useState<string>('');
  const [brand, setBrand] = useState('IOCL');
  const [station, setStation] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [tripType, setTripType] = useState<TripType>('Commute');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  // Local calendar day + local wall clock. The old default mixed
  // `toISOString()` (UTC date) with `toTimeString()` (local time), which filed
  // late-evening fills under tomorrow's date and early-morning fills under
  // yesterday's - sending them to the wrong billing month and mis-attributing
  // the mileage segment.
  const [dateStr, setDateStr] = useState(() => toDateKey());
  const [timeStr, setTimeStr] = useState(() => toTimeInput());

  // Reset to a clean form each time the dialog opens.
  useEffect(() => {
    if (!isOpen) return;
    setOdometer('');
    setStation('');
    setFuelAmount('');
    setTotalCost('');
    setNotes('');
    setTouched(false);
    setIsFullTank(true);
    setTripType('Commute');
    setDateStr(toDateKey());
    setTimeStr(toTimeInput());
  }, [isOpen]);

  if (!isOpen) return null;

  const numOdo = odometer === '' ? 0 : Number(odometer);
  const numFuel = fuelAmount === '' ? 0 : Number(fuelAmount);
  const numCost = totalCost === '' ? 0 : Number(totalCost);

  const pricePerLitre = numFuel > 0 ? Number((numCost / numFuel).toFixed(2)) : 0;
  const distance = latestOdometer > 0 && numOdo > latestOdometer ? numOdo - latestOdometer : 0;

  // This preview is only trustworthy for a *full* tank: the segment's real
  // denominator includes any partial top-ups in between, which this form has no
  // visibility into. Labelling it as economy would reintroduce exactly the bug
  // fixed in src/utils/mileage.ts.
  const economyPreview = distance > 0 && numFuel > 0 ? Number((distance / numFuel).toFixed(2)) : 0;
  const canPreviewEconomy = isFullTank && distance > 0 && numFuel > 0;
  const costPerKm = distance > 0 && numCost > 0 ? Number((numCost / distance).toFixed(2)) : 0;

  const odoTooLow = touched && latestOdometer > 0 && numOdo > 0 && numOdo < latestOdometer;
  const errors = {
    odometer:
      touched && (!numOdo || !Number.isFinite(numOdo))
        ? 'Enter the odometer reading.'
        : odoTooLow
          ? `Must be at least ${latestOdometer.toLocaleString('en-IN')} km.`
          : undefined,
    fuel: touched && (!numFuel || numFuel <= 0) ? 'Enter the litres filled.' : undefined,
    cost: touched && (!numCost || numCost <= 0) ? 'Enter the amount paid.' : undefined,
    station: touched && !station.trim() ? 'Enter the station name.' : undefined,
  };
  const hasError = Object.values(errors).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!numOdo || !numFuel || !numCost || !station.trim()) return;
    if (latestOdometer > 0 && numOdo < latestOdometer) return;

    const stationFull = brand && brand !== 'Other' ? `${brand} - ${station.trim()}` : station.trim();

    onSaveLog({
      date: localDateTimeToIso(dateStr, timeStr),
      odometer: numOdo,
      fuelAmount: numFuel,
      totalCost: numCost,
      pricePerLitre,
      isFullTank,
      tripType,
      stationName: stationFull || 'Petrol Station',
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Refill Stop"
      icon={<Fuel className="h-4 w-4 text-blue-600" aria-hidden="true" />}
    >
      {/* Live preview */}
      {distance > 0 && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs font-medium">
              {distance} km since last fill ({latestOdometer.toLocaleString('en-IN')} km)
            </span>
          </div>
          <div className="text-right">
            {canPreviewEconomy ? (
              <>
                <span
                  className={`text-sm font-bold font-mono ${
                    economyPreview >= 40 ? 'text-emerald-600' : economyPreview >= 34 ? 'text-amber-600' : 'text-red-500'
                  }`}
                >
                  {economyPreview} km/L
                </span>
                <p className="text-[10px] text-slate-500 font-mono">₹{costPerKm}/km</p>
              </>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono text-right block max-w-[9rem]">
                Economy needs a full tank &amp; no partial top-ups in between
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="px-5 pb-5 pt-4 space-y-4">
        {hasError && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Check the highlighted fields.
          </p>
        )}

        {/* Odometer */}
        <Field
          label="Odometer Reading (km)"
          required
          error={errors.odometer}
          hint={latestOdometer > 0 ? `Last recorded: ${latestOdometer.toLocaleString('en-IN')} km` : undefined}
        >
          {({ id, 'aria-describedby': describedBy }) => (
            <div className="relative">
              <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={errors.odometer ? true : undefined}
                type="number"
                inputMode="decimal"
                step="0.1"
                required
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className={`${inputCls} pl-9 ${errors.odometer ? 'border-red-300' : ''}`}
                placeholder="e.g. 2019.5"
              />
            </div>
          )}
        </Field>

        {/* Brand + Station */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Brand">
            {({ id }) => (
              <select id={id} value={brand} onChange={(e) => setBrand(e.target.value)} className={`${inputCls} pr-2`}>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Station Name" required error={errors.station} className="col-span-2">
            {({ id, 'aria-describedby': describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={errors.station ? true : undefined}
                type="text"
                required
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className={`${inputCls} ${errors.station ? 'border-red-300' : ''}`}
                placeholder="Praveen Auto Centre"
              />
            )}
          </Field>
        </div>

        {/* Qty + Cost */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Litres Filled" required error={errors.fuel}>
            {({ id, 'aria-describedby': describedBy }) => (
              <div className="relative">
                <Fuel className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />
                <input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={errors.fuel ? true : undefined}
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  required
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value)}
                  className={`${inputCls} pl-9 ${errors.fuel ? 'border-red-300' : ''}`}
                  placeholder="12.82"
                />
              </div>
            )}
          </Field>
          <Field label="Amount Paid (₹)" required error={errors.cost}>
            {({ id, 'aria-describedby': describedBy }) => (
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />
                <input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={errors.cost ? true : undefined}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  required
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className={`${inputCls} pl-9 ${errors.cost ? 'border-red-300' : ''}`}
                  placeholder="1438.14"
                />
              </div>
            )}
          </Field>
        </div>

        {pricePerLitre > 0 && (
          <p className="text-xs text-slate-400 font-mono text-right -mt-2">
            Rate: <span className="text-slate-700 font-semibold">₹{pricePerLitre}/L</span>
          </p>
        )}

        {/* Full tank + trip type */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isFullTank}
            onClick={() => setIsFullTank(!isFullTank)}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              isFullTank ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Filled to full
            </span>
            <span className={`text-[10px] font-bold ${isFullTank ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isFullTank ? 'YES' : 'NO'}
            </span>
          </button>
          <Field label="Trip Type">
            {({ id }) => (
              <select
                id={id}
                value={tripType}
                onChange={(e) => setTripType(e.target.value as TripType)}
                className={`${inputCls} py-2 pr-2`}
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            {({ id }) => (
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />
                <input
                  id={id}
                  type="date"
                  value={dateStr}
                  max={toDateKey()}
                  onChange={(e) => setDateStr(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            )}
          </Field>
          <Field label="Time">
            {({ id }) => (
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-300" aria-hidden="true" />
                <input
                  id={id}
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            )}
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes (optional)">
          {({ id }) => (
            <textarea
              id={id}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} font-sans resize-none`}
              placeholder="Highway run, evening traffic…"
            />
          )}
        </Field>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={Boolean(hasError)}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Stop
          </button>
        </div>
      </form>
    </Modal>
  );
};
