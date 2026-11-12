import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { query, isDbConnected } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// Personal papers (RC, insurance, licence) are private: every method here needs
// the owner session, and the files live in the database, not in a public bucket.
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic']);
const CATEGORIES = new Set(['Registration (RC)', 'Insurance', 'PUC', 'Driving licence', 'Service booklet', 'Warranty', 'Purchase invoice', 'Other']);

export async function GET(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    if (!(await isDbConnected())) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    }
    await ensureExtraTables();
    const res = await query(`
      SELECT id, title, category, file_name AS "fileName", mime_type AS "mimeType",
             size_bytes AS "sizeBytes", to_char(expiry_date, 'YYYY-MM-DD') AS "expiryDate",
             notes, created_at AS "createdAt"
      FROM bike_documents ORDER BY created_at DESC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('Failed to list documents:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That file is larger than 8 MB.' }, { status: 413 });
    }
    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: 'Only PDF and photo files can be stored here.' }, { status: 415 });
    }

    const title = String(form.get('title') || '').trim().slice(0, 255) || file.name;
    const categoryRaw = String(form.get('category') || 'Other');
    const category = CATEGORIES.has(categoryRaw) ? categoryRaw : 'Other';
    const expiryRaw = String(form.get('expiryDate') || '');
    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(expiryRaw) ? expiryRaw : null;
    const notes = String(form.get('notes') || '').trim().slice(0, 2000) || null;

    await ensureExtraTables();
    const id = crypto.randomUUID();
    const bytes = Buffer.from(await file.arrayBuffer());
    await query(
      `INSERT INTO bike_documents (id, title, category, file_name, mime_type, size_bytes, content, expiry_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, title, category, file.name.slice(0, 255), mime, file.size, bytes, expiry, notes]
    );
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Failed to save document:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    await ensureExtraTables();
    await query('DELETE FROM bike_documents WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete document:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
