export type TripType = 'Commute' | 'Highway' | 'City' | 'Tour';

export interface FuelLog {
  id: string;
  date: string; // ISO string
  odometer: number; // km
  fuelAmount: number; // Litres
  totalCost: number; // ₹
  pricePerLitre: number; // ₹/L
  isFullTank: boolean;
  tripType: TripType;
  stationName?: string;
  notes?: string;
  distanceCalculated?: number; // km since last log
  mileageCalculated?: number; // km/L for this refill
  costPerKmCalculated?: number; // ₹/km
  synced: boolean;
}

export interface Trip {
  id: string;
  name: string;
  tripType: TripType;
  startDate: string;
  endDate?: string;
  startOdometer: number;
  endOdometer?: number;
  totalDistance?: number;
  totalFuelCost: number;
  totalFuelLitres: number;
  avgMileage?: number;
  notes?: string;
}

export interface DashboardMetrics {
  latestFuelPrice: number;
  currentTripKm: number;
  avgMileage: number;
  avgFuelCost: number;
  costPerKm: number;
  totalSpent: number;
  totalDistance: number;
  totalLitres: number;
  totalLogsCount: number;
}

export interface GoogleSheetConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface ServiceLog {
  id: string;
  date: string; // ISO
  odometer: number;
  serviceType: string;
  serviceCenter?: string;
  totalCost: number;
  notes?: string;
  documentUrl?: string;
}

export interface AccessoryGear {
  id: string;
  datePurchased: string; // ISO
  itemName: string;
  category: string;
  brand?: string;
  cost: number;
  notes?: string;
  photoUrl?: string;
}
