import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { issueSessionCookie, clearSessionCookie } from '@/lib/ownerAuth';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

const attempts = new Map<string, { count: number; firstAt: number }>();

function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still perform a comparison to keep timing flat, then report mismatch.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const key = getClientKey(req);

  if (isRateLimited(key)) {
    return NextResponse.json(
      { success: false, message: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const { pin, password } = await req.json();

    const correctPin = process.env.OWNER_PIN;
    const correctPassword = process.env.OWNER_PASSWORD;

    // Fail closed: if no server-side secret is configured, owner mode is
    // unavailable rather than open. Never ship a default credential.
    if (!correctPin && !correctPassword) {
      console.error('[auth/owner] OWNER_PIN / OWNER_PASSWORD are not set on the server.');
      return NextResponse.json(
        { success: false, message: 'Owner authentication is not configured.' },
        { status: 503 }
      );
    }

    const providedPin = String(pin ?? '').trim();
    const providedPassword = String(password ?? '').trim();

    const pinOk =
      !!correctPin && providedPin.length > 0 && timingSafeEqualStrings(providedPin, correctPin.trim());
    const passwordOk =
      !!correctPassword &&
      providedPassword.length > 0 &&
      timingSafeEqualStrings(providedPassword, correctPassword.trim());

    if (pinOk || passwordOk) {
      attempts.delete(key);
      const res = NextResponse.json({ success: true, message: 'Owner verified' });
      issueSessionCookie(res, req);
      return res;
    }

    recordFailure(key);
    return NextResponse.json({ success: false, message: 'Invalid PIN or password' }, { status: 401 });
  } catch (err) {
    console.error('[auth/owner] unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearSessionCookie(res);
  return res;
}
