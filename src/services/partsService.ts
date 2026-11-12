import { ownerFetch } from '@/lib/ownerFetch';

export interface BikePart {
  id: string;
  name: string;
  brand: string | null;
  installedDate: string | null;
  installedOdometer: number | null;
  lifeKm: number | null;
  cost: number | null;
  notes: string | null;
  removedDate: string | null;
  removedOdometer: number | null;
}

export type PartInput = Omit<BikePart, 'id'>;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function failure(res: Response): Promise<Error> {
  if (res.status === 401 || res.status === 403) return new Error('Your owner session has expired. Unlock again.');
  try {
    const j = await res.json();
    if (j?.error) return new Error(String(j.error));
  } catch {
    /* no JSON body */
  }
  return new Error(`Request failed (${res.status}).`);
}

export async function listParts(): Promise<BikePart[]> {
  const res = await ownerFetch('/api/parts', { cache: 'no-store' });
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function createPart(p: PartInput): Promise<void> {
  const res = await ownerFetch('/api/parts', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(p) });
  if (!res.ok) throw await failure(res);
}

export async function updatePart(id: string, p: PartInput): Promise<void> {
  const res = await ownerFetch('/api/parts', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ id, ...p }) });
  if (!res.ok) throw await failure(res);
}

export async function deletePart(id: string): Promise<void> {
  const res = await ownerFetch(`/api/parts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw await failure(res);
}
