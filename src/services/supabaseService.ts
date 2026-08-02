import { createClient, User } from '@supabase/supabase-js';
import { FuelLog } from '../types/fuel';

// Your Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --------------------------------------------------------
// SUPABASE CRUD OPERATIONS FOR FUEL LOGS
// --------------------------------------------------------

/**
 * Adds a new fuel log to Supabase.
 */
export async function addFuelLogToSupabase(log: Omit<FuelLog, 'id' | 'synced'>): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("Unauthorized: You must be logged in as the owner to add logs.");
  }

  // Parse brand and station name for the advanced schema
  let brand = '';
  let stationName = log.stationName || '';
  if (stationName.includes(' ')) {
    const parts = stationName.split(' ');
    brand = parts[0];
    stationName = parts.slice(1).join(' ');
  } else if (stationName) {
    brand = stationName;
  }

  // Parse date and time
  const d = new Date(log.date);
  const log_date = d.toISOString().split('T')[0];
  const log_time = d.toTimeString().split(' ')[0];

  const payload = {
    log_date,
    log_time,
    date_iso: log.date,
    brand,
    station_name: stationName,
    odometer: log.odometer,
    is_full_tank: log.isFullTank,
    qty_filled_litres: log.fuelAmount,
    price_per_litre: log.pricePerLitre,
    amount_paid: log.totalCost,
    distance_from_last: log.distanceCalculated,
    mileage_kmpl: log.mileageCalculated,
    cost_per_km: log.costPerKmCalculated,
    trip_type: log.tripType,
    notes: log.notes,
    synced_to_sheet: true // assuming if it gets here, it's synced or will be synced
  };

  const { data, error } = await supabase
    .from('fuel_logs')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error adding document to Supabase: ", error);
    throw error;
  }

  return data.id;
}

/**
 * Fetches all fuel logs from Supabase, ordered by Date (newest first).
 */
export async function fetchFuelLogsFromSupabase(): Promise<FuelLog[]> {
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .order('date_iso', { ascending: false });

  if (error) {
    console.error("Error fetching documents from Supabase: ", error);
    return [];
  }

  // Filter out any Shetimal / roadside top-up false duplicate entries
  const cleanData = data.filter((row: any) => {
    const sName = (row.station_name || '').toLowerCase();
    const brand = (row.brand || '').toLowerCase();
    const notes = (row.notes || '').toLowerCase();
    const isShetimal = 
      sName.includes('shetimal') || 
      brand.includes('shetimal') || 
      notes.includes('shetimal') || 
      notes.includes('roadside topup') ||
      (row.qty_filled_litres === 1.78 && row.amount_paid === 199.72);
    return !isShetimal;
  });

  return cleanData.map(mapSupabaseRowToFuelLog);
}

/**
 * Delete any false Shetimal / roadside topup logs from Supabase
 */
export async function deleteShetimalLogsFromSupabase(): Promise<void> {
  try {
    await supabase.from('fuel_logs').delete().ilike('station_name', '%shetimal%');
    await supabase.from('fuel_logs').delete().ilike('brand', '%shetimal%');
    await supabase.from('fuel_logs').delete().ilike('notes', '%roadside topup%');
    await supabase.from('fuel_logs').delete().eq('qty_filled_litres', 1.78).eq('amount_paid', 199.72);
  } catch (err) {
    console.warn('Cleanup Shetimal error:', err);
  }
}

/**
 * Subscribes to real-time updates from Supabase.
 */
export function subscribeToFuelLogs(callback: (logs: FuelLog[]) => void) {
  // First fetch the initial data
  fetchFuelLogsFromSupabase().then(callback);

  // Then subscribe to changes
  const channel = supabase
    .channel('public:fuel_logs')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'fuel_logs' },
      async () => {
        // Simple strategy: refetch all on any change
        const logs = await fetchFuelLogsFromSupabase();
        callback(logs);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// --------------------------------------------------------
// MIGRATION HELPER
// --------------------------------------------------------

export async function migrateLogsToSupabase(rawLogs: FuelLog[]) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("Unauthorized: Must be logged in to migrate.");
  }

  for (const log of rawLogs) {
    let brand = '';
    let stationName = log.stationName || '';
    if (stationName.includes(' ')) {
      const parts = stationName.split(' ');
      brand = parts[0];
      stationName = parts.slice(1).join(' ');
    } else if (stationName) {
      brand = stationName;
    }

    const d = new Date(log.date);
    const log_date = d.toISOString().split('T')[0];
    const log_time = d.toTimeString().split(' ')[0];

    const payload = {
      log_date,
      log_time,
      date_iso: log.date,
      brand,
      station_name: stationName,
      odometer: log.odometer,
      is_full_tank: log.isFullTank,
      qty_filled_litres: log.fuelAmount,
      price_per_litre: log.pricePerLitre,
      amount_paid: log.totalCost,
      distance_from_last: log.distanceCalculated,
      mileage_kmpl: log.mileageCalculated,
      cost_per_km: log.costPerKmCalculated,
      trip_type: log.tripType,
      notes: log.notes,
      synced_to_sheet: true,
      created_at: log.date // preserve original creation time conceptually
    };

    const { error } = await supabase.from('fuel_logs').insert([payload]);
    if (error) {
      console.error("Migration error for log:", log.id, error);
    }
  }
}

