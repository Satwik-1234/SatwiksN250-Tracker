import { CareState } from '@/lib/care';
import { getOwnerToken, ensureOwnerToken } from '@/services/backendService';
import { fetchCareStateFromSupabase, saveCareStateToSupabase } from '@/services/supabaseService';

export interface CareHistoryRow {
  taskId: string;
  date: string;
  odometer: number | null;
}

const authHeaders = (): Record<string, string> => {
  const t = getOwnerToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/** Saves the care state to the database; falls back to the Supabase settings row if the API is down. */
export async function saveCareToCloud(
  state: CareState,
  event?: { taskId: string; date: string; odometer?: number | null }
): Promise<boolean> {
  await ensureOwnerToken();
  try {
    const res = await fetch('/api/care', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ state, event }),
    });
    if (res.ok) return true;
    if (res.status === 401 || res.status === 403) return false; // owner session missing: do not fork storage
  } catch {
    /* fall through to the settings-row fallback */
  }
  await saveCareStateToSupabase(state).catch(() => {});
  return false;
}

/**
 * Reads the shared care state. The database wins over this device's cache; if the
 * database is still empty and the owner is signed in, this device's state seeds it.
 */
export async function syncCareFromCloud(local: CareState): Promise<{ state: CareState; history: CareHistoryRow[] }> {
  try {
    const res = await fetch('/api/care', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { state: CareState; history: CareHistoryRow[] };
      const remote = data.state || {};
      if (Object.keys(remote).length === 0) {
        if (getOwnerToken()) void saveCareToCloud(local);
        return { state: local, history: [] };
      }
      return { state: { ...local, ...remote }, history: data.history || [] };
    }
  } catch {
    /* offline: use the settings-row fallback below */
  }
  const fallback = await fetchCareStateFromSupabase().catch(() => null);
  return { state: fallback ? { ...local, ...fallback } : local, history: [] };
}
