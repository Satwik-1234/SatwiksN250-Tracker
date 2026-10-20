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

export async function saveFuelLog(log: Omit<FuelLog, 'id' | 'synced'>): Promise<{ success: boolean; id: string }> {
  try {
    const res = await fetch('/api/fuel-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(log),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id };
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

export async function saveTrip(trip: Omit<Trip, 'id'>, id?: string): Promise<{ success: boolean; id: string }> {
  try {
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { ...trip, id } : trip;
    const res = await fetch('/api/trips', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || id };
    }
  } catch (err) {
    console.error('API save trip failed, falling back to Supabase client:', err);
  }

  try {
    const savedId = await saveTripToSupabase(trip, id);
    return { success: true, id: savedId };
  } catch (err) {
    console.error('Supabase direct save trip failed:', err);
  }

  return { success: false, id: id || `trip-${Date.now()}` };
}

export async function deleteTrip(id: string): Promise<boolean> {
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

export async function saveService(service: Omit<ServiceLog, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string }> {
  try {
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { ...service, id } : service;

    const res = await fetch('/api/services', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || id };
    }
  } catch (err) {
    console.error('API save service failed, falling back to Supabase client:', err);
  }

  try {
    if (id) {
      await updateServiceLogToSupabase(id, service, file);
      return { success: true, id };
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

export async function saveAccessory(accessory: Omit<AccessoryGear, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string }> {
  try {
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { ...accessory, id } : accessory;

    const res = await fetch('/api/accessories', {
      method,
      headers: { 'Content-Type': 'application/json', ...ownerAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, id: data.id || id };
    }
  } catch (err) {
    console.error('API save accessory failed, falling back to Supabase client:', err);
  }

  try {
    if (id) {
      await updateAccessoryToSupabase(id, accessory, file);
      return { success: true, id };
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
      }
      return !!data.success;
    }
  } catch (err) {
    console.warn('API PIN verification error, using local fallback:', err);
  }

  // Fallback to default PIN
  return pin === '2500';
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
      const odo = Number(l.odometer);
      const isMissing = (odo > 0 && !liveOdos.has(odo)) || (String(l.id).startsWith('log-') && !liveLogIds.has(String(l.id)));
      if (isMissing || !l.synced) {
        try {
          const res = await saveFuelLog(l);
          if (res.success && res.id) {
            syncedLogs++;
            liveOdos.add(odo);
            liveLogIds.add(res.id);
          }
        } catch (err) {
          console.warn('Failed to sync local fuel log to Supabase:', l.id, err);
        }
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

    // 6. After uploading local-only records, pull the authoritative data back from Supabase
    const [finalLogs, finalTrips, finalServices, finalAccessories] = await Promise.all([
      fetchFuelLogsFromSupabase().catch(() => []),
      fetchTripsFromSupabase().catch(() => []),
      fetchServiceLogsFromSupabase().catch(() => []),
      fetchAccessoriesFromSupabase().catch(() => []),
    ]);

    if (finalLogs.length > 0) {
      const recalculated = StorageService.recalculateDerivedFields(finalLogs);
      StorageService.saveLogs(recalculated);
    }
    if (finalTrips.length > 0) StorageService.saveTrips(finalTrips);
    if (finalServices.length > 0) StorageService.saveServices(finalServices);
    if (finalAccessories.length > 0) StorageService.saveAccessories(finalAccessories);

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

