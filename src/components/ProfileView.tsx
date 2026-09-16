'use client';

import React from 'react';
import Image from 'next/image';
import { User, Key, Zap, Droplet, Disc, Activity, Settings2, IndianRupee, Wrench, ShoppingBag, Banknote, ShieldCheck, Gauge, HelpCircle } from 'lucide-react';
import { DashboardMetrics, AccessoryGear, ServiceLog } from '../types/fuel';

interface ProfileViewProps {
  metrics?: DashboardMetrics;
  accessories?: AccessoryGear[];
  services?: ServiceLog[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ metrics, accessories = [], services = [] }) => {
  const totalFuel = metrics?.totalSpent || 0;
  const totalAccessories = accessories.reduce((sum, a) => sum + a.cost, 0);
  const totalService = services.reduce((sum, s) => sum + s.totalCost, 0);
  const grandTotal = totalFuel + totalAccessories + totalService;

  return (
    <div className="animate-fade-up max-w-5xl mx-auto pb-16 space-y-10">
      {/* ── PROFILE HERO ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl group border border-slate-200/80 transition-all duration-700 bg-white">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 shadow-md font-mono">
              <User className="h-3 w-3" /> Registered Rider
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-md font-mono">
              Satwik
            </h1>
            <p className="text-sm sm:text-lg text-blue-200 font-medium font-mono">
              Bajaj Pulsar N250 · Pearl Metallic White
            </p>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-xs text-slate-300 font-mono uppercase tracking-widest">Model Year</p>
            <p className="text-3xl font-black text-white font-mono drop-shadow-md">2026</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* ── ABOUT THE BIKE ── */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Bike Identity
            </h3>
            <div className="bg-white rounded-3xl p-6 border border-slate-200/85 shadow-sm space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Manufacturer</p>
                <p className="text-base font-bold text-slate-900">Bajaj Auto Limited</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Platform Model</p>
                <p className="text-base font-bold text-slate-900">Pulsar N250 (Dual Channel ABS)</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Color Variant</p>
                <p className="text-base font-bold text-slate-900">Pearl Metallic White</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Factory Equipment</p>
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { icon: Key, title: "Engine", val: "249.07 cc", desc: "Single cylinder, 4-stroke, SOHC 2V, Oil-cooled FI" },
                { icon: Zap, title: "Max Power & Torque", val: "24.5 PS / 21.5 Nm", desc: "@ 8,750 rpm & @ 6,500 rpm" },
                { icon: Droplet, title: "Fuel Tank Capacity", val: "14.0 Litres", desc: "Estimated highway range ~550+ km" },
                { icon: Settings2, title: "Transmission", val: "5-Speed Constant Mesh", desc: "Wet multiplate Assist & Slipper clutch" },
                { icon: Activity, title: "Suspension", val: "37mm USD Forks / Nitrox Mono", desc: "Front USD Forks, Rear Nitrox Monoshock" },
                { icon: Disc, title: "Brakes & ABS", val: "300mm / 230mm Discs", desc: "Dual Channel ABS with Mode Selection" }
              ].map((spec, i) => (
                <div key={i} className="flex items-start gap-3.5 p-4 bg-white border border-slate-200/85 rounded-2xl shadow-xs">
                  <div className="h-9 w-9 bg-slate-50 text-blue-600 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <spec.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">{spec.title}</p>
                    <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{spec.val}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{spec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SENIOR DEV FEATURE: PULSAR N250 MAINTENANCE & FLUID SPECIFICATIONS ── */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
          <span className="w-8 h-[1px] bg-slate-200"></span>
          Factory Fluids & Maintenance Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Engine Oil Grade</span>
            <span className="text-sm font-black text-slate-900 block mt-1">10W-50 API SN</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Semi-Synthetic</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Oil Capacity</span>
            <span className="text-sm font-black text-slate-900 block mt-1">1,400 ml</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">(1.4 Litres drain)</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Front Tire PSI</span>
            <span className="text-sm font-black text-blue-600 block mt-1">25 PSI</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">100/80-17 Tubeless</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Rear Tire PSI</span>
            <span className="text-sm font-black text-blue-600 block mt-1">28 / 32 PSI</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Solo: 28 | Pillion: 32</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Drive Chain Slack</span>
            <span className="text-sm font-black text-slate-900 block mt-1">25 – 35 mm</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Clean & lube @ 500 km</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Spark Plug</span>
            <span className="text-sm font-black text-slate-900 block mt-1">Triple Spark</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">0.8 – 0.9 mm gap</span>
          </div>
        </div>
      </div>
    </div>
  );
};
