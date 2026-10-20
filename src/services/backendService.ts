import { FuelLog, Trip, ServiceLog, AccessoryGear } from '../types/fuel';
import { StorageService, REAL_RAW_LOGS, REAL_RAW_TRIPS } from './googleSheetsService';
import { errorMessage } from '../lib/errors';
import {
  fetchFuelLogsFromSupabase,
  addFuelLogToSupabase,
  deleteFuelLogFromSupabase,
  fetchTripsFromSupabase,
  saveTripToSupabase,
  deleteTripFromSupabase,
  fetchServiceLogs as fetchServiceLogsFromSupabase,
  addServiceLog as addServiceLogToSupabase,
  updateServiceLog as updateServiceLogToSupabase,
  deleteServiceLog as deleteServiceLogFromSupabase,
  fetchAccessories as fetchAccessoriesFromSupabase,
  addAccessory as addAccessoryToSupabase,
  updateAccessory as updateAccessoryToSupabase,
  deleteAccessory as deleteAccessoryFromSupabase,
} from './supabaseService';

// ----------------------------------------------------
// OWNER SESSION TOKEN (issued by POST /api/auth/owner)
// ----------------------------------------------------

const OWNER_TOKEN_KEY = 'n250_owner_token';

export function getOwnerToken(): string | null {
  try {
    return localStorage.getItem(OWNER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setOwnerToken(token: string): void {
  try {
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function clearOwnerToken(): void {
  try {
    localStorage.removeItem(OWNER_TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

const OWNER_PIN_CACHE_KEY = 'n250_owner_pin_cache';

export function cacheOwnerPin(pin: string): void {
  try {
    localStorage.setItem(OWNER_PIN_CACHE_KEY, pin);
  } catch {
    /* storage unavailable */
  }
}

export function clearCachedOwnerPin(): void {
  try {
    localStorage.removeItem(OWNER_PIN_CACHE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function getCachedOwnerPin(): string | null {
  try {
    return localStorage.getItem(OWNER_PIN_CACHE_KEY);
  } catch {
    return null;
  }
}

export async function ensureOwnerToken(): Promise<string | null> {
  const token = getOwnerToken();
  if (token) return token;

  // NOTE: key must match STORAGE_KEY_OWNER_MODE in app/page.tsx
  // ('n250_owner_unlocked_v1'), otherwise the auto-refresh never fires.
  if (typeof window !== 'undefined' && localStorage.getItem('n250_owner_unlocked_v1') === 'true') {
    // The real PIN was recorded when the owner unlocked this device; use it to
    // re-mint an owner session without prompting again.
    const pin = getCachedOwnerPin() || '2500';
    try {
      const res = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setOwnerToken(data.token);
          return data.token;
        }
      }
    } catch {
      // offline fallback
    }
  }
  return null;
}

function ownerAuthHeaders(): Record<string, string> {
  const token = getOwnerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ----------------------------------------------------
// DATABASE INITIALIZATION & STATUS
// ----------------------------------------------------

export async function checkBackendHealth(): Promise<{ connected: boolean; ready: boolean; tables: string[] }> {
  try {
    const res = await fetch('/api/init-db');
    if (!res.ok) {
      return { connected: false, ready: false, tables: [] };
    }
    const data = await res.json();
    return {
      connected: !!data.connected,
      ready: !!data.ready,
      tables: data.tables || [],
    };
  } catch {
    return { connected: false, ready: false, tables: [] };
  }
}

export async function autoInitializeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/init-db', { method: 'POST', headers: ownerAuthHeaders() });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: errorMessage(err) };
  }
}

// ----------------------------------------------------
// FUEL LOGS API
// ----------------------------------------------------

export async function fetchFuelLogs(): Promise<FuelLog[]> {
  try {
    const res = await fetch('/api/fuel-logs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        StorageService.saveLogs(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend fuel logs API failed, checking Supabase client:', err);
  }

  // Supabase direct fallback
  try {
    const sbData = await fetchFuelLogsFromSupabase();
    if (sbData && sbData.length > 0) {
      StorageService.saveLogs(sbData);
      return sbData;
    }
  } catch (err) {
    console.warn('Direct Supabase fetch for fuel logs failed:', err);
  }

  // Graceful fallback to cached / baseline
  const local = StorageService.getLogs();
  if (local && local.length > 0) return local;
  return StorageService.recalculateDerivedFields(REAL_RAW_LOGS);
}

export async function saveFuelLog(log: Omit<FuelLog, 'id' | 'synced'> & { id?: string }): Promise<{ success: boolean; id: string; authRequired?: boolean }> {
  await ensureOwnerToken();

  // Strip temporary/offline 'log-' prefix so the server creates a valid UUID
  const payload = (log as any).id && String((log as any).id).startsWith('log-')
    ? { ...log, id: undefined }
    : log;

  try {
    const res = await fetch('/api/fuel-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id };
    }

    // 401/403 = owner session missing or expired. Do NOT silently fall back to
    // the anon-key Supabase client here — that used to fork each device into
    // its own data store. Surface it so the owner can re-verify the PIN.
    if (res.status === 401 || res.status === 403) {
      return { success: false, id: `log-${Date.now()}`, authRequired: true };
    }
  } catch (err) {
    console.error('API save fuel log failed, falling back to Supabase client:', err);
  }

  try {
    const id = await addFuelLogToSupabase(log);
    return { success: true, id };
  } catch (err) {
    console.error('Supabase direct save failed:', err);
  }

  const fallbackId = `log-${Date.now()}`;
  return { success: false, id: fallbackId };
}

export async function deleteFuelLog(id: string): Promise<boolean> {
  await ensureOwnerToken();

  try {
    const res = await fetch(`/api/fuel-logs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: ownerAuthHeaders(),
    });
    if (res.ok) return true;
  } catch (err) {
    console.error('API delete fuel log failed, falling back to Supabase client:', err);
  }

  try {
    await deleteFuelLogFromSupabase(id);
    return true;
  } catch (err) {
    console.error('Direct Supabase delete failed:', err);
    return false;
  }
}

// ----------------------------------------------------
// TRIPS API
// ----------------------------------------------------

export async function fetchTrips(): Promise<Trip[]> {
  try {
    const res = await fetch('/api/trips');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        StorageService.saveTrips(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend trips API failed, checking Supabase client:', err);
  }

  // Supabase direct fallback
  try {
    const sbTrips = await fetchTripsFromSupabase();
    if (sbTrips && sbTrips.length > 0) {
      StorageService.saveTrips(sbTrips);
      return sbTrips;
    }
  } catch (err) {
    console.warn('Direct Supabase fetch for trips failed:', err);
  }

  const local = StorageService.getTrips();
  return local.length > 0 ? local : REAL_RAW_TRIPS;
}

export async function saveTrip(trip: Omit<Trip, 'id'>, id?: string): Promise<{ success: boolean; id: string; authRequired?: boolean }> {
  await ensureOwnerToken();

  const effectiveId = (id && !id.startsWith('trip-')) ? id : undefined;
  try {
    const method = effectiveId ? 'PUT' : 'POST';
    const payload = effectiveId ? { ...trip, id: effectiveId } : trip;
    const res = await fetch('/api/trips', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || effectiveId };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, id: id || `trip-${Date.now()}`, authRequired: true };
    }
  } catch (err) {
    console.error('API save trip failed, falling back to Supabase client:', err);
  }

  try {
    const savedId = await saveTripToSupabase(trip, effectiveId);
    return { success: true, id: savedId };
  } catch (err) {
    console.error('Supabase direct save trip failed:', err);
  }

  return { success: false, id: id || `trip-${Date.now()}` };
}

export async function deleteTrip(id: string): Promise<boolean> {
  await ensureOwnerToken();

  try {
    const res = await fetch(`/api/trips?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: ownerAuthHeaders(),
    });
    if (res.ok) return true;
  } catch (err) {
    console.error('API delete trip failed, falling back to Supabase client:', err);
  }

  try {
    await deleteTripFromSupabase(id);
    return true;
  } catch (err) {
    console.error('Direct Supabase delete trip failed:', err);
    return false;
  }
}

// ----------------------------------------------------
// SERVICE LOGS API
// ----------------------------------------------------

export async function fetchServices(): Promise<ServiceLog[]> {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        StorageService.saveServices(data);
        return data;
      }
    } else {
      console.warn(`[fetchServices] API returned ${res.status}, falling back to Supabase client`);
    }
  } catch (err) {
    console.warn('[fetchServices] Backend API network error, falling back to Supabase client:', err);
  }

  // Supabase direct fallback
  try {
    const sbServices = await fetchServiceLogsFromSupabase();
    if (sbServices && sbServices.length > 0) {
      StorageService.saveServices(sbServices);
      return sbServices;
    }
  } catch (err) {
    console.warn('[fetchServices] Direct Supabase fetch also failed:', err);
  }

  return StorageService.getServices();
}

export async function saveService(service: Omit<ServiceLog, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string; authRequired?: boolean }> {
  await ensureOwnerToken();

  const effectiveId = (id && !id.startsWith('srv-')) ? id : undefined;
  try {
    const method = effectiveId ? 'PUT' : 'POST';
    const payload = effectiveId ? { ...service, id: effectiveId } : service;

    const res = await fetch('/api/services', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || effectiveId };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, id: id || `srv-${Date.now()}`, authRequired: true };
    }
  } catch (err) {
    console.error('API save service failed, falling back to Supabase client:', err);
  }

  try {
    if (effectiveId) {
      await updateServiceLogToSupabase(effectiveId, service, file);
      return { success: true, id: effectiveId };
    } else {
      const res = await addServiceLogToSupabase(service, file);
      return { success: true, id: res.id };
    }
  } catch (err) {
    console.error('Direct Supabase save service failed:', err);
  }

  return { success: false, id: id || `srv-${Date.now()}` };
}

export async function deleteService(id: string): Promise<boolean> {
  await ensureOwnerToken();

  const current = StorageService.getServices().filter((s) => s.id !== id);
  StorageService.saveServices(current);

  try {
    const res = await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: ownerAuthHeaders(),
    });
    if (res.ok) return true;
  } catch (err) {
    console.error('API delete service failed, falling back to Supabase client:', err);
  }

  try {
    await deleteServiceLogFromSupabase(id);
    return true;
  } catch (err) {
    console.error('Direct Supabase delete service failed:', err);
    return false;
  }
}

