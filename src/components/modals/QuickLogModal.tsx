'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Fuel, Gauge, Check, ScanLine } from 'lucide-react';
import { scanPhoto } from '@/services/receiptService';
import { FuelLog, TripType } from '@/types/fuel';
import { pendingSegment, previewMileage, economyRating } from '@/lib/metrics';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLog: (log: Omit<FuelLog, 'id' | 'synced'>) => void;
  latestOdometer: number;
  previousLogs?: FuelLog[];
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-[13px] font-medium text-ink-2">{label}</label>
      {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputCls =
  'w-full h-11 px-3 border border-[var(--color-border)] rounded-[10px] text-[15px] text-ink-1 tabular bg-surface outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 transition placeholder-ink-3';

const BRAND_LIST = ['IOCL', 'Jio-BP', 'HPCL', 'BPCL', 'Nayara', 'Shell', 'Other'];
const TRIP_TYPES: TripType[] = ['Commute', 'Highway', 'City', 'Tour'];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSaveLog,
  latestOdometer,
  previousLogs = [],
}) => {
  const [odometer, setOdometer] = useState<number | ''>(latestOdometer || '');
  const [scanning, setScanning] = useState<'' | 'pump' | 'odometer'>('');
  const [scanNote, setScanNote] = useState('');
  const [brand, setBrand] = useState('IOCL');
  const [station, setStation] = useState('Praveen Auto Centre');
  const [fuelBars, setFuelBars] = useState<number>(8);
  const [fuelAmount, setFuelAmount] = useState<number | ''>(10.5);
  const [totalCost, setTotalCost] = useState<number | ''>(1177.3);
  const [isFullTank, setIsFullTank] = useState(true);
  const [tripType, setTripType] = useState<TripType>('Commute');
  const [notes, setNotes] = useState('');

  const now = new Date();
  const [dateStr, setDateStr] = useState(now.toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState(now.toTimeString().slice(0, 5));

  const stationSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    previousLogs.forEach((l) => {
      const s = (l.stationName || '').trim();
      if (s) {
        const b = l.brand || (s.includes(' ') ? s.split(' ')[0] : 'IOCL');
        map.set(s, b);
      }
    });
    if (!map.has('Praveen Auto Centre')) map.set('Praveen Auto Centre', 'IOCL');
    if (!map.has('Reliance BP Mobility')) map.set('Reliance BP Mobility', 'Jio-BP');
    if (!map.has('Raj Petroleum')) map.set('Raj Petroleum', 'HPCL');
    if (!map.has('Saraswati Petroleum')) map.set('Saraswati Petroleum', 'IOCL');
    if (!map.has('Vijayshree Nyara Petroleum')) map.set('Vijayshree Nyara Petroleum', 'Nayara');
    return Array.from(map.entries()).map(([name, b]) => ({ name, brand: b }));
  }, [previousLogs]);

  const handleStationChange = (val: string) => {
    setStation(val);
    const trimmed = val.trim();
    if (!trimmed) return;
    const match = stationSuggestions.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase() || trimmed.toLowerCase().includes(s.name.toLowerCase())
    );
    if (match && BRAND_LIST.includes(match.brand)) {
      setBrand(match.brand);
      return;
    }
    const lower = trimmed.toLowerCase();
    if (lower.includes('jio') || lower.includes('reliance')) setBrand('Jio-BP');
    else if (lower.includes('praveen') || lower.includes('saraswati') || lower.includes('iocl') || lower.includes('indian oil')) setBrand('IOCL');
    else if (lower.includes('raj') || lower.includes('hpcl') || lower.includes('hindustan')) setBrand('HPCL');
    else if (lower.includes('konduskar') || lower.includes('bpcl') || lower.includes('bharat')) setBrand('BPCL');
    else if (lower.includes('nayara') || lower.includes('nyara') || lower.includes('vijayshree')) setBrand('Nayara');
    else if (lower.includes('shell')) setBrand('Shell');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (latestOdometer > 0) setOdometer(latestOdometer);
  }, [latestOdometer]);

  // Lock the page behind the sheet while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numOdo = typeof odometer === 'number' ? odometer : 0;
  const numFuel = typeof fuelAmount === 'number' ? fuelAmount : 0;
  const numCost = typeof totalCost === 'number' ? totalCost : 0;

  const pricePerLitre = numFuel > 0 ? Number((numCost / numFuel).toFixed(2)) : 0;
  const distance = latestOdometer > 0 && numOdo > latestOdometer ? numOdo - latestOdometer : 0;
  const mileagePreview = previewMileage(previousLogs, numOdo, numFuel);
  const costPerKm = distance > 0 && numCost > 0 ? Number((numCost / distance).toFixed(2)) : 0;

  const { lastFullTankOdo } = pendingSegment(previousLogs);
  const distanceSinceFull = lastFullTankOdo !== null && numOdo > lastFullTankOdo ? numOdo - lastFullTankOdo : distance;
  const previewRating = economyRating(mileagePreview);

  const odoTooLow = latestOdometer > 0 && numOdo > 0 && numOdo < latestOdometer;

  const handleBarsChange = (bars: number) => {
    setFuelBars(bars);
    if (bars === 8) setIsFullTank(true);
    else if (bars <= 6) setIsFullTank(false);
  };

  const handleFullTankToggle = () => {
    const nextVal = !isFullTank;
    setIsFullTank(nextVal);
    if (nextVal) setFuelBars(8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numOdo || !numFuel || !numCost) return;
    const parsedDate = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
    const dateIso = isNaN(parsedDate.getTime()) ? new Date(`${dateStr}T00:00:00`).toISOString() : parsedDate.toISOString();
    if (isNaN(new Date(dateIso).getTime())) return;
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

  const ratingTone =
    previewRating === 'Excellent' || previewRating === 'Good' ? 'text-emerald-500' : previewRating === 'Average' ? 'text-amber-500' : 'text-accent';

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-[var(--color-bg)] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden border border-[var(--color-border)] animate-sheet-up sm:animate-fade-up max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle (phone) */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-ink-1">Log a refill</h2>
            <p className="text-[13px] text-ink-2">Odometer, fuel and what you paid</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 overflow-y-auto grow">
          {/* Live preview — this fill */}
          <div className="rounded-xl bg-[var(--color-rail)] text-white px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/50">This fill</div>
                <div className="mt-0.5 font-display text-3xl font-semibold tabular leading-none">
                  {mileagePreview > 0 ? mileagePreview.toFixed(1) : '—'}
                  <span className="text-[13px] font-medium text-white/50 ml-1">km/L</span>
                </div>
              </div>
              <div className="text-right text-[13px] tabular">
                <div className="text-white/50">
                  {distanceSinceFull > 0 ? `${distanceSinceFull} km since full` : 'Distance from full tank'}
                </div>
                <div className="mt-1 flex items-center justify-end gap-3">
                  <span className={ratingTone}>{mileagePreview > 0 ? previewRating : '—'}</span>
                  <span className="text-white/70">₹{costPerKm || '0'}/km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo scan: pump display + odometer */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              {([['pump', 'pump display'], ['odometer', 'odometer']] as const).map(([kind, label]) => (
                <label key={kind} className="btn btn-secondary !h-11 cursor-pointer">
                  <ScanLine className="h-4 w-4" /> {scanning === kind ? 'Reading…' : `Scan ${label}`}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={!!scanning}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      setScanning(kind);
                      setScanNote('');
                      try {
                        const r = await scanPhoto(f, kind);
                        if (kind === 'odometer') {
                          if (r.odometer) setOdometer(r.odometer);
                          setScanNote(r.odometer ? 'Odometer filled. Check it before saving.' : 'Could not read the odometer.');
                        } else {
                          if (r.litres) setFuelAmount(r.litres);
                          if (r.amount) setTotalCost(r.amount);
                          const extra = [r.rate && `₹${r.rate}/L`, r.density && `density ${r.density}`].filter(Boolean).join(', ');
                          setScanNote(r.litres || r.amount ? `Filled from the pump${extra ? ` (${extra})` : ''}. Check before saving.` : 'Could not read the pump display.');
                        }
                      } catch (err) {
                        setScanNote((err as Error).message);
                      } finally {
                        setScanning('');
                      }
                    }}
                  />
                </label>
              ))}
            </div>
            {scanNote && <p className="mt-1.5 text-[12px] text-ink-2">{scanNote}</p>}
          </div>

          {/* Odometer */}
          <Field label="Odometer" hint={latestOdometer > 0 ? `last ${latestOdometer.toLocaleString('en-IN')} km` : undefined}>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3 pointer-events-none" />
              <input
                type="number"
                step="0.1"
                required
                inputMode="decimal"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value ? Number(e.target.value) : '')}
                className={`${inputCls} pl-10 ${odoTooLow ? '!border-accent focus:!ring-accent/15' : ''}`}
                placeholder="e.g. 5120.4"
              />
            </div>
            {odoTooLow && (
              <p className="text-[12px] text-accent mt-1">Lower than your last reading ({latestOdometer.toLocaleString('en-IN')} km).</p>
            )}
          </Field>

          {/* Litres + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Litres">
              <input
                type="number"
                step="0.001"
                required
                inputMode="decimal"
                value={fuelAmount}
                onChange={(e) => setFuelAmount(e.target.value ? Number(e.target.value) : '')}
                className={inputCls}
                placeholder="10.50"
              />
            </Field>
            <Field label="Amount paid" hint={pricePerLitre > 0 ? `₹${pricePerLitre}/L` : undefined}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-3">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  inputMode="decimal"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value ? Number(e.target.value) : '')}
                  className={`${inputCls} pl-7`}
                  placeholder="1177.30"
                />
              </div>
            </Field>
          </div>

          {/* N250 fuel gauge */}
          <div className="rounded-xl bg-[var(--color-rail)] p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="flex items-center gap-1.5 text-[13px] text-white/70">
                <Fuel className="h-3.5 w-3.5 text-white/50" />
                Fuel gauge
              </span>
              <span className="text-[13px] font-medium text-white tabular">{fuelBars}/8 bars</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                const isLit = bar <= fuelBars;
                const litColor = bar <= 2 ? '#ff4b40' : bar <= 3 ? '#fb923c' : '#60a5fa';
                return (
                  <button
                    key={bar}
                    type="button"
                    onClick={() => handleBarsChange(bar)}
                    aria-label={`Set fuel to ${bar} of 8 bars`}
                    className="h-8 rounded-[5px] transition-all"
                    style={
                      isLit
                        ? { background: litColor, boxShadow: `0 0 8px ${litColor}66` }
                        : { background: 'rgba(255,255,255,0.08)' }
                    }
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/40">
              <span>Reserve</span>
              <span>Half</span>
              <span>Full · ~14 L</span>
            </div>
          </div>

          {/* Full tank toggle */}
          <button
            type="button"
            onClick={handleFullTankToggle}
            className={`w-full h-11 px-4 rounded-[10px] border flex items-center justify-between text-[14px] font-medium transition-colors ${
              isFullTank ? 'bg-accent-bg border-[color:var(--color-accent)]/30 text-accent' : 'bg-surface border-[var(--color-border)] text-ink-2'
            }`}
          >
            <span>Filled to full tank</span>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isFullTank ? 'bg-accent text-white' : 'border border-[var(--color-border)]'
              }`}
            >
              {isFullTank && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>

          {/* Station + Brand */}
          <Field label="Station">
            <input
              type="text"
              required
              list="station-list"
              value={station}
              onChange={(e) => handleStationChange(e.target.value)}
              className={inputCls}
              placeholder="Praveen Auto Centre"
            />
            <datalist id="station-list">
              {stationSuggestions.map((s, idx) => (
                <option key={idx} value={s.name}>
                  {s.brand}
                </option>
              ))}
            </datalist>
          </Field>

          <Field label="Brand">
            <div className="flex flex-wrap gap-2">
              {BRAND_LIST.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrand(b)}
                  className={`h-9 px-3 rounded-full text-[13px] font-medium transition-colors ${
                    brand === b ? 'bg-slate-900 text-white' : 'bg-surface border border-[var(--color-border)] text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </Field>

          {/* Trip type */}
          <Field label="Riding type">
            <div className="grid grid-cols-4 gap-2">
              {TRIP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTripType(t)}
                  className={`h-9 rounded-[10px] text-[13px] font-medium transition-colors ${
                    tripType === t ? 'bg-slate-900 text-white' : 'bg-surface border border-[var(--color-border)] text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Time">
              <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes" hint="optional">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
              placeholder="e.g. highway run, chain felt dry"
            />
          </Field>

          <button type="submit" className="btn btn-accent w-full !h-12 text-[15px] sticky bottom-0">
            Save refill
          </button>
        </form>
      </div>
    </div>
  );
};