/**
 * Nuclear reset: delete ALL fuel_logs from Supabase and re-insert the
 * complete, correctly-calculated dataset. Use when Supabase data is
 * out of sync with Google Sheets / hardcoded data.
 */
export async function fullResetAndMigrate(correctLogs: FuelLog[]): Promise<{ success: boolean; migrated: number; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, migrated: 0, error: "Not authenticated. Sign in first." };
  }

  try {
    // Step 1: Delete all existing fuel_logs
    const { error: deleteError } = await supabase
      .from('fuel_logs')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // matches all UUIDs

    if (deleteError) {
      console.error("Delete failed:", deleteError);
      return { success: false, migrated: 0, error: deleteError.message };
    }

    // Step 2: Insert all correct logs
    let migrated = 0;
    for (const log of correctLogs) {
      let brand = '';
      let stationName = log.stationName || '';
      if (stationName.includes(' ')) {
        const parts = stationName.split(' ');
        brand = parts[0];
        stationName = parts.slice(1).join(' ');
      } else if (stationName) {
        brand = stationName;
      }

      const d = new Date(log.date);
      const log_date = d.toISOString().split('T')[0];
      const log_time = d.toTimeString().split(' ')[0];

      const payload = {
        log_date,
        log_time,
        date_iso: log.date,
        brand,
        station_name: stationName,
        odometer: log.odometer,
        is_full_tank: log.isFullTank,
        qty_filled_litres: log.fuelAmount,
        price_per_litre: log.pricePerLitre,
        amount_paid: log.totalCost,
        distance_from_last: log.distanceCalculated ?? 0,
        mileage_kmpl: log.mileageCalculated ?? null,
        cost_per_km: log.costPerKmCalculated ?? null,
        trip_type: log.tripType || 'Commute',
        notes: log.notes || '',
        synced_to_sheet: true,
      };

      const { error } = await supabase.from('fuel_logs').insert([payload]);
      if (error) {
        console.error("Migration error for log:", log.id, error);
      } else {
        migrated++;
      }
    }

    return { success: true, migrated };
  } catch (err: any) {
    return { success: false, migrated: 0, error: err.message };
  }
}

// --------------------------------------------------------
// HELPER MAPPER
// --------------------------------------------------------

function mapSupabaseRowToFuelLog(row: any): FuelLog {
  const stationNameCombined = [row.brand, row.station_name].filter(Boolean).join(' ');
  return {
    id: row.id,
    date: row.date_iso,
    odometer: row.odometer,
    fuelAmount: row.qty_filled_litres,
    totalCost: row.amount_paid,
    pricePerLitre: row.price_per_litre,
    isFullTank: row.is_full_tank,
    tripType: row.trip_type,
    stationName: stationNameCombined,
    notes: row.notes,
    distanceCalculated: row.distance_from_last,
    mileageCalculated: row.mileage_kmpl,
    costPerKmCalculated: row.cost_per_km,
    synced: row.synced_to_sheet
  };
}

// --------------------------------------------------------
// SUPABASE AUTHENTICATION (OWNER MODE)
// --------------------------------------------------------

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
        throw new Error('Incorrect email or password.');
    }
    throw new Error(error.message);
  }
  
  if (!data.user) throw new Error("Sign in failed");
  return data.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign up failed");
    return data.user;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
  if (error) throw new Error(error.message);
}

export async function signInWithPhone(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });
  if (error) throw new Error(error.message);
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<User> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("OTP Verification failed");
  return data.user;
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session?.user || null);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

// --------------------------------------------------------
// SUPABASE STORAGE (PHOTOS/DOCUMENTS)
// --------------------------------------------------------

