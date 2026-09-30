import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { requireOwner } from '@/lib/ownerAuth';
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
        station_name AS "stationName", 
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
      stationName: row.stationName || undefined,
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
  const unauthorized = await requireOwner(req);
  if (unauthorized) return unauthorized;

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
      stationName,
      notes,
      distanceCalculated,
      mileageCalculated,
      costPerKmCalculated,
    } = body;

    const numOdometer = Number(odometer);
    const numFuelAmount = Number(fuelAmount);
    const numTotalCost = Number(totalCost);
    const numPricePerLitre = Number(pricePerLitre);

    if (!Number.isFinite(numOdometer) || numOdometer < 0) {
      return NextResponse.json({ error: 'odometer must be a non-negative number' }, { status: 400 });
    }
    if (!Number.isFinite(numFuelAmount) || numFuelAmount <= 0) {
      return NextResponse.json({ error: 'fuelAmount must be greater than 0' }, { status: 400 });
    }
    if (!Number.isFinite(numTotalCost) || numTotalCost < 0) {
      return NextResponse.json({ error: 'totalCost must be a non-negative number' }, { status: 400 });
    }
    if (!Number.isFinite(numPricePerLitre) || numPricePerLitre <= 0) {
      return NextResponse.json({ error: 'pricePerLitre must be greater than 0' }, { status: 400 });
    }
    if (date !== undefined && Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date is not a valid timestamp' }, { status: 400 });
    }

    const id = body.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await query(`
      INSERT INTO fuel_logs (
        id, date, odometer, fuel_amount, total_cost, price_per_litre,
        is_full_tank, trip_type, station_name, notes,
        distance_calculated, mileage_calculated, cost_per_km_calculated, synced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
    `, [
      id,
      date || new Date().toISOString(),
      numOdometer,
      numFuelAmount,
      numTotalCost,
      numPricePerLitre,
      isFullTank ?? false,
      tripType || 'Commute',
      stationName || null,
      notes || null,
      distanceCalculated ?? 0,
      mileageCalculated ?? null,
      costPerKmCalculated ?? null,
      true
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to insert fuel log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireOwner(req);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }
    if (id.length > 64) {
      return NextResponse.json({ error: 'Log ID is invalid' }, { status: 400 });
    }

    const result = await query('DELETE FROM fuel_logs WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete fuel log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
