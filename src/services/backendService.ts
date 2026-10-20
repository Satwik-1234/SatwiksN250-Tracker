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
    // 1. Sync Fuel Logs that are local (synced: false or id starts with 'log-')
    const currentLogs = StorageService.getLogs();
    let logsUpdated = false;
    const newLogsList = [...currentLogs];

    for (let i = 0; i < newLogsList.length; i++) {
      const l = newLogsList[i];
      if (!l.synced || (typeof l.id === 'string' && l.id.startsWith('log-'))) {
        try {
          const res = await saveFuelLog(l);
          if (res.success && res.id && !res.id.startsWith('log-')) {
            newLogsList[i] = { ...l, id: res.id, synced: true };
            logsUpdated = true;
            syncedLogs++;
          }
        } catch (err) {
          console.warn('Failed to sync local fuel log to Supabase:', l.id, err);
        }
      }
    }
    if (logsUpdated) {
      StorageService.saveLogs(newLogsList);
    }

    // 2. Sync Trips that are local (id starts with 'trip-')
    const currentTrips = StorageService.getTrips();
    let tripsUpdated = false;
    const newTripsList = [...currentTrips];

    for (let i = 0; i < newTripsList.length; i++) {
      const t = newTripsList[i];
      if (typeof t.id === 'string' && t.id.startsWith('trip-')) {
        try {
          const res = await saveTrip(t);
          if (res.success && res.id && !res.id.startsWith('trip-')) {
            newTripsList[i] = { ...t, id: res.id };
            tripsUpdated = true;
            syncedTrips++;
          }
        } catch (err) {
          console.warn('Failed to sync local trip to Supabase:', t.id, err);
        }
      }
    }
    if (tripsUpdated) {
      StorageService.saveTrips(newTripsList);
    }

    // 3. Sync Services that are local (id starts with 'srv-')
    const currentServices = StorageService.getServices();
    let servicesUpdated = false;
    const newServicesList = [...currentServices];

    for (let i = 0; i < newServicesList.length; i++) {
      const s = newServicesList[i];
      if (typeof s.id === 'string' && s.id.startsWith('srv-')) {
        try {
          const res = await saveService(s);
          if (res.success && res.id && !res.id.startsWith('srv-')) {
            newServicesList[i] = { ...s, id: res.id };
            servicesUpdated = true;
            syncedServices++;
          }
        } catch (err) {
          console.warn('Failed to sync local service log to Supabase:', s.id, err);
        }
      }
    }
    if (servicesUpdated) {
      StorageService.saveServices(newServicesList);
    }

    // 4. Sync Accessories that are local (id starts with 'acc-')
    const currentAccessories = StorageService.getAccessories();
    let accessoriesUpdated = false;
    const newAccessoriesList = [...currentAccessories];

    for (let i = 0; i < newAccessoriesList.length; i++) {
      const a = newAccessoriesList[i];
      if (typeof a.id === 'string' && a.id.startsWith('acc-')) {
        try {
          const res = await saveAccessory(a);
          if (res.success && res.id && !res.id.startsWith('acc-')) {
            newAccessoriesList[i] = { ...a, id: res.id };
            accessoriesUpdated = true;
            syncedAccessories++;
          }
        } catch (err) {
          console.warn('Failed to sync local accessory to Supabase:', a.id, err);
        }
      }
    }
    if (accessoriesUpdated) {
      StorageService.saveAccessories(newAccessoriesList);
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

