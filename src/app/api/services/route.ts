import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { query, isDbConnected } from '@/lib/db';
import { errorMessage } from '@/lib/errors';
import { ServiceLog } from '@/types/fuel';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidUuidOrNew(candidate?: unknown): string {
  if (typeof candidate === 'string' && UUID_REGEX.test(candidate)) {
    return candidate;
  }
  return crypto.randomUUID();
}

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

    const services: ServiceLog[] = result.rows.map((row) => ({
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
  } catch (err) {
    console.error('Failed to fetch service logs:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

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

    const id = toValidUuidOrNew(body.id);

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
  } catch (err) {
    console.error('Failed to save service log:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

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

    if (!UUID_REGEX.test(id)) {
      // Local ID being upgraded to database row: insert as new
      const newId = crypto.randomUUID();
      await query(`
        INSERT INTO service_logs (
          id, date, odometer, service_type, service_center, total_cost, notes, document_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        newId,
        date || new Date().toISOString(),
        odometer,
        serviceType,
        serviceCenter || null,
        totalCost || 0,
        notes || null,
        documentUrl || null
      ]);
      return NextResponse.json({ success: true, id: newId });
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

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Failed to update service log:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(id)) {
      // Local/offline ID that never existed in PostgreSQL
      return NextResponse.json({ success: true });
    }

    await query('DELETE FROM service_logs WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete service log:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
