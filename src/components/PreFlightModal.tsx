'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Wrench, Gauge, CheckCircle2, AlertTriangle, Calendar, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { ChainLubeRecord, TyrePressureRecord, RiderCadence } from '../types/fuel';
import { StorageService } from '../services/googleSheetsService';
import { Modal } from './ui/Modal';
import { parseDateKey, toDateKey } from '../utils/date';

interface PreFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestOdometer: number;
  onOpenChainModal?: () => void;
  onLubeOrPressureUpdated?: () => void;
}

export const PreFlightModal: React.FC<PreFlightModalProps> = ({
  isOpen,
  onClose,
  latestOdometer,
  onOpenChainModal,
  onLubeOrPressureUpdated,
}) => {
  const [chainRecord, setChainRecord] = useState<ChainLubeRecord>(() => StorageService.getChainLube());
  const [tyreRecord, setTyreRecord] = useState<TyrePressureRecord>(() => StorageService.getTyrePressure());
  const [cadence, setCadence] = useState<RiderCadence>(() => StorageService.getCadence());
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isEditingCadence, setIsEditingCadence] = useState<boolean>(false);
  const [weeklyKm, setWeeklyKm] = useState<number>(cadence.weeklyCommuteKm);
  const [weekendKm, setWeekendKm] = useState<number>(cadence.weekendRideKm);
  const [pillionMode, setPillionMode] = useState<boolean>(tyreRecord.isPillionMode);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      setChainRecord(StorageService.getChainLube());
      const tyre = StorageService.getTyrePressure();
      setTyreRecord(tyre);
      setPillionMode(tyre.isPillionMode);
      const cad = StorageService.getCadence();
      setCadence(cad);
      setWeeklyKm(cad.weeklyCommuteKm);
      setWeekendKm(cad.weekendRideKm);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const odo = latestOdometer || chainRecord.lastLubeOdometer;
  const kmSinceLube = Math.max(0, odo - chainRecord.lastLubeOdometer);
  const remainingLubeKm = Math.max(0, 500 - kmSinceLube);
  const lubeProgressPercent = Math.min(100, Math.round((kmSinceLube / 500) * 100));

  // Rider cadence rate. `??` throughout: `||` would turn a legitimate 0 ("I
  // don't ride at all on weekends") into the 140 km default, so the forecast was
  // silently computed from a number the rider had explicitly rejected.
  const totalWeeklyKm = (cadence.weeklyCommuteKm ?? 0) + (cadence.weekendRideKm ?? 0);
  const dailyRateKm = totalWeeklyKm / 7;
  const projectedDaysToLube = dailyRateKm > 0 ? Math.max(1, Math.round(remainingLubeKm / dailyRateKm)) : null;

  // Tyre pressure calculations. lastCheckedDate is a `YYYY-MM-DD` date key, so
  // parse it as local midnight rather than UTC midnight.
  const today = new Date();
  const lastTyreCheckDate = parseDateKey(tyreRecord.lastCheckedDate);
  const daysSinceTyreCheck = Math.max(
    0,
    Math.floor((today.getTime() - lastTyreCheckDate.getTime()) / 86_400_000)
  );

  const isTyreDue = daysSinceTyreCheck >= 7;
  const isChainDue = remainingLubeKm <= (cadence.weekendRideKm ?? 0);

  const handleMarkTyresChecked = () => {
    const todayStr = toDateKey();
    const newRecord: TyrePressureRecord = {
      lastCheckedDate: todayStr,
      frontPsi: 25,
      rearPsi: pillionMode ? 32 : 28,
      isPillionMode: pillionMode,
      notes: `Checked cold: 25 PSI Front / ${pillionMode ? '32' : '28'} PSI Rear (${pillionMode ? 'Pillion' : 'Solo'})`,
    };
    StorageService.saveTyrePressure(newRecord);
    setTyreRecord(newRecord);
    setToastMsg('Cold tyre pressure verified & logged.');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
    if (onLubeOrPressureUpdated) onLubeOrPressureUpdated();
  };

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          new Notification('🏍️ Pulsar N250 Guardian Enabled', {
            body: 'You will receive timely alerts for 500 km chain lube and weekly cold tyre pressure (25 PSI Front / 28-32 PSI Rear)!',
            icon: '/n250-logo.png',
          });
          const updated = { ...cadence, notificationsEnabled: true };
          StorageService.saveCadence(updated);
          setCadence(updated);
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  const handleSaveCadence = () => {
    // Reject blank / negative / non-numeric rather than coercing to a default.
    // `Number(x) || 250` previously stored 250 for a rider who typed 0.
    const weekly = Number(weeklyKm);
    const weekend = Number(weekendKm);

    if (!Number.isFinite(weekly) || weekly < 0 || !Number.isFinite(weekend) || weekend < 0) {
      setToastMsg('Enter a distance of 0 or more for both fields.');
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const updated: RiderCadence = {
      ...cadence,
      weeklyCommuteKm: weekly,
      weekendRideKm: weekend,
    };
    StorageService.saveCadence(updated);
    setCadence(updated);
    setIsEditingCadence(false);
    setToastMsg('Riding cadence preferences saved.');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
    if (onLubeOrPressureUpdated) onLubeOrPressureUpdated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex flex-col">
          Pulsar N250 Pre-Flight &amp; Care Guardian
          <span className="text-[11px] font-normal text-slate-400 font-mono">
            Predictive 500 km chain care &amp; weekly cold tyre maintenance
          </span>
        </span>
      }
      icon={<Bell className="h-4 w-4 text-blue-600" aria-hidden="true" />}
    >
      <div className="p-5 sm:p-6 space-y-6">
        {/* Toast */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="space-y-6">

          {/* ── CARD 1: WEEKLY COLD TYRE PRESSURE GUARDIAN ── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Weekly Cold Tyre Pressure
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isTyreDue
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isTyreDue ? `Check Due (${daysSinceTyreCheck}d ago)` : `Healthy (${daysSinceTyreCheck}d ago)`}
              </span>
            </div>

            {/* OEM Specification Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Front Tyre (Cold)</span>
                <span className="text-lg font-black text-blue-600 block mt-0.5">25 PSI</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">110/70-17 54P</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Rear Tyre (Cold)</span>
                <span className="text-lg font-black text-blue-600 block mt-0.5">
                  {pillionMode ? '32 PSI' : '28 PSI'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {pillionMode ? 'Pillion / Tour' : 'Solo Riding'}
                </span>
              </div>
            </div>

            {/* Rider Mode Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-mono">Current Setup:</span>
              <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-mono font-semibold">
                <button
                  type="button"
                  onClick={() => setPillionMode(false)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    !pillionMode ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Solo (28 PSI)
                </button>
                <button
                  type="button"
                  onClick={() => setPillionMode(true)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    pillionMode ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pillion (32 PSI)
                </button>
              </div>
            </div>

            <button
              onClick={handleMarkTyresChecked}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Tyres Checked Today (25 / {pillionMode ? '32' : '28'} PSI)
            </button>
          </div>

          {/* ── CARD 2: PREDICTIVE 500 KM CHAIN CARE (PACED BY ~250 KM WEEKLY) ── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Predictive 500 km Chain Care
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isChainDue
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {remainingLubeKm} km left
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-500">{kmSinceLube} km driven</span>
                <span className="font-bold text-slate-900">{remainingLubeKm} km remaining</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    lubeProgressPercent >= 90 ? 'bg-red-500' : lubeProgressPercent >= 75 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${lubeProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Smart Cadence Forecast */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Cadence Forecast</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                At your riding pace of <strong className="text-slate-900">~{cadence.weeklyCommuteKm} km weekly</strong> + <strong className="text-slate-900">~{cadence.weekendRideKm} km weekend</strong>, your next 500 km chain lube is projected in <strong className="text-blue-600 font-black">~{projectedDaysToLube} days</strong>.
              </p>
              {remainingLubeKm <= (cadence.weekendRideKm || 140) && (
                <p className="text-amber-700 text-[10px] font-bold mt-1">
                  ⚠️ Pre-Flight Alert: Your weekend ride (~{cadence.weekendRideKm} km) will cross the 500 km threshold! Clean & lube chain before heading out.
                </p>
              )}
            </div>

            {onOpenChainModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChainModal();
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Open Chain Lube & Slack Checker (20–30 mm)
              </button>
            )}
          </div>

          {/* ── CARD 3: RIDER CADENCE CONFIGURATION ── */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                Riding Routine & Pace
              </span>
              <button
                onClick={() => setIsEditingCadence(!isEditingCadence)}
                className="text-[11px] text-blue-600 font-mono font-bold hover:underline cursor-pointer"
              >
                {isEditingCadence ? 'Cancel' : 'Edit Routine'}
              </button>
            </div>

            {isEditingCadence ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Weekday Commute (km / week)
                  </label>
                  <input
                    type="number"
                    value={weeklyKm}
                    onChange={(e) => setWeeklyKm(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Weekend Ride (km / weekend)
                  </label>
                  <input
                    type="number"
                    value={weekendKm}
                    onChange={(e) => setWeekendKm(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="140"
                  />
                </div>
                <button
                  onClick={handleSaveCadence}
                  className="w-full py-2 bg-slate-900 text-white text-xs font-mono font-bold rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  Save Routine
                </button>
              </div>
            ) : (
              <div className="flex justify-between text-xs font-mono text-slate-500 pt-1">
                <span>Weekday: <strong className="text-slate-900">~{cadence.weeklyCommuteKm} km</strong></span>
                <span>Weekend: <strong className="text-slate-900">~{cadence.weekendRideKm} km</strong></span>
                <span>Combined: <strong className="text-slate-900">~{totalWeeklyKm} km/wk</strong></span>
              </div>
            )}
          </div>

          {/* ── CARD 4: BROWSER NOTIFICATIONS ── */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 font-mono block">
                Browser Notification Alerts
              </span>
              <span className="text-[11px] text-slate-400 font-mono block">
                Get desktop alerts when weekly tyre check or chain lube is due
              </span>
            </div>
            {permissionState === 'granted' ? (
              <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Enabled
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1.5 text-xs font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer"
              >
                Enable
              </button>
            )}
          </div>

        </div>
      </div>
    </Modal>
  );
};
