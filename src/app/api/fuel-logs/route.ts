import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { FuelLog } from '@/types/fuel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connected = await isDbConnected();
    if (!connected) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    }

    const result = await query(`
      SELECT 
        id, 
        date, 
        odometer, 
        fuel_amount AS "fuelAmount", 
        total_cost AS "totalCost", 
        price_per_litre AS "pricePerLitre", 
        is_full_tank AS "isFullTank", 
        trip_type AS "tripType", 
        brand,
        station_name AS "stationName", 
        fuel_bars AS "fuelBars",
        notes, 
        distance_calculated AS "distanceCalculated", 
        mileage_calculated AS "mileageCalculated", 
        cost_per_km_calculated AS "costPerKmCalculated", 
        synced
      FROM fuel_logs
      ORDER BY odometer DESC, date DESC;
    `);

    const logs: FuelLog[] = result.rows.map((row: any) => ({
      id: row.id,
      date: new Date(row.date).toISOString(),
      odometer: Number(row.odometer),
      fuelAmount: Number(row.fuelAmount),
      totalCost: Number(row.totalCost),
      pricePerLitre: Number(row.pricePerLitre),
      isFullTank: Boolean(row.isFullTank),
      tripType: row.tripType,
      brand: row.brand || undefined,
      stationName: row.stationName || undefined,
      fuelBars: row.fuelBars !== null && row.fuelBars !== undefined ? Number(row.fuelBars) : undefined,
      notes: row.notes || undefined,
      distanceCalculated: row.distanceCalculated !== null ? Number(row.distanceCalculated) : undefined,
      mileageCalculated: row.mileageCalculated !== null ? Number(row.mileageCalculated) : undefined,
      costPerKmCalculated: row.costPerKmCalculated !== null ? Number(row.costPerKmCalculated) : undefined,
      synced: Boolean(row.synced),
    }));

    return NextResponse.json(logs);
  } catch (err: any) {
    console.error('Failed to fetch fuel logs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      odometer,
      fuelAmount,
      totalCost,
      pricePerLitre,
      isFullTank,
      tripType,
      brand,
      stationName,
      fuelBars,
      notes,
      distanceCalculated,
      mileageCalculated,
      costPerKmCalculated,
    } = body;

    const id = body.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isoDate = date || new Date().toISOString();
    const d = new Date(isoDate);
    const logDate = d.toISOString().split('T')[0];
    const logTime = d.toTimeString().split(' ')[0];

    await query(`
      INSERT INTO fuel_logs (
        id, date, log_date, log_time, date_iso, odometer,
        fuel_amount, qty_filled_litres, total_cost, amount_paid, price_per_litre,
        is_full_tank, trip_type, brand, station_name, fuel_bars, notes,
        distance_calculated, distance_from_last, mileage_calculated, mileage_kmpl,
        cost_per_km_calculated, cost_per_km, synced, synced_to_sheet
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25
      );
    `, [
      id,
      isoDate,
      logDate,
      logTime,
      isoDate,
      odometer,
      fuelAmount,
      fuelAmount,
      totalCost,
      totalCost,
      pricePerLitre,
      isFullTank ?? false,
      tripType || 'Commute',
      brand || null,
      stationName || null,
      fuelBars !== undefined ? fuelBars : null,
      notes || null,
      distanceCalculated ?? 0,
      distanceCalculated ?? 0,
      mileageCalculated ?? null,
      mileageCalculated ?? null,
      costPerKmCalculated ?? null,
      costPerKmCalculated ?? null,
      true,
      true
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to insert fuel log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    await query('DELETE FROM fuel_logs WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete fuel log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

