import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { ServiceLog } from '@/types/fuel';

export const dynamic = 'force-static';

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
        service_type AS "serviceType",
        service_center AS "serviceCenter",
        total_cost AS "totalCost",
        notes,
        document_url AS "documentUrl"
      FROM service_logs
      ORDER BY date DESC, odometer DESC;
    `);

    const services: ServiceLog[] = result.rows.map((row: any) => ({
      id: row.id,
      date: new Date(row.date).toISOString().split('T')[0],
      odometer: Number(row.odometer),
      serviceType: row.serviceType,
      serviceCenter: row.serviceCenter || undefined,
      totalCost: Number(row.totalCost),
      notes: row.notes || undefined,
      documentUrl: row.documentUrl || undefined,
    }));

    return NextResponse.json(services);
  } catch (err: any) {
    console.error('Failed to fetch service logs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      odometer,
      serviceType,
      serviceCenter,
      totalCost,
      notes,
      documentUrl,
    } = body;

    const id = body.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await query(`
      INSERT INTO service_logs (
        id, date, odometer, service_type, service_center, total_cost, notes, document_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      id,
      date || new Date().toISOString(),
      odometer,
      serviceType,
      serviceCenter || null,
      totalCost || 0,
      notes || null,
      documentUrl || null
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to save service log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      date,
      odometer,
      serviceType,
      serviceCenter,
      totalCost,
      notes,
      documentUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    await query(`
      UPDATE service_logs SET
        date = $1,
        odometer = $2,
        service_type = $3,
        service_center = $4,
        total_cost = $5,
        notes = $6,
        document_url = COALESCE($7, document_url)
      WHERE id = $8;
    `, [
      date,
      odometer,
      serviceType,
      serviceCenter || null,
      totalCost || 0,
      notes || null,
      documentUrl || null,
      id
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update service log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    await query('DELETE FROM service_logs WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete service log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
