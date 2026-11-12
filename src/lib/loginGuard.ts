import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';

/**
 * Brute-force protection for the owner login. A short PIN has few combinations,
 * so failed attempts are counted per client address (and across all addresses),
 * stored in Postgres so the limit holds across serverless instances. If the
 * database is unreachable it falls back to per-instance memory.
 */
const WINDOW = '15 minutes';
const LOCK = '15 minutes';

const memory = new Map<string, { fails: number; first: number; lockedUntil: number }>();
const WINDOW_MS = 15 * 60 * 1000;

export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

/** Minutes left on a lock for this key, or 0 if it is not locked. */
export async function lockedMinutes(key: string): Promise<number> {
  try {
    await ensureExtraTables();
    const res = await query(`SELECT CEIL(EXTRACT(EPOCH FROM (locked_until - NOW())) / 60) AS m FROM auth_attempts WHERE ip = $1 AND locked_until > NOW()`, [key]);
    return res.rows[0] ? Number(res.rows[0].m) : 0;
  } catch {
    const m = memory.get(key);
    return m && m.lockedUntil > Date.now() ? Math.ceil((m.lockedUntil - Date.now()) / 60000) : 0;
  }
}

export async function recordFailure(key: string, maxFails: number): Promise<void> {
  try {
    await ensureExtraTables();
    await query(
      `INSERT INTO auth_attempts (ip, fails, window_start, locked_until)
       VALUES ($1, 1, NOW(), NULL)
       ON CONFLICT (ip) DO UPDATE SET
         fails = CASE WHEN auth_attempts.window_start < NOW() - INTERVAL '${WINDOW}' THEN 1 ELSE auth_attempts.fails + 1 END,
         window_start = CASE WHEN auth_attempts.window_start < NOW() - INTERVAL '${WINDOW}' THEN NOW() ELSE auth_attempts.window_start END,
         locked_until = CASE
           WHEN (CASE WHEN auth_attempts.window_start < NOW() - INTERVAL '${WINDOW}' THEN 1 ELSE auth_attempts.fails + 1 END) >= $2
           THEN NOW() + INTERVAL '${LOCK}' ELSE NULL END`,
      [key, maxFails]
    );
  } catch {
    const now = Date.now();
    const m = memory.get(key);
    const fresh = !m || now - m.first > WINDOW_MS;
    const fails = fresh ? 1 : m.fails + 1;
    memory.set(key, { fails, first: fresh ? now : m.first, lockedUntil: fails >= maxFails ? now + WINDOW_MS : 0 });
  }
}

export async function clearFailures(key: string): Promise<void> {
  memory.delete(key);
  try {
    await query('DELETE FROM auth_attempts WHERE ip = $1', [key]);
  } catch {
    /* table may not exist yet; nothing to clear */
  }
}