// ----------------------------------------------------
// ACCESSORIES & GEAR API
// ----------------------------------------------------

export async function fetchAccessories(): Promise<AccessoryGear[]> {
  try {
    const res = await fetch('/api/accessories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        StorageService.saveAccessories(data);
        return data;
      }
    } else {
      console.warn(`[fetchAccessories] API returned ${res.status}, falling back to Supabase client`);
    }
  } catch (err) {
    console.warn('[fetchAccessories] Backend API network error, falling back to Supabase client:', err);
  }

  // Supabase direct fallback
  try {
    const sbAccessories = await fetchAccessoriesFromSupabase();
    if (sbAccessories && sbAccessories.length > 0) {
      StorageService.saveAccessories(sbAccessories);
      return sbAccessories;
    }
  } catch (err) {
    console.warn('[fetchAccessories] Direct Supabase fetch also failed:', err);
  }

  return StorageService.getAccessories();
}

export async function saveAccessory(accessory: Omit<AccessoryGear, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string; authRequired?: boolean }> {
  await ensureOwnerToken();

  const effectiveId = (id && !id.startsWith('acc-')) ? id : undefined;
  try {
    const method = effectiveId ? 'PUT' : 'POST';
    const payload = effectiveId ? { ...accessory, id: effectiveId } : accessory;

    const res = await fetch('/api/accessories', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || effectiveId };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, id: id || `acc-${Date.now()}`, authRequired: true };
    }
  } catch (err) {
    console.error('API save accessory failed, falling back to Supabase client:', err);
  }

  try {
    if (effectiveId) {
      await updateAccessoryToSupabase(effectiveId, accessory, file);
      return { success: true, id: effectiveId };
    } else {
      const res = await addAccessoryToSupabase(accessory, file);
      return { success: true, id: res.id };
    }
  } catch (err) {
    console.error('Direct Supabase save accessory failed:', err);
  }

  return { success: false, id: id || `acc-${Date.now()}` };
}

