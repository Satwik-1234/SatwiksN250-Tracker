import { FuelLog, DashboardMetrics, GoogleSheetConfig, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '../types/fuel';
import { averageMileage, segmentCostPerKm, sortLogsByDate, deduplicateLogs } from '../lib/metrics';

const STORAGE_KEY_LOGS = 'n250_fuel_logs_v2';
const STORAGE_KEY_TRIPS = 'n250_fuel_trips_v2';
const STORAGE_KEY_SERVICES = 'n250_services_v2';
const STORAGE_KEY_ACCESSORIES = 'n250_accessories_v2';
const STORAGE_KEY_CHAIN_LUBE = 'n250_chain_lube_v2';
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
    brand: 'Jio-BP',
    stationName: 'Reliance BP Mobility',
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
    brand: 'Jio-BP',
    stationName: 'Reliance BP Mobility',
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
    brand: 'Jio-BP',
    stationName: 'Reliance BP Mobility',
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
    brand: 'IOCL',
    stationName: 'Saraswati Petroleum',
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
    brand: 'Nayara',
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
    brand: 'Jio-BP',
    stationName: 'Yash Enterprises',
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
    brand: 'HPCL',
    stationName: 'Raj Petroleum',
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
    brand: 'Jio-BP',
    stationName: 'Reliance BP Mobility',
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
    brand: 'IOCL',
    stationName: 'Praveen Auto Centre',
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
    brand: 'BPCL',
    stationName: 'Konduskar Auto Center Rajarampuri',
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
    brand: 'IOCL',
    stationName: 'Praveen Auto Centre',
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
    brand: 'Nayara',
    stationName: 'Raj Petroleum',
    notes: '',
    distanceCalculated: 548.3,
    mileageCalculated: 45.35,
    costPerKmCalculated: 2.48,
    synced: true,
  },
  {
    id: 'raw-13',
    date: '2026-08-14T10:00:00.000Z',
    odometer: 2846.0,
    fuelAmount: 13.86,
    totalCost: 1559.00,
    pricePerLitre: 112.48,
    isFullTank: true,
    tripType: 'City',
    brand: 'Nayara',
    stationName: 'Raj Petrolium',
    notes: '',
    distanceCalculated: 518.0,
    mileageCalculated: 37.37,
    costPerKmCalculated: 3.01,
    synced: true,
  },
  {
    id: 'raw-14',
    date: '2026-08-28T10:00:00.000Z',
    odometer: 3376.0,
    fuelAmount: 13.87,
    totalCost: 1559.95,
    pricePerLitre: 112.47,
    isFullTank: true,
    tripType: 'City',
    brand: 'Jio-BP',
    stationName: 'Reliance BP Mobility limited karad',
    notes: '',
    distanceCalculated: 530.0,
    mileageCalculated: 38.21,
    costPerKmCalculated: 2.94,
    synced: true,
  },
  {
    id: 'raw-15',
    date: '2026-09-07T10:00:00.000Z',
    odometer: 3793.0,
    fuelAmount: 4.46,
    totalCost: 500.00,
    pricePerLitre: 112.11,
    isFullTank: false,
    tripType: 'City',
    brand: 'Jio-BP',
    stationName: 'Yash Enterprises',
    notes: '',
    distanceCalculated: 417.0,
    mileageCalculated: undefined,
    costPerKmCalculated: 1.20,
    synced: true,
  },
  {
    id: 'raw-16',
    date: '2026-09-16T10:00:00.000Z',
    odometer: 4180.0,
    fuelAmount: 10.00,
    totalCost: 1123.00,
    pricePerLitre: 112.30,
    isFullTank: true,
    tripType: 'City',
    brand: 'Jio-BP',
    stationName: 'Yash Enterprises',
    notes: '',
    distanceCalculated: 387.0,
    mileageCalculated: 55.61,
    costPerKmCalculated: 2.90,
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically sanitize and deduplicate so corrupted/repeated entries in localStorage are cleaned
        const deduped = deduplicateLogs(parsed);
        if (deduped.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(deduped));
        }
        return deduped;
      }
      return REAL_RAW_LOGS;
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

    // Filter out false/duplicate Shetimal entries (by name/notes only —
    // never by exact amount, which could drop a legitimate identical fill)
    const cleanLogs = logs.filter(l => {
      const sName = (l.stationName || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      const isShetimal = 
        sName.includes('shetimal') || 
        notes.includes('shetimal') || 
        notes.includes('roadside topup');
      return !isShetimal;
    });

    const dedupedLogs = deduplicateLogs(cleanLogs);

    const sorted = [...dedupedLogs].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });

    let lastFullTankOdo: number | null = null;
    let fuelSinceLastFull = 0;

    return sorted.map((log, i) => {
      const prevLog = i > 0 ? sorted[i - 1] : null;

      // Distance from previous fill (any fill)
      const curOdo = Number(log.odometer) || 0;
      const prevOdo = prevLog ? (Number(prevLog.odometer) || 0) : 0;
      const distanceCalculated = prevLog
        ? Number((curOdo - prevOdo).toFixed(1))
        : 0;

      const fuelAmt = Number(log.fuelAmount) || 0;
      const costAmt = Number(log.totalCost) || 0;

      // Accumulate fuel for full-tank-to-full-tank mileage
      fuelSinceLastFull += fuelAmt;

      let mileageCalculated: number | undefined = undefined;

      if (log.isFullTank) {
        if (lastFullTankOdo !== null) {
          const segmentDist = curOdo - lastFullTankOdo;
          if (segmentDist > 0 && fuelSinceLastFull > 0) {
            mileageCalculated = Number((segmentDist / fuelSinceLastFull).toFixed(2));
          }
        }
        lastFullTankOdo = curOdo;
        fuelSinceLastFull = 0;
      }

      // Cost per km (only meaningful when distance > 0)
      const costPerKmCalculated = distanceCalculated > 0
        ? Number((costAmt / distanceCalculated).toFixed(2))
        : undefined;

      return {
        ...log,
        odometer: curOdo,
        fuelAmount: fuelAmt,
        totalCost: costAmt,
        pricePerLitre: Number(log.pricePerLitre) || 0,
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
        avgCostPerFill: 0,
        costPerKm: 0,
        totalSpent: 0,
        totalDistance: 0,
        totalLitres: 0,
        totalLogsCount: 0,
      };
    }

    const sorted = sortLogsByDate(logs);

    const latestLog = sorted[sorted.length - 1];
    const latestFuelPrice = latestLog && Number(latestLog.pricePerLitre) > 0 ? Number(latestLog.pricePerLitre) : 112.13;

    let totalSpent = 0;
    let totalLitres = 0;

    sorted.forEach((l) => {
      totalSpent += Number(l.totalCost) || 0;
      totalLitres += Number(l.fuelAmount) || 0;
    });

    const firstOdo = Number(sorted[0].odometer) || 0;
    const lastOdo = Number(sorted[sorted.length - 1].odometer) || 0;
    const totalDistance = Math.max(0, lastOdo - firstOdo);

    // Fuel-weighted full-tank-to-full-tank average (0 until a segment closes)
    const avgMileage = averageMileage(sorted);

    const avgCostPerFill = logs.length > 0 ? Number((totalSpent / logs.length).toFixed(2)) : 0;
    // Segment-based: excludes the opening fill bought before the measured span
    const costPerKm = segmentCostPerKm(sorted);

    // Current Trip Distance (distance since the latest refill log)
    const currentTripKm = sorted.length > 1 
      ? (sorted[sorted.length - 1].distanceCalculated || Number(((Number(sorted[sorted.length - 1].odometer) || 0) - (Number(sorted[sorted.length - 2].odometer) || 0)).toFixed(1)))
      : 0;

    return {
      latestFuelPrice: Number((latestFuelPrice || 112.13).toFixed(2)),
      currentTripKm: isNaN(currentTripKm) ? 0 : currentTripKm,
      avgMileage: isNaN(avgMileage) ? 0 : avgMileage,
      avgCostPerFill: isNaN(avgCostPerFill) ? 0 : avgCostPerFill,
      costPerKm: isNaN(costPerKm) ? 0 : costPerKm,
      totalSpent: Math.round(totalSpent || 0),
      totalDistance: Number((totalDistance || 0).toFixed(1)),
      totalLitres: Number((totalLitres || 0).toFixed(1)),
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
          brand: brand.trim() || undefined,
          stationName: station.trim(),
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

  static getGoogleAppsScriptCode(): string {
    return `// ==========================================
// N250 FUEL TRACKER - GOOGLE APPS SCRIPT WEBHOOK API v2
// Copy & Paste into Extensions > Apps Script in your Google Sheet
// Deploy: Deploy > New deployment > Web app > Execute as: Me > Access: Anyone
// ==========================================

var TABS = [
  {
    key: 'fuelLogs',
    name: 'Fuel Logs',
    headers: ['ID', 'Date', 'Time', 'Brand', 'Pump / Station', 'Odometer (km)', 'Full Tank?', 'Fuel (L)', 'Price/L (Rs)', 'Total (Rs)', 'Distance (km)', 'Mileage (km/L)', 'Cost/km (Rs)', 'Trip Type', 'Fuel Bars', 'Notes']
  },
  {
    key: 'trips',
    name: 'Trips',
    headers: ['ID', 'Name', 'Type', 'From', 'To', 'Departure Date', 'Departure Time', 'Arrival Date', 'Arrival Time', 'Start Odo (km)', 'End Odo (km)', 'Distance (km)', 'Fuel Cost (Rs)', 'Fuel (L)', 'MID km/L', 'Calc km/L', 'Notes']
  },
  {
    key: 'services',
    name: 'Service Logs',
    headers: ['ID', 'Date', 'Odometer (km)', 'Service Type', 'Service Center', 'Cost (Rs)', 'Notes', 'Document URL']
  },
  {
    key: 'accessories',
    name: 'Accessories',
    headers: ['ID', 'Purchase Date', 'Item', 'Category', 'Brand', 'Cost (Rs)', 'Notes', 'Photo URL']
  },
  {
    key: 'chainLube',
    name: 'Chain Care',
    headers: ['Last Lube Date', 'Last Lube Odo (km)', 'Lube Brand', 'Slack Checked', 'Notes']
  }
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getTab_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function formatTime_(dateStr) {
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm');
  } catch (err) {
    return '';
  }
}

function formatDate_(dateStr) {
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr || '');
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  } catch (err) {
    return String(dateStr || '');
  }
}

function fuelRow_(l) {
  return [
    l.id || '', formatDate_(l.date), formatTime_(l.date), l.brand || '', l.stationName || '',
    Number(l.odometer || 0), l.isFullTank ? 'Yes' : 'No', Number(l.fuelAmount || 0),
    Number(l.pricePerLitre || 0), Number(l.totalCost || 0),
    l.distance === '' || l.distance === undefined ? '' : Number(l.distance),
    l.mileage === '' || l.mileage === undefined ? '' : Number(l.mileage),
    l.costPerKm === '' || l.costPerKm === undefined ? '' : Number(l.costPerKm),
    l.tripType || '', l.fuelBars === '' || l.fuelBars === undefined ? '' : Number(l.fuelBars),
    l.notes || ''
  ];
}

function tripRow_(t) {
  return [
    t.id || '', t.name || '', t.tripType || '', t.fromLocation || '', t.toLocation || '',
    formatDate_(t.departureDate), t.departureTime || '', formatDate_(t.arrivalDate), t.arrivalTime || '',
    Number(t.startOdometer || 0), t.endOdometer === '' || t.endOdometer === undefined ? '' : Number(t.endOdometer),
    t.distanceCovered === '' || t.distanceCovered === undefined ? '' : Number(t.distanceCovered),
    Number(t.totalFuelCost || 0), Number(t.totalFuelLitres || 0),
    t.avgFuelEconomy === '' || t.avgFuelEconomy === undefined ? '' : Number(t.avgFuelEconomy),
    t.calculatedFuelEconomy === '' || t.calculatedFuelEconomy === undefined ? '' : Number(t.calculatedFuelEconomy),
    t.notes || ''
  ];
}

function serviceRow_(s) {
  return [s.id || '', formatDate_(s.date), Number(s.odometer || 0), s.serviceType || '', s.serviceCenter || '', Number(s.totalCost || 0), s.notes || '', s.documentUrl || ''];
}

function accessoryRow_(a) {
  return [a.id || '', formatDate_(a.datePurchased), a.itemName || '', a.category || '', a.brand || '', Number(a.cost || 0), a.notes || '', a.photoUrl || ''];
}

function chainRow_(c) {
  if (!c) return [];
  return [formatDate_(c.lastLubeDate), Number(c.lastLubeOdometer || 0), c.lubeBrand || '', c.slackChecked ? 'Yes' : 'No', c.notes || ''];
}

function writeTab_(ss, tab, rows) {
  var sheet = getTab_(ss, tab.name);
  // Clear previous content (full-state replace => idempotent, no duplicates)
  if (sheet.getLastRow() > 0) {
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearContent();
  }
  var values = [tab.headers].concat(rows);
  sheet.getRange(1, 1, values.length, tab.headers.length).setValues(values);
  sheet.setFrozenRows(1);
  return rows.length;
}

function handleReplaceAll_(ss, entities) {
  var written = {};
  entities = entities || {};
  for (var i = 0; i < TABS.length; i++) {
    var tab = TABS[i];
    var rows = [];
    if (tab.key === 'fuelLogs') {
      rows = (entities.fuelLogs || []).map(fuelRow_);
    } else if (tab.key === 'trips') {
      rows = (entities.trips || []).map(tripRow_);
    } else if (tab.key === 'services') {
      rows = (entities.services || []).map(serviceRow_);
    } else if (tab.key === 'accessories') {
      rows = (entities.accessories || []).map(accessoryRow_);
    } else if (tab.key === 'chainLube') {
      var c = entities.chainLube;
      rows = c ? [chainRow_(c)] : [];
    }
    written[tab.name] = writeTab_(ss, tab, rows);
  }
  return written;
}

// Legacy single-row append (kept so older deployed scripts still work)
function handleAddLog_(ss, data) {
  var sheet = ss.getSheetByName('Fuel Logs') || ss.getSheetByName('Fuel') || ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    writeTab_(ss, TABS[0], []);
  }
  sheet.appendRow(fuelRow_(data));
  return { appended: 1 };
}

function doGet() {
  return json_({ status: 'online', message: 'N250 Tracker Webhook API v2 active.', timestamp: new Date().toISOString() });
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    if (data.action === 'replaceAll') {
      var written = handleReplaceAll_(ss, data.entities);
      return json_({ status: 'success', ok: true, message: 'All tabs rewritten', rows: written, syncedAt: data.syncedAt || '' });
    }

    if (data.action === 'addLog') {
      handleAddLog_(ss, data);
      return json_({ status: 'success', ok: true, message: 'Fuel log appended' });
    }

    return json_({ status: 'error', ok: false, message: 'Unknown action: ' + (data.action || '(none)') });
  } catch (error) {
    return json_({ status: 'error', ok: false, message: error.toString() });
  }
}`;
  }
}
