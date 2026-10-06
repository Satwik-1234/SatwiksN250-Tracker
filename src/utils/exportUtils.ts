/**
 * CSV builders + local file downloads for every tracker entity.
 * Shared by the browser (Export buttons) and /api/sync/github (repo exports/).
 */
import { FuelLog, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '@/types/fuel';
import { toCsv, downloadCsv } from '@/lib/csv';

const day = (value: string | undefined | null): string => (value ? String(value).slice(0, 10) : '');

export function fuelLogsToCsv(logs: FuelLog[]): string {
  return toCsv(
    [
      'ID', 'Date', 'Odometer (km)', 'Distance (km)', 'Brand', 'Station',
      'Fuel Bars', 'Fuel (L)', 'Cost (INR)', 'Rate (INR/L)', 'Mileage (km/L)',
      'Cost/km (INR)', 'Full Tank', 'Trip Type', 'Notes',
    ],
    logs.map((l) => [
      l.id,
      day(l.date),
      l.odometer,
      l.distanceCalculated ?? '',
      l.brand || '',
      l.stationName || '',
      l.fuelBars ?? '',
      l.fuelAmount,
      l.totalCost,
      l.pricePerLitre,
      l.mileageCalculated ?? '',
      l.costPerKmCalculated ?? '',
      l.isFullTank ? 'Yes' : 'No',
      l.tripType,
      l.notes || '',
    ])
  );
}

export function tripsToCsv(trips: Trip[]): string {
  return toCsv(
    [
      'ID', 'Name', 'Type', 'From', 'To', 'Departure', 'Arrival',
      'Start Odo (km)', 'End Odo (km)', 'Distance (km)', 'Fuel Cost (INR)',
      'Fuel (L)', 'MID km/L', 'Calc km/L', 'Notes',
    ],
    trips.map((t) => [
      t.id,
      t.name,
      t.tripType,
      t.fromLocation || '',
      t.toLocation || '',
      [t.departureDate, t.departureTime].filter(Boolean).join(' '),
      [t.arrivalDate, t.arrivalTime].filter(Boolean).join(' '),
      t.startOdometer,
      t.endOdometer ?? '',
      t.distanceCovered ?? '',
      t.totalFuelCost,
      t.totalFuelLitres,
      t.avgFuelEconomy ?? '',
      t.calculatedFuelEconomy ?? '',
      t.notes || '',
    ])
  );
}

export function serviceLogsToCsv(services: ServiceLog[]): string {
  return toCsv(
    ['ID', 'Date', 'Odometer (km)', 'Service Type', 'Service Center', 'Cost (INR)', 'Notes', 'Document URL'],
    services.map((s) => [
      s.id,
      day(s.date),
      s.odometer,
      s.serviceType,
      s.serviceCenter || '',
      s.totalCost,
      s.notes || '',
      s.documentUrl || '',
    ])
  );
}

export function accessoriesToCsv(accessories: AccessoryGear[]): string {
  return toCsv(
    ['ID', 'Purchase Date', 'Item', 'Category', 'Brand', 'Cost (INR)', 'Notes', 'Photo URL'],
    accessories.map((a) => [
      a.id,
      day(a.datePurchased),
      a.itemName,
      a.category,
      a.brand || '',
      a.cost,
      a.notes || '',
      a.photoUrl || '',
    ])
  );
}

export interface FullBackupEntities {
  logs: FuelLog[];
  trips: Trip[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  chainLube: ChainLubeRecord | null;
}

export function buildFullBackup(entities: FullBackupEntities): string {
  return (
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: "Satwik's N250 Tracker",
        counts: {
          fuelLogs: entities.logs.length,
          trips: entities.trips.length,
          services: entities.services.length,
          accessories: entities.accessories.length,
          chainLube: entities.chainLube ? 1 : 0,
        },
        ...entities,
      },
      null,
      2
    ) + '\n'
  );
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function downloadFuelCsv(logs: FuelLog[]): void {
  downloadCsv(`N250_Fuel_Telemetry_${stamp()}.csv`, fuelLogsToCsv(logs));
}

export function downloadTripsCsv(trips: Trip[]): void {
  downloadCsv(`N250_Trips_${stamp()}.csv`, tripsToCsv(trips));
}

export function downloadServicesCsv(services: ServiceLog[]): void {
  downloadCsv(`N250_Services_${stamp()}.csv`, serviceLogsToCsv(services));
}

export function downloadAccessoriesCsv(accessories: AccessoryGear[]): void {
  downloadCsv(`N250_Accessories_${stamp()}.csv`, accessoriesToCsv(accessories));
}

export function downloadFullBackup(entities: FullBackupEntities): void {
  const blob = new Blob([buildFullBackup(entities)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `N250_Full_Backup_${stamp()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
