import { FuelLog, DashboardMetrics, GoogleSheetConfig, Trip, ServiceLog, AccessoryGear, ChainLubeRecord, TyrePressureRecord, RiderCadence } from '../types/fuel';

const STORAGE_KEY_LOGS = 'n250_fuel_logs_v2';
const STORAGE_KEY_TRIPS = 'n250_fuel_trips_v2';
const STORAGE_KEY_SERVICES = 'n250_services_v2';
const STORAGE_KEY_ACCESSORIES = 'n250_accessories_v2';
const STORAGE_KEY_CHAIN_LUBE = 'n250_chain_lube_v2';
const STORAGE_KEY_TYRE_PRESSURE = 'n250_tyre_pressure_v2';
const STORAGE_KEY_RIDER_CADENCE = 'n250_rider_cadence_v2';
const STORAGE_KEY_CONFIG = 'n250_sheet_config_v2';

// PUBLIC GOOGLE SHEET CSV FEED FOR USER'S SHEET
export const DEFAULT_SHEET_ID = '1jgRFISJ-K5YQ3ApcxKd0GFojMvRJdrncicYSNJAjrOs';
export const PUBLIC_CSV_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/gviz/tq?tqx=out:csv`;

// EXACT RAW DATA PARSED FROM USER'S GOOGLE SHEET
export const REAL_RAW_LOGS: FuelLog[] = [
  {
    id: 'raw-1',
    date: '2026-05-24T10:00:00.000Z',
    odometer: 20.0,
    fuelAmount: 8.52,
    totalCost: 1000.0,
    pricePerLitre: 114.0,
    isFullTank: false,
    tripType: 'City',
    stationName: 'Jio-BP Reliance BP Mobility',
    notes: 'Opening fill',
    distanceCalculated: 0,
    mileageCalculated: 0,
    costPerKmCalculated: 0,
    synced: true,
  },
  {
    id: 'raw-2',
    date: '2026-05-24T18:00:00.000Z',
    odometer: 20.0,
    fuelAmount: 2.0,
    totalCost: 200.0,
    pricePerLitre: 114.0,
    isFullTank: true,
    tripType: 'City',
    stationName: 'Jio-BP Reliance BP Mobility',
    notes: 'Topped up same day',
    distanceCalculated: 0,
    mileageCalculated: 0,
    costPerKmCalculated: 0,
    synced: true,
  },
  {
    id: 'raw-3',
    date: '2026-06-04T12:00:00.000Z',
    odometer: 268.0,
    fuelAmount: 5.26,
    totalCost: 600.0,
    pricePerLitre: 114.5,
    isFullTank: true,
    tripType: 'Commute',
    stationName: 'Jio-BP Reliance BP Mobility',
    notes: 'Break-in completed',
    distanceCalculated: 248.0,
    mileageCalculated: 47.15,
    costPerKmCalculated: 2.42,
    synced: true,
  },
  {
    id: 'raw-4',
    date: '2026-06-05T09:30:00.000Z',
    odometer: 410.0,
    fuelAmount: 1.0,
    totalCost: 112.0,
    pricePerLitre: 112.0,
    isFullTank: false,
    tripType: 'City',
    stationName: 'IOCL Saraswati Petroleum',
    notes: 'Roadside top-up',
    distanceCalculated: 142.0,
    mileageCalculated: undefined,
    costPerKmCalculated: 0.79,
    synced: true,
  },
  {
    id: 'raw-5',
    date: '2026-06-08T14:15:00.000Z',
    odometer: 502.0,
    fuelAmount: 3.87,
    totalCost: 450.0,
    pricePerLitre: 116.0,
    isFullTank: true,
    tripType: 'Highway',
    stationName: 'Vijayshree Nyara Petroleum',
    notes: 'Highway run',
    distanceCalculated: 92.0,
    mileageCalculated: 48.05,
    costPerKmCalculated: 4.89,
    synced: true,
  },
  {
    id: 'raw-6',
    date: '2026-06-12T16:00:00.000Z',
    odometer: 610.0,
    fuelAmount: 3.5,
    totalCost: 400.0,
    pricePerLitre: 114.12,
    isFullTank: false,
    tripType: 'City',
    stationName: 'Jio-BP Yash Enterprises',
    notes: '',
    distanceCalculated: 108.0,
    mileageCalculated: undefined,
    costPerKmCalculated: 3.7,
    synced: true,
  },
  {
    id: 'raw-7',
    date: '2026-06-13T11:45:00.000Z',
    odometer: 780.0,
    fuelAmount: 5.69,
    totalCost: 650.0,
    pricePerLitre: 114.1,
    isFullTank: true,
    tripType: 'Commute',
    stationName: 'HPCL Raj Petroleum',
    notes: '',
    distanceCalculated: 170.0,
    mileageCalculated: 30.25,
    costPerKmCalculated: 3.82,
    synced: true,
  },
  {
    id: 'raw-8',
    date: '2026-06-22T08:30:00.000Z',
    odometer: 1210.0,
    fuelAmount: 11.266,
    totalCost: 1269.87,
    pricePerLitre: 112.71,
    isFullTank: true,
    tripType: 'Tour',
    stationName: 'Jio-BP Reliance BP Mobility',
    notes: 'Long weekend tour',
    distanceCalculated: 430.0,
    mileageCalculated: 38.17,
    costPerKmCalculated: 2.95,
    synced: true,
  },
  {
    id: 'raw-9',
    date: '2026-06-29T17:20:00.000Z',
    odometer: 1479.7,
    fuelAmount: 5.34,
    totalCost: 600.0,
    pricePerLitre: 112.18,
    isFullTank: false,
    tripType: 'Commute',
    stationName: 'IOCL Praveen Auto Centre',
    notes: '',
    distanceCalculated: 269.7,
    mileageCalculated: undefined,
    costPerKmCalculated: 2.22,
    synced: true,
  },
  {
    id: 'raw-10',
    date: '2026-07-13T19:10:00.000Z',
    odometer: 1540.0,
    fuelAmount: 1.07,
    totalCost: 120.0,
    pricePerLitre: 112.13,
    isFullTank: false,
    tripType: 'City',
    stationName: 'BPCL Konduskar Auto Center Rajarampuri',
    notes: '',
    distanceCalculated: 60.3,
    mileageCalculated: undefined,
    costPerKmCalculated: 1.99,
    synced: true,
  },
  {
    id: 'raw-11',
    date: '2026-07-16T15:00:00.000Z',
    odometer: 1779.7,
    fuelAmount: 12.82,
    totalCost: 1438.14,
    pricePerLitre: 112.13,
    isFullTank: true,
    tripType: 'Tour',
    stationName: 'IOCL Praveen Auto Centre',
    notes: '',
    distanceCalculated: 239.7,
    mileageCalculated: 29.63,
    costPerKmCalculated: 6.0,
    synced: true,
  },
  {
    id: 'raw-12',
    date: '2026-08-01T14:00:00.000Z',
    odometer: 2328.0,
    fuelAmount: 12.09,
    totalCost: 1359.16,
    pricePerLitre: 112.42,
    isFullTank: true,
    tripType: 'City',
    stationName: 'Nayara Raj Petroleum',
    notes: '',
    distanceCalculated: 548.3,
    mileageCalculated: 45.35,
    costPerKmCalculated: 2.48,
    synced: true,
  },
];

export const REAL_RAW_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    name: 'Home to Reliance BP Mobility',
    tripType: 'Commute',
    fromLocation: 'Home',
    toLocation: 'Reliance BP Mobility',
    departureDate: '2026-05-24',
    departureTime: '08:00',
    arrivalDate: '2026-06-04',
    arrivalTime: '19:00',
    startOdometer: 20.0,
    endOdometer: 268.0,
    distanceCovered: 248.0,
    totalFuelCost: 1800.0,
    totalFuelLitres: 15.78,
    avgFuelEconomy: 48.0,
    calculatedFuelEconomy: 47.15,
    notes: 'Engine break-in riding at 50-60 km/h',
    startDate: '2026-05-24',
    endDate: '2026-06-04',
    totalDistance: 248.0,
    avgMileage: 47.15,
  },
  {
    id: 'trip-2',
    name: 'Kolhapur to Vijayshree Nayara Highway Stretch',
    tripType: 'Highway',
    fromLocation: 'Kolhapur',
    toLocation: 'Nayara Highway',
    departureDate: '2026-06-04',
    departureTime: '06:30',
    arrivalDate: '2026-06-08',
    arrivalTime: '18:00',
    startOdometer: 268.0,
    endOdometer: 502.0,
    distanceCovered: 234.0,
    totalFuelCost: 1162.0,
    totalFuelLitres: 10.13,
    avgFuelEconomy: 49.2,
    calculatedFuelEconomy: 48.05,
    notes: 'Smooth cruising on Nayara highway fuel',
    startDate: '2026-06-04',
    endDate: '2026-06-08',
    totalDistance: 234.0,
    avgMileage: 48.05,
  },
  {
    id: 'trip-3',
    name: 'Kolhapur to Goa 430 km Long Distance Tour',
    tripType: 'Tour',
    fromLocation: 'Kolhapur',
    toLocation: 'Goa Coast',
    departureDate: '2026-06-13',
    departureTime: '05:45',
    arrivalDate: '2026-06-22',
    arrivalTime: '14:30',
    startOdometer: 780.0,
    endOdometer: 1210.0,
    distanceCovered: 430.0,
    totalFuelCost: 1269.87,
    totalFuelLitres: 11.266,
    avgFuelEconomy: 39.5,
    calculatedFuelEconomy: 38.17,
    notes: 'High speed 85-95 km/h tour with luggage',
    startDate: '2026-06-13',
    endDate: '2026-06-22',
    totalDistance: 430.0,
    avgMileage: 38.17,
  },
  {
    id: 'trip-4',
    name: 'Rajarampuri to Praveen Auto Run',
    tripType: 'City',
    fromLocation: 'Rajarampuri',
    toLocation: 'Praveen Auto',
    departureDate: '2026-06-22',
    departureTime: '10:00',
    arrivalDate: '2026-07-16',
    arrivalTime: '20:15',
    startOdometer: 1210.0,
    endOdometer: 1779.7,
    distanceCovered: 569.7,
    totalFuelCost: 2158.14,
    totalFuelLitres: 19.23,
    avgFuelEconomy: 31.0,
    calculatedFuelEconomy: 29.63,
    notes: 'Mixed urban traffic and stop-and-go rides',
    startDate: '2026-06-22',
    endDate: '2026-07-16',
    totalDistance: 569.7,
    avgMileage: 29.63,
  },
  {
    id: 'trip-5',
    name: 'Home to Raj Petroleum Long Haul',
    tripType: 'Commute',
    fromLocation: 'Home',
    toLocation: 'Raj Petroleum',
    departureDate: '2026-07-16',
    departureTime: '09:00',
    arrivalDate: '2026-08-01',
    arrivalTime: '19:30',
    startOdometer: 1779.7,
    endOdometer: 2328.0,
    distanceCovered: 548.3,
    totalFuelCost: 1359.16,
    totalFuelLitres: 12.09,
    avgFuelEconomy: 46.8,
    calculatedFuelEconomy: 45.35,
    notes: 'Extended commute run to Raj Petroleum',
    startDate: '2026-07-16',
    endDate: '2026-08-01',
    totalDistance: 548.3,
    avgMileage: 45.35,
  },
];

export const REAL_RAW_SERVICES: ServiceLog[] = [
  {
    id: 'adb3aa91-00e0-4490-a1f4-2f7c3eafdf23',
    date: '2026-07-25',
    odometer: 2110,
    serviceType: 'Other',
    serviceCenter: 'Priyanshi Washing Centre ',
    totalCost: 80,
    notes: 'The service was okish bike\nNo billing done Gpay ',
  },
  {
    id: 'fbafe115-7f9a-4c21-8e5f-fae12cde53b1',
    date: '2026-06-20',
    odometer: 1210,
    serviceType: 'Other',
    serviceCenter: 'Washing centre Karad ',
    totalCost: 80,
    notes: 'Oma took the bike and washed and returned to me ',
  },
  {
    id: 'a555d4f0-b90e-4d38-a0f5-fff9f6b4a8b9',
    date: '2026-06-13',
    odometer: 780,
    serviceType: 'Other',
    serviceCenter: 'Washing Centre Karad ',
    totalCost: 80,
    notes: 'Oma took the bike and washed and returned to me ',
  },
  {
    id: '8e5abf3f-872e-45f2-ab3c-a038ec00523e',
    date: '2026-06-12',
    odometer: 750,
    serviceType: 'Routine Service',
    serviceCenter: 'KALE BAJAJ',
    totalCost: 1076,
    notes: 'Frist Free Service on 750 km The chain was lubed so separate 100 rs were taken ',
  },
  {
    id: '93f2c744-7e2c-4d8a-a038-a6318ccf0181',
    date: '2026-08-01',
    odometer: 2328,
    serviceType: 'Other',
    serviceCenter: 'RAJ PETROLIUM ',
    totalCost: 30,
    notes: 'added the fuel additive in the fuel ',
  },
  {
    id: '4333e1e5-5979-4f78-b15a-cc50c9766bd0',
    date: '2026-08-09',
    odometer: 2640,
    serviceType: 'Other',
    serviceCenter: 'Oma service ',
    totalCost: 80,
    notes: 'Oma did the washing of bike in friends shop ',
  },
];

export const REAL_RAW_ACCESSORIES: AccessoryGear[] = [
  {
    id: '851bd92c-ccdc-4798-9e66-d295acee43b1',
    datePurchased: '2026-05-31',
    itemName: 'Turboracing USD FORK SEAL ',
    category: 'Cosmetic',
    brand: 'Turboracing ',
    cost: 291,
    notes: 'Good purchase the price was good and the product is also good just fits very tightly and hard to install ',
  },
  {
    id: '0e8bc06a-416f-43ca-a8cb-875926fa2f7b',
    datePurchased: '2026-05-28',
    itemName: 'Tyre valve cap ',
    category: 'Other',
    brand: 'AuTO ADDiCT',
    cost: 156,
    notes: "delivered in the good condition but it's not worthy as the tyre pressure monitor ",
  },
  {
    id: 'c5ae5b01-5c2a-41f0-ae67-f8e1a7eb2884',
    datePurchased: '2026-07-13',
    itemName: 'AXOR GATOR Full Gauntlet Gloves ',
    category: 'Gear',
    brand: 'AXOR ',
    cost: 2400,
    notes: 'Overall good frist gear purchase from bikers point 46 karad ',
  },
  {
    id: 'abda652c-f8dc-4da1-be1f-a7d231af43d8',
    datePurchased: '2026-06-25',
    itemName: 'OKS Chain Lube Spray ',
    category: 'Performance',
    brand: 'OKS',
    cost: 150,
    notes: "The quantity was 100 milliliters, but it didn't last for two chain lubes. Nevertheless, the quality is good, and I can tell by riding. ",
  },
  {
    id: '65ad5392-59fc-4253-a33f-f5ec8296d082',
    datePurchased: '2026-08-05',
    itemName: 'Amaron Battery ',
    category: 'Performance',
    brand: 'Amaron',
    cost: 2200,
    notes: 'The bike was running overnight, but the battery died in the morning. Since the Exide Warenty battery claim process takes a long time, I had to buy a new one on August 10. ',
  },
  {
    id: 'f4432843-73f6-4d2b-b46e-1b5619f94eba',
    datePurchased: '2026-08-02',
    itemName: 'MOTUL chain Lube ',
    category: 'Performance',
    brand: 'MOTUL',
    cost: 250,
    notes: 'Sticky than the Previous OKS chain Lube \nsprocket wasnt feeling quiet in operation in frist 50 km lets see ',
  },
  {
    id: 'a55fe693-4ba0-4902-af4c-1e46c7e1c9b1',
    datePurchased: '2026-08-25',
    itemName: 'MECHTEC 53 PCS 53 PCS Tool Belt',
    category: 'Other',
    brand: 'Mectec',
    cost: 1338,
    notes: 'Just okey purchase took too long time to deliver but worth will be decided by the ease ',
  },
];

export class StorageService {
  static getLogs(): FuelLog[] {
    if (typeof window === 'undefined') return REAL_RAW_LOGS;
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(REAL_RAW_LOGS));
      return REAL_RAW_LOGS;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed.length > 0 ? parsed : REAL_RAW_LOGS;
    } catch {
      return REAL_RAW_LOGS;
    }
  }

  static saveLogs(logs: FuelLog[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }

  static getTrips(): Trip[] {
    if (typeof window === 'undefined') return REAL_RAW_TRIPS;
    const data = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(REAL_RAW_TRIPS));
      return REAL_RAW_TRIPS;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed.length > 0 ? parsed : REAL_RAW_TRIPS;
    } catch {
      return REAL_RAW_TRIPS;
    }
  }

  static saveTrips(trips: Trip[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
  }

  static getServices(): ServiceLog[] {
    if (typeof window === 'undefined') return REAL_RAW_SERVICES;
    const data = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(REAL_RAW_SERVICES));
      return REAL_RAW_SERVICES;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed.length > 0 ? parsed : REAL_RAW_SERVICES;
    } catch {
      return REAL_RAW_SERVICES;
    }
  }

  static saveServices(services: ServiceLog[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
  }

  static getAccessories(): AccessoryGear[] {
    if (typeof window === 'undefined') return REAL_RAW_ACCESSORIES;
    const data = localStorage.getItem(STORAGE_KEY_ACCESSORIES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_ACCESSORIES, JSON.stringify(REAL_RAW_ACCESSORIES));
      return REAL_RAW_ACCESSORIES;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed.length > 0 ? parsed : REAL_RAW_ACCESSORIES;
    } catch {
      return REAL_RAW_ACCESSORIES;
    }
  }

  static saveAccessories(accessories: AccessoryGear[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_ACCESSORIES, JSON.stringify(accessories));
  }

  static getChainLube(): ChainLubeRecord {
    const defaultRecord: ChainLubeRecord = {
      lastLubeOdometer: 2328,
      lastLubeDate: '2026-08-02',
      lubeBrand: 'Motul Chain Lube',
      slackChecked: true,
      notes: 'Cleaned and lubricated with Motul spray, slack within 20-30 mm',
    };
    if (typeof window === 'undefined') return defaultRecord;
    const data = localStorage.getItem(STORAGE_KEY_CHAIN_LUBE);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_CHAIN_LUBE, JSON.stringify(defaultRecord));
      return defaultRecord;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultRecord;
    }
  }

  static saveChainLube(record: ChainLubeRecord): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CHAIN_LUBE, JSON.stringify(record));
  }

  static getTyrePressure(): TyrePressureRecord {
    const defaultRecord: TyrePressureRecord = {
      lastCheckedDate: '2026-09-10',
      frontPsi: 25,
      rearPsi: 28,
      isPillionMode: false,
      notes: 'Cold tyre pressure checked: 25 PSI Front / 28 PSI Rear (Solo)',
    };
    if (typeof window === 'undefined') return defaultRecord;
    const data = localStorage.getItem(STORAGE_KEY_TYRE_PRESSURE);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_TYRE_PRESSURE, JSON.stringify(defaultRecord));
      return defaultRecord;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultRecord;
    }
  }

  static saveTyrePressure(record: TyrePressureRecord): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TYRE_PRESSURE, JSON.stringify(record));
  }

  static getCadence(): RiderCadence {
    const defaultCadence: RiderCadence = {
      weeklyCommuteKm: 250,
      weekendRideKm: 140,
      notificationsEnabled: true,
    };
    if (typeof window === 'undefined') return defaultCadence;
    const data = localStorage.getItem(STORAGE_KEY_RIDER_CADENCE);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_RIDER_CADENCE, JSON.stringify(defaultCadence));
      return defaultCadence;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultCadence;
    }
  }

  static saveCadence(cadence: RiderCadence): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_RIDER_CADENCE, JSON.stringify(cadence));
  }

  static getConfig(): GoogleSheetConfig {
    if (typeof window === 'undefined') return { webAppUrl: '', autoSync: true };
    const data = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!data) {
      return {
        webAppUrl: '',
        autoSync: true,
      };
    }
    try {
      return JSON.parse(data);
    } catch {
      return { webAppUrl: '', autoSync: true };
    }
  }

  static saveConfig(config: GoogleSheetConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }

  /**
   * Recompute all derived fields (distance, mileage, costPerKm) from raw data.
   * This ensures consistent, correct calculations regardless of data source.
   * Uses the standard full-tank-to-full-tank method for mileage.
   */
  static recalculateDerivedFields(logs: FuelLog[]): FuelLog[] {
    if (!logs || logs.length === 0) return [];

    // Filter out false/duplicate Shetimal entries
    const cleanLogs = logs.filter(l => {
      const sName = (l.stationName || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      const isShetimal = 
        sName.includes('shetimal') || 
        notes.includes('shetimal') || 
        notes.includes('roadside topup') || 
        (l.fuelAmount === 1.78 && l.totalCost === 199.72);
      return !isShetimal;
    });

    const sorted = [...cleanLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let lastFullTankOdo: number | null = null;
    let fuelSinceLastFull = 0;

    return sorted.map((log, i) => {
      const prevLog = i > 0 ? sorted[i - 1] : null;

      // Distance from previous fill (any fill)
      const distanceCalculated = prevLog
        ? Number((log.odometer - prevLog.odometer).toFixed(1))
        : 0;

      // Accumulate fuel for full-tank-to-full-tank mileage
      fuelSinceLastFull += log.fuelAmount;

      let mileageCalculated: number | undefined = undefined;

      if (log.isFullTank) {
        if (lastFullTankOdo !== null) {
          const segmentDist = log.odometer - lastFullTankOdo;
          if (segmentDist > 0 && fuelSinceLastFull > 0) {
            mileageCalculated = Number((segmentDist / fuelSinceLastFull).toFixed(2));
          }
        }
        lastFullTankOdo = log.odometer;
        fuelSinceLastFull = 0;
      }

      // Cost per km (only meaningful when distance > 0)
      const costPerKmCalculated = distanceCalculated > 0
        ? Number((log.totalCost / distanceCalculated).toFixed(2))
        : undefined;

      return {
        ...log,
        distanceCalculated,
        mileageCalculated,
        costPerKmCalculated,
      };
    });
  }

  static calculateMetrics(logs: FuelLog[]): DashboardMetrics {
    if (!logs || logs.length === 0) {
      return {
        latestFuelPrice: 0,
        currentTripKm: 0,
        avgMileage: 0,
        avgFuelCost: 0,
        costPerKm: 0,
        totalSpent: 0,
        totalDistance: 0,
        totalLitres: 0,
        totalLogsCount: 0,
      };
    }

    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestLog = sorted[sorted.length - 1];
    const latestFuelPrice = latestLog ? latestLog.pricePerLitre : 112.13;

    let totalSpent = 0;
    let totalLitres = 0;

    sorted.forEach((l) => {
      totalSpent += l.totalCost;
      totalLitres += l.fuelAmount;
    });

    const firstOdo = sorted[0].odometer;
    const lastOdo = sorted[sorted.length - 1].odometer;
    const totalDistance = Math.max(0, lastOdo - firstOdo);

    // Proper full-tank-to-full-tank weighted mileage calculation
    // Walk through logs: accumulate fuel between full tanks, then compute segment mileage
    let lastFullTankOdo: number | null = null;
    let fuelSinceLastFull = 0;
    let totalMileageDistance = 0;
    let totalMileageFuel = 0;

    sorted.forEach((l) => {
      fuelSinceLastFull += l.fuelAmount;

      if (l.isFullTank) {
        if (lastFullTankOdo !== null) {
          const segmentDist = l.odometer - lastFullTankOdo;
          if (segmentDist > 0 && fuelSinceLastFull > 0) {
            totalMileageDistance += segmentDist;
            totalMileageFuel += fuelSinceLastFull;
          }
        }
        lastFullTankOdo = l.odometer;
        fuelSinceLastFull = 0;
      }
    });

    const avgMileage = totalMileageFuel > 0
      ? Number((totalMileageDistance / totalMileageFuel).toFixed(2))
      : (totalLitres > 0 ? Number((totalDistance / totalLitres).toFixed(2)) : 0);

    const avgFuelCost = logs.length > 0 ? Number((totalSpent / logs.length).toFixed(2)) : 0;
    const costPerKm = totalDistance > 0 ? Number((totalSpent / totalDistance).toFixed(2)) : 0;

    // Current Trip Distance (distance since the latest refill log)
    const currentTripKm = sorted.length > 1 
      ? (sorted[sorted.length - 1].distanceCalculated || Number((sorted[sorted.length - 1].odometer - sorted[sorted.length - 2].odometer).toFixed(1)))
      : 0;

    return {
      latestFuelPrice: Number(latestFuelPrice.toFixed(2)),
      currentTripKm,
      avgMileage,
      avgFuelCost,
      costPerKm,
      totalSpent: Math.round(totalSpent),
      totalDistance: Number(totalDistance.toFixed(1)),
      totalLitres: Number(totalLitres.toFixed(1)),
      totalLogsCount: logs.length,
    };
  }

  static async fetchFromPublicGoogleSheet(): Promise<FuelLog[] | null> {
    try {
      const res = await fetch(PUBLIC_CSV_URL);
      if (!res.ok) return null;
      const csvText = await res.text();

      const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) return null;

      const logs: FuelLog[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV row ignoring commas inside quotes
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 8) continue;

        const clean = matches.map((m) => m.replace(/^"|"$/g, '').replace(/₹/g, '').replace(/,/g, '').trim());

        const dateStr = clean[0]; // e.g. "24/05/2026"
        const brand = clean[2] || '';
        const station = clean[3] || brand;
        const odo = parseFloat(clean[4]);
        const fullTank = clean[5]?.toLowerCase().includes('yes') || false;
        const qty = parseFloat(clean[6]);
        const price = parseFloat(clean[7]);
        const cost = parseFloat(clean[8]);
        const dist = parseFloat(clean[9]) || 0;
        const mileage = parseFloat(clean[12]) || undefined;
        const costPerKm = parseFloat(clean[13]) || undefined;
        const notes = clean[16] || '';

        if (isNaN(odo) || isNaN(qty) || isNaN(cost)) continue;
        if (station.toLowerCase().includes('shetimal') || notes.toLowerCase().includes('roadside topup')) continue;

        // Parse date DD/MM/YYYY
        let dateIso = new Date().toISOString();
        if (dateStr && dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            dateIso = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
          }
        }

        logs.push({
          id: `sheet-${i}`,
          date: dateIso,
          odometer: odo,
          fuelAmount: qty,
          totalCost: cost,
          pricePerLitre: price || (qty > 0 ? cost / qty : 112),
          isFullTank: fullTank,
          tripType: fullTank ? 'Highway' : 'Commute',
          stationName: `${brand} ${station}`.trim(),
          notes,
          distanceCalculated: dist,
          mileageCalculated: mileage,
          costPerKmCalculated: costPerKm,
          synced: true,
        });
      }

      return logs.length > 0 ? logs : null;
    } catch (e) {
      console.error('Failed to fetch from public Google Sheet CSV:', e);
      return null;
    }
  }

  static async syncLogToGoogleSheet(log: FuelLog, webAppUrl: string): Promise<boolean> {
    if (!webAppUrl) return false;
    try {
      const payload = {
        action: 'addLog',
        id: log.id,
        date: new Date(log.date).toLocaleDateString('en-IN'),
        odometer: log.odometer,
        fuelAmount: log.fuelAmount,
        totalCost: log.totalCost,
        pricePerLitre: log.pricePerLitre,
        isFullTank: log.isFullTank ? 'Yes' : 'No',
        tripType: log.tripType,
        stationName: log.stationName || '',
        notes: log.notes || '',
        distance: log.distanceCalculated || 0,
        mileage: log.mileageCalculated || 0,
        costPerKm: log.costPerKmCalculated || 0,
      };

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return true;
    } catch (err) {
      console.error('Failed to sync to Google Sheet:', err);
      return false;
    }
  }

  static getGoogleAppsScriptCode(): string {
    return `// ==========================================
// N250 FUEL TRACKER - FREE GOOGLE APPS SCRIPT
// Copy & Paste into Extensions > Apps Script in your Google Sheet
// ==========================================

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date",
      "Time",
      "Brand",
      "Pump / Station Name",
      "Odometer (km)",
      "Full Tank?",
      "Qty Filled (L)",
      "Price/Litre (₹)",
      "Amount Paid (₹)",
      "Dist from Last Fill (km)",
      "Mileage (km/L)",
      "Cost/km (₹)",
      "Notes"
    ]);
  }
  
  try {
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.date,
      "",
      data.stationName,
      data.stationName,
      data.odometer,
      data.isFullTank,
      data.fuelAmount,
      data.pricePerLitre,
      data.totalCost,
      data.distance,
      data.mileage,
      data.costPerKm,
      data.notes
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("N250 Fuel Tracker API is Online!");
}`;
  }
}
