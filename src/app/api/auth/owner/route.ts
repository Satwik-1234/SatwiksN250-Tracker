import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { errorMessage } from '@/lib/errors';
import { createOwnerToken, getBearerToken, verifyOwnerToken, getOwnerPin, getOwnerPassword } from '@/lib/ownerSession';
import { clientKey, lockedMinutes, recordFailure, clearFailures } from '@/lib/loginGuard';

export const dynamic = 'force-dynamic';

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(req: NextRequest) {
  try {
    const { pin, password } = await req.json();
    const correctPin = getOwnerPin();
    const correctPassword = getOwnerPassword();

    if (!correctPin && !correctPassword) {
      return NextResponse.json(
        { success: false, message: 'Owner login is not set up on the server. Set OWNER_PIN in the environment.' },
        { status: 503 }
      );
    }

    // Too many wrong guesses from this address, or across all addresses: wait it out.
    const ip = clientKey(req);
    const wait = Math.max(await lockedMinutes(ip), await lockedMinutes('global'));
    if (wait > 0) {
      return NextResponse.json(
        { success: false, message: `Too many wrong attempts. Try again in ${wait} ${wait === 1 ? 'minute' : 'minutes'}.` },
        { status: 429 }
      );
    }

    const pinOk = Boolean(pin && correctPin && sameSecret(String(pin).trim(), String(correctPin).trim()));
    const passwordOk = Boolean(password && correctPassword && sameSecret(String(password).trim(), String(correctPassword).trim()));

    if (pinOk || passwordOk) {
      await clearFailures(ip);
      return NextResponse.json({ success: true, message: 'Owner verified', token: createOwnerToken() });
    }

    await recordFailure(ip, 5);
    await recordFailure('global', 40);
    return NextResponse.json({ success: false, message: 'Invalid PIN or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyOwnerToken(getBearerToken(req))) {
      return NextResponse.json({ success: false, error: 'Owner authentication required' }, { status: 401 });
    }
    return NextResponse.json({ success: true, pin: getOwnerPin() });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
