'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { Navigation, TabType } from '../components/Navigation';
import { DashboardView } from '../components/DashboardView';
import { AnalyticsView } from '../components/AnalyticsView';
import { BillingView } from '../components/BillingView';
import { TripsView } from '../components/TripsView';
import { LogsView } from '../components/LogsView';
import { ProfileView } from '../components/ProfileView';
import { QuickLogModal } from '../components/QuickLogModal';
import { SetupGuideModal } from '../components/SetupGuideModal';
import { OwnerAuthModal } from '../components/OwnerAuthModal';
import { AddServiceModal } from '../components/AddServiceModal';
import { AddAccessoryModal } from '../components/AddAccessoryModal';
import { ServiceLogsView } from '../components/ServiceLogsView';
import { AccessoriesView } from '../components/AccessoriesView';
import { Footer } from '../components/Footer';
import { StorageService, REAL_RAW_LOGS, REAL_RAW_TRIPS } from '../services/googleSheetsService';
import {
  subscribeToFuelLogs,
  subscribeToServiceLogs,
  subscribeToAccessories,
  addFuelLogToSupabase,
  subscribeToAuthChanges,
  deleteShetimalLogsFromSupabase,
  uploadFileToSupabase,
  convertFileToDataUrl
} from '../services/supabaseService';
import {
  fetchFuelLogs,
  saveFuelLog,
  deleteFuelLog,
  fetchTrips,
  saveTrip,
  deleteTrip,
  fetchServices,
  saveService,
  deleteService,
  fetchAccessories,
  saveAccessory,
  deleteAccessory,
  checkBackendHealth,
  autoInitializeDatabase,
} from '../services/backendService';
import { FuelLog, Trip, GoogleSheetConfig, DashboardMetrics, ServiceLog, AccessoryGear } from '../types/fuel';

