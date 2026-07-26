'use client';

import React from 'react';
import Image from 'next/image';
import { User, Key, Zap, Gauge, Droplet, Disc, Activity, Settings2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  return (
    <div className="animate-fade-up max-w-4xl mx-auto pb-12">
      {/* ── PROFILE HERO ── */}
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl">
        <div className="h-64 sm:h-96 w-full relative">
          <Image
            src="/n250-profile.png"
            alt="Satwik's Bajaj Pulsar N250"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
              <User className="h-3 w-3" /> Owner Profile
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-1">Satwik</h1>
            <p className="text-sm sm:text-lg text-slate-300 font-medium">Bajaj Pulsar N250</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-mono mb-1">Model Year</p>
            <p className="text-xl font-bold text-white font-mono">2025</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ── ABOUT THE BIKE ── */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bike Details</h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Make</p>
                <p className="text-sm font-bold text-slate-900">Bajaj Auto</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Model</p>
                <p className="text-sm font-bold text-slate-900">Pulsar N250</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Color / Edition</p>
                <p className="text-sm font-bold text-slate-900">Pearl Metallic White</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Key Features</p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Golden USD Forks, Bi-functional LED Projector Headlamp, Dual Channel ABS, Digital Console
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TECHNICAL SPECIFICATIONS ── */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Engine</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">249.07 cc</p>
                  <p className="text-[11px] text-slate-400 mt-1">Single cylinder, 4 stroke, SOHC, 2 Valve, Oil cooled, FI</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Max Power & Torque</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">24.5 PS / 21.5 Nm</p>
                  <p className="text-[11px] text-slate-400 mt-1">@ 8750 rpm / @ 6500 rpm</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Droplet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Fuel Capacity</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">14 Litres</p>
                  <p className="text-[11px] text-slate-400 mt-1">Tank-to-tank range approx ~450+ km</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Settings2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Transmission</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">5 Speed</p>
                  <p className="text-[11px] text-slate-400 mt-1">Constant mesh with Assist & Slipper Clutch</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Suspension</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">USD Forks (Front)</p>
                  <p className="text-[11px] text-slate-400 mt-1">Monoshock with Nitrox (Rear)</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors">
                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Disc className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Brakes</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Dual Channel ABS</p>
                  <p className="text-[11px] text-slate-400 mt-1">300mm Front Disc, 230mm Rear Disc</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
