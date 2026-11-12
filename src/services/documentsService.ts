import { ownerFetch } from '@/lib/ownerFetch';

export interface BikeDocument {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
}

export const DOCUMENT_CATEGORIES = [
  'Registration (RC)',
  'Insurance',
  'PUC',
  'Driving licence',
  'Service booklet',
  'Warranty',
  'Purchase invoice',
  'Other',
];

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

export async function listDocuments(): Promise<BikeDocument[]> {
  const res = await ownerFetch('/api/documents', { cache: 'no-store' });
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function uploadDocument(
  file: File,
  meta: { title: string; category: string; expiryDate?: string; notes?: string }
): Promise<void> {
  const form = new FormData();
  form.set('file', file);
  form.set('title', meta.title);
  form.set('category', meta.category);
  if (meta.expiryDate) form.set('expiryDate', meta.expiryDate);
  if (meta.notes) form.set('notes', meta.notes);
  const res = await ownerFetch('/api/documents', { method: 'POST', body: form });
  if (!res.ok) throw await failure(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await ownerFetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw await failure(res);
}

export async function fetchDocumentBlob(id: string, download = false): Promise<Blob> {
  const res = await ownerFetch(`/api/documents/${encodeURIComponent(id)}${download ? '?download=1' : ''}`, { cache: 'no-store' });
  if (!res.ok) throw await failure(res);
  return res.blob();
}

/** The viewer detects the file type from the URL text, so hand it a data: URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(blob);
  });
}

export function saveBlobAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
