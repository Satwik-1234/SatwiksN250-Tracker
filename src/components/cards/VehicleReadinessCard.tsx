'use client';

import React from 'react';
import { ShieldCheck, Wrench, ArrowRight } from 'lucide-react';
import { ServiceLog } from '@/types/fuel';
import { getServiceWindow, getWarrantySummary } from '@/lib/maintenance';

interface VehicleReadinessCardProps {
  latestOdometer: number;
  services: ServiceLog[];
  isOwnerMode?: boolean;
  onNavigateTab: (tab: 'services' | 'analytics' | 'trips' | 'logs') => void;
  onLubeLogged?: () => void;
  onRequireOwner?: () => void;
}

/**
 * Top-of-dashboard status: where the bike stands against its next paid/free
 * service and its 5-year warranty. Recurring upkeep (chain, tyres, wash,
 * check-up) lives in the CareCard beside it.
 */
export const VehicleReadinessCard: React.FC<VehicleReadinessCardProps> = ({
  latestOdometer = 0,
  onNavigateTab,
}) => {
  const serviceWindow = getServiceWindow(latestOdometer);
  const warranty = getWarrantySummary(latestOdometer);
  const isFreeService = serviceWindow.intervalName.includes('Free');
  const kmToService = serviceWindow.kmRemaining;
  const progress = serviceWindow.progressPercent;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--color-text-1)]">Bike health</h2>
          <p className="text-[13px] text-[var(--color-text-2)] mt-0.5">
            Odometer {latestOdometer.toLocaleString('en-IN')} km
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('services')}
          className="text-[13px] font-medium text-[var(--color-text-1)] hover:text-[var(--color-accent)] flex items-center gap-1"
        >
          All service <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Next service */}
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-medium text-[var(--color-text-2)] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[var(--color-data)]" />
              Next service
            </span>
            <span
              className={`text-[12px] font-medium px-2 h-6 inline-flex items-center rounded-full ${
                isFreeService ? 'bg-blue-50 text-blue-700' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {isFreeService ? 'Free' : 'Paid'}
            </span>
          </div>

          <div className="text-[17px] font-semibold text-[var(--color-text-1)]">{serviceWindow.intervalName}</div>
          <div className="text-[13px] text-[var(--color-text-2)] mt-0.5">Target {serviceWindow.targetRange}</div>

          <div className="mt-3">
            <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={`h-full rounded-full bar-grow ${kmToService <= 500 ? 'bg-accent' : 'bg-[var(--color-data)]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-[13px] font-medium">
              {kmToService > 0 ? (
                <span className="text-[var(--color-text-2)]">{kmToService.toLocaleString('en-IN')} km to go</span>
              ) : (
                <span className="text-accent">Service due</span>
              )}
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-medium text-[var(--color-text-2)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-data)]" />
              Warranty
            </span>
            <span
              className={`text-[12px] font-medium px-2 h-6 inline-flex items-center rounded-full ${
                warranty.isActive ? 'bg-blue-50 text-blue-700' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {warranty.isActive ? 'Active' : 'Expired'}
            </span>
          </div>

          <div className="text-[17px] font-semibold text-[var(--color-text-1)]">5 yrs · 75,000 km</div>
          <div className="text-[13px] text-[var(--color-text-2)] mt-0.5">Valid till {warranty.validUntil}</div>

          <dl className="mt-3 space-y-1 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-2)]">Free services left</dt>
              <dd className="font-medium text-[var(--color-text-1)] tabular">{warranty.freeServicesRemaining}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-text-2)]">Km covered</dt>
              <dd className="font-medium text-[var(--color-text-1)] tabular">
                {warranty.kmCoveredRemaining.toLocaleString('en-IN')} km
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};