const STORAGE_KEY_OWNER_MODE = 'n250_owner_unlocked_v1';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [services, setServices] = useState<ServiceLog[]>([]);
  const [accessories, setAccessories] = useState<AccessoryGear[]>([]);
  const [config, setConfig] = useState<GoogleSheetConfig>({ webAppUrl: '', autoSync: true });
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    latestFuelPrice: 0,
    currentTripKm: 0,
    avgMileage: 0,
    avgFuelCost: 0,
    costPerKm: 0,
    totalSpent: 0,
    totalDistance: 0,
    totalLitres: 0,
    totalLogsCount: 0,
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState<boolean>(false);
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceLog | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryGear | null>(null);

  // Helper: merge two log arrays, deduplicating by date+odometer+fuelAmount
  const mergeLogs = (primary: FuelLog[], secondary: FuelLog[]): FuelLog[] => {
    const makeKey = (l: FuelLog) =>
      `${new Date(l.date).toISOString().split('T')[0]}_${l.odometer}_${l.fuelAmount}`;
    const seen = new Set(primary.map(makeKey));
    const missing = secondary.filter((l) => !seen.has(makeKey(l)));
    if (missing.length === 0) return primary;
    return [...primary, ...missing].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Track whether we've already triggered migration this session
  const migrationTriggered = React.useRef(false);

  // Load initial data & owner lock state on mount
  useEffect(() => {
    // 1. Instant baseline data so UI renders immediately without delay
    const localLogs = StorageService.getLogs();
    const baselineLogs = StorageService.recalculateDerivedFields(
      localLogs && localLogs.length > 0 ? localLogs : REAL_RAW_LOGS
    );
    const loadedTrips = StorageService.getTrips();
    const loadedServices = StorageService.getServices();
    const loadedAccessories = StorageService.getAccessories();
    const loadedConfig = StorageService.getConfig();

    setLogs(baselineLogs);
    setTrips(loadedTrips);
    setServices(loadedServices);
    setAccessories(loadedAccessories);
    setConfig(loadedConfig);
    setMetrics(StorageService.calculateMetrics(baselineLogs));

    // Check if owner was previously unlocked
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY_OWNER_MODE) === 'true') {
      setIsOwnerMode(true);
    }

    // 2. PostgreSQL Backend Connection & Auto-Initialization
    checkBackendHealth().then(async (health) => {
      if (health.connected && !health.ready) {
        console.log('[PostgreSQL] Initializing tables and seeding baseline data...');
        await autoInitializeDatabase();
      }

      // Fetch live data from PostgreSQL API
      const [dbLogs, dbTrips, dbServices, dbAccessories] = await Promise.all([
        fetchFuelLogs(),
        fetchTrips(),
        fetchServices(),
        fetchAccessories(),
      ]);

      if (dbLogs && dbLogs.length > 0) {
        const merged = mergeLogs(baselineLogs, dbLogs);
        const recalculated = StorageService.recalculateDerivedFields(merged);
        setLogs(recalculated);
        setMetrics(StorageService.calculateMetrics(recalculated));
        StorageService.saveLogs(recalculated);
      }

      if (dbTrips && dbTrips.length > 0) {
        setTrips(dbTrips);
      }

      if (dbServices && dbServices.length > 0) {
        setServices(dbServices);
      }

      if (dbAccessories && dbAccessories.length > 0) {
        setAccessories(dbAccessories);
      }
    }).catch((err) => {
      console.warn('[PostgreSQL] Could not reach backend API, running with local cache:', err);
    });

    deleteShetimalLogsFromSupabase().catch(() => {});

    // Subscribe to auth state (for Supabase OAuth if used)
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      if (user) {
        setIsOwnerMode(true);
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_OWNER_MODE, 'true');
      }
    });

    // Realtime listener fallback for fuel logs
    const unsubscribeFirebase = subscribeToFuelLogs((liveSupabaseLogs) => {
      if (liveSupabaseLogs && liveSupabaseLogs.length > 0) {
        setLogs((currentLogs) => {
          const merged = mergeLogs(currentLogs, liveSupabaseLogs);
          const recalculated = StorageService.recalculateDerivedFields(merged);
          StorageService.saveLogs(recalculated);
          setMetrics(StorageService.calculateMetrics(recalculated));
          return recalculated;
        });
      }
    });

    // Realtime listener for service bills & logs
    const unsubscribeServices = subscribeToServiceLogs((liveServices) => {
      if (liveServices && liveServices.length > 0) {
        setServices(liveServices);
        StorageService.saveServices(liveServices);
      }
    });

    // Realtime listener for bike accessories & gear
    const unsubscribeAccessories = subscribeToAccessories((liveAcc) => {
      if (liveAcc && liveAcc.length > 0) {
        setAccessories(liveAcc);
        StorageService.saveAccessories(liveAcc);
      }
    });

    return () => {
      unsubscribeFirebase();
      unsubscribeServices();
      unsubscribeAccessories();
      unsubscribeAuth();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenLogModal = () => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
    } else {
      setIsLogModalOpen(true);
    }
  };

  const handleUnlockOwnerMode = () => {
    setIsOwnerMode(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OWNER_MODE, 'true');
    }
    showToast('🔓 Owner Access Unlocked! Full editing enabled.');
    setIsLogModalOpen(true);
  };

  const handleLockOwnerMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_OWNER_MODE);
    }
    import('../services/supabaseService').then(({ signOutUser }) => {
      signOutUser().catch(() => {});
    });
    setIsOwnerMode(false);
    showToast('🔒 Signed Out. App is now in Read-Only Mode.');
  };

  // Handle adding a new fuel refill log
  const handleSaveLog = async (newLogData: Omit<FuelLog, 'id' | 'synced'>) => {
    const tempId = `log-${Date.now()}`;
    const newLog: FuelLog = {
      ...newLogData,
      id: tempId,
      synced: false,
    };

    const updatedLogs = StorageService.recalculateDerivedFields([newLog, ...logs]);
    setLogs(updatedLogs);
    setMetrics(StorageService.calculateMetrics(updatedLogs));
    StorageService.saveLogs(updatedLogs);

    setIsSyncing(true);
    try {
      // 1. Save to PostgreSQL Backend (Primary)
      const res = await saveFuelLog(newLogData);
      if (res.success) {
        newLog.id = res.id;
        newLog.synced = true;
        showToast('🔥 Saved securely to PostgreSQL Database!');
      } else {
        // Fallback to Supabase client if configured
        try {
          const supabaseId = await addFuelLogToSupabase(newLogData);
          newLog.id = supabaseId;
          newLog.synced = true;
          showToast('🔥 Saved to Supabase Database!');
        } catch {
          showToast('✅ Saved to local storage.');
        }
      }
    } catch (err) {
      console.error('Save failed, saved to local:', err);
    }

    // 2. Optional Google Sheet Backup (if webhook configured)
    if (config.webAppUrl) {
      StorageService.syncLogToGoogleSheet(newLog, config.webAppUrl).catch(() => {});
    }

    setIsSyncing(false);
  };

  const handleSaveService = async (newLogData: Omit<ServiceLog, 'id'>, file?: File, editId?: string) => {
    setIsSyncing(true);
    try {
      let documentUrl = newLogData.documentUrl;
      let uploadWarning: string | undefined;

      if (file) {
        try {
          documentUrl = await uploadFileToSupabase(file, 'service_bills');
        } catch (uploadErr: any) {
          console.warn('Supabase storage upload error, using Data URL fallback:', uploadErr.message);
          documentUrl = await convertFileToDataUrl(file);
        }
      }

      const serviceToSave = { ...newLogData, documentUrl };

      if (editId) {
        showToast('Updating Service Log in PostgreSQL...');
        await saveService(serviceToSave, editId);
        const refreshed = await fetchServices();
        setServices(refreshed);
        showToast('✅ Service updated in PostgreSQL!');
      } else {
        showToast('Saving Service Log to PostgreSQL...');
        const res = await saveService(serviceToSave);
        const refreshed = await fetchServices();
        setServices(refreshed.length > 0 ? refreshed : [{ ...serviceToSave, id: res.id || `srv-${Date.now()}` }, ...services]);
        showToast('✅ Service saved to PostgreSQL!');
      }
    } catch (e: any) {
      showToast('❌ Failed to save service: ' + e.message);
    }
    setEditingService(null);
    setIsSyncing(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    await deleteService(id);
    showToast('Service log deleted from PostgreSQL.');
  };

  const handleSaveAccessory = async (newAccessoryData: Omit<AccessoryGear, 'id'>, file?: File, editId?: string) => {
    setIsSyncing(true);
    try {
      let photoUrl = newAccessoryData.photoUrl;

      if (file) {
        try {
          photoUrl = await uploadFileToSupabase(file, 'accessories');
        } catch (uploadErr: any) {
          console.warn('Photo upload error, using Data URL fallback:', uploadErr.message);
          photoUrl = await convertFileToDataUrl(file);
        }
      }

      const accessoryToSave = { ...newAccessoryData, photoUrl };

      if (editId) {
        showToast('Updating Accessory in PostgreSQL...');
        await saveAccessory(accessoryToSave, editId);
        const refreshed = await fetchAccessories();
        setAccessories(refreshed);
        showToast('✅ Accessory updated in PostgreSQL!');
      } else {
        showToast('Saving Accessory to PostgreSQL...');
        const res = await saveAccessory(accessoryToSave);
        const refreshed = await fetchAccessories();
        setAccessories(refreshed.length > 0 ? refreshed : [{ ...accessoryToSave, id: res.id || `acc-${Date.now()}` }, ...accessories]);
        showToast('✅ Accessory saved to PostgreSQL!');
      }
    } catch (e: any) {
      showToast('❌ Failed to save accessory: ' + e.message);
    }
    setEditingAccessory(null);
    setIsSyncing(false);
  };

  const handleDeleteAccessory = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setAccessories((prev) => prev.filter((a) => a.id !== id));
    await deleteAccessory(id);
    showToast('Accessory removed from PostgreSQL.');
  };

  // Handle adding a new trip
  const handleAddTrip = async (newTripData: Omit<Trip, 'id'>) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    const tempId = `trip-${Date.now()}`;
    const newTrip: Trip = {
      ...newTripData,
      id: tempId,
    };
    const updatedTrips = [newTrip, ...trips];
    setTrips(updatedTrips);
    StorageService.saveTrips(updatedTrips);

    const res = await saveTrip(newTripData);
    if (res.success) {
      newTrip.id = res.id;
      showToast(`Trip "${newTrip.name}" saved to PostgreSQL!`);
    } else {
      showToast(`Trip "${newTrip.name}" saved locally.`);
    }
  };

  // Handle deleting a trip
  const handleDeleteTrip = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    const updatedTrips = trips.filter((t) => t.id !== id);
    setTrips(updatedTrips);
    StorageService.saveTrips(updatedTrips);
    await deleteTrip(id);
    showToast('Trip deleted from PostgreSQL.');
  };

  // Handle deleting a log
  const handleDeleteLog = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    const updatedLogs = StorageService.recalculateDerivedFields(logs.filter((l) => l.id !== id));
    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
    setMetrics(StorageService.calculateMetrics(updatedLogs));
    await deleteFuelLog(id);
    showToast('Log entry removed from PostgreSQL.');
  };

  // Handle saving config
  const handleSaveConfig = (newConfig: GoogleSheetConfig) => {
    setConfig(newConfig);
    StorageService.saveConfig(newConfig);
    showToast(newConfig.webAppUrl ? 'Google Sheet linked!' : 'Sync config updated');
  };

  const latestOdometer = logs.length > 0 ? Math.max(...logs.map((l) => l.odometer)) : 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl animate-fade-up flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        {/* Header */}
        <Header
          config={config}
          onOpenLogModal={handleOpenLogModal}
          onOpenSetupModal={() => setIsSetupModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isOwnerMode={isOwnerMode}
          onLockOwnerMode={handleLockOwnerMode}
          isSyncing={isSyncing}
        />

        {/* Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
        />

        {/* Main View Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12">
          {activeTab === 'dashboard' && (
            <>
              {isOwnerMode && (
                <div className="mb-4 flex justify-end">
                  <button 
                    onClick={async () => {
                      try {
                        showToast('Syncing & initializing PostgreSQL database...');
                        const result = await autoInitializeDatabase();
                        if (result.success) {
                          showToast(`✅ PostgreSQL Synced! ${result.message}`);
                          const [dbLogs, dbTrips] = await Promise.all([fetchFuelLogs(), fetchTrips()]);
                          if (dbLogs.length > 0) setLogs(dbLogs);
                          if (dbTrips.length > 0) setTrips(dbTrips);
                        } else {
                          showToast('❌ Sync: ' + (result.message || 'Error connecting to Postgres'));
                        }
                      } catch(e: any) {
                        showToast('❌ Sync Failed: ' + e.message);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                  >
                    ⚡ Re-sync PostgreSQL Backend
                  </button>
                </div>
              )}
              <DashboardView
                metrics={metrics}
                recentLogs={logs}
                recentTrips={trips}
                services={services}
                accessories={accessories}
                onOpenLogModal={handleOpenLogModal}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
                isOwnerMode={isOwnerMode}
              />
            </>
          )}

          {activeTab === 'billing' && (
            <BillingView 
              logs={logs}
              services={services}
              accessories={accessories}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView logs={logs} metrics={metrics} />}

          {activeTab === 'trips' && (
            <TripsView
              trips={trips}
              onAddTrip={handleAddTrip}
              onDeleteTrip={handleDeleteTrip}
              latestOdometer={latestOdometer}
              isOwnerMode={isOwnerMode}
            />
          )}

          {activeTab === 'logs' && <LogsView logs={logs} onDeleteLog={handleDeleteLog} />}
          
          {activeTab === 'services' && (
            <ServiceLogsView
              services={services}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => { setEditingService(null); setIsServiceModalOpen(true); }}
              onEditService={(service) => { setEditingService(service); setIsServiceModalOpen(true); }}
              onDeleteService={handleDeleteService}
            />
          )}

          {activeTab === 'accessories' && (
            <AccessoriesView
              accessories={accessories}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => { setEditingAccessory(null); setIsAccessoryModalOpen(true); }}
              onEditAccessory={(item) => { setEditingAccessory(item); setIsAccessoryModalOpen(true); }}
              onDeleteAccessory={handleDeleteAccessory}
            />
          )}

          {activeTab === 'profile' && <ProfileView metrics={metrics} accessories={accessories} services={services} />}
        </main>
      </div>

      {/* Footer */}
      <Footer config={config} isOwnerMode={isOwnerMode} onOpenSetupModal={() => setIsSetupModalOpen(true)} />

      {/* Owner Auth Modal */}
      <OwnerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUnlockSuccess={handleUnlockOwnerMode}
      />

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSaveLog={handleSaveLog}
        latestOdometer={latestOdometer}
      />
      
      {/* Service Modal */}
      {isServiceModalOpen && (
        <AddServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
          onSave={handleSaveService}
          latestOdometer={latestOdometer}
          editData={editingService}
        />
      )}

      {/* Accessory Modal */}
      {isAccessoryModalOpen && (
        <AddAccessoryModal
          isOpen={isAccessoryModalOpen}
          onClose={() => { setIsAccessoryModalOpen(false); setEditingAccessory(null); }}
          onSave={handleSaveAccessory}
          editData={editingAccessory}
        />
      )}

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* Mobile Floating Action Button (Quick Refill on the go) */}
      <button
        onClick={handleOpenLogModal}
        aria-label="Quick Log Refill"
        title="Log Refill"
        className="md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 rounded-2xl bg-blue-600 text-white shadow-[0_8px_25px_rgba(37,99,235,0.4)] flex items-center justify-center active:scale-90 transition-all hover:bg-blue-700 cursor-pointer"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
