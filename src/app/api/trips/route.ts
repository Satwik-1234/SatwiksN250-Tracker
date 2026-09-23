import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { Trip } from '@/types/fuel';

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
        name,
        trip_type AS "tripType",
        COALESCE(from_location, 'Home') AS "fromLocation",
        COALESCE(to_location, name) AS "toLocation",
        COALESCE(departure_date::text, start_date::text) AS "departureDate",
        departure_time::text AS "departureTime",
        COALESCE(arrival_date::text, end_date::text) AS "arrivalDate",
        arrival_time::text AS "arrivalTime",
        start_odometer AS "startOdometer",
        end_odometer AS "endOdometer",
        COALESCE(distance_covered, total_distance, 0) AS "distanceCovered",
        total_fuel_cost AS "totalFuelCost",
        total_fuel_litres AS "totalFuelLitres",
        COALESCE(avg_fuel_economy, avg_mileage) AS "avgFuelEconomy",
        calculated_fuel_economy AS "calculatedFuelEconomy",
        notes
      FROM trips
      ORDER BY COALESCE(departure_date, start_date) DESC;
    `);

    const trips: Trip[] = result.rows.map((row: any) => {
      const dist = Number(row.distanceCovered);
      const fuelLitres = Number(row.totalFuelLitres);
      const calculatedEco =
        row.calculatedFuelEconomy !== null && row.calculatedFuelEconomy !== undefined
          ? Number(row.calculatedFuelEconomy)
          : dist > 0 && fuelLitres > 0
          ? Number((dist / fuelLitres).toFixed(2))
          : undefined;

      const departureStr = row.departureDate
        ? new Date(row.departureDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const arrivalStr = row.arrivalDate
        ? new Date(row.arrivalDate).toISOString().split('T')[0]
        : undefined;

      return {
        id: row.id,
        name: row.name,
        tripType: row.tripType,
        fromLocation: row.fromLocation,
        toLocation: row.toLocation,
        departureDate: departureStr,
        departureTime: row.departureTime ? String(row.departureTime).substring(0, 5) : undefined,
        arrivalDate: arrivalStr,
        arrivalTime: row.arrivalTime ? String(row.arrivalTime).substring(0, 5) : undefined,
        startOdometer: Number(row.startOdometer),
        endOdometer: row.endOdometer !== null ? Number(row.endOdometer) : undefined,
        distanceCovered: dist,
        totalFuelCost: Number(row.totalFuelCost),
        totalFuelLitres: fuelLitres,
        avgFuelEconomy: row.avgFuelEconomy !== null ? Number(row.avgFuelEconomy) : undefined,
        calculatedFuelEconomy: calculatedEco,
        notes: row.notes || undefined,

        // Backward compatibility
        startDate: departureStr,
        endDate: arrivalStr,
        totalDistance: dist,
        avgMileage: calculatedEco || (row.avgFuelEconomy !== null ? Number(row.avgFuelEconomy) : undefined),
      };
    });

    return NextResponse.json(trips);
  } catch (err: any) {
    console.error('Failed to fetch trips:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      tripType,
      fromLocation,
      toLocation,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      startOdometer,
      endOdometer,
      distanceCovered,
      totalFuelCost,
      totalFuelLitres,
      avgFuelEconomy,
      calculatedFuelEconomy,
      notes,
    } = body;

    const id = body.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const finalFrom = fromLocation || 'Home';
    const finalTo = toLocation || name || 'Destination';
    const finalName = name || `${finalFrom} to ${finalTo}`;

    const dist =
      typeof distanceCovered === 'number'
        ? distanceCovered
        : endOdometer && startOdometer && endOdometer > startOdometer
        ? endOdometer - startOdometer
        : 0;

    const litres = Number(totalFuelLitres) || 0;
    const calcEco =
      typeof calculatedFuelEconomy === 'number'
        ? calculatedFuelEconomy
        : dist > 0 && litres > 0
        ? Number((dist / litres).toFixed(2))
        : null;

    const depDate = departureDate || body.startDate || new Date().toISOString().split('T')[0];
    const arrDate = arrivalDate || body.endDate || null;

    await query(`
      INSERT INTO trips (
        id, name, trip_type, from_location, to_location,
        departure_date, departure_time, arrival_date, arrival_time,
        start_odometer, end_odometer, distance_covered,
        total_fuel_cost, total_fuel_litres, avg_fuel_economy,
        calculated_fuel_economy, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
    `, [
      id,
      finalName,
      tripType || 'Highway',
      finalFrom,
      finalTo,
      depDate,
      departureTime || null,
      arrDate,
      arrivalTime || null,
      startOdometer || 0,
      endOdometer || null,
      dist,
      totalFuelCost || 0,
      litres,
      avgFuelEconomy || null,
      calcEco,
      notes || null
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to save trip:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    await query('DELETE FROM trips WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete trip:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
