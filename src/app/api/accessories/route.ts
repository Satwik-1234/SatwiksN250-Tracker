import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { query, isDbConnected } from '@/lib/db';
import { errorMessage } from '@/lib/errors';
import { AccessoryGear } from '@/types/fuel';

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
        date_purchased AS "datePurchased",
        item_name AS "itemName",
        category,
        brand,
        cost,
        notes,
        photo_url AS "photoUrl"
      FROM accessories_gear
      ORDER BY date_purchased DESC;
    `);

    const accessories: AccessoryGear[] = result.rows.map((row) => ({
      id: row.id,
      datePurchased: new Date(row.datePurchased).toISOString().split('T')[0],
      itemName: row.itemName,
      category: row.category,
      brand: row.brand || undefined,
      cost: Number(row.cost),
      notes: row.notes || undefined,
      photoUrl: row.photoUrl || undefined,
    }));

    return NextResponse.json(accessories);
  } catch (err) {
    console.error('Failed to fetch accessories:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const body = await req.json();
    const {
      datePurchased,
      itemName,
      category,
      brand,
      cost,
      notes,
      photoUrl,
    } = body;

    const id = toValidUuidOrNew(body.id);

    await query(`
      INSERT INTO accessories_gear (
        id, date_purchased, item_name, category, brand, cost, notes, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      id,
      datePurchased || new Date().toISOString(),
      itemName,
      category,
      brand || null,
      cost || 0,
      notes || null,
      photoUrl || null
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Failed to save accessory:', err);
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
      datePurchased,
      itemName,
      category,
      brand,
      cost,
      notes,
      photoUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Accessory ID is required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(id)) {
      // Local ID being upgraded to database row: insert as new
      const newId = crypto.randomUUID();
      await query(`
        INSERT INTO accessories_gear (
          id, date_purchased, item_name, category, brand, cost, notes, photo_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        newId,
        datePurchased || new Date().toISOString(),
        itemName,
        category,
        brand || null,
        cost || 0,
        notes || null,
        photoUrl || null
      ]);
      return NextResponse.json({ success: true, id: newId });
    }

    await query(`
      UPDATE accessories_gear SET
        date_purchased = $1,
        item_name = $2,
        category = $3,
        brand = $4,
        cost = $5,
        notes = $6,
        photo_url = COALESCE($7, photo_url)
      WHERE id = $8;
    `, [
      datePurchased,
      itemName,
      category,
      brand || null,
      cost || 0,
      notes || null,
      photoUrl || null,
      id
    ]);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Failed to update accessory:', err);
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
      return NextResponse.json({ error: 'Accessory ID is required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(id)) {
      // Local/offline ID that never existed in PostgreSQL
      return NextResponse.json({ success: true });
    }

    await query('DELETE FROM accessories_gear WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete accessory:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