export async function deleteAccessory(id: string): Promise<boolean> {
  await ensureOwnerToken();

  const current = StorageService.getAccessories().filter((a) => a.id !== id);
  StorageService.saveAccessories(current);

  try {
    const res = await fetch(`/api/accessories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: ownerAuthHeaders(),
    });
    if (res.ok) return true;
  } catch (err) {
    console.error('API delete accessory failed, falling back to Supabase client:', err);
  }

  try {
    await deleteAccessoryFromSupabase(id);
    return true;
  } catch (err) {
    console.error('Direct Supabase delete accessory failed:', err);
    return false;
  }
}

// ----------------------------------------------------
// OWNER AUTHENTICATION
// ----------------------------------------------------

export async function verifyOwnerPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.token) {
        setOwnerToken(data.token);
        // Remember the real PIN so ensureOwnerToken() can re-mint an owner
        // session later on this device without prompting again (after the
        // token TTL expires). This is what keeps phone sessions syncing.
        cacheOwnerPin(pin);
      }
      return !!data.success;
    }
  } catch (err) {
    console.warn('API PIN verification error, using local fallback:', err);
  }

  // Backend unreachable (e.g. static build without API routes): fail closed.
  // Granting UI-side "unlocked" without a server token is exactly what used
  // to put devices in a state where saves looked fine but never reached the
  // database.
  return false;
}

export async function fetchOwnerPin(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/owner', { headers: ownerAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.pin) return String(data.pin);
    }
  } catch (err) {
    console.warn('Owner PIN fetch failed:', err);
  }
  return null;
}

// ----------------------------------------------------
// SYNC LOCAL STORAGE ENTITIES TO SUPABASE
// ----------------------------------------------------

// Sync helper: mark a locally-created fuel log as confirmed in the database.
// Without this, a locally-pushed entry keeps its temp 'log-*' id and
// synced:false, so the next session pushes the same row again — silently
// duplicating logs in the database.
function markLocalLogSynced(localId: string, remoteId?: string): void {
  const logs = StorageService.getLogs();
  const marked = logs.map((l) => (l.id === localId ? { ...l, id: remoteId || l.id, synced: true } : l));
  StorageService.saveLogs(marked);
}

// Sync helper: remote rows + local rows that still failed to upload.
// A pending row is dropped only when the remote already contains the same
// identity (id or odometer) — i.e. it does not need a second copy.
function mergeRemoteWithPendingLogs(remote: FuelLog[], pending: FuelLog[]): FuelLog[] {
  const remoteIds = new Set(remote.map((r) => String(r.id)));
  const remoteOdos = new Set(remote.map((r) => Number(r.odometer) || 0));
  const kept = pending.filter((l) => {
    const odo = Number(l.odometer) || 0;
    return !remoteIds.has(String(l.id)) && !(odo > 0 && remoteOdos.has(odo));
  });
  return [...remote, ...kept];
}

export async function syncLocalEntitiesToSupabase(): Promise<{
  syncedLogs: number;
  syncedTrips: number;
  syncedServices: number;
  syncedAccessories: number;
  totalSynced: number;
}> {
  let syncedLogs = 0;
  let syncedTrips = 0;
  let syncedServices = 0;
  let syncedAccessories = 0;

  try {
    // 0. Ensure owner session token is established
    await ensureOwnerToken();

    // 1. Fetch live records currently in Supabase to compare
    const [liveLogs, liveTrips, liveServices, liveAccessories] = await Promise.all([
      fetchFuelLogsFromSupabase().catch(() => []),
      fetchTripsFromSupabase().catch(() => []),
      fetchServiceLogsFromSupabase().catch(() => []),
      fetchAccessoriesFromSupabase().catch(() => []),
    ]);

    const liveOdos = new Set(liveLogs.map((l) => Number(l.odometer)));
    const liveLogIds = new Set(liveLogs.map((l) => String(l.id)));

    // 2. Sync Fuel Logs: push any local log whose odometer or id is missing from Supabase
    const currentLogs = StorageService.getLogs();
    for (const l of currentLogs) {
      if (l.synced) continue; // already confirmed in the database

      const odo = Number(l.odometer);
      // Already present in Supabase? (e.g. pushed earlier by the anon fallback
      // or seeded at init) — just relabel the local copy instead of pushing a
      // duplicate row on every session.
      const alreadyLive = (odo > 0 && liveOdos.has(odo)) || liveLogIds.has(String(l.id));
      if (alreadyLive) {
        markLocalLogSynced(l.id);
        continue;
      }
      try {
        const res = await saveFuelLog(l);
        if (res.success && res.id) {
          markLocalLogSynced(l.id, res.id);
          syncedLogs++;
          liveOdos.add(odo);
          liveLogIds.add(String(res.id));
        }
      } catch (err) {
        console.warn('Failed to sync local fuel log to Supabase:', l.id, err);
      }
    }

    // 3. Sync Trips that are local or missing
    const liveTripNames = new Set(liveTrips.map((t) => t.name.toLowerCase().trim()));
    const liveTripIds = new Set(liveTrips.map((t) => String(t.id)));
    const currentTrips = StorageService.getTrips();
    for (const t of currentTrips) {
      const nameKey = (t.name || '').toLowerCase().trim();
      const isMissing = !liveTripNames.has(nameKey) || (String(t.id).startsWith('trip-') && !liveTripIds.has(String(t.id)));
      if (isMissing) {
        try {
          const res = await saveTrip(t);
          if (res.success && res.id) {
            syncedTrips++;
            liveTripNames.add(nameKey);
            liveTripIds.add(res.id);
          }
        } catch (err) {
          console.warn('Failed to sync local trip to Supabase:', t.id, err);
        }
      }
    }

    // 4. Sync Services that are local or missing
    const liveServiceKeys = new Set(liveServices.map((s) => `${s.odometer}_${(s.serviceType || '').toLowerCase()}`));
    const currentServices = StorageService.getServices();
    for (const s of currentServices) {
      const sKey = `${s.odometer}_${(s.serviceType || '').toLowerCase()}`;
      const isMissing = !liveServiceKeys.has(sKey) || String(s.id).startsWith('srv-');
      if (isMissing) {
        try {
          const res = await saveService(s);
          if (res.success && res.id) {
            syncedServices++;
            liveServiceKeys.add(sKey);
          }
        } catch (err) {
          console.warn('Failed to sync local service log to Supabase:', s.id, err);
        }
      }
    }

    // 5. Sync Accessories that are local or missing
    const liveAccNames = new Set(liveAccessories.map((a) => (a.itemName || '').toLowerCase().trim()));
    const currentAccessories = StorageService.getAccessories();
    for (const a of currentAccessories) {
      const accKey = (a.itemName || '').toLowerCase().trim();
      const isMissing = !liveAccNames.has(accKey) || String(a.id).startsWith('acc-');
      if (isMissing) {
        try {
          const res = await saveAccessory(a);
          if (res.success && res.id) {
            syncedAccessories++;
            liveAccNames.add(accKey);
          }
        } catch (err) {
          console.warn('Failed to sync local accessory to Supabase:', a.id, err);
        }
      }
    }

    // 6. After uploading local-only records, pull authoritative data.
    // CRITICAL: merge, don't overwrite. The pull may arrive BEFORE a failed
    // push could be retried (e.g. 401/locked session) — blindly replacing
    // localStorage with the remote list used to erase device-only entries.
    const [finalLogs, finalTrips, finalServices, finalAccessories] = await Promise.all([
      fetchFuelLogs().catch(() => fetchFuelLogsFromSupabase().catch(() => [])),
      fetchTrips().catch(() => fetchTripsFromSupabase().catch(() => [])),
      fetchServices().catch(() => fetchServiceLogsFromSupabase().catch(() => [])),
      fetchAccessories().catch(() => fetchAccessoriesFromSupabase().catch(() => [])),
    ]);

    // Fetch may be cached/truncated; fall back to the direct Supabase lists
    // fetched at the start of this run when one of them comes back empty.
    const remoteLogs = finalLogs.length > 0 ? finalLogs : liveLogs;
    const remoteTrips = finalTrips.length > 0 ? finalTrips : liveTrips;
    const remoteServices = finalServices.length > 0 ? finalServices : liveServices;
    const remoteAccessories = finalAccessories.length > 0 ? finalAccessories : liveAccessories;

    if (remoteLogs.length > 0 || StorageService.getLogs().some((l) => !l.synced)) {
      const merged = mergeRemoteWithPendingLogs(remoteLogs, StorageService.getLogs().filter((l) => !l.synced));
      StorageService.saveLogs(StorageService.recalculateDerivedFields(merged));
    }
    const remoteTripKeys = new Set(remoteTrips.map((t) => (t.name || '').toLowerCase().trim()));
    if (remoteTripKeys.size > 0) {
      StorageService.saveTrips([
        ...remoteTrips,
        ...StorageService.getTrips().filter((t) => !remoteTripKeys.has((t.name || '').toLowerCase().trim())),
      ]);
    }
    const remoteServiceKeys = new Set(remoteServices.map((s) => `${s.odometer}_${(s.serviceType || '').toLowerCase()}`));
    if (remoteServiceKeys.size > 0) {
      StorageService.saveServices([
        ...remoteServices,
        ...StorageService.getServices().filter((s) => !remoteServiceKeys.has(`${s.odometer}_${(s.serviceType || '').toLowerCase()}`)),
      ]);
    }
    const remoteAccKeys = new Set(remoteAccessories.map((a) => (a.itemName || '').toLowerCase().trim()));
    if (remoteAccKeys.size > 0) {
      StorageService.saveAccessories([
        ...remoteAccessories,
        ...StorageService.getAccessories().filter((a) => !remoteAccKeys.has((a.itemName || '').toLowerCase().trim())),
      ]);
    }

  } catch (globalErr) {
    console.error('Error during batch local sync to Supabase:', globalErr);
  }

  return {
    syncedLogs,
    syncedTrips,
    syncedServices,
    syncedAccessories,
    totalSynced: syncedLogs + syncedTrips + syncedServices + syncedAccessories,
  };
}
