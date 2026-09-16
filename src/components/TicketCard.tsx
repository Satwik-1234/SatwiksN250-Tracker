'use client';

import React from 'react';
import { Bike, ArrowRight, Gauge, Calendar, Clock, Fuel, Sparkles, Navigation, Trash2, Copy, Check } from 'lucide-react';
import { Trip } from '../types/fuel';

interface TicketCardProps {
  trip: Trip;
  onDeleteTrip?: (id: string) => void;
  isOwnerMode?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ trip, onDeleteTrip, isOwnerMode = false }) => {
  const [copied, setCopied] = React.useState(false);

  // Determine from and to locations
  let from = trip.fromLocation || '';
  let to = trip.toLocation || '';

  if (!from || !to) {
    const lowerName = trip.name.toLowerCase();
    if (lowerName.includes(' to ')) {
      const parts = trip.name.split(/ to /i);
      from = from || parts[0].trim();
      to = to || parts[1].trim();
    } else if (trip.name.includes('-')) {
      const parts = trip.name.split('-');
      from = from || parts[0].trim();
      to = to || parts[1].trim();
    } else {
      from = from || 'Origin';
      to = to || trip.name;
    }
  }

  const fromAcronym = from.substring(0, 3).toUpperCase();
  const toAcronym = to.substring(0, 3).toUpperCase();

  const distance =
    trip.distanceCovered ||
    trip.totalDistance ||
    (trip.endOdometer && trip.startOdometer ? trip.endOdometer - trip.startOdometer : 0);

  const departureDateStr = trip.departureDate || trip.startDate || '';
  const departureTimeStr = trip.departureTime ? trip.departureTime.substring(0, 5) : '';
  const arrivalDateStr = trip.arrivalDate || trip.endDate || departureDateStr;
  const arrivalTimeStr = trip.arrivalTime ? trip.arrivalTime.substring(0, 5) : '';

  const actualMileage =
    trip.calculatedFuelEconomy ||
    trip.avgMileage ||
    (distance > 0 && trip.totalFuelLitres > 0
      ? Number((distance / trip.totalFuelLitres).toFixed(1))
      : undefined);

  const midMileage = trip.avgFuelEconomy;

  const tripTypeColor =
    trip.tripType === 'Highway'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : trip.tripType === 'Tour'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : trip.tripType === 'City'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const handleCopySummary = () => {
    const summary = `🏍️ Bajaj Pulsar N250 Ride: ${from} ➔ ${to} | ${distance} km | Actual: ${actualMileage || '—'} km/L | MID: ${midMileage || '—'} km/L | ₹${trip.totalFuelCost}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white border border-slate-200/85 rounded-3xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-300 hover:shadow-[0_8px_25px_rgba(37,99,235,0.05)] transition-all duration-200 group overflow-hidden flex flex-col justify-between">
      
      <div>
        {/* Top Bar: Category, Bike Icon, Distance, Actions */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Bike className="h-4 w-4" />
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold font-mono uppercase tracking-wider ${tripTypeColor}`}>
                {trip.tripType}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                Distance
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {distance > 0 ? `${distance} km` : '—'}
              </span>
            </div>

            {/* Quick Actions (Copy & Delete) */}
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-100">
              <button
                onClick={handleCopySummary}
                title="Copy ride telemetry summary"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {isOwnerMode && onDeleteTrip && (
                <button
                  onClick={() => {
                    if (confirm(`Delete trip "${trip.name}"?`)) {
                      onDeleteTrip(trip.id);
                    }
                  }}
                  title="Delete ride log"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Route & Departure / Arrival Boarding Pass */}
        <div className="py-4 flex items-center justify-between gap-2">
          {/* Origin */}
          <div className="flex-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight block">
              {fromAcronym}
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate block max-w-[110px]" title={from}>
              {from}
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {departureDateStr}
              {departureTimeStr && <span className="ml-1 text-slate-500 font-medium">({departureTimeStr})</span>}
            </p>
          </div>

          {/* Route Path Visual */}
          <div className="flex-1 flex flex-col items-center justify-center px-1">
            <span className="text-[9px] font-mono text-blue-600 font-bold uppercase tracking-widest mb-1">
              N250 Route
            </span>
            <div className="w-full relative flex items-center justify-center">
              <div className="w-full border-t-2 border-dashed border-blue-200" />
              <div className="absolute w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                <Navigation className="h-3 w-3 rotate-90" />
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="flex-1 text-right">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight block">
              {toAcronym}
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate block max-w-[110px] ml-auto" title={to}>
              {to}
            </span>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {arrivalDateStr}
              {arrivalTimeStr && <span className="ml-1 text-slate-500 font-medium">({arrivalTimeStr})</span>}
            </p>
          </div>
        </div>

        {/* Dashed divider with boarding ticket notch aesthetics */}
        <div className="relative my-2">
          <div className="border-t border-dashed border-slate-200" />
          <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border border-slate-200" />
          <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-50 border border-slate-200" />
        </div>

        {/* Bottom Telemetry: Fuel Cost & Economy Comparison */}
        <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Cost & Litres */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              Fuel Consumed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 font-mono">
              <span className="text-sm font-black text-slate-900">
                ₹{trip.totalFuelCost.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400">
                ({trip.totalFuelLitres} L)
              </span>
            </div>
          </div>

          {/* MID vs Calculated Comparison Box */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-1.5 font-mono">
            <div className="text-left pr-2 border-r border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                MID Console
              </span>
              <span className="text-xs font-bold text-slate-800">
                {midMileage ? `${midMileage} km/L` : '—'}
              </span>
            </div>

            <div className="text-left pl-1">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                Calculated
              </span>
              <span className="text-xs font-black text-emerald-600">
                {actualMileage ? `${actualMileage} km/L` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes or Barcode stub */}
      {trip.notes && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <p className="text-[11px] italic text-slate-500 truncate max-w-[240px]">
            &ldquo;{trip.notes}&rdquo;
          </p>
          <span className="text-[9px] font-mono tracking-widest uppercase font-semibold text-slate-400">
            {trip.id.replace(/-/g, '').substring(0, 8)}
          </span>
        </div>
      )}
    </div>
  );
};
