import { FuelLog, DashboardMetrics, GoogleSheetConfig, Trip } from '../types/fuel';

const STORAGE_KEY_LOGS = 'n250_fuel_logs_v2';
const STORAGE_KEY_TRIPS = 'n250_fuel_trips_v2';
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
    date: '2026-08-01T12:00:00.000Z',
    odometer: 2328.0,
    fuelAmount: 1.78,
    totalCost: 199.72,
    pricePerLitre: 112.20,
    isFullTank: false,
    tripType: 'City',
    stationName: 'IOCL Shetimal Prakriya Sahakari Limited',
    notes: 'roadside topup',
    distanceCalculated: 548.3,
    mileageCalculated: undefined,
    costPerKmCalculated: 0.36,
    synced: true,
  },
  {
    id: 'raw-13',
    date: '2026-08-01T14:00:00.000Z',
    odometer: 2328.0,
    fuelAmount: 12.09,
    totalCost: 1359.16,
    pricePerLitre: 112.42,
    isFullTank: true,
    tripType: 'City',
    stationName: 'Nayara Raj Petroleum',
    notes: '',
    distanceCalculated: 0,
    mileageCalculated: 39.51,
    costPerKmCalculated: undefined,
    synced: true,
  },
];

export const REAL_RAW_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    name: 'Initial Break-in & Reliance Mobility Run',
    tripType: 'Commute',
    startDate: '2026-05-24',
    endDate: '2026-06-04',
    startOdometer: 20.0,
    endOdometer: 268.0,
    totalDistance: 248.0,
    totalFuelCost: 1800.0,
    totalFuelLitres: 15.78,
    avgMileage: 47.15,
    notes: 'Engine break-in riding at 50-60 km/h',
  },
  {
    id: 'trip-2',
    name: 'Vijayshree Nayara Highway Stretch',
    tripType: 'Highway',
    startDate: '2026-06-04',
    endDate: '2026-06-08',
    startOdometer: 268.0,
    endOdometer: 502.0,
    totalDistance: 234.0,
    totalFuelCost: 1162.0,
    totalFuelLitres: 10.13,
    avgMileage: 48.05,
    notes: 'Smooth cruising on Nayara highway fuel',
  },
  {
    id: 'trip-3',
    name: '430 km Long Distance Highway Ride',
    tripType: 'Tour',
    startDate: '2026-06-13',
    endDate: '2026-06-22',
    startOdometer: 780.0,
    endOdometer: 1210.0,
    totalDistance: 430.0,
    totalFuelCost: 1269.87,
    totalFuelLitres: 11.266,
    avgMileage: 38.17,
    notes: 'High speed 85-95 km/h tour',
  },
  {
    id: 'trip-4',
    name: 'Konduskar Rajarampuri & Praveen Auto Run',
    tripType: 'City',
    startDate: '2026-06-22',
    endDate: '2026-07-16',
    startOdometer: 1210.0,
    endOdometer: 1779.7,
    totalDistance: 569.7,
    totalFuelCost: 2158.14,
    totalFuelLitres: 19.23,
    avgMileage: 29.63,
    notes: 'Mixed urban traffic and stop-and-go rides',
  },
  {
    id: 'trip-5',
    name: 'Shetimal & Raj Petroleum Long Haul',
    tripType: 'Commute',
    startDate: '2026-07-16',
    endDate: '2026-08-01',
    startOdometer: 1779.7,
    endOdometer: 2328.0,
    totalDistance: 548.3,
    totalFuelCost: 1558.88,
    totalFuelLitres: 13.87,
    avgMileage: 39.51,
    notes: 'Extended commute run with roadside top-up',
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

    const sorted = [...logs].sort(
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
