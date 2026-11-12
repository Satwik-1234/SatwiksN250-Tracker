'use client';

import React, { useState, useMemo } from 'react';
import { Compass, Calendar, Clock, MapPin, Gauge, X, Route } from 'lucide-react';
import { PageHeader, StatStrip, Chip, ChipRow, SearchInput, EmptyState } from '@/components/ui/Page';
import { Trip, TripType } from '@/types/fuel';
import { AnimatedActionButton } from '@/components/ui/AnimatedActionButton';
import { TicketCard } from '@/components/cards/TicketCard';

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
  React.useEffect(() => {
    const open = () => setIsModalOpen(true);
    window.addEventListener('n250:add', open);
    return () => window.removeEventListener('n250:add', open);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
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

  // Trip summary stats
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
    <div className="stagger space-y-5 md:space-y-6">
      <PageHeader
        title="Trips"
        subtitle="What the bike's display says against what you actually got."
        action={<AnimatedActionButton label="Add trip" onClick={() => setIsModalOpen(true)} />}
      />

      <StatStrip
        items={[
          { label: 'Rides', value: trips.length },
          { label: 'Distance', value: tripStats.totalDist.toLocaleString('en-IN'), unit: 'km' },
          { label: 'Average mileage', value: tripStats.avgEconomy > 0 ? tripStats.avgEconomy : '—', unit: 'km/L' },
          { label: 'Fuel spend', value: `₹${Math.round(tripStats.totalCost).toLocaleString('en-IN')}` },
        ]}
      />

      {/* Search and ride type */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search route, city, notes"
          className="md:w-80"
        />
        <ChipRow>
          {[
            ['ALL', 'All'],
            ['HIGHWAY', 'Highway'],
            ['TOUR', 'Tour'],
            ['COMMUTE', 'Commute'],
            ['CITY', 'City'],
          ].map(([id, label]) => (
            <Chip key={id} active={selectedCategory === id} onClick={() => setSelectedCategory(id)}>
              {label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* Trip Cards */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={Route}
          title={trips.length === 0 ? 'No trips yet' : 'No trips match'}
          body={
            trips.length === 0
              ? 'Add a ride to track its distance, mileage and fuel cost.'
              : 'Try a different search or ride type.'
          }
          action={
            trips.length === 0 ? (
              <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-secondary btn-sm">
                Add your first trip
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
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
          <div className="bg-surface border border-[var(--color-border)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-ink-1">
                  Log New Highway Trip / Ride
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-3 hover:text-ink-2 p-1.5 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Ride Type */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">
                  Ride Category
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-xs font-medium outline-none focus:bg-surface focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> From Origin
                  </label>
                  <input
                    type="text"
                    required
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-xs outline-none focus:bg-surface focus:border-blue-500 transition-all placeholder-[var(--color-text-3)]"
                    placeholder="Starting city"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-xs outline-none focus:bg-surface focus:border-blue-500 transition-all placeholder-[var(--color-text-3)]"
                    placeholder="Destination city"
                  />
                </div>
              </div>

              {/* Departure Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" /> Departure Date
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-[var(--color-border)] rounded-lg text-ink-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" /> Departure Time
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-[var(--color-border)] rounded-lg text-ink-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Arrival Date & Time */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" /> Arrival Date
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-[var(--color-border)] rounded-lg text-ink-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" /> Arrival Time
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface border border-[var(--color-border)] rounded-lg text-ink-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Odometer Readings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Start Odo (km)
                  </label>
                  <input
                    type="number"
                    value={startOdometer}
                    onChange={(e) =>
                      setStartOdometer(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-sm outline-none focus:bg-surface focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    End Odo (km)
                  </label>
                  <input
                    type="number"
                    value={endOdometer}
                    onChange={(e) =>
                      setEndOdometer(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-sm outline-none focus:bg-surface focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live Distance Preview */}
              <div className="bg-blue-50/60 px-4 py-2.5 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <span className="text-blue-700 font-medium">Calculated Trip Distance:</span>
                <span className="font-bold text-blue-900 text-sm">{liveDist} km</span>
              </div>

              {/* Fuel Cost & Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Total Fuel Spent (₹)
                  </label>
                  <input
                    type="number"
                    value={totalFuelCost}
                    onChange={(e) =>
                      setTotalFuelCost(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-sm outline-none focus:bg-surface focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-2 mb-1">
                    Fuel Consumed (L)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalFuelLitres}
                    onChange={(e) =>
                      setTotalFuelLitres(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-sm outline-none focus:bg-surface focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fuel Economy Comparison (MID vs Actual) */}
              <div className="p-4 bg-surface-2 border border-slate-200/80 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-ink-2 flex items-center gap-1.5">
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
                  className="w-full px-3 py-2 bg-surface border border-[var(--color-border)] rounded-xl text-ink-1 text-sm outline-none focus:border-blue-500"
                  placeholder="e.g. 48.5"
                />

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70">
                  <span className="text-ink-2">Calculated Tank Economy:</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {liveCalculatedEconomy > 0 ? `${liveCalculatedEconomy} km/L` : '—'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">
                  Trip Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-2 border border-[var(--color-border)] rounded-xl text-ink-1 text-xs outline-none focus:bg-surface focus:border-blue-500"
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
