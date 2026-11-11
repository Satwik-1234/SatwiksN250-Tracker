'use client';

import React from 'react';
import { ArrowRight, Trash2, Copy, Check } from 'lucide-react';
import { Trip } from '@/types/fuel';

interface TicketCardProps {
  trip: Trip;
  onDeleteTrip?: (id: string) => void;
  isOwnerMode?: boolean;
}

const fmtDate = (raw?: string) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

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

  const distance =
    trip.distanceCovered ||
    trip.totalDistance ||
    (trip.endOdometer && trip.startOdometer ? trip.endOdometer - trip.startOdometer : 0);

  const departure = fmtDate(trip.departureDate || trip.startDate);
  const arrival = fmtDate(trip.arrivalDate || trip.endDate);
  const dateLabel = arrival && arrival !== departure ? `${departure} – ${arrival}` : departure;

  const actualMileage =
    trip.calculatedFuelEconomy ||
    trip.avgMileage ||
    (distance > 0 && trip.totalFuelLitres > 0
      ? Number((distance / trip.totalFuelLitres).toFixed(1))
      : undefined);

  const midMileage = trip.avgFuelEconomy;

  // How far the bike's display is from reality, as a percentage of the real figure.
  const displayError =
    midMileage && actualMileage ? Math.round(((midMileage - actualMileage) / actualMileage) * 100) : null;

  const handleCopySummary = () => {
    const summary = `N250: ${from} → ${to} | ${distance} km | ${actualMileage || '—'} km/L | ₹${trip.totalFuelCost}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="card p-5 flex flex-col">
      {/* Route + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900 flex items-center gap-1.5 min-w-0">
            <span className="truncate">{from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{to}</span>
          </h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {trip.tripType}
            {dateLabel && ` · ${dateLabel}`}
          </p>
        </div>

        <div className="flex items-center -mr-2 -mt-1 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            aria-label="Copy trip summary"
            title="Copy trip summary"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-blue-600" /> : <Copy className="h-4 w-4" />}
          </button>

          {isOwnerMode && onDeleteTrip && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete trip "${trip.name}"?`)) {
                  onDeleteTrip(trip.id);
                }
              }}
              aria-label="Delete trip"
              title="Delete trip"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Numbers */}
      <dl className="mt-4 grid grid-cols-3 gap-3 tabular">
        <div>
          <dt className="text-xs text-slate-500">Distance</dt>
          <dd className="text-base font-semibold text-slate-900 mt-0.5">
            {distance > 0 ? `${Number(distance).toLocaleString('en-IN')} km` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Fuel</dt>
          <dd className="text-base font-semibold text-slate-900 mt-0.5">
            ₹{Math.round(trip.totalFuelCost || 0).toLocaleString('en-IN')}
          </dd>
          <dd className="text-xs text-slate-500">{trip.totalFuelLitres || 0} L</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Actual mileage</dt>
          <dd className="text-base font-semibold text-slate-900 mt-0.5">
            {actualMileage ? `${actualMileage} km/L` : '—'}
          </dd>
        </div>
      </dl>

      {/* Display vs actual */}
      {midMileage ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] tabular">
          <span className="text-slate-600">
            Bike display showed <span className="font-semibold text-slate-900">{midMileage} km/L</span>
          </span>
          {displayError !== null && (
            <span
              className={`font-medium whitespace-nowrap ${
                Math.abs(displayError) <= 2 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {displayError === 0
                ? 'Spot on'
                : `${Math.abs(displayError)}% ${displayError > 0 ? 'optimistic' : 'low'}`}
            </span>
          )}
        </div>
      ) : null}

      {trip.notes && <p className="mt-3 text-[13px] text-slate-500 line-clamp-2">{trip.notes}</p>}
    </article>
  );
};
