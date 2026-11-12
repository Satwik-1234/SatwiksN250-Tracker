import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { query } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** Streams one stored document. Owner session required; add ?download=1 to save it as a file. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const { id } = await ctx.params;
    await ensureExtraTables();
    const res = await query('SELECT file_name, mime_type, content FROM bike_documents WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const download = new URL(req.url).searchParams.get('download') === '1';
    const safeName = String(row.file_name).replace(/[^\w.\- ]+/g, '_');
    return new NextResponse(new Uint8Array(row.content as Buffer), {
      headers: {
        'Content-Type': row.mime_type,
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('Failed to read document:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
