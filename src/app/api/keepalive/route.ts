import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Keeps the free-plan database from being paused for inactivity.
 * A scheduler (Vercel Cron, see vercel.json) calls this once a day. It makes a
 * real read through both doors the app uses: a Postgres query, and a request
 * to the Supabase REST API. Returns 503 if the database could not be reached,
 * so a failing check is visible in the scheduler's logs.
 *
 * If CRON_SECRET is set (Vercel sends it automatically to cron calls), the
 * request must carry it. The response never includes any data from your tables.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result: { postgres: boolean | string; rest: boolean | string } = { postgres: false, rest: 'skipped' };

  try {
    await query('SELECT COUNT(*) FROM fuel_logs');
    result.postgres = true;
  } catch (err) {
    result.postgres = errorMessage(err);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/fuel_logs?select=id&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        cache: 'no-store',
      });
      result.rest = res.ok ? true : `HTTP ${res.status}`;
    } catch (err) {
      result.rest = errorMessage(err);
    }
  }

  const ok = result.postgres === true || result.rest === true;
  return NextResponse.json({ ok, ...result, at: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
