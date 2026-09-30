'use client';

import React, { useState } from 'react';
import { Fuel, Zap, ShieldCheck, Gauge, ArrowLeft, ArrowRight, AlertTriangle, Thermometer, Phone, Bluetooth, Compass } from 'lucide-react';
import { DashboardMetrics } from '../types/fuel';

interface N250DigitalMeterProps {
  metrics: DashboardMetrics;
  latestOdometer: number;
}

export const N250DigitalMeter: React.FC<N250DigitalMeterProps> = ({ metrics, latestOdometer }) => {
  const [displayMode, setDisplayMode] = useState<'ODO' | 'TRIP_A' | 'TRIP_B' | 'AFE' | 'DTE'>('ODO');
  const [ridingMode, setRidingMode] = useState<'ROAD' | 'RAIN' | 'OFFROAD'>('ROAD');

  // No fabricated fallbacks. These readouts used to invent 1779.7 km, 239.7 km,
  // 38.64 km/L and a fixed 6.5 L tank level, so an empty database rendered as a
  // fully-populated instrument cluster - indistinguishable from real readings.
  // Missing data now renders as an explicit dash.
  const currentOdo = latestOdometer ?? null;
  const currentTrip = metrics.currentTripKm || null;
  const avgMileage = metrics.avgMileage || null;

  // Fuel level is not tracked anywhere in the schema (no tank sensor field on
  // FuelLog), so distance-to-empty cannot be derived. Shown as unavailable
  // rather than derived from a hardcoded 6.5 L.
  const dteKm: number | null = null;

  return (
    <div className="relative w-full max-w-5xl mx-auto my-4 font-mono select-none">
      {/* OUTER HEXAGONAL ANGLED SHIELD BEZEL (MATCHING USER'S DIAGRAM EXACTLY) */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-black p-4 sm:p-6 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl shadow-black overflow-hidden clip-hexagon">
        
        {/* Subtle Outer Bezel Accent Lighting */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* LEFT TELL-TALE LED LIGHTS STACK */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 bg-black/60 p-3 rounded-2xl border border-slate-800/80 min-w-[70px]">
            {/* Left Turn Indicator Arrow */}
            <div className="h-7 w-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/30">
              <ArrowLeft className="h-4 w-4 animate-pulse" />
            </div>

            {/* Neutral Indicator 'N' */}
            <div className="h-7 w-7 rounded-full bg-emerald-950 border border-emerald-500/80 flex items-center justify-center text-emerald-400 font-extrabold text-xs shadow-md shadow-emerald-500/40">
              N
            </div>

            {/* Oil / Engine Warning */}
            <div className="h-7 w-7 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-500 text-xs">
              🛢️
            </div>

            {/* High Beam Headlight */}
            <div className="h-7 w-7 rounded-full bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400 text-xs">
              💡
            </div>
          </div>

          {/* CENTER LCD DIGITAL SEGMENT DISPLAY (MATCHING PULSAR N250 GRAPHIC) */}
          <div className="flex-1 w-full bg-black border-2 border-slate-800/90 rounded-2xl p-4 sm:p-5 relative shadow-inner space-y-4">
            
            {/* 1. TOP SWEEPING TACHOMETER BAR (x1000 RPM) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold tracking-widest px-1">
                <span>x1000 rpm</span>
                <div className="flex space-x-2 sm:space-x-4">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  <span>6</span><span>7</span><span>8</span><span>9</span><span className="text-red-400">10</span>
                  <span className="text-red-500">11</span><span className="text-red-500 font-black">12</span>
                </div>
                <span className="text-red-500 font-bold">REDLINE</span>
              </div>

              {/* Tachometer Bar Segments */}
              <div className="flex items-center space-x-1 h-3 bg-slate-950 p-0.5 rounded border border-slate-800">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-xs transition-all ${
                      i < 6
                        ? 'bg-cyan-400 shadow-xs shadow-cyan-400/40'
                        : i < 14
                        ? 'bg-slate-800'
                        : 'bg-red-950 border border-red-900/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 2. TOP STATUS ROW: CLOCK | SIDE STAND | MTC */}
            <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400">TIME <strong className="text-white">08:30 PM</strong></span>
                <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                  SIDE STAND
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 font-mono">MTC ON</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-slate-300 font-bold uppercase">{ridingMode} MODE</span>
              </div>
            </div>

            {/* 3. MAIN CENTER GRID: FUEL BAR | GEAR | BIG SPEEDOMETER | NAVIGATION WHEEL */}
            <div className="grid grid-cols-12 gap-3 items-center py-2">
              
              {/* Left: Vertical Fuel Gauge */}
              <div className="col-span-3 sm:col-span-2 flex flex-col items-center space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <div className="flex items-center space-x-1 text-[9px] text-amber-400 font-bold">
                  <Fuel className="h-3 w-3" />
                  <span>FUEL</span>
                </div>

                <div className="flex flex-col-reverse space-y-reverse space-y-1 h-24 w-4" title="Fuel level is not tracked">
                  {Array.from({ length: 8 }).map((_, idx) => {
                    // All bars stay unlit: the app has no fuel-level input.
                    const isLit = false;
                    const isLow = idx < 2;
                    return (
                      <div
                        key={idx}
                        className={`w-full flex-1 rounded-xs transition-all ${
                          isLit
                            ? isLow
                              ? 'bg-red-500 shadow-xs shadow-red-500/50'
                              : 'bg-cyan-400 shadow-xs shadow-cyan-400/50'
                            : 'bg-slate-800/60'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] text-slate-600 font-bold">n/a</span>
              </div>

              {/* Center Left: Boxed Gear Indicator */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="text-[9px] text-slate-400 font-bold mb-1">GEAR</div>
                <div className="h-14 w-12 rounded-xl bg-slate-950 border-2 border-cyan-500/50 flex items-center justify-center text-2xl font-black text-cyan-300 shadow-md shadow-cyan-500/20">
                  N
                </div>
              </div>

              {/* Center Right: HUGE SLANTED DIGITAL SPEEDOMETER */}
              <div className="col-span-4 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-6xl font-black tracking-tight text-white italic font-mono drop-shadow-lg">
                  00
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-sans tracking-widest uppercase">
                  km/h
                </span>
              </div>

              {/* Right: TFT Navigation Wheel & Bluetooth Status */}
              <div className="col-span-3 flex flex-col items-center justify-center bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-slate-300 space-y-1">
                <div className="flex items-center space-x-1 text-[9px] text-blue-400 font-bold">
                  <Bluetooth className="h-3 w-3" />
                  <span>CONNECTED</span>
                </div>
                <div className="h-10 w-10 rounded-full border border-blue-500/40 flex items-center justify-center text-cyan-400 bg-slate-900 shadow-sm">
                  <Compass className="h-5 w-5 animate-spin-slow" />
                </div>
                <span className="text-[9px] text-slate-400">TURN BY TURN</span>
              </div>
            </div>

            {/* 4. BOTTOM LCD SEGMENT: ODO / TRIP A / AFE / DTE / RIDING MODES */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                  {displayMode}
                </span>
                <span className="text-base font-black text-white font-mono tracking-wider">
                  {displayMode === 'ODO' && `${currentOdo !== null ? currentOdo.toLocaleString() : '—'} km`}
                  {displayMode === 'TRIP_A' && `${currentTrip !== null ? currentTrip : '—'} km`}
                  {displayMode === 'TRIP_B' && '— km'}
                  {displayMode === 'AFE' && `${avgMileage !== null ? avgMileage.toFixed(1) : '—'} km/L`}
                  {displayMode === 'DTE' && `${dteKm !== null ? dteKm : '—'}${dteKm !== null ? ' km (DTE)' : ''}`}
                </span>
              </div>

              {/* Mode Switchers */}
              <div className="flex items-center space-x-2 text-[10px]">
                {(['ROAD', 'RAIN', 'OFFROAD'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRidingMode(m)}
                    className={`px-2 py-1 rounded font-bold transition ${
                      ridingMode === m
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const modes: ('ODO' | 'TRIP_A' | 'TRIP_B' | 'AFE' | 'DTE')[] = ['ODO', 'TRIP_A', 'TRIP_B', 'AFE', 'DTE'];
                    const next = modes[(modes.indexOf(displayMode) + 1) % modes.length];
                    setDisplayMode(next);
                  }}
                  className="ml-2 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-sm"
                >
                  MODE ⟳
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT TELL-TALE LED LIGHTS STACK */}
          <div className="flex flex-row lg:flex-col items-center justify-center gap-3 bg-black/60 p-3 rounded-2xl border border-slate-800/80 min-w-[70px]">
            {/* Right Turn Indicator Arrow */}
            <div className="h-7 w-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/30">
              <ArrowRight className="h-4 w-4 animate-pulse" />
            </div>

            {/* ABS Warning Light */}
            <div className="h-7 w-7 rounded-full bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 font-bold text-[9px]">
              (ABS)
            </div>

            {/* Check Engine Light */}
            <div className="h-7 w-7 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs">
              🛠️
            </div>

            {/* Coolant High Temp Warning */}
            <div className="h-7 w-7 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 text-xs">
              <Thermometer className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Bajaj Emblem Logo at Bottom Center */}
        <div className="flex items-center justify-center pt-3 opacity-60">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-sans tracking-widest uppercase">
            <span>BAJAJ</span>
            <span>•</span>
            <span>PULSAR N250</span>
          </div>
        </div>
      </div>
    </div>
  );
};
