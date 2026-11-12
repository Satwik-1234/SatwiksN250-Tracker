import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const PROMPTS = {
  pump:
    'This is a photo of an Indian petrol pump dispenser display. Reply with ONLY a JSON object: ' +
    '{"litres": number|null, "amount": number|null, "rate": number|null, "density": number|null}. ' +
    'litres is the volume dispensed (VOLUME/LITRE), amount is the total rupees (SALE/AMOUNT), rate is rupees per litre, density is the fuel density shown (e.g. 0.74). ' +
    'Use null for anything not clearly visible. Do not guess.',
  odometer:
    'This is a photo of a motorcycle instrument cluster. Reply with ONLY a JSON object: {"odometer": number|null}. ' +
    'odometer is the total distance (ODO) in km, not a trip meter. Use null if it is not clearly visible.',
} as const;

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

const MODELS = ['gemini-flash-latest', 'gemini-3.8-flash'];

async function ask(kind: keyof typeof PROMPTS, mime: string, data: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Photo scan is not set up. Add GEMINI_API_KEY in Vercel.');
  let status = 0;
  // Gemini sometimes answers 503 "high demand": try each model, twice, before giving up.
  for (const model of [...MODELS, ...MODELS]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mime, data } }, { text: PROMPTS[kind] }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        }),
      });
      if (res.ok) return (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      status = res.status;
      if (![429, 500, 503, 404].includes(res.status)) break;
    } catch {
      status = 504; // timed out, try the next one
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`The scan service is busy (${status}). Try again in a minute, or type it in.`);
}

/** Owner only (calls a paid/limited API). kind=pump reads the dispenser panel, kind=odometer reads the speedo. */
export async function POST(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const form = await req.formData();
    const file = form.get('file');
    const kind = form.get('kind') === 'odometer' ? 'odometer' : 'pump';
    if (!(file instanceof File) || !TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Send a JPG, PNG or WebP photo.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That photo is larger than 5 MB.' }, { status: 413 });
    const text = await ask(kind, file.type, Buffer.from(await file.arrayBuffer()).toString('base64'));
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Could not read that photo. Try a clearer one.' }, { status: 422 });
    const j = JSON.parse(match[0]);
    return NextResponse.json({ litres: num(j.litres), amount: num(j.amount), rate: num(j.rate), density: num(j.density), odometer: num(j.odometer) });
  } catch (err) {
    const msg = errorMessage(err);
    return NextResponse.json({ error: msg }, { status: /scan|set up/.test(msg) ? 502 : 500 });
  }
}
