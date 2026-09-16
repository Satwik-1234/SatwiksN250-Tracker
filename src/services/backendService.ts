import { FuelLog, Trip, ServiceLog, AccessoryGear } from '../types/fuel';
import { StorageService, REAL_RAW_LOGS, REAL_RAW_TRIPS } from './googleSheetsService';
import {
  fetchFuelLogsFromSupabase,
  addFuelLogToSupabase,
  deleteFuelLogFromSupabase,
  fetchTripsFromSupabase,
  saveTripToSupabase,
  deleteTripFromSupabase,
  fetchServiceLogs as fetchServiceLogsFromSupabase,
  addServiceLog as addServiceLogToSupabase,
  deleteServiceLog as deleteServiceLogFromSupabase,
  fetchAccessories as fetchAccessoriesFromSupabase,
  addAccessory as addAccessoryToSupabase,
  deleteAccessory as deleteAccessoryFromSupabase,
} from './supabaseService';

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
    const res = await fetch('/api/init-db', { method: 'POST' });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message };
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    if (sbServices && sbServices.length >= 0) {
      return sbServices;
    }
  } catch (err) {
    console.warn('[fetchServices] Direct Supabase fetch also failed:', err);
  }

  return [];
}

export async function saveService(service: Omit<ServiceLog, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string }> {
  try {
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { ...service, id } : service;

    const res = await fetch('/api/services', {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const res = await addServiceLogToSupabase(service, file);
    return { success: true, id: res.id };
  } catch (err) {
    console.error('Direct Supabase save service failed:', err);
  }

  return { success: false, id: id || `srv-${Date.now()}` };
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
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
    if (sbAccessories && sbAccessories.length >= 0) {
      return sbAccessories;
    }
  } catch (err) {
    console.warn('[fetchAccessories] Direct Supabase fetch also failed:', err);
  }

  return [];
}

export async function saveAccessory(accessory: Omit<AccessoryGear, 'id'>, id?: string, file?: File): Promise<{ success: boolean; id?: string }> {
  try {
    const method = id ? 'PUT' : 'POST';
    const payload = id ? { ...accessory, id } : accessory;

    const res = await fetch('/api/accessories', {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const res = await addAccessoryToSupabase(accessory, file);
    return { success: true, id: res.id };
  } catch (err) {
    console.error('Direct Supabase save accessory failed:', err);
  }

  return { success: false, id: id || `acc-${Date.now()}` };
}

export async function deleteAccessory(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/accessories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
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
      return !!data.success;
    }
  } catch (err) {
    console.warn('API PIN verification error, using local fallback:', err);
  }

  // Fallback to default PIN
  return pin === '2500';
}

