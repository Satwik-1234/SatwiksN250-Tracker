import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin, password } = await req.json();
    const correctPin = process.env.OWNER_PIN || '2500';
    const correctPassword = process.env.OWNER_PASSWORD || 'n250owner';

    if (pin && String(pin).trim() === String(correctPin).trim()) {
      return NextResponse.json({ success: true, message: 'Owner PIN verified' });
    }

    if (password && String(password).trim() === String(correctPassword).trim()) {
      return NextResponse.json({ success: true, message: 'Owner password verified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid PIN or password' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
