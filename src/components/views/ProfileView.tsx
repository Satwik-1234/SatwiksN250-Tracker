'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Droplet, Fuel, Gauge, FolderOpen, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { DashboardMetrics } from '@/types/fuel';
import { fetchOwnerPin } from '@/services/backendService';
import { CareIcons } from '@/components/ui/CareIcons';
import { TrophyCard } from '@/components/cards/TrophyCard';
import { DedupeButton } from '@/components/ui/DedupeButton';
import { OwnershipCard } from '@/components/cards/OwnershipCard';
import { StatStrip } from '@/components/ui/Page';
import type { TabType } from '@/components/layout/Navigation';

interface ProfileViewProps {
  metrics?: DashboardMetrics;
  isOwnerMode?: boolean;
  onRequireOwner?: () => void;
  latestOdometer?: number;
  onNavigate?: (tab: TabType) => void;
}

const TyreIcon = CareIcons['tyre-pressure'];
const ChainIcon = CareIcons['chain-slack'];
const PlugIcon = CareIcons['spark-plug'];

import { DELIVERY_DATE } from '@/lib/bikeConstants';
const PURCHASE_DATE = DELIVERY_DATE;

const SPECS: [string, string, string?][] = [
  ['Engine', '249.07 cc', 'Single cylinder, 4-stroke, SOHC 2V, oil-cooled FI'],
  ['Power', '24.5 PS', 'at 8,750 rpm'],
  ['Torque', '21.5 Nm', 'at 6,500 rpm'],
  ['Gearbox', '5-speed constant mesh', 'Assist and slipper clutch'],
  ['Fuel tank', '14.0 L', 'No separate reserve, as per the owner manual'],
  ['Suspension', '37 mm USD forks', 'Nitrox monoshock at the rear'],
  ['Brakes', '300 mm / 230 mm discs', 'Dual-channel ABS with modes'],
  ['Lighting', 'LED projector', 'Dual LED DRLs, infinity digital display'],
];

const Reference: React.FC<{ icon: React.ReactNode; value: string; label: string; note: string }> = ({ icon, value, label, note }) => (
  <div className="glyph-tile rounded-xl bg-white/[0.04] p-4 flex items-center gap-3.5" style={{ ['--lamp' as string]: '#8fb0ff' }}>
    <span className="glyph is-lit shrink-0">{icon}</span>
    <div className="min-w-0">
      <div className="font-display text-[22px] leading-none font-semibold text-white tabular">{value}</div>
      <div className="text-[13px] text-white/70 mt-1">{label}</div>
      <div className="text-[12px] text-white/40 truncate">{note}</div>
    </div>
  </div>
);

