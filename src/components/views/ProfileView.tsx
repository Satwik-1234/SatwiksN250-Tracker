'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Key, Zap, Droplet, Disc, Activity, Settings2, ShieldCheck, Lock } from 'lucide-react';
import { DashboardMetrics } from '@/types/fuel';
import { fetchOwnerPin } from '@/services/backendService';

interface ProfileViewProps {
  metrics?: DashboardMetrics;
  isOwnerMode?: boolean;
  onRequireOwner?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ isOwnerMode = false, onRequireOwner }) => {
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
  return (
    <div className="animate-fade-up stagger space-y-8">
      {/* ── PROFILE HERO ── */}
      <div className="relative rounded-2xl overflow-hidden group bg-slate-900">
        <div className="h-64 sm:h-96 w-full relative overflow-hidden">
          <Image
            src="/n250-profile.png"
            alt="Satwik's Bajaj Pulsar N250"
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent transition-opacity duration-700" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold rounded-full mb-3 shadow-md">
              <User className="h-3 w-3" /> Registered Rider
            </span>
            <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight mb-2 drop-shadow-md">
              Satwik
            </h1>
            <p className="text-sm sm:text-lg text-blue-200 font-medium">
              Bajaj Pulsar N250 · Pearl Metallic White
            </p>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-xs text-slate-300">Model Year</p>
            <p className="text-3xl font-semibold text-white drop-shadow-md">2026</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── ABOUT THE BIKE ── */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-3">
              
              About this bike
            </h3>
            <div className="bg-white rounded-3xl p-6 border border-slate-200/85 shadow-sm space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Manufacturer</p>
                <p className="text-base font-bold text-slate-900">Bajaj Auto Limited</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Platform Model</p>
                <p className="text-base font-bold text-slate-900">Pulsar N250 (Dual Channel ABS)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Color Variant</p>
                <p className="text-base font-bold text-slate-900">Pearl Metallic White</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Factory Equipment</p>
                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                  37mm Golden USD Telescopic Forks, Bi-Functional LED Projector with Dual LED DRLs, Assist & Slipper Clutch, Infinity Digital Display.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TECHNICAL SPECIFICATIONS ── */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-3">
              
              Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { icon: Key, title: "Engine", val: "249.07 cc", desc: "Single cylinder, 4-stroke, SOHC 2V, Oil-cooled FI" },
                { icon: Zap, title: "Max Power & Torque", val: "24.5 PS / 21.5 Nm", desc: "@ 8,750 rpm & @ 6,500 rpm" },
                { icon: Droplet, title: "Fuel Tank Capacity", val: "14.0 Litres", desc: "Min 3.0 L reserve protects EFI high-pressure pump" },
                { icon: Settings2, title: "Transmission", val: "5-Speed Constant Mesh", desc: "Wet multiplate Assist & Slipper clutch" },
                { icon: Activity, title: "Suspension", val: "37mm USD Forks / Nitrox Mono", desc: "Front USD Forks, Rear Nitrox Monoshock" },
                { icon: Disc, title: "Brakes & ABS", val: "300mm / 230mm Discs", desc: "Dual Channel ABS with Mode Selection" }
              ].map((spec, i) => (
                <div key={i} className="flex items-start gap-3.5 p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs">
                  <div className="h-9 w-9 bg-slate-50 text-blue-600 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <spec.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{spec.title}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{spec.val}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{spec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── OFFICIAL PULSAR N250 FACTORY FLUIDS & MAINTENANCE SPECIFICATIONS ── */}
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-3">
          
          Fluids and pressures
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Engine Oil Grade</span>
            <span className="text-sm font-semibold text-slate-900 block mt-1">20W50 BS6</span>
            <span className="text-xs text-slate-400 block mt-0.5">Bajaj DTS-i · API SN / MA2</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Oil Capacity</span>
            <span className="text-sm font-semibold text-slate-900 block mt-1">1,300 ml</span>
            <span className="text-xs text-slate-400 block mt-0.5">Refill (1,700 ml overhaul)</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Front Tyre PSI</span>
            <span className="text-sm font-semibold text-blue-600 block mt-1">25 PSI</span>
            <span className="text-xs text-slate-400 block mt-0.5">110/70-17 54P Tubeless</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Rear Tyre PSI</span>
            <span className="text-sm font-semibold text-blue-600 block mt-1">28 / 32 PSI</span>
            <span className="text-xs text-slate-400 block mt-0.5">Solo: 28 | Pillion: 32 (140/70)</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Chain Slack</span>
            <span className="text-sm font-semibold text-slate-900 block mt-1">20 – 30 mm</span>
            <span className="text-xs text-slate-400 block mt-0.5">Sealed &apos;O&apos; Ring · 500 km</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[11px] font-medium text-slate-500 block">Spark Plug</span>
            <span className="text-sm font-semibold text-slate-900 block mt-1">1 No. (Single)</span>
            <span className="text-xs text-slate-400 block mt-0.5">VR5NEU · 0.8–0.9 mm</span>
          </div>
        </div>
      </div>

      {/* ── OWNER ACCESS & PIN ── */}
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900 mb-3">
          
          Owner Access
        </h3>
        <div className="bg-white rounded-3xl p-6 border border-slate-200/85 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              {isOwnerMode ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Owner PIN</p>
              {isOwnerMode ? (
                <p className="text-2xl font-semibold text-slate-900 mt-0.5 tracking-normal">{pin ?? '••••'}</p>
              ) : (
                <p className="text-sm font-bold text-slate-500 mt-1">•••• · Locked</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwnerMode ? (
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  pin
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {pin ? 'Verified · 12 h session' : 'Local session'}
              </span>
            ) : (
              <button
                onClick={() => onRequireOwner?.()}
                className="btn btn-primary"
              >
                Unlock to view PIN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
