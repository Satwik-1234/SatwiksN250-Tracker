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
import { saveChainLubeToSupabase } from '@/services/supabaseService';
import { getServiceWindow, getWarrantySummary } from '@/lib/maintenance';

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

  // Next-service window + warranty are owned by lib/maintenance.ts (same
  // numbers as ServiceLogsView — no more duplicated ad-hoc math here).
  const serviceWindow = getServiceWindow(latestOdometer);
  const warranty = getWarrantySummary(latestOdometer);
  const nextServiceTitle = serviceWindow.intervalName;
  const isFreeService = serviceWindow.intervalName.includes('Free');

  const kmToService = serviceWindow.kmRemaining;
  const serviceProgressPercent = serviceWindow.progressPercent;

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
      notes: 'Chain lubed (25 mm slack)',
    };
    StorageService.saveChainLube(updated);
    saveChainLubeToSupabase(updated).catch(() => {});
    setChainRecord(updated);
    setIsLubeModalOpen(false);
    if (onLubeLogged) onLubeLogged();
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/85 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Vehicle Health
              </h3>
              <p className="text-[11px] text-slate-400">
                Odometer {latestOdometer.toLocaleString('en-IN')} km
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('services')}
            className="self-start sm:self-auto text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            All Services <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          
          {/* Next Service */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Next Service
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  kmToService <= 500
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {isFreeService ? 'FREE' : 'PAID'}
                </span>
              </div>

              <div className="text-base font-bold text-slate-900">
                {nextServiceTitle}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target: {serviceWindow.targetRange}
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-medium text-slate-700">{serviceProgressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      kmToService <= 500 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${serviceProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <div className="text-xs font-medium text-slate-700">
                {kmToService > 0 ? (
                  <span className="text-amber-600">{kmToService.toLocaleString('en-IN')} km left</span>
                ) : (
                  <span className="text-rose-600">Service due</span>
                )}
              </div>
              <button
                onClick={() => onNavigateTab('services')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Details →
              </button>
            </div>
          </div>

          {/* Chain Care */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="w-3 h-3 text-amber-500" />
                  Chain Lube (500 km)
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  isLubeOverdue
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : isLubeDueSoon
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isLubeOverdue ? 'OVERDUE' : isLubeDueSoon ? 'DUE SOON' : 'OK'}
                </span>
              </div>

              <div className="text-base font-bold text-slate-900">
                {isLubeOverdue ? 'Lube chain now' : `${remainingLubeKm} km remaining`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Last: {chainRecord.lastLubeOdometer.toLocaleString('en-IN')} km · {kmSinceLube} km ago
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Cycle</span>
                  <span className="font-medium text-slate-700">{lubeProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLubeOverdue ? 'bg-rose-500' : isLubeDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${lubeProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">20–30 mm slack</span>
              <button
                onClick={openLubeModal}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Log Lube
              </button>
            </div>
          </div>

          {/* Warranty */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Warranty
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  warranty.isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                }`}>
                  {warranty.isActive ? 'ACTIVE' : 'EXPIRED'}
                </span>
              </div>

              <div className="text-base font-bold text-slate-900">
                5 Yrs / 75,000 km
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Valid till {warranty.validUntil}
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Free services left</span>
                  <span className="font-medium text-slate-800">{warranty.freeServicesRemaining}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-500">Km covered</span>
                  <span className="font-medium text-slate-800">{warranty.kmCoveredRemaining.toLocaleString('en-IN')} km</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className={`text-[11px] font-medium flex items-center gap-1 ${warranty.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3 h-3" /> {warranty.isActive ? 'Active' : 'Ended'}
              </span>
              <button
                onClick={() => onNavigateTab('services')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Details →
              </button>
            </div>
          </div>

        </div>
      </div>

      {isLubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Log Chain Lube</h3>
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
