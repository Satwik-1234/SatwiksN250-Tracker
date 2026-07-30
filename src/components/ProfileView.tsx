'use client';

import React from 'react';
import Image from 'next/image';
import { User, Key, Zap, Droplet, Disc, Activity, Settings2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  return (
    <div className="animate-fade-up max-w-4xl mx-auto pb-12 space-y-12">
      {/* ── PROFILE HERO ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl group border border-slate-800/20 transition-all duration-700 hover:shadow-blue-500/30">
        <div className="h-64 sm:h-96 w-full relative overflow-hidden">
          <Image
            src="/n250-profile.png"
            alt="Satwik's Bajaj Pulsar N250"
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
          
          {/* Animated Glow on hover */}
          <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between z-10">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 shadow-lg shadow-blue-500/30">
              <User className="h-3 w-3" /> Owner Profile
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-lg">Satwik</h1>
            <p className="text-sm sm:text-xl text-blue-200 font-medium">Bajaj Pulsar N250</p>
          </div>
          <div className="text-left sm:text-right mt-6 sm:mt-0 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">
            <p className="text-xs text-slate-400 font-mono mb-1 uppercase tracking-widest">Model Year</p>
            <p className="text-3xl font-black text-white font-mono drop-shadow-md">2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ── ABOUT THE BIKE ── */}
        <div className="md:col-span-1 space-y-6">
          <div className="transform transition-all duration-500 hover:-translate-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Bike Details
            </h3>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 space-y-5">
              <div className="group/item">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider group-hover/item:text-blue-500 transition-colors">Make</p>
                <p className="text-base font-bold text-slate-900">Bajaj Auto</p>
              </div>
              <div className="group/item">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider group-hover/item:text-blue-500 transition-colors">Model</p>
                <p className="text-base font-bold text-slate-900">Pulsar N250</p>
              </div>
              <div className="group/item">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider group-hover/item:text-blue-500 transition-colors">Color / Edition</p>
                <p className="text-base font-bold text-slate-900">Pearl Metallic White</p>
              </div>
              <div className="group/item">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider group-hover/item:text-blue-500 transition-colors">Key Features</p>
                <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                  Golden USD Forks, Bi-functional LED Projector Headlamp, Dual Channel ABS, Digital Console
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TECHNICAL SPECIFICATIONS ── */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Technical Data
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {[
                { icon: Key, title: "Engine", val: "249.07 cc", desc: "Single cylinder, 4 stroke, SOHC, 2 Valve, Oil cooled, FI", delay: "delay-[0ms]" },
                { icon: Zap, title: "Max Power & Torque", val: "24.5 PS / 21.5 Nm", desc: "@ 8750 rpm / @ 6500 rpm", delay: "delay-[75ms]" },
                { icon: Droplet, title: "Fuel Capacity", val: "14 Litres", desc: "Tank-to-tank range approx ~450+ km", delay: "delay-[150ms]" },
                { icon: Settings2, title: "Transmission", val: "5 Speed", desc: "Constant mesh with Assist & Slipper Clutch", delay: "delay-[225ms]" },
                { icon: Activity, title: "Suspension", val: "USD Forks (Front)", desc: "Monoshock with Nitrox (Rear)", delay: "delay-[300ms]" },
                { icon: Disc, title: "Brakes", val: "Dual Channel ABS", desc: "300mm Front Disc, 230mm Rear Disc", delay: "delay-[375ms]" }
              ].map((spec, i) => (
                <div key={i} className={`flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-1 animate-fade-up ${spec.delay} group/card cursor-default`}>
                  <div className="h-10 w-10 bg-slate-50 group-hover/card:bg-blue-50 text-slate-400 group-hover/card:text-blue-600 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500">
                    <spec.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover/card:text-blue-500 transition-colors">{spec.title}</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{spec.val}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{spec.desc}</p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
