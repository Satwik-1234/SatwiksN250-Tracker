'use client';

import React, { useState, useMemo } from 'react';
import { Compass, Calendar, Clock, MapPin, Gauge, X, Route, Search, Filter, Fuel, IndianRupee } from 'lucide-react';
import { Trip, TripType } from '../types/fuel';
import { AnimatedActionButton } from './AnimatedActionButton';
import { TicketCard } from './TicketCard';

interface TripsViewProps {
  trips: Trip[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
  onDeleteTrip?: (id: string) => void;
  latestOdometer: number;
  isOwnerMode?: boolean;
}

export const TripsView: React.FC<TripsViewProps> = ({
  trips,
  onAddTrip,
  onDeleteTrip,
  latestOdometer,
  isOwnerMode = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states
  const [fromLocation, setFromLocation] = useState('Bangalore');
  const [toLocation, setToLocation] = useState('Mysore');
  const [tripType, setTripType] = useState<TripType>('Highway');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('06:00');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('11:30');
  const [startOdometer, setStartOdometer] = useState<number | ''>(
    latestOdometer ? latestOdometer - 150 : 2000
  );
  const [endOdometer, setEndOdometer] = useState<number | ''>(latestOdometer || 2150);
  const [totalFuelCost, setTotalFuelCost] = useState<number | ''>(600);
  const [totalFuelLitres, setTotalFuelLitres] = useState<number | ''>(5.5);
  const [avgFuelEconomy, setAvgFuelEconomy] = useState<number | ''>(48.5); // Bike MID cluster reading
  const [notes, setNotes] = useState('');

  // Live calculations for modal
  const sOdo = typeof startOdometer === 'number' ? startOdometer : 0;
  const eOdo = typeof endOdometer === 'number' ? endOdometer : 0;
  const liveDist = eOdo > sOdo ? eOdo - sOdo : 0;
  const litres = typeof totalFuelLitres === 'number' ? totalFuelLitres : 0;
  const liveCalculatedEconomy =
    liveDist > 0 && litres > 0 ? Number((liveDist / litres).toFixed(2)) : 0;

  // Senior dev addition: Computed Trip Telemetry KPIs
  const tripStats = useMemo(() => {
    const totalDist = trips.reduce(
      (sum, t) => sum + (t.distanceCovered || t.totalDistance || 0),
      0
    );
    const totalCost = trips.reduce((sum, t) => sum + t.totalFuelCost, 0);
    const totalLitres = trips.reduce((sum, t) => sum + t.totalFuelLitres, 0);
    const avgEconomy =
      totalLitres > 0 && totalDist > 0
        ? Number((totalDist / totalLitres).toFixed(1))
        : 0;

    return { totalDist, totalCost, totalLitres, avgEconomy };
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.fromLocation?.toLowerCase().includes(q) ||
        t.toLocation?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === 'ALL' || t.tripType.toUpperCase() === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [trips, searchQuery, selectedCategory]);

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

      // Compatibility fields
      startDate: departureDate,
      endDate: arrivalDate,
      totalDistance: liveDist,
      avgMileage: calcEco || midEco,
    });

    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Compass className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              N250 Highway Rides & Tours
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 font-mono">
            Digital Boarding Pass Ledger — Compare Instrument Cluster (MID) vs Actual Tank Refill economy.
          </p>
        </div>

        <AnimatedActionButton label="New Trip Entry" onClick={() => setIsModalOpen(true)} />
      </div>

      {/* ── SENIOR DEV KPI TELEMETRY SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
            Total Rides Tracked
          </span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
            {trips.length} <span className="text-xs font-normal text-slate-400">trips</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
            Total Distance Covered
          </span>
          <span className="text-xl font-black text-blue-600 font-mono mt-1 block">
            {tripStats.totalDist.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-400">km</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
            Avg Highway Economy
          </span>
          <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">
            {tripStats.avgEconomy > 0 ? `${tripStats.avgEconomy}` : '—'}{' '}
            <span className="text-xs font-normal text-slate-400">km/L</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
            Total Trip Fuel Spent
          </span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
            ₹{tripStats.totalCost.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── TOOLBAR & SEARCH / CATEGORY CHIPS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by route, city, notes..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['ALL', 'HIGHWAY', 'TOUR', 'COMMUTE', 'CITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap
                ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Digital Boarding Pass Tickets */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white border border-slate-200/85 rounded-3xl p-12 text-center">
          <Route className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {trips.length === 0 ? 'No trips logged yet' : 'No matching trips found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {trips.length === 0
              ? 'Log your weekend highway rides, road trips, or daily commutes to generate digital boarding pass tickets with mileage telemetry.'
              : 'Try clearing your search or category filter.'}
          </p>
          {trips.length === 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Create first trip →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTrips.map((trip) => (
            <TicketCard
              key={trip.id}
              trip={trip}
              onDeleteTrip={onDeleteTrip}
              isOwnerMode={isOwnerMode}
            />
          ))}
        </div>
      )}

      {/* New Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Log New Highway Trip / Ride
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Ride Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                  Ride Category
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value="Highway">Highway Tour</option>
                  <option value="Tour">Long Distance Ride</option>
                  <option value="Commute">Daily Commute</option>
                  <option value="City">City Ride</option>
                </select>
              </div>

              {/* From & To Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> From Origin
                  </label>
                  <input
                    type="text"
                    required
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="e.g. Bangalore"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="e.g. Mysore"
                  />
                </div>
              </div>

              {/* Departure Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-blue-600" /> Departure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-blue-600" /> Departure Time
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Arrival Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-blue-600" /> Arrival Date
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-blue-600" /> Arrival Time
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Odometer Readings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
                    Start Odo (km)
                  </label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) =>
                      setStartOdometer(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
                    End Odo (km)
                  </label>
                  <input
                    type="number"
                    value={endOdometer}
                    onChange={(e) =>
                      setEndOdometer(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live Distance Preview */}
              <div className="bg-blue-50/60 px-4 py-2.5 rounded-xl border border-blue-100 flex items-center justify-between text-xs font-mono">
                <span className="text-blue-700 font-medium">Calculated Trip Distance:</span>
                <span className="font-bold text-blue-900 text-sm">{liveDist} km</span>
              </div>

              {/* Fuel Cost & Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
                    Total Fuel Spent (₹)
                  </label>
                  <input
                    type="number"
                    value={totalFuelCost}
                    onChange={(e) =>
                      setTotalFuelCost(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
                    Fuel Consumed (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalFuelLitres}
                    onChange={(e) =>
                      setTotalFuelLitres(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fuel Economy Comparison (MID vs Actual) */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  Instrument Cluster (MID) Economy (km/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={avgFuelEconomy}
                  onChange={(e) =>
                    setAvgFuelEconomy(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm outline-none focus:border-blue-500"
                  placeholder="e.g. 48.5"
                />

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70 font-mono">
                  <span className="text-slate-500">Calculated Tank Economy:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {liveCalculatedEconomy > 0 ? `${liveCalculatedEconomy} km/L` : '—'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono">
                  Trip Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs outline-none focus:bg-white focus:border-blue-500"
                  placeholder="Route conditions, highway speed, weather notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                Save Digital Trip Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
