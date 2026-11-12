import { ownerFetch } from '@/lib/ownerFetch';

export type NoteCategory = 'Breakdown' | 'Issue' | 'Good experience' | 'Review' | 'Tip' | 'Note';

export const NOTE_CATEGORIES: NoteCategory[] = ['Breakdown', 'Issue', 'Good experience', 'Review', 'Tip', 'Note'];

export interface BikeNote {
  id: string;
  title: string;
  body: string;
  category: NoteCategory;
  noteDate: string | null;
  odometer: number | null;
  rating: number | null;
  cost: number | null;
  createdAt: string;
}

export type NoteInput = Omit<BikeNote, 'id' | 'createdAt'>;

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

export async function listNotes(): Promise<BikeNote[]> {
  const res = await ownerFetch('/api/notes', { cache: 'no-store' });
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function createNote(note: NoteInput): Promise<void> {
  const res = await ownerFetch('/api/notes', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(note) });
  if (!res.ok) throw await failure(res);
}

export async function updateNote(id: string, note: NoteInput): Promise<void> {
  const res = await ownerFetch('/api/notes', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ id, ...note }) });
  if (!res.ok) throw await failure(res);
}

export async function removeNote(id: string): Promise<void> {
  const res = await ownerFetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw await failure(res);
}
