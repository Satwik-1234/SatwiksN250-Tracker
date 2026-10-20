'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  Droplet, 
  ArrowRight, 
  Clock, 
  CheckCircle2
} from 'lucide-react';
import { ServiceLog, ChainLubeRecord } from '@/types/fuel';
import { StorageService } from '@/services/googleSheetsService';

interface VehicleReadinessCardProps {
  latestOdometer: number;
  services: ServiceLog[];
  isOwnerMode?: boolean;
  onNavigateTab: (tab: 'services' | 'analytics' | 'trips' | 'logs') => void;
  onLubeLogged?: () => void;
  onRequireOwner?: () => void;
}

export const VehicleReadinessCard: React.FC<VehicleReadinessCardProps> = ({
  latestOdometer = 4180,
  services = [],
  isOwnerMode = false,
  onNavigateTab,
  onLubeLogged,
  onRequireOwner,
}) => {
  // Chain care state
  const [chainRecord, setChainRecord] = useState<ChainLubeRecord>(() => StorageService.getChainLube());
  const [isLubeModalOpen, setIsLubeModalOpen] = useState(false);
  const [formOdo, setFormOdo] = useState<number>(latestOdometer);
  const [formBrand, setFormBrand] = useState('Motul Chain Lube C2');
  const [formSlack, setFormSlack] = useState(true);

  const openLubeModal = () => {
    if (!isOwnerMode) {
      onRequireOwner?.();
      return;
    }
    if (latestOdometer > 0) setFormOdo(latestOdometer);
    setIsLubeModalOpen(true);
  };

  const kmSinceLube = Math.max(0, latestOdometer - (chainRecord.lastLubeOdometer || 0));
  const remainingLubeKm = Math.max(0, 500 - kmSinceLube);
  const lubeProgress = Math.min(100, Math.round((kmSinceLube / 500) * 100));
  const isLubeOverdue = kmSinceLube >= 500;
  const isLubeDueSoon = kmSinceLube >= 380 && !isLubeOverdue;

  // Next service calculation (Owner's manual: 1st: 750 km, 2nd: 4,500-5,000 km, 3rd: 10,000 km)
  let nextServiceTitle = '2nd Free Service';
  let nextServiceKm = 5000;
  let serviceWindowStart = 4500;
  let isFreeService = true;

  if (latestOdometer < 1000) {
    nextServiceTitle = '1st Free Service';
    nextServiceKm = 750;
    serviceWindowStart = 500;
    isFreeService = true;
  } else if (latestOdometer < 5500) {
    nextServiceTitle = '2nd Free Service';
    nextServiceKm = 5000;
    serviceWindowStart = 4500;
    isFreeService = true;
  } else if (latestOdometer < 10500) {
    nextServiceTitle = '3rd Free Service';
    nextServiceKm = 10000;
    serviceWindowStart = 9500;
    isFreeService = true;
  } else {
    const lastOdo = services.length > 0 ? Math.max(...services.map(s => s.odometer)) : 10000;
    nextServiceTitle = 'Paid Maintenance';
    nextServiceKm = lastOdo + 5000;
    serviceWindowStart = nextServiceKm - 500;
    isFreeService = false;
  }

  const kmToService = Math.max(0, serviceWindowStart - latestOdometer);
  const serviceProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((latestOdometer - (serviceWindowStart - 4000)) / 4000) * 100))
  );

  const handleQuickLubeSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerMode) {
      setIsLubeModalOpen(false);
      onRequireOwner?.();
      return;
    }
    const updated: ChainLubeRecord = {
      lastLubeOdometer: Number(formOdo) || latestOdometer,
      lastLubeDate: new Date().toISOString().split('T')[0],
      lubeBrand: formBrand,
      slackChecked: formSlack,
      notes: 'Logged via Vehicle Readiness Hub (25 mm standard)',
    };
    StorageService.saveChainLube(updated);
    setChainRecord(updated);
    setIsLubeModalOpen(false);
    if (onLubeLogged) onLubeLogged();
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/85 p-5 sm:p-6 shadow-sm overflow-hidden relative">
        {/* Subtle Ambient Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Vehicle Health & Readiness Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Optimal
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Pulsar N250 active maintenance state · Odometer {latestOdometer.toLocaleString('en-IN')} km
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('services')}
            className="self-start sm:self-auto text-xs font-mono font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            Full Service Ledger <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── 3-PILLAR GOOGLE MATERIAL GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          
          {/* Pillar 1: Next Service Milestone */}
          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Service Countdown
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  kmToService <= 500 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {isFreeService ? 'FREE' : 'PAID'}
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 font-mono">
                {nextServiceTitle}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Target: {serviceWindowStart.toLocaleString('en-IN')} – {nextServiceKm.toLocaleString('en-IN')} km
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                  <span>Window Progress</span>
                  <span className="font-bold text-slate-800">{serviceProgressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      kmToService <= 500 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${serviceProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-700">
                {kmToService > 0 ? (
                  <span className="text-amber-600 font-black">{kmToService.toLocaleString('en-IN')} km left</span>
                ) : (
                  <span className="text-rose-600 font-black">Window Open!</span>
                )}
              </div>
              <button
                onClick={() => onNavigateTab('services')}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
              >
                View Tasks →
              </button>
            </div>
          </div>

          {/* Pillar 2: 500 km Chain Care */}
          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-3 h-3 text-amber-500" />
                  Chain Care (500 km)
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isLubeOverdue 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : isLubeDueSoon
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isLubeOverdue ? 'LUBE OVERDUE' : isLubeDueSoon ? 'DUE SOON' : 'HEALTHY'}
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 font-mono">
                {isLubeOverdue ? 'Service Chain Now' : `${remainingLubeKm} km remaining`}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Last lubed: {chainRecord.lastLubeOdometer.toLocaleString('en-IN')} km · {kmSinceLube} km run
              </div>

              {/* Lube Life Progress */}
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                  <span>Cycle Used</span>
                  <span className="font-bold text-slate-800">{lubeProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLubeOverdue ? 'bg-rose-500' : isLubeDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${lubeProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">20-30 mm Slack</span>
              <button
                onClick={openLubeModal}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 text-[11px] font-bold font-mono rounded-lg transition-all cursor-pointer"
              >
                + Log Lube
              </button>
            </div>
          </div>

          {/* Pillar 3: 5-Year OEM Warranty Guardian */}
          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-4 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  OEM Warranty Guardian
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  100% SECURE
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 font-mono">
                5 Yrs / 75,000 km
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Bajaj Factory Shield · Valid till May 2029
              </div>

              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Free Coupons:</span>
                  <span className="font-bold text-slate-800">2 Remaining</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono py-0.5">
                  <span className="text-slate-500">Km Protected:</span>
                  <span className="font-bold text-slate-800">{(75000 - latestOdometer).toLocaleString('en-IN')} km</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Compliant
              </span>
              <button
                onClick={() => onNavigateTab('services')}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Warranty Matrix →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── QUICK LOG LUBE MODAL ── */}
      {isLubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Droplet className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-mono">Record Chain Care</h3>
              </div>
              <button
                onClick={() => setIsLubeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickLubeSave} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Current Odometer (km)
                </label>
                <input
                  type="number"
                  value={formOdo}
                  onChange={(e) => setFormOdo(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Lube Product
                </label>
                <input
                  type="text"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slackCheckQuick"
                  checked={formSlack}
                  onChange={(e) => setFormSlack(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="slackCheckQuick" className="text-slate-700">
                  Chain Slack inspected (20–30 mm)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLubeModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-sm cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
