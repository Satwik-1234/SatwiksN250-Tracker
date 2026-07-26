'use client';

import React, { useState } from 'react';
import { Compass, Plus, Navigation, Calendar, IndianRupee, Zap, X } from 'lucide-react';
import { Trip, TripType } from '../types/fuel';

interface TripsViewProps {
  trips: Trip[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  latestOdometer: number;
}

export const TripsView: React.FC<TripsViewProps> = ({ trips, onAddTrip, latestOdometer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tripType, setTripType] = useState<TripType>('Highway');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startOdometer, setStartOdometer] = useState<number | ''>(latestOdometer ? latestOdometer - 300 : 2000);
  const [endOdometer, setEndOdometer] = useState<number | ''>(latestOdometer || 2300);
  const [totalFuelCost, setTotalFuelCost] = useState<number | ''>(850);
  const [totalFuelLitres, setTotalFuelLitres] = useState<number | ''>(8.2);
  const [notes, setNotes] = useState('');

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const sOdo = typeof startOdometer === 'number' ? startOdometer : 0;
    const eOdo = typeof endOdometer === 'number' ? endOdometer : 0;
    const cost = typeof totalFuelCost === 'number' ? totalFuelCost : 0;
    const litres = typeof totalFuelLitres === 'number' ? totalFuelLitres : 0;

    const dist = eOdo > sOdo ? eOdo - sOdo : 0;
    const avgM = dist > 0 && litres > 0 ? Number((dist / litres).toFixed(2)) : undefined;

    onAddTrip({
      name: name || 'N250 Highway Ride',
      tripType,
      startDate,
      endDate: endDate || undefined,
      startOdometer: sOdo,
      endOdometer: eOdo || undefined,
      totalDistance: dist,
      totalFuelCost: cost,
      totalFuelLitres: litres,
      avgMileage: avgM,
      notes: notes.trim() || undefined,
    });

    setName('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Compass className="h-5 w-5 text-blue-400" />
            <span>N250 Trips & Highway Rides</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log specific tours, long weekend rides, and commuting stats.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition active:scale-95 border border-blue-400/30"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Trip Entry</span>
        </button>
      </div>

      {/* Grid of Trip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                  {trip.tripType}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{trip.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {trip.startDate} {trip.endDate ? `to ${trip.endDate}` : ''}
                  </span>
                </p>
              </div>

              {trip.avgMileage && (
                <div className="text-right bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-cyan-400 block font-medium">Trip Mileage</span>
                  <span className="text-base font-black text-cyan-300">
                    {trip.avgMileage} km/L
                  </span>
                </div>
              )}
            </div>

            {/* Trip Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-3 text-center border border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-400 block">Distance</span>
                <span className="text-sm font-bold text-white">
                  {trip.totalDistance || (trip.endOdometer && trip.startOdometer ? trip.endOdometer - trip.startOdometer : 'N/A')} km
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Fuel Cost</span>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{trip.totalFuelCost}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Fuel Volume</span>
                <span className="text-sm font-bold text-white">
                  {trip.totalFuelLitres} L
                </span>
              </div>
            </div>

            {trip.notes && (
              <p className="text-xs text-slate-300 italic bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                "{trip.notes}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* New Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span>Log New Trip</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                  placeholder="e.g. Bangalore to Coorg Weekend Tour"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ride Type</label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as TripType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Highway">Highway Ride</option>
                    <option value="Tour">Long Tour</option>
                    <option value="Commute">Daily Commute</option>
                    <option value="City">City Ride</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Odometer (km)</label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Odometer (km)</label>
                  <input
                    type="number"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Fuel Spent (₹)</label>
                  <input
                    type="number"
                    value={totalFuelCost}
                    onChange={(e) => setTotalFuelCost(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Volume (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalFuelLitres}
                    onChange={(e) => setTotalFuelLitres(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trip Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                  placeholder="Cruising speed, road conditions, gear notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-lg hover:from-blue-500 hover:to-cyan-500 transition"
              >
                Save Trip
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
