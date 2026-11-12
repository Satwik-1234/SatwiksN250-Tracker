import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { requireOwner } from '@/lib/ownerSession';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const dateOrNull = (v: unknown) => (DATE_RE.test(String(v || '')) ? String(v) : null);

function clean(raw: unknown) {
  const b = (raw || {}) as Record<string, unknown>;
  const name = String(b.name || '').trim().slice(0, 120);
  if (!name) return null;
  return {
    name,
    brand: String(b.brand || '').trim().slice(0, 120) || null,
    installedDate: dateOrNull(b.installedDate),
    installedOdometer: num(b.installedOdometer),
    lifeKm: num(b.lifeKm),
    cost: num(b.cost),
    notes: String(b.notes || '').trim().slice(0, 2000) || null,
    removedDate: dateOrNull(b.removedDate),
    removedOdometer: num(b.removedOdometer),
  };
}

const SELECT = `
  SELECT id, name, brand, to_char(installed_date, 'YYYY-MM-DD') AS "installedDate",
         installed_odometer AS "installedOdometer", life_km AS "lifeKm", cost, notes,
         to_char(removed_date, 'YYYY-MM-DD') AS "removedDate", removed_odometer AS "removedOdometer"
  FROM bike_parts`;

export async function GET(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    if (!(await isDbConnected())) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    await ensureExtraTables();
    const res = await query(`${SELECT} ORDER BY removed_date IS NOT NULL, installed_date DESC NULLS LAST, created_at DESC`);
    const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    return NextResponse.json(
      res.rows.map((r) => ({ ...r, installedOdometer: n(r.installedOdometer), lifeKm: n(r.lifeKm), cost: n(r.cost), removedOdometer: n(r.removedOdometer) }))
    );
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const p = clean(await req.json());
    if (!p) return NextResponse.json({ error: 'A part needs a name.' }, { status: 400 });
    await ensureExtraTables();
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO bike_parts (id, name, brand, installed_date, installed_odometer, life_km, cost, notes, removed_date, removed_odometer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, p.name, p.brand, p.installedDate, p.installedOdometer, p.lifeKm, p.cost, p.notes, p.removedDate, p.removedOdometer]
    );
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const raw = await req.json();
    const id = String(raw?.id || '');
    const p = clean(raw);
    if (!id || !p) return NextResponse.json({ error: 'A part needs an id and a name.' }, { status: 400 });
    await ensureExtraTables();
    await query(
      `UPDATE bike_parts SET name=$2, brand=$3, installed_date=$4, installed_odometer=$5, life_km=$6, cost=$7,
              notes=$8, removed_date=$9, removed_odometer=$10 WHERE id=$1`,
      [id, p.name, p.brand, p.installedDate, p.installedOdometer, p.lifeKm, p.cost, p.notes, p.removedDate, p.removedOdometer]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await ensureExtraTables();
    await query('DELETE FROM bike_parts WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
