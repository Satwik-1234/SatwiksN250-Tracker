'use client';

import React, { useState } from 'react';
import { Compass, Plus, Navigation, Calendar, IndianRupee, Zap, X, Clock, MapPin, Gauge } from 'lucide-react';
import { Trip, TripType } from '../types/fuel';
import { AnimatedActionButton } from './AnimatedActionButton';
import { TicketCard } from './TicketCard';

interface TripsViewProps {
  trips: Trip[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  latestOdometer: number;
}

export const TripsView: React.FC<TripsViewProps> = ({ trips, onAddTrip, latestOdometer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromLocation, setFromLocation] = useState('Bangalore');
  const [toLocation, setToLocation] = useState('Mysore');
  const [tripType, setTripType] = useState<TripType>('Highway');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('06:00');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('11:30');
  const [startOdometer, setStartOdometer] = useState<number | ''>(latestOdometer ? latestOdometer - 150 : 2000);
  const [endOdometer, setEndOdometer] = useState<number | ''>(latestOdometer || 2150);
  const [totalFuelCost, setTotalFuelCost] = useState<number | ''>(600);
  const [totalFuelLitres, setTotalFuelLitres] = useState<number | ''>(5.5);
  const [avgFuelEconomy, setAvgFuelEconomy] = useState<number | ''>(48.5); // Bike MID cluster reading
  const [notes, setNotes] = useState('');

  // Live calculations
  const sOdo = typeof startOdometer === 'number' ? startOdometer : 0;
  const eOdo = typeof endOdometer === 'number' ? endOdometer : 0;
  const liveDist = eOdo > sOdo ? eOdo - sOdo : 0;
  const litres = typeof totalFuelLitres === 'number' ? totalFuelLitres : 0;
  const liveCalculatedEconomy = liveDist > 0 && litres > 0 ? Number((liveDist / litres).toFixed(2)) : 0;

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = typeof totalFuelCost === 'number' ? totalFuelCost : 0;
    const midEco = typeof avgFuelEconomy === 'number' ? avgFuelEconomy : undefined;
    const calcEco = liveCalculatedEconomy > 0 ? liveCalculatedEconomy : undefined;

    const tripName = `${fromLocation.trim() || 'Home'} to ${toLocation.trim() || 'Destination'}`;

    onAddTrip({
      name: tripName,
      tripType,
      fromLocation: fromLocation.trim() || 'Home',
      toLocation: toLocation.trim() || 'Destination',
      departureDate,
      departureTime: departureTime || undefined,
      arrivalDate: arrivalDate || undefined,
      arrivalTime: arrivalTime || undefined,
      startOdometer: sOdo,
      endOdometer: eOdo || undefined,
      distanceCovered: liveDist,
      totalFuelCost: cost,
      totalFuelLitres: litres,
      avgFuelEconomy: midEco,
      calculatedFuelEconomy: calcEco,
      notes: notes.trim() || undefined,

      // Compatibility
      startDate: departureDate,
      endDate: arrivalDate,
      totalDistance: liveDist,
      avgMileage: calcEco || midEco,
    });

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
            Log departure, arrival, distance, and compare Instrument Cluster MID vs Actual Calculated mileage.
          </p>
        </div>

        <AnimatedActionButton label="New Trip Entry" onClick={() => setIsModalOpen(true)} />
      </div>

      {/* Grid of Trip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <TicketCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* New Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <span>Log New Ride / Trip</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Ride Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ride Category</label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                >
                  <option value="Highway">Highway Tour</option>
                  <option value="Tour">Long Distance Ride</option>
                  <option value="Commute">Daily Commute</option>
                  <option value="City">City Ride</option>
                </select>
              </div>

              {/* From Location & To Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> From Location
                  </label>
                  <input
                    type="text"
                    required
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                    placeholder="e.g. Bangalore"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> To Location
                  </label>
                  <input
                    type="text"
                    required
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                    placeholder="e.g. Coorg"
                  />
                </div>
              </div>

              {/* Departure Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-400" /> Departure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> Departure Time
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Arrival Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" /> Arrival Date
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Arrival Time
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Odometer Readings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Odo (km)</label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Odo (km)</label>
                  <input
                    type="number"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live Distance Preview */}
              <div className="bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Distance Covered:</span>
                <span className="font-mono font-bold text-white text-sm">{liveDist} km</span>
              </div>

              {/* Fuel Cost & Volume */}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Consumed (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalFuelLitres}
                    onChange={(e) => setTotalFuelLitres(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fuel Economy Comparison (MID vs Actual) */}
              <div className="p-3 bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-900/50 rounded-2xl space-y-2">
                <label className="block text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  Instrument Cluster (MID) Economy (km/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={avgFuelEconomy}
                  onChange={(e) => setAvgFuelEconomy(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500"
                  placeholder="e.g. 47.5"
                />

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Actual Calculated Economy:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {liveCalculatedEconomy > 0 ? `${liveCalculatedEconomy} km/L` : '—'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trip Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                  placeholder="Route details, cruising speed, weather, gear notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-sm shadow-lg hover:from-blue-500 hover:to-cyan-500 transition active:scale-[0.98]"
              >
                Save Trip Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
