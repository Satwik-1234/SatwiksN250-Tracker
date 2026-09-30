import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_COOKIE = 'n250_owner_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getSessionSecret(): Buffer | null {
  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.trim().length > 0) {
    return crypto.createHash('sha256').update(explicit.trim()).digest();
  }

  // Derive from the server-only owner credentials so no additional env var is
  // strictly required. These are never exposed to the client bundle.
  const pin = process.env.OWNER_PIN;
  const password = process.env.OWNER_PASSWORD;
  if (!pin && !password) return null;

  return crypto
    .createHash('sha256')
    .update(`${pin ?? ''}|${password ?? ''}|n250-owner-session-salt`)
    .digest();
}

function isSecureRequest(req: NextRequest): boolean {
  if (req.nextUrl?.protocol === 'https:') return true;
  return req.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https';
}

export function issueSessionCookie(res: NextResponse, req: NextRequest): void {
  const secret = getSessionSecret();
  if (!secret) return;

  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  res.cookies.set(SESSION_COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

function verifySessionCookie(req: NextRequest): boolean {
  const secret = getSessionSecret();
  if (!secret) { console.error('[auth] no session secret'); return false; }

  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) { console.error('[auth] no cookie present'); return false; }

  const dot = raw.lastIndexOf('.');
  if (dot <= 0) { console.error('[auth] no dot in cookie'); return false; }

  const payload = raw.slice(0, dot);
  const sig = Buffer.from(raw.slice(dot + 1), 'base64url');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();

  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(sig, expected)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Guard for every mutating API route. Returns null when the caller is
 * authorized, or a 401 NextResponse to return immediately otherwise.
 */
export async function requireOwner(req: NextRequest): Promise<NextResponse | null> {
  if (verifySessionCookie(req)) return null;

  // Also accept a Supabase access token, so the email/password unlock path
  // (OwnerAuthModal) keeps working.
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
          const { data, error } = await createClient(url, key).auth.getUser(token);
          if (!error && data?.user) return null;
        }
      } catch {
        // fall through to unauthorized
      }
    }
  }

  return NextResponse.json({ error: 'Owner authentication required' }, { status: 401 });
}
