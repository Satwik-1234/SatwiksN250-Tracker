import { NextRequest, NextResponse } from 'next/server';
import { errorMessage } from '@/lib/errors';
import { createOwnerToken, getBearerToken, verifyOwnerToken } from '@/lib/ownerSession';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { pin, password } = await req.json();
    const correctPin = process.env.OWNER_PIN || '2500';
    const correctPassword = process.env.OWNER_PASSWORD || 'n250owner';

    if (pin && String(pin).trim() === String(correctPin).trim()) {
      return NextResponse.json({
        success: true,
        message: 'Owner PIN verified',
        token: createOwnerToken(),
      });
    }

    if (password && String(password).trim() === String(correctPassword).trim()) {
      return NextResponse.json({
        success: true,
        message: 'Owner password verified',
        token: createOwnerToken(),
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid PIN or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyOwnerToken(getBearerToken(req))) {
      return NextResponse.json(
        { success: false, error: 'Owner authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, pin: process.env.OWNER_PIN || '2500' });
  } catch (err) {
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
