'use client';

import React from 'react';
import { ShieldCheck, Clock, Calendar, CheckCircle2, Wrench, ShieldAlert, CalendarRange } from 'lucide-react';
import { ServiceLog } from '../types/fuel';
import { parseDateKey, formatDay } from '../utils/date';

interface WarrantyGuardianProps {
  services: ServiceLog[];
  latestOdometer: number;
  /** `YYYY-MM-DD`. Empty means unknown - the card then asks for it rather than
   *  inventing one. Every deadline here depends on this value. */
  purchaseDate?: string;
  onViewSchedule?: () => void;
  onSetPurchaseDate?: () => void;
}

/**
 * Which logged service types advance the manufacturer's scheduled-service count.
 *
 * This used to be `serviceType.toLowerCase().includes('service')`. `serviceType`
 * is a fixed select, and six of its seven options ("Oil Change",
 * "Chain Maintenance", "Tyre Replacement", ...) do not contain the word
 * "service" - so logging a routine oil change did not increment the count, the
 * card fell through to the "1st free service" branch, and it reported
 * "Warranty Protected" with 5,000 km remaining while the schedule tab in the
 * same screen showed the free services already used. The two halves of the
 * screen contradicted each other, and a paid service that should have been
 * free was easy to miss.
 *
 * Only the work the owner's manual actually counts towards the schedule
 * qualifies. Chain, tyres, brakes and repairs are separate items.
 */
const SCHEDULED_SERVICE_TYPES = new Set(['routine service', 'oil change']);

const isScheduledService = (s: ServiceLog) => SCHEDULED_SERVICE_TYPES.has(s.serviceType.trim().toLowerCase());

const ordinal = (n: number) => {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
};

