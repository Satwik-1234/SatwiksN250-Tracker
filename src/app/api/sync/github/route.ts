import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { commitFilesToGitHub, GitHubFile } from '@/lib/githubCommit';
import {
  fuelLogsToCsv,
  tripsToCsv,
  serviceLogsToCsv,
  accessoriesToCsv,
} from '@/utils/exportUtils';
import { FuelLog, Trip, ServiceLog, AccessoryGear, ChainLubeRecord } from '@/types/fuel';

export const dynamic = 'force-dynamic';

interface SyncEntities {
  fuelLogs?: FuelLog[];
  trips?: Trip[];
  services?: ServiceLog[];
  accessories?: AccessoryGear[];
  chainLube?: ChainLubeRecord | null;
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GITHUB_TOKEN),
    repo: process.env.GITHUB_REPO || 'Satwik-1234/SatwiksN250-Tracker',
    branch: process.env.GITHUB_BRANCH || '(default)',
  });
}

async function readFromDb(): Promise<SyncEntities | null> {
  const connected = await isDbConnected();
  if (!connected) return null;

  const [fuelRes, tripRes, svcRes, accRes] = await Promise.all([
    query(`
      SELECT id, date, odometer, fuel_amount AS "fuelAmount", total_cost AS "totalCost",
        price_per_litre AS "pricePerLitre", is_full_tank AS "isFullTank", trip_type AS "tripType",
        brand, station_name AS "stationName", fuel_bars AS "fuelBars", notes,
        distance_calculated AS "distanceCalculated", mileage_calculated AS "mileageCalculated",
        cost_per_km_calculated AS "costPerKmCalculated"
      FROM fuel_logs ORDER BY date ASC, odometer ASC;
    `),
    query(`
      SELECT id, name, trip_type AS "tripType", COALESCE(from_location, 'Home') AS "fromLocation",
        COALESCE(to_location, name) AS "toLocation",
        COALESCE(departure_date::text, start_date::text) AS "departureDate",
        departure_time::text AS "departureTime",
        COALESCE(arrival_date::text, end_date::text) AS "arrivalDate",
        arrival_time::text AS "arrivalTime",
        start_odometer AS "startOdometer", end_odometer AS "endOdometer",
        COALESCE(distance_covered, total_distance, 0) AS "distanceCovered",
        total_fuel_cost AS "totalFuelCost", total_fuel_litres AS "totalFuelLitres",
        COALESCE(avg_fuel_economy, avg_mileage) AS "avgFuelEconomy",
        calculated_fuel_economy AS "calculatedFuelEconomy", notes
      FROM trips ORDER BY COALESCE(departure_date, start_date) ASC;
    `),
    query(`
      SELECT id, date, odometer, service_type AS "serviceType", service_center AS "serviceCenter",
        total_cost AS "totalCost", notes, document_url AS "documentUrl"
      FROM service_logs ORDER BY date ASC;
    `),
    query(`
      SELECT id, date_purchased AS "datePurchased", item_name AS "itemName", category, brand,
        cost, notes, photo_url AS "photoUrl"
      FROM accessories_gear ORDER BY date_purchased ASC;
    `),
  ]);

  const fuelLogs: FuelLog[] = fuelRes.rows.map((r) => ({
    id: r.id,
    date: r.date ? new Date(r.date).toISOString() : '',
    odometer: Number(r.odometer ?? 0),
    fuelAmount: Number(r.fuelAmount ?? 0),
    totalCost: Number(r.totalCost ?? 0),
    pricePerLitre: Number(r.pricePerLitre ?? 0),
    isFullTank: Boolean(r.isFullTank),
    tripType: r.tripType || 'Commute',
    brand: r.brand || undefined,
    stationName: r.stationName || undefined,
    fuelBars: r.fuelBars !== null && r.fuelBars !== undefined ? Number(r.fuelBars) : undefined,
    notes: r.notes || undefined,
    distanceCalculated: r.distanceCalculated != null ? Number(r.distanceCalculated) : undefined,
    mileageCalculated: r.mileageCalculated != null ? Number(r.mileageCalculated) : undefined,
    costPerKmCalculated: r.costPerKmCalculated != null ? Number(r.costPerKmCalculated) : undefined,
    synced: true,
  }));

  const trips: Trip[] = tripRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    tripType: r.tripType || 'Commute',
    fromLocation: r.fromLocation || undefined,
    toLocation: r.toLocation || undefined,
    departureDate: r.departureDate || '',
    departureTime: r.departureTime ? String(r.departureTime).substring(0, 5) : undefined,
    arrivalDate: r.arrivalDate || undefined,
    arrivalTime: r.arrivalTime ? String(r.arrivalTime).substring(0, 5) : undefined,
    startOdometer: Number(r.startOdometer || 0),
    endOdometer: r.endOdometer != null ? Number(r.endOdometer) : undefined,
    distanceCovered: Number(r.distanceCovered || 0),
    totalFuelCost: Number(r.totalFuelCost || 0),
    totalFuelLitres: Number(r.totalFuelLitres || 0),
    avgFuelEconomy: r.avgFuelEconomy != null ? Number(r.avgFuelEconomy) : undefined,
    calculatedFuelEconomy: r.calculatedFuelEconomy != null ? Number(r.calculatedFuelEconomy) : undefined,
    notes: r.notes || undefined,
  }));

  const services: ServiceLog[] = svcRes.rows.map((r) => ({
    id: r.id,
    date: r.date ? new Date(r.date).toISOString() : '',
    odometer: Number(r.odometer || 0),
    serviceType: r.serviceType,
    serviceCenter: r.serviceCenter || undefined,
    totalCost: Number(r.totalCost || 0),
    notes: r.notes || undefined,
    documentUrl: r.documentUrl || undefined,
  }));

  const accessories: AccessoryGear[] = accRes.rows.map((r) => ({
    id: r.id,
    datePurchased: r.datePurchased ? new Date(r.datePurchased).toISOString() : '',
    itemName: r.itemName,
    category: r.category,
    brand: r.brand || undefined,
    cost: Number(r.cost || 0),
    notes: r.notes || undefined,
    photoUrl: r.photoUrl || undefined,
  }));

  return { fuelLogs, trips, services, accessories };
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'GITHUB_TOKEN is not set on the server. Add it to .env.local / Vercel env.' },
        { status: 503 }
      );
    }

    let body: { entities?: SyncEntities } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const clientEntities = body.entities || {};

    let entities: SyncEntities | null = null;
    let source: 'postgres' | 'client' = 'client';
    let dbConnected = false;
    try {
      entities = await readFromDb();
      dbConnected = entities !== null;
      if (entities) source = 'postgres';
    } catch (err) {
      console.warn('[github-sync] Postgres read failed, falling back to client entities:', err);
    }

    if (!entities) {
      entities = clientEntities;
    } else if (clientEntities.chainLube) {
      entities.chainLube = clientEntities.chainLube; // chain care lives only in localStorage
    }

    const fuelLogs = entities.fuelLogs || [];
    const trips = entities.trips || [];
    const services = entities.services || [];
    const accessories = entities.accessories || [];
    const chainLube = entities.chainLube || null;

    if (fuelLogs.length === 0 && trips.length === 0 && services.length === 0 && accessories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available to sync (database empty and no entities supplied)' },
        { status: 400 }
      );
    }

    const counts = {
      fuelLogs: fuelLogs.length,
      trips: trips.length,
      services: services.length,
      accessories: accessories.length,
      chainLube: chainLube ? 1 : 0,
    };

    const generatedAt = new Date().toISOString();
    const files: GitHubFile[] = [
      { path: 'data/fuel-logs.json', content: pretty(fuelLogs) },
      { path: 'data/trips.json', content: pretty(trips) },
      { path: 'data/service-logs.json', content: pretty(services) },
      { path: 'data/accessories.json', content: pretty(accessories) },
      { path: 'data/chain-lube.json', content: pretty(chainLube) },
      { path: 'exports/fuel-logs.csv', content: fuelLogsToCsv(fuelLogs) },
      { path: 'exports/trips.csv', content: tripsToCsv(trips) },
      { path: 'exports/service-logs.csv', content: serviceLogsToCsv(services) },
      { path: 'exports/accessories.csv', content: accessoriesToCsv(accessories) },
      {
        path: 'data/sync-manifest.json',
        content: pretty({
          generatedAt,
          source,
          dbConnected,
          counts,
          note: 'Cross-verification manifest: these counts must match the app and the Google Sheet tabs.',
        }),
      },
    ];

    const message = `data: sync tracker logs (${counts.fuelLogs} fuels, ${counts.trips} trips, ${counts.services} services, ${counts.accessories} accessories) [skip ci]`;
    const result = await commitFilesToGitHub(files, message);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.message }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      sha: result.sha,
      url: result.url,
      counts,
      source,
      generatedAt,
    });
  } catch (err) {
    console.error('GitHub sync failed:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
