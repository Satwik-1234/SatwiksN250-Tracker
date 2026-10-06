import { FuelLog, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '@/types/fuel';

/**
 * Full-state Google Sheets sync.
 *
 * Every push sends ALL entities in a single POST; the Apps Script then
 * clears and rewrites each tab (idempotent — edits and deletes propagate,
 * no duplicate rows). Responses are read (cors) so failures are visible;
 * falls back to no-cors for legacy deployments where CORS is unavailable.
 */

export interface SheetSyncEntities {
  fuelLogs: FuelLog[];
  trips: Trip[];
  services: ServiceLog[];
  accessories: AccessoryGear[];
  chainLube: ChainLubeRecord | null;
}

export interface SheetSyncResult {
  ok: boolean;
  verified: boolean; // true only when the Apps Script response was readable
  message: string;
  syncedAt: string;
  counts?: Record<string, number>;
}

export const SHEET_SYNC_PAYLOAD_VERSION = 2;

export function buildFullStatePayload(entities: SheetSyncEntities) {
  return {
    action: 'replaceAll',
    version: SHEET_SYNC_PAYLOAD_VERSION,
    syncedAt: new Date().toISOString(),
    entities: {
      fuelLogs: (entities.fuelLogs || []).map((l) => ({
        id: l.id,
        date: l.date,
        odometer: l.odometer,
        fuelAmount: l.fuelAmount,
        totalCost: l.totalCost,
        pricePerLitre: l.pricePerLitre,
        isFullTank: !!l.isFullTank,
        tripType: l.tripType,
        brand: l.brand || '',
        stationName: l.stationName || '',
        fuelBars: l.fuelBars ?? '',
        notes: l.notes || '',
        distance: l.distanceCalculated ?? '',
        mileage: l.mileageCalculated ?? '',
        costPerKm: l.costPerKmCalculated ?? '',
      })),
      trips: (entities.trips || []).map((t) => ({
        id: t.id,
        name: t.name,
        tripType: t.tripType,
        fromLocation: t.fromLocation || '',
        toLocation: t.toLocation || '',
        departureDate: t.departureDate || '',
        departureTime: t.departureTime || '',
        arrivalDate: t.arrivalDate || '',
        arrivalTime: t.arrivalTime || '',
        startOdometer: t.startOdometer,
        endOdometer: t.endOdometer ?? '',
        distanceCovered: t.distanceCovered ?? t.totalDistance ?? '',
        totalFuelCost: t.totalFuelCost,
        totalFuelLitres: t.totalFuelLitres,
        avgFuelEconomy: t.avgFuelEconomy ?? '',
        calculatedFuelEconomy: t.calculatedFuelEconomy ?? '',
        notes: t.notes || '',
      })),
      services: (entities.services || []).map((s) => ({
        id: s.id,
        date: s.date,
        odometer: s.odometer,
        serviceType: s.serviceType,
        serviceCenter: s.serviceCenter || '',
        totalCost: s.totalCost,
        notes: s.notes || '',
        documentUrl: s.documentUrl || '',
      })),
      accessories: (entities.accessories || []).map((a) => ({
        id: a.id,
        datePurchased: a.datePurchased,
        itemName: a.itemName,
        category: a.category,
        brand: a.brand || '',
        cost: a.cost,
        notes: a.notes || '',
        photoUrl: a.photoUrl || '',
      })),
      chainLube: entities.chainLube
        ? {
            lastLubeOdometer: entities.chainLube.lastLubeOdometer,
            lastLubeDate: entities.chainLube.lastLubeDate,
            lubeBrand: entities.chainLube.lubeBrand,
            slackChecked: !!entities.chainLube.slackChecked,
            notes: entities.chainLube.notes || '',
          }
        : null,
    },
  };
}

export async function pushFullStateToSheet(
  webAppUrl: string,
  entities: SheetSyncEntities
): Promise<SheetSyncResult> {
  const syncedAt = new Date().toISOString();
  if (!webAppUrl) {
    return { ok: false, verified: false, message: 'No Google Sheet web app URL configured', syncedAt };
  }

  const payload = buildFullStatePayload(entities);
  const counts = {
    fuelLogs: entities.fuelLogs?.length || 0,
    trips: entities.trips?.length || 0,
    services: entities.services?.length || 0,
    accessories: entities.accessories?.length || 0,
    chainLube: entities.chainLube ? 1 : 0,
  };

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    // Readable response → we know the Apps Script actually ran
    try {
      const json = await res.json();
      if (json && (json.status === 'success' || json.ok === true)) {
        return {
          ok: true,
          verified: true,
          message: json.message || 'Sheet rewritten',
          syncedAt,
          counts,
        };
      }
      return {
        ok: false,
        verified: true,
        message: json?.message || `Sheet script returned status ${res.status}`,
        syncedAt,
        counts,
      };
    } catch {
      // Non-JSON response (e.g. HTML error page)
      if (res.ok) {
        return { ok: true, verified: true, message: 'Sheet updated', syncedAt, counts };
      }
      return {
        ok: false,
        verified: true,
        message: `Sheet endpoint returned ${res.status}`,
        syncedAt,
        counts,
      };
    }
  } catch (err) {
    // CORS unavailable (older deployment) → deliver blindly, but say so
    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      return {
        ok: true,
        verified: false,
        message: 'Sent (response not verifiable — redeploy the Apps Script for full status)',
        syncedAt,
        counts,
      };
    } catch {
      return {
        ok: false,
        verified: false,
        message: `Sheet sync failed: ${err instanceof Error ? err.message : String(err)}`,
        syncedAt,
        counts,
      };
    }
  }
}
