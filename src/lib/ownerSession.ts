import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Long-lived owner session so secondary devices (e.g. the phone) do not lose
// write access every 12 hours and silently fall back to local-only storage.
// Default: 7 days. Override with OWNER_SESSION_TTL_HOURS in env.
const TOKEN_TTL_HOURS = (() => {
  const n = Number(process.env.OWNER_SESSION_TTL_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 24 * 7;
})();

const isProd = process.env.NODE_ENV === 'production';

/** The owner PIN. Only a local dev server may fall back to a built-in one. */
export function getOwnerPin(): string | null {
  return process.env.OWNER_PIN || (isProd ? null : '2500');
}

export function getOwnerPassword(): string | null {
  return process.env.OWNER_PASSWORD || (isProd ? null : 'n250owner');
}

/**
 * The key that signs owner sessions. It must not be guessable from a short PIN,
 * so unless OWNER_SESSION_SECRET is set it is derived from the database URL,
 * which holds a long server-only password.
 */
function getSecret(): string {
  if (process.env.OWNER_SESSION_SECRET) return process.env.OWNER_SESSION_SECRET;
  const db = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (db) return createHmac('sha256', 'n250-owner-session').update(db).digest('hex');
  if (!isProd) return process.env.OWNER_PIN || '2500';
  throw new Error('Owner login is not configured on the server.');
}

export function createOwnerToken(): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_HOURS * 60 * 60;
  const payload = `v1.${iat}.${exp}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyOwnerToken(token: string | null | undefined): boolean {
  try {
    return verifyToken(token);
  } catch {
    return false;
  }
}

function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;

  const [version, iat, exp, sig] = parts;
  if (version !== 'v1') return false;

  const expSeconds = Number(exp);
  if (!Number.isFinite(expSeconds) || Math.floor(Date.now() / 1000) > expSeconds) {
    return false;
  }

  const expected = createHmac('sha256', getSecret())
    .update(`v1.${iat}.${exp}`)
    .digest('hex');

  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

export function requireOwner(req: NextRequest): NextResponse | null {
  if (verifyOwnerToken(getBearerToken(req))) return null;
  return NextResponse.json(
    { success: false, error: 'Owner authentication required' },
    { status: 401 }
  );
}