export const WarrantyGuardianCard: React.FC<WarrantyGuardianProps> = ({
  services,
  latestOdometer,
  purchaseDate,
  onViewSchedule,
  onSetPurchaseDate,
}) => {
  const sortedServices = [...services].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastService = sortedServices[0];
  const lastServiceOdo = lastService ? lastService.odometer : 0;
  const today = new Date();

  const hasPurchaseDate = Boolean(purchaseDate);
  const startDate = hasPurchaseDate ? parseDateKey(purchaseDate as string) : null;
  const lastServiceDate = lastService ? new Date(lastService.date) : startDate;

  const daysSinceLastService =
    lastServiceDate !== null
      ? Math.max(0, Math.floor((today.getTime() - lastServiceDate.getTime()) / 86_400_000))
      : 0;
  const kmSinceLastService = Math.max(0, latestOdometer - lastServiceOdo);

  // Warranty limit: 5 years or 75,000 km.
  const warrantyEndDate = startDate ? new Date(startDate) : null;
  if (warrantyEndDate) warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 5);

  const daysUsed = startDate ? Math.floor((today.getTime() - startDate.getTime()) / 86_400_000) : 0;
  const daysRemaining =
    warrantyEndDate !== null ? Math.max(0, Math.floor((warrantyEndDate.getTime() - today.getTime()) / 86_400_000)) : 0;
  const kmRemainingWarranty = Math.max(0, 75000 - latestOdometer);

  const serviceCount = services.filter(isScheduledService).length;

  // Service number determination (based on count of scheduled services)
  let nextServiceNumber = 1;
  let nextServiceKmTarget = 750;
  let maxDaysForNext = 45;
  let isFreeService = true;
  /** Free services count down from purchase; paid services run from the last one. */
  let dayRuleLabel = '45 days from purchase';

  if (serviceCount === 0 && latestOdometer < 1000) {
    nextServiceNumber = 1;
    nextServiceKmTarget = 750;
    maxDaysForNext = 45;
    isFreeService = true;
    dayRuleLabel = '45 days from purchase';
  } else if (serviceCount <= 1 && latestOdometer < 5500) {
    nextServiceNumber = 2;
    nextServiceKmTarget = 5000;
    maxDaysForNext = 240;
    isFreeService = true;
    dayRuleLabel = '240 days from purchase';
  } else if (serviceCount <= 2 && latestOdometer < 10500) {
    nextServiceNumber = 3;
    nextServiceKmTarget = 10000;
    maxDaysForNext = 360;
    isFreeService = true;
    dayRuleLabel = '360 days from purchase';
  } else {
    nextServiceNumber = serviceCount + 1;
    nextServiceKmTarget = lastServiceOdo + 5000;
    maxDaysForNext = 120;
    isFreeService = false;
    dayRuleLabel = '120 days from last service';
  }

  const daysLeftForService = isFreeService
    ? Math.max(0, maxDaysForNext - daysUsed)
    : Math.max(0, maxDaysForNext - daysSinceLastService);

  const kmLeftForService = Math.max(0, nextServiceKmTarget - latestOdometer);

  // Compliance evaluation
  // Manual page 57: "Availing paid services at subsequent 5000 kms. or 120 days
  // from last service whichever is earlier"
  const isKmExceeded = (isFreeService && serviceCount === 0 && latestOdometer > 750) ||
    (!isFreeService && kmSinceLastService > 5000);
  const isDaysExceeded = (isFreeService && serviceCount === 0 && daysUsed > 45) ||
    (!isFreeService && daysSinceLastService > 120);

  const isAtRisk = isKmExceeded || isDaysExceeded;
  const isDueSoon = !isAtRisk && (kmLeftForService <= 500 || daysLeftForService <= 15);

  // Wrench notification check (Pulsar N250 console illuminates wrench at 450, 4450, 9450, 14450 km)
  const isWrenchActive = (nextServiceKmTarget === 750 && latestOdometer >= 450) ||
    (nextServiceKmTarget > 750 && latestOdometer >= nextServiceKmTarget - 550 && latestOdometer <= nextServiceKmTarget + 500);

  // Without a purchase date there is no defensible day count to show, and the
  // previous hardcoded default (2026-05-24) made every one of these figures
  // fiction - including "Expires 2031" for a bike bought at any other time.
  if (!hasPurchaseDate || startDate === null) {
    return (
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-50/60 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <CalendarRange className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-mono">OEM Warranty &amp; Service Guardian</h3>
              <p className="text-xs text-slate-500 font-mono mt-1 max-w-md">
                Add your bike&rsquo;s purchase date to track the 5-year / 75,000 km warranty and the three free
                services. Every day-based deadline is counted from it, so it can&rsquo;t be guessed.
              </p>
            </div>
          </div>
          {onSetPurchaseDate && (
            <button
              type="button"
              onClick={onSetPurchaseDate}
              className="self-start sm:self-auto text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors font-mono cursor-pointer shrink-0"
            >
              Set purchase date
            </button>
          )}
        </div>
      </div>
    );
  }

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
            {isAtRisk ? <ShieldAlert className="w-5 h-5" aria-hidden="true" /> : <ShieldCheck className="w-5 h-5" aria-hidden="true" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                OEM Warranty &amp; Service Guardian
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
            type="button"
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
              {isFreeService ? `${ordinal(nextServiceNumber)} Free Service` : `#${nextServiceNumber} Paid Service`}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {kmLeftForService.toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">km remaining</span>
          </div>

          {/* The label now states the rule that actually produced the number
              rather than always claiming a "120-day rule" above a 45/240/360-day
              free-service deadline. */}
          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span>
              or <strong>{daysLeftForService} days</strong> left
              <span className="text-slate-400"> ({dayRuleLabel})</span>
            </span>
          </div>

          {isWrenchActive && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs font-mono">
              <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
              <span>Console <strong>wrench</strong> should be glowing now</span>
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
              Expires {warrantyEndDate?.getFullYear()}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {kmRemainingWarranty.toLocaleString('en-IN')}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">km covered</span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              <strong>{Math.round(daysRemaining / 30)} months</strong> ({daysRemaining} days) remaining
            </span>
          </div>

          {/* Warranty Progress Bar */}
          <div className="mt-3 w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((latestOdometer / 75000) * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 font-mono">
            From purchase on {formatDay(purchaseDate as string, { year: true })}
          </p>
        </div>
      </div>

      {/* Manual Clauses Checklist for Warranty Retention */}
      <div className="border-t border-slate-100 pt-4 text-xs font-mono text-slate-600 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Oil: <strong>Bajaj DTS-i 20W50 BS6</strong> only</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Interval: <strong>≤ 5,000 km / 120 days</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Authorized <strong>Bajaj Dealer</strong> stamped</span>
        </div>
      </div>
    </div>
  );
};
