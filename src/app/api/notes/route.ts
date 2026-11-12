import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConnected } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { requireOwner } from '@/lib/ownerSession';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// A private journal: breakdowns, good experiences, reviews, problems. Owner only.
const CATEGORIES = new Set(['Breakdown', 'Issue', 'Good experience', 'Review', 'Tip', 'Note']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SELECT = `
  SELECT id, title, body, category, to_char(note_date, 'YYYY-MM-DD') AS "noteDate",
         odometer, rating, cost, created_at AS "createdAt"
  FROM bike_notes`;

interface NoteInput {
  title: string;
  body: string;
  category: string;
  noteDate: string | null;
  odometer: number | null;
  rating: number | null;
  cost: number | null;
}

function clean(raw: unknown): NoteInput | null {
  const b = (raw || {}) as Record<string, unknown>;
  const title = String(b.title || '').trim().slice(0, 255);
  if (!title) return null;
  const num = (v: unknown) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
  const rating = num(b.rating);
  return {
    title,
    body: String(b.body || '').trim().slice(0, 8000),
    category: CATEGORIES.has(String(b.category)) ? String(b.category) : 'Note',
    noteDate: DATE_RE.test(String(b.noteDate || '')) ? String(b.noteDate) : null,
    odometer: num(b.odometer),
    rating: rating !== null && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    cost: num(b.cost),
  };
}

function numbers(rows: Record<string, unknown>[]) {
  return rows.map((r) => ({
    ...r,
    odometer: r.odometer === null ? null : Number(r.odometer),
    cost: r.cost === null ? null : Number(r.cost),
  }));
}

export async function GET(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    if (!(await isDbConnected())) return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    await ensureExtraTables();
    const res = await query(`${SELECT} ORDER BY COALESCE(note_date, created_at::date) DESC, created_at DESC`);
    return NextResponse.json(numbers(res.rows));
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const n = clean(await req.json());
    if (!n) return NextResponse.json({ error: 'A note needs a title.' }, { status: 400 });
    await ensureExtraTables();
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO bike_notes (id, title, body, category, note_date, odometer, rating, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, n.title, n.body, n.category, n.noteDate, n.odometer, n.rating, n.cost]
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
    const n = clean(raw);
    if (!id || !n) return NextResponse.json({ error: 'A note needs an id and a title.' }, { status: 400 });
    await ensureExtraTables();
    await query(
      `UPDATE bike_notes SET title = $2, body = $3, category = $4, note_date = $5, odometer = $6,
              rating = $7, cost = $8, updated_at = NOW() WHERE id = $1`,
      [id, n.title, n.body, n.category, n.noteDate, n.odometer, n.rating, n.cost]
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
    await query('DELETE FROM bike_notes WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
