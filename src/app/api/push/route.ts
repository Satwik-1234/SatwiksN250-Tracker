import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { requireOwner } from '@/lib/ownerSession';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** Saves this phone's push subscription (owner only). */
export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const sub = await req.json();
    const endpoint = String(sub?.endpoint || '');
    const p256dh = String(sub?.keys?.p256dh || '');
    const auth = String(sub?.keys?.auth || '');
    if (!endpoint.startsWith('https://') || !p256dh || !auth) {
      return NextResponse.json({ success: false, error: 'That is not a valid push subscription.' }, { status: 400 });
    }
    await ensureExtraTables();
    await query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [endpoint, p256dh, auth]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const endpoint = new URL(req.url).searchParams.get('endpoint');
    if (!endpoint) return NextResponse.json({ success: false, error: 'endpoint is required' }, { status: 400 });
    await ensureExtraTables();
    await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
