import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { requireOwner } from '@/lib/ownerAuth';
import { runStatements } from '@/lib/migrate';
import {
  CORE_SCHEMA,
  MIGRATION_SCHEMA,
  CONSTRAINT_SCHEMA,
  INDEX_SCHEMA,
  SUPABASE_SCHEMA,
} from '@/lib/dbSchema';
import { REAL_RAW_LOGS, REAL_RAW_TRIPS, StorageService } from '@/services/googleSheetsService';

export const dynamic = 'force-dynamic';

/**
 * Columns each API route depends on. Used to detect a database provisioned from
 * the legacy schema.sql, which used entirely different column names and made
 * every Postgres read fail with 42703 "column does not exist".
 */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  fuel_logs: [
    'id', 'date', 'odometer', 'fuel_amount', 'total_cost', 'price_per_litre',
    'is_full_tank', 'trip_type', 'station_name', 'notes', 'distance_calculated',
    'mileage_calculated', 'cost_per_km_calculated', 'synced',
  ],
  trips: [
    'id', 'name', 'trip_type', 'from_location', 'to_location', 'departure_date',
    'departure_time', 'arrival_date', 'arrival_time', 'start_odometer',
    'end_odometer', 'distance_covered', 'total_fuel_cost', 'total_fuel_litres',
    'avg_fuel_economy', 'calculated_fuel_economy', 'notes',
  ],
  service_logs: [
    'id', 'date', 'odometer', 'service_type', 'service_center',
    'total_cost', 'notes', 'document_url',
  ],
  accessories_gear: [
    'id', 'date_purchased', 'item_name', 'category', 'brand',
    'cost', 'notes', 'photo_url',
  ],
};

export async function GET(req: NextRequest) {
  const unauthorized = await requireOwner(req);
  if (unauthorized) return unauthorized;

  const connected = await isDbConnected();
  if (!connected) {
    return NextResponse.json({
      connected: false,
      message: 'PostgreSQL database is not connected. Check DATABASE_URL in .env.local',
    }, { status: 503 });
  }

  try {
    const tableCheck = await query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('fuel_logs', 'trips', 'service_logs', 'accessories_gear')`
    );
    const tables: string[] = tableCheck.rows.map((r: any) => r.table_name);

    // Per-table column verification, so a legacy/partially-migrated database is
    // reported precisely instead of looking "ready".
    const missing: Record<string, string[]> = {};
    for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
      if (!tables.includes(table)) {
        missing[table] = [...cols];
        continue;
      }
      const res = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const present = new Set<string>(res.rows.map((r: any) => r.column_name));
      const gap = cols.filter((c) => !present.has(c));
      if (gap.length) missing[table] = gap;
    }

    return NextResponse.json({
      connected: true,
      tables,
      ready: tables.length >= 4 && Object.keys(missing).length === 0,
      missingColumns: missing,
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // This route executes DDL and seeds data. It must never be reachable
  // anonymously - it is both a migration path and an attack surface.
  const unauthorized = await requireOwner(req);
  if (unauthorized) return unauthorized;

  try {
    // 1. Create tables, migrate any legacy columns, add constraints and indexes.
    //    Each statement runs independently so one failure cannot abort the rest.
    const core = await runStatements(CORE_SCHEMA);
    const migration = await runStatements(MIGRATION_SCHEMA);
    const constraints = await runStatements(CONSTRAINT_SCHEMA);
    const indexes = await runStatements(INDEX_SCHEMA);

    // Supabase-only (storage/auth schemas). Expected to fail on plain Postgres.
    await runStatements(SUPABASE_SCHEMA, { optional: true });

    const failures = [...core.failed, ...migration.failed, ...constraints.failed, ...indexes.failed];
    if (failures.length) {
      console.error('[init-db] schema failures:', failures);
    }

    // 2. Check if fuel_logs has data, if not seed baseline logs
    const existingLogs = await query('SELECT COUNT(*) as count FROM fuel_logs');
    let seededLogsCount = 0;
    if (parseInt(existingLogs.rows[0].count, 10) === 0) {
      const calculatedLogs = StorageService.recalculateDerivedFields(REAL_RAW_LOGS);
      for (const log of calculatedLogs) {
        await query(`
          INSERT INTO fuel_logs (
            id, date, odometer, fuel_amount, total_cost, price_per_litre,
            is_full_tank, trip_type, station_name, notes,
            distance_calculated, mileage_calculated, cost_per_km_calculated, synced
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING;
        `, [
          log.id,
          log.date,
          log.odometer,
          log.fuelAmount,
          log.totalCost,
          log.pricePerLitre,
          log.isFullTank,
          log.tripType,
          log.stationName || '',
          log.notes || '',
          log.distanceCalculated || 0,
          log.mileageCalculated || null,
          log.costPerKmCalculated || null,
          true
        ]);
        seededLogsCount++;
      }
    }

    // 3. Check if trips has data, if not seed baseline trips
    const existingTrips = await query('SELECT COUNT(*) as count FROM trips');
    let seededTripsCount = 0;
    if (parseInt(existingTrips.rows[0].count, 10) === 0) {
      for (const trip of REAL_RAW_TRIPS) {
        const dist = trip.distanceCovered || trip.totalDistance || (trip.endOdometer && trip.startOdometer ? Math.max(0, trip.endOdometer - trip.startOdometer) : 0);
        await query(`
          INSERT INTO trips (
            id, name, trip_type,
            departure_date, departure_time, arrival_date, arrival_time,
            from_location, to_location, start_odometer, end_odometer,
            distance_covered, total_fuel_cost, total_fuel_litres,
            avg_fuel_economy, calculated_fuel_economy, notes
          ) VALUES (
            $1, $2, $3,
            $4, $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13, $14,
            $15, $16, $17
          )
          ON CONFLICT (id) DO NOTHING;
        `, [
          trip.id,
          trip.name,
          trip.tripType,
          trip.departureDate || trip.startDate || null,
          trip.departureTime || null,
          trip.arrivalDate || trip.endDate || null,
          trip.arrivalTime || null,
          trip.fromLocation || null,
          trip.toLocation || null,
          trip.startOdometer,
          trip.endOdometer || null,
          dist,
          trip.totalFuelCost || 0,
          trip.totalFuelLitres || 0,
          trip.avgFuelEconomy || trip.avgMileage || null,
          trip.calculatedFuelEconomy || null,
          trip.notes || ''
        ]);
        seededTripsCount++;
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      message:
        failures.length === 0
          ? 'PostgreSQL database successfully initialized and seeded!'
          : 'Schema applied with errors. See failedStatements.',
      applied: {
        core: core.applied,
        migration: migration.applied,
        constraints: constraints.applied,
        indexes: indexes.applied,
      },
      failedStatements: failures,
      seededLogs: seededLogsCount,
      seededTrips: seededTripsCount,
    }, { status: failures.length === 0 ? 200 : 500 });
  } catch (err: any) {
    console.error('Database initialization failed:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Database initialization error',
    }, { status: 500 });
  }
}