export async function uploadFileToSupabase(file: File, path: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized: Must be logged in to upload.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('bike documents_N250')
    .upload(filePath, file);

  if (uploadError) {
    console.error('File upload failed:', uploadError.message);
    if (uploadError.message?.toLowerCase().includes('bucket') || (uploadError as any).statusCode === 400) {
      throw new Error(
        'Storage bucket "bike documents_N250" not found. Please create it in your Supabase Dashboard → Storage.'
      );
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from('bike documents_N250').getPublicUrl(filePath);
  return data.publicUrl;
}

// --------------------------------------------------------
// SERVICE LOGS CRUD
// --------------------------------------------------------

import { ServiceLog, AccessoryGear } from '../types/fuel';

export async function addServiceLog(log: Omit<ServiceLog, 'id'>, file?: File): Promise<{ id: string; uploadWarning?: string }> {
  let documentUrl = log.documentUrl;
  let uploadWarning: string | undefined;

  if (file) {
    try {
      documentUrl = await uploadFileToSupabase(file, 'service_bills');
    } catch (uploadErr: any) {
      console.warn('File upload failed, saving service log without document:', uploadErr.message);
      uploadWarning = uploadErr.message;
      // Continue saving the rest of the data without the file
    }
  }

  const payload = {
    date: log.date,
    odometer: log.odometer,
    service_type: log.serviceType,
    service_center: log.serviceCenter,
    total_cost: log.totalCost,
    notes: log.notes,
    document_url: documentUrl,
  };

  const { data, error } = await supabase.from('service_logs').insert([payload]).select().single();
  if (error) throw error;
  return { id: data.id, uploadWarning };
}

export async function fetchServiceLogs(): Promise<ServiceLog[]> {
  const { data, error } = await supabase.from('service_logs').select('*').order('date', { ascending: false });
  if (error) return [];
  return data.map(row => ({
    id: row.id,
    date: row.date,
    odometer: row.odometer,
    serviceType: row.service_type,
    serviceCenter: row.service_center,
    totalCost: row.total_cost,
    notes: row.notes,
    documentUrl: row.document_url,
  }));
}

export async function updateServiceLog(id: string, log: Omit<ServiceLog, 'id'>, file?: File): Promise<{ uploadWarning?: string }> {
  let documentUrl = log.documentUrl;
  let uploadWarning: string | undefined;

  if (file) {
    try {
      documentUrl = await uploadFileToSupabase(file, 'service_bills');
    } catch (uploadErr: any) {
      console.warn('File upload failed, updating service log without new document:', uploadErr.message);
      uploadWarning = uploadErr.message;
    }
  }

  const payload: any = {
    date: log.date,
    odometer: log.odometer,
    service_type: log.serviceType,
    service_center: log.serviceCenter,
    total_cost: log.totalCost,
    notes: log.notes,
  };
  if (documentUrl !== undefined) {
    payload.document_url = documentUrl;
  }

  const { error } = await supabase.from('service_logs').update(payload).eq('id', id);
  if (error) throw error;
  return { uploadWarning };
}

// --------------------------------------------------------
// ACCESSORIES & GEAR CRUD
// --------------------------------------------------------

export async function addAccessory(item: Omit<AccessoryGear, 'id'>, file?: File): Promise<{ id: string; uploadWarning?: string }> {
  let photoUrl = item.photoUrl;
  let uploadWarning: string | undefined;

  if (file) {
    try {
      photoUrl = await uploadFileToSupabase(file, 'accessories');
    } catch (uploadErr: any) {
      console.warn('File upload failed, saving accessory without photo:', uploadErr.message);
      uploadWarning = uploadErr.message;
      // Continue saving the rest of the data without the file
    }
  }

  const payload = {
    date_purchased: item.datePurchased,
    item_name: item.itemName,
    category: item.category,
    brand: item.brand,
    cost: item.cost,
    notes: item.notes,
    photo_url: photoUrl,
  };

  const { data, error } = await supabase.from('accessories_gear').insert([payload]).select().single();
  if (error) throw error;
  return { id: data.id, uploadWarning };
}

export async function updateAccessory(id: string, item: Omit<AccessoryGear, 'id'>, file?: File): Promise<{ uploadWarning?: string }> {
  let photoUrl = item.photoUrl;
  let uploadWarning: string | undefined;

  if (file) {
    try {
      photoUrl = await uploadFileToSupabase(file, 'accessories');
    } catch (uploadErr: any) {
      console.warn('File upload failed, updating accessory without new photo:', uploadErr.message);
      uploadWarning = uploadErr.message;
    }
  }

  const payload: any = {
    date_purchased: item.datePurchased,
    item_name: item.itemName,
    category: item.category,
    brand: item.brand,
    cost: item.cost,
    notes: item.notes,
  };
  if (photoUrl !== undefined) {
    payload.photo_url = photoUrl;
  }

  const { error } = await supabase.from('accessories_gear').update(payload).eq('id', id);
  if (error) throw error;
  return { uploadWarning };
}

export async function fetchAccessories(): Promise<AccessoryGear[]> {
  const { data, error } = await supabase.from('accessories_gear').select('*').order('date_purchased', { ascending: false });
  if (error) return [];
  return data.map(row => ({
    id: row.id,
    datePurchased: row.date_purchased,
    itemName: row.item_name,
    category: row.category,
    brand: row.brand,
    cost: row.cost,
    notes: row.notes,
    photoUrl: row.photo_url,
  }));
}

// --------------------------------------------------------
// DELETE OPERATIONS
// --------------------------------------------------------

export async function deleteServiceLog(id: string): Promise<void> {
  const { error } = await supabase.from('service_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAccessory(id: string): Promise<void> {
  const { error } = await supabase.from('accessories_gear').delete().eq('id', id);
  if (error) throw error;
}
