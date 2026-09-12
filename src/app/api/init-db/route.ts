import { NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { REAL_RAW_LOGS, REAL_RAW_TRIPS, StorageService } from '@/services/googleSheetsService';

export async function GET() {
  const connected = await isDbConnected();
  if (!connected) {
    return NextResponse.json({
      connected: false,
      message: 'PostgreSQL database is not connected. Check DATABASE_URL in .env.local',
    }, { status: 503 });
  }

  try {
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('fuel_logs', 'trips', 'service_logs', 'accessories_gear');
    `);

    const tables = tableCheck.rows.map(r => r.table_name);
    return NextResponse.json({
      connected: true,
      tables,
      ready: tables.length >= 4,
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    // 1. Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id VARCHAR(64) PRIMARY KEY,
        date TIMESTAMPTZ NOT NULL,
        odometer NUMERIC(10, 2) NOT NULL,
        fuel_amount NUMERIC(10, 2) NOT NULL,
        total_cost NUMERIC(10, 2) NOT NULL,
        price_per_litre NUMERIC(10, 2) NOT NULL,
        is_full_tank BOOLEAN DEFAULT FALSE,
        trip_type VARCHAR(32) DEFAULT 'Commute',
        station_name VARCHAR(255),
        notes TEXT,
        distance_calculated NUMERIC(10, 2) DEFAULT 0,
        mileage_calculated NUMERIC(10, 2),
        cost_per_km_calculated NUMERIC(10, 2),
        synced BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trip_type VARCHAR(32) DEFAULT 'Highway',
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        departure_date DATE,
        departure_time TIME,
        arrival_date DATE,
        arrival_time TIME,
        from_location VARCHAR(255),
        to_location VARCHAR(255),
        start_odometer NUMERIC(10, 2) NOT NULL,
        end_odometer NUMERIC(10, 2),
        distance_covered NUMERIC(10, 2) DEFAULT 0,
        total_distance NUMERIC(10, 2) DEFAULT 0,
        total_fuel_cost NUMERIC(10, 2) DEFAULT 0,
        total_fuel_litres NUMERIC(10, 2) DEFAULT 0,
        avg_mileage NUMERIC(10, 2),
        avg_fuel_economy NUMERIC(10, 2),
        calculated_fuel_economy NUMERIC(10, 2),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure upgraded columns exist if table was already created
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS departure_date DATE;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS departure_time TIME;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS arrival_date DATE;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS arrival_time TIME;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS from_location VARCHAR(255);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS to_location VARCHAR(255);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS distance_covered NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS avg_fuel_economy NUMERIC(10, 2);
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS calculated_fuel_economy NUMERIC(10, 2);

      CREATE TABLE IF NOT EXISTS service_logs (
        id VARCHAR(64) PRIMARY KEY,
        date TIMESTAMPTZ NOT NULL,
        odometer NUMERIC(10, 2) NOT NULL,
        service_type VARCHAR(128) NOT NULL,
        service_center VARCHAR(255),
        total_cost NUMERIC(10, 2) DEFAULT 0,
        notes TEXT,
        document_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accessories_gear (
        id VARCHAR(64) PRIMARY KEY,
        date_purchased TIMESTAMPTZ NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(128) NOT NULL,
        brand VARCHAR(128),
        cost NUMERIC(10, 2) DEFAULT 0,
        notes TEXT,
        photo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
            id, name, trip_type, start_date, end_date,
            departure_date, departure_time, arrival_date, arrival_time,
            from_location, to_location, start_odometer, end_odometer,
            distance_covered, total_distance, total_fuel_cost, total_fuel_litres,
            avg_mileage, avg_fuel_economy, calculated_fuel_economy, notes
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21
          )
          ON CONFLICT (id) DO NOTHING;
        `, [
          trip.id,
          trip.name,
          trip.tripType,
          trip.startDate,
          trip.endDate || null,
          trip.departureDate || null,
          trip.departureTime || null,
          trip.arrivalDate || null,
          trip.arrivalTime || null,
          trip.fromLocation || null,
          trip.toLocation || null,
          trip.startOdometer,
          trip.endOdometer || null,
          dist,
          dist,
          trip.totalFuelCost || 0,
          trip.totalFuelLitres || 0,
          trip.avgFuelEconomy || trip.avgMileage || null,
          trip.avgFuelEconomy || null,
          trip.calculatedFuelEconomy || null,
          trip.notes || ''
        ]);
        seededTripsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database successfully initialized and seeded!',
      seededLogs: seededLogsCount,
      seededTrips: seededTripsCount,
    });
  } catch (err: any) {
    console.error('Database initialization failed:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Database initialization error',
    }, { status: 500 });
  }
}
