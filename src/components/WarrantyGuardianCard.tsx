'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Gauge, Calendar, CheckCircle2, Wrench, ShieldAlert } from 'lucide-react';
import { ServiceLog } from '../types/fuel';

interface WarrantyGuardianProps {
  services: ServiceLog[];
  latestOdometer: number;
  purchaseDate?: string;
  onViewSchedule?: () => void;
}

export const WarrantyGuardianCard: React.FC<WarrantyGuardianProps> = ({
  services,
  latestOdometer,
  purchaseDate = '2026-05-24',
  onViewSchedule,
}) => {
  // Sort services by date descending
  const sortedServices = [...services].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastService = sortedServices[0];
  const lastServiceOdo = lastService ? lastService.odometer : 0;
  const lastServiceDate = lastService ? new Date(lastService.date) : new Date(purchaseDate);

  const today = new Date();
  const daysSinceLastService = Math.max(
    0,
    Math.floor((today.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const kmSinceLastService = Math.max(0, latestOdometer - lastServiceOdo);

  // Warranty limit: 5 years or 75,000 km
  const startDate = new Date(purchaseDate);
  const warrantyEndDate = new Date(startDate);
  warrantyEndDate.setFullYear(startDate.getFullYear() + 5);

  const totalWarrantyDays = Math.floor(
    (warrantyEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUsed = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, Math.floor((warrantyEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const kmRemainingWarranty = Math.max(0, 75000 - latestOdometer);

  // Service number determination (based on count of official services)
  const serviceCount = services.filter((s) => s.serviceType.toLowerCase().includes('service')).length;
  
  // Next Service Milestones according to Owner's Manual (p. 40, 45, 52, 57)
  let nextServiceNumber = 1;
  let nextServiceKmTarget = 750;
  let maxDaysForNext = 45;
  let isFreeService = true;

  if (serviceCount === 0 && latestOdometer < 1000) {
    nextServiceNumber = 1;
    nextServiceKmTarget = 750;
    maxDaysForNext = 45;
    isFreeService = true;
  } else if (serviceCount <= 1 && latestOdometer < 5500) {
    nextServiceNumber = 2;
    nextServiceKmTarget = 5000;
    maxDaysForNext = 240; // from purchase
    isFreeService = true;
  } else if (serviceCount <= 2 && latestOdometer < 10500) {
    nextServiceNumber = 3;
    nextServiceKmTarget = 10000;
    maxDaysForNext = 360; // from purchase
    isFreeService = true;
  } else {
    nextServiceNumber = serviceCount + 1;
    nextServiceKmTarget = lastServiceOdo + 5000;
    maxDaysForNext = 120; // 120 days from last service
    isFreeService = false;
  }

  // Days left for next service
  const daysLeftForService = isFreeService && serviceCount > 0
    ? Math.max(0, maxDaysForNext - daysUsed)
    : Math.max(0, maxDaysForNext - daysSinceLastService);

  const kmLeftForService = Math.max(0, nextServiceKmTarget - latestOdometer);

  // Compliance evaluation
  // Manual page 57: "Availing paid services at subsequent 5000 kms. or 120 days from last service whichever is earlier"
  const isKmExceeded = (isFreeService && serviceCount === 0 && latestOdometer > 750) ||
    (!isFreeService && kmSinceLastService > 5000);
  const isDaysExceeded = (isFreeService && serviceCount === 0 && daysUsed > 45) ||
    (!isFreeService && daysSinceLastService > 120);

  const isAtRisk = isKmExceeded || isDaysExceeded;
  const isDueSoon = !isAtRisk && (kmLeftForService <= 500 || daysLeftForService <= 15);

  // Wrench notification check (Pulsar N250 console illuminates wrench at 450, 4450, 9450, 14450 km)
  const isWrenchActive = (nextServiceKmTarget === 750 && latestOdometer >= 450) ||
    (nextServiceKmTarget > 750 && latestOdometer >= nextServiceKmTarget - 550 && latestOdometer <= nextServiceKmTarget + 500);

  return (
    <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isAtRisk 
              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
              : isDueSoon 
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {isAtRisk ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                OEM Warranty & Service Guardian
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider ${
                isAtRisk 
                  ? 'bg-rose-100 text-rose-700' 
                  : isDueSoon
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isAtRisk ? 'Warranty At Risk' : isDueSoon ? 'Service Due Soon' : 'Warranty Protected'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Official Bajaj Auto Limited 5-Year / 75,000 km Warranty Terms
            </p>
          </div>
        </div>

        {onViewSchedule && (
          <button
            onClick={onViewSchedule}
            className="self-start sm:self-auto text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl transition-colors font-mono cursor-pointer"
          >
            View 16-Service Matrix →
          </button>
        )}
      </div>

      {/* Dual Countdown: Km & Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
        {/* Next Service Target Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Next Scheduled Milestone
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100/70 text-blue-700 font-bold">
              {isFreeService ? `${nextServiceNumber}${nextServiceNumber === 1 ? 'st' : nextServiceNumber === 2 ? 'nd' : 'rd'} Free Service` : `#${nextServiceNumber} Paid Service`}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {kmLeftForService.toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">km remaining</span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>
              or <strong>{daysLeftForService} days</strong> left
              <span className="text-slate-400"> (120-day rule)</span>
            </span>
          </div>

          {isWrenchActive && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs font-mono">
              <Wrench className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              <span>Console <strong>Wrench 🔧</strong> should be glowing now</span>
            </div>
          )}
        </div>

        {/* 5-Year Warranty Lifecycle Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              5-Year Factory Warranty Cap
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-700 font-bold">
              Expires {warrantyEndDate.getFullYear()}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {kmRemainingWarranty.toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">km covered</span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              <strong>{Math.round(daysRemaining / 30)} months</strong> ({daysRemaining} days) active
            </span>
          </div>

          {/* Warranty Progress Bar */}
          <div className="mt-3 w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((latestOdometer / 75000) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Manual Clauses Checklist for Warranty Retention */}
      <div className="border-t border-slate-100 pt-4 text-xs font-mono text-slate-600 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Oil: <strong>Bajaj DTS-i 20W50 BS6</strong> only</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Interval: <strong>≤ 5,000 km / 120 days</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Authorized <strong>Bajaj Dealer</strong> stamped</span>
        </div>
      </div>
    </div>
  );
};
