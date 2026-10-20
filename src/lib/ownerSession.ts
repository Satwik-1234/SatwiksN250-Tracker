import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const TOKEN_TTL_SECONDS = 12 * 60 * 60;

function getSecret(): string {
  return (
    process.env.OWNER_SESSION_SECRET ||
    process.env.OWNER_PIN ||
    process.env.OWNER_PASSWORD ||
    '2500'
  );
}

export function createOwnerToken(): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_SECONDS;
  const payload = `v1.${iat}.${exp}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyOwnerToken(token: string | null | undefined): boolean {
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