export const ProfileView: React.FC<ProfileViewProps> = ({
  metrics,
  isOwnerMode = false,
  onRequireOwner,
  latestOdometer = 0,
  onNavigate,
}) => {
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwnerMode) return;
    let cancelled = false;
    fetchOwnerPin()
      .then((value) => {
        if (!cancelled && value) setPin(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOwnerMode]);

  const daysOwned = Math.max(0, Math.floor((new Date().getTime() - new Date(`${PURCHASE_DATE}T00:00:00`).getTime()) / 86400000));
  const odoDigits = String(Math.round(latestOdometer)).padStart(6, '0').split('');
  const avg = Number(metrics?.avgMileage) || 0;

  return (
    <div className="stagger space-y-5 md:space-y-6">
      {/* Hero */}
      <section className="cluster relative min-h-[320px] sm:min-h-[380px] flex flex-col justify-end">
        <Image
          src="/n250-profile.png"
          alt="Satwik's Bajaj Pulsar N250 in Pearl Metallic White"
          fill
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="object-cover object-[62%_45%] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15171c] via-[#15171c]/55 to-transparent sm:bg-gradient-to-r sm:from-[#15171c] sm:via-[#15171c]/60 sm:to-transparent" />

        <div className="relative px-5 sm:px-8 pb-5 pt-24">
          <h1 className="font-display italic font-bold text-[52px] sm:text-[72px] leading-[0.95] text-white">Satwik</h1>
          <p className="mt-2 text-[15px] sm:text-[17px] text-white/75">Bajaj Pulsar N250 · Pearl Metallic White · 2026</p>

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-[13px] text-white/50 mb-1.5">Odometer</div>
              {latestOdometer > 0 ? (
                <span className="odo" aria-label={`${latestOdometer.toLocaleString('en-IN')} kilometres`}>
                  {odoDigits.map((d, i) => (
                    <span key={i} aria-hidden="true">
                      {d}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-white/50">—</span>
              )}
              <span className="ml-1.5 text-[13px] text-white/50">km</span>
            </div>
            <div>
              <div className="text-[13px] text-white/50 mb-1.5">Together for</div>
              <div className="font-display text-[26px] leading-none font-semibold text-white tabular">
                {daysOwned} <span className="text-[14px] font-medium text-white/50">days</span>
              </div>
            </div>
          </div>
        </div>
        <div className="cluster-road relative" aria-hidden="true" />
      </section>

      <OwnershipCard odometer={latestOdometer} />

      <TrophyCard odometer={latestOdometer} fills={metrics?.totalLogsCount || 0} />

      <StatStrip
        items={[
          { label: 'Odometer', value: (metrics?.totalDistance || 0).toLocaleString('en-IN'), unit: 'km' },
          { label: 'Refills', value: metrics?.totalLogsCount || 0 },
          { label: 'Average mileage', value: avg > 0 ? avg.toFixed(1) : '—', unit: 'km/L' },
          { label: 'Spent on fuel', value: `₹${Math.round(metrics?.totalSpent || 0).toLocaleString('en-IN')}` },
        ]}
      />

      {/* Quick links to the parts of the app that belong to the bike */}
      {onNavigate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { tab: 'console' as TabType, icon: Gauge, title: 'Console', body: 'Warning lamps and upkeep' },
            { tab: 'documents' as TabType, icon: FolderOpen, title: 'Documents', body: 'RC, insurance and licence' },
          ].map((l) => (
            <button
              key={l.tab}
              type="button"
              onClick={() => onNavigate(l.tab)}
              className="card px-4 py-3.5 flex items-center gap-3.5 text-left group"
            >
              <span className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                <l.icon className="w-5 h-5 text-ink-1" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-ink-1">{l.title}</span>
                <span className="block text-[13px] text-ink-2">{l.body}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Spec sheet */}
      <section className="card overflow-hidden">
        <h2 className="px-5 sm:px-6 pt-5 pb-3 text-[15px] font-semibold text-ink-1">Specifications</h2>
        <dl className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {SPECS.map(([label, value, note]) => (
            <div key={label} className="px-5 sm:px-6 py-3 grid grid-cols-[110px_1fr] sm:grid-cols-[160px_1fr] gap-x-4 items-baseline">
              <dt className="text-[13px] text-ink-2">{label}</dt>
              <dd>
                <span className="text-[15px] font-medium text-ink-1">{value}</span>
                {note && <span className="block text-[13px] text-ink-2 mt-0.5">{note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Quick reference: the numbers you need at the pump and in the garage */}
      <section className="console-panel p-4 sm:p-6">
        <h2 className="text-[15px] font-semibold text-white mb-3.5">Pump and garage numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <Reference icon={<TyreIcon className="w-9 h-9" />} value="25 PSI" label="Front tyre" note="110/70-17 54P tubeless" />
          <Reference icon={<TyreIcon className="w-9 h-9" />} value="28 / 32 PSI" label="Rear tyre" note="Solo / with pillion · 140/70" />
          <Reference icon={<Droplet className="w-9 h-9" strokeWidth={1.7} />} value="20W50" label="Engine oil" note="1,300 ml refill · Bajaj DTS-i 10000" />
          <Reference icon={<ChainIcon className="w-9 h-9" />} value="20–30 mm" label="Chain slack" note="Workshop sets 20–25 mm" />
          <Reference icon={<PlugIcon className="w-9 h-9" />} value="VR5NEU" label="Spark plug" note="Gap 0.8–0.9 mm" />
          <Reference icon={<Fuel className="w-9 h-9" strokeWidth={1.7} />} value="14.0 L" label="Fuel tank" note="No separate reserve" />
        </div>
      </section>

      {/* Owner access */}
      <section className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
            {isOwnerMode ? <ShieldCheck className="h-5 w-5 text-ink-1" /> : <Lock className="h-5 w-5 text-ink-1" />}
          </span>
          <div>
            <div className="text-[13px] text-ink-2">Owner PIN</div>
            {isOwnerMode ? (
              <div className="font-display text-[26px] leading-none font-semibold text-ink-1 mt-1 tabular">{pin ?? '••••'}</div>
            ) : (
              <div className="text-[15px] font-medium text-ink-2 mt-1">•••• · Locked</div>
            )}
          </div>
        </div>
        {isOwnerMode ? (
          <span className="inline-flex items-center h-7 px-3 rounded-full text-[13px] font-medium bg-surface-2 text-ink-2">
            {pin ? 'Verified · 12 h session' : 'Local session'}
          </span>
        ) : (
          <button type="button" onClick={() => onRequireOwner?.()} className="btn btn-primary">
            Unlock to view PIN
          </button>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold text-ink-1 mb-1">Torque and technical data</h2>
        <p className="text-[13px] text-ink-2 mb-3">From the owner manual. Torque in kgf·m (multiply by 9.8 for Nm).</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-[14px] tabular">
          {[
            ['Front and rear axle nuts', '8 – 10'],
            ['Swing arm axle', '13 – 15'],
            ['Engine mount, front bottom', '4.0 – 4.2'],
            ['Engine mount, front top', '2.8 – 3.0'],
            ['Engine mount, rear', '4.0 – 4.2'],
            ['Engine mount, top', '2.2 – 2.4'],
            ['Rider foot rest', '1.8 – 2.2'],
            ['Pillion stay', '1.8 – 2.2'],
            ['Rear sprocket fasteners', '3.5 – 3.8'],
            ['Front tyre', '110/70-17 54P, 25 psi'],
            ['Rear tyre', '140/70-17 66P, 28 psi (32 with pillion)'],
            ['Battery', '12 V 8 Ah VRLA'],
            ['Engine oil', '1,300 ml refill, 1,700 ml overhaul'],
            ['Wheelbase', '1,341 mm'],
            ['Ground clearance', '165 mm'],
            ['Kerb / gross weight', '164 kg / 314 kg'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 border-b border-[var(--color-border)]">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-ink-1 font-medium text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {isOwnerMode && <DedupeButton />}
    </div>
  );
};
