import { NextRequest, NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { query } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { requireOwner } from '@/lib/ownerSession';
import { buildAlerts } from '@/lib/alerts';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const REPEAT_AFTER = '3 days';

function configurePush(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@example.com', pub, priv);
  return true;
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToAll(payload: object): Promise<number> {
  const subs = (await query('SELECT endpoint, p256dh, auth FROM push_subscriptions')).rows as SubRow[];
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
      sent += 1;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [s.endpoint]);
    }
  }
  return sent;
}

/**
 * Daily check (Vercel Cron). Tells subscribed phones about upkeep that is due or
 * overdue, and papers about to expire. An alert is not repeated for 3 days.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (!configurePush()) return NextResponse.json({ ok: true, sent: 0, reason: 'Phone alerts are not set up (VAPID keys missing).' });
    await ensureExtraTables();

    const alerts = await buildAlerts();
    const recent = new Set(
      (await query(`SELECT alert_key FROM alert_log WHERE last_sent > NOW() - INTERVAL '${REPEAT_AFTER}'`)).rows.map((r) => r.alert_key as string)
    );
    const fresh = alerts.filter((a) => !recent.has(a.key));
    if (fresh.length === 0) return NextResponse.json({ ok: true, sent: 0, reason: 'Nothing new to report.' });

    const sent = await sendToAll({
      title: fresh.length === 1 ? 'Pulsar N250' : `Pulsar N250: ${fresh.length} things need attention`,
      body: fresh.slice(0, 4).map((a) => a.text).join('\n'),
      tag: 'n250-care',
      url: '/',
    });
    if (sent > 0) {
      for (const a of fresh) {
        await query(
          `INSERT INTO alert_log (alert_key, last_sent) VALUES ($1, NOW())
           ON CONFLICT (alert_key) DO UPDATE SET last_sent = NOW()`,
          [a.key]
        );
      }
    }
    return NextResponse.json({ ok: true, sent, alerts: fresh.length });
  } catch (err) {
    console.error('Notify failed:', err);
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
  }
}

/** Owner only: send a test notification to every subscribed phone. */
export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    if (!configurePush()) return NextResponse.json({ ok: false, error: 'Phone alerts are not set up on the server (VAPID keys missing).' }, { status: 503 });
    await ensureExtraTables();
    const sent = await sendToAll({ title: 'Phone alerts are on', body: 'You will be told when something on your bike is due.', tag: 'n250-test', url: '/' });
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 500 });
  }
}
