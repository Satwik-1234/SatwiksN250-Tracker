import { ownerFetch } from '@/lib/ownerFetch';
import { compressImageFile } from '@/utils/imageCompression';

export interface PhotoReading {
  litres: number | null;
  amount: number | null;
  rate: number | null;
  density: number | null;
  odometer: number | null;
}

/** Reads the pump display ('pump') or the bike's odometer ('odometer') from a photo. */
export async function scanPhoto(file: File, kind: 'pump' | 'odometer'): Promise<PhotoReading> {
  const small = await compressImageFile(file, 1600, 1600, 0.8).catch(() => file);
  const form = new FormData();
  form.set('file', small);
  form.set('kind', kind);
  const res = await ownerFetch('/api/receipt', { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Scan failed (${res.status}).`);
  return body as PhotoReading;
}
