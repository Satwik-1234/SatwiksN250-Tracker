'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Navigation, TabType } from '../components/Navigation';
import { DashboardView } from '../components/DashboardView';
import { AnalyticsView } from '../components/AnalyticsView';
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
import { StorageService } from '../services/googleSheetsService';
import { subscribeToFuelLogs, addFuelLogToSupabase, subscribeToAuthChanges, migrateLogsToSupabase, fetchServiceLogs, fetchAccessories, addServiceLog, addAccessory } from '../services/supabaseService';
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

  // Load initial data & owner lock state on mount
  useEffect(() => {
    const loadedLogs = StorageService.getLogs();
    const loadedTrips = StorageService.getTrips();
    const loadedConfig = StorageService.getConfig();

    setLogs(loadedLogs);
    setTrips(loadedTrips);
    setConfig(loadedConfig);
    setMetrics(StorageService.calculateMetrics(loadedLogs));
    
    fetchServiceLogs().then(setServices);
    fetchAccessories().then(setAccessories);

    // Subscribe to Firebase Auth state changes
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      if (user) {
        setIsOwnerMode(true);
      } else {
        setIsOwnerMode(false);
      }
    });

    // Subscribe to real-time Firebase Firestore updates
    const unsubscribeFirebase = subscribeToFuelLogs((liveFirebaseLogs) => {
      if (liveFirebaseLogs.length > 0) {
        setLogs(liveFirebaseLogs);
        StorageService.saveLogs(liveFirebaseLogs);
        setMetrics(StorageService.calculateMetrics(liveFirebaseLogs));
      }
    });

    // Fallback/Legacy Sync with public Google Sheet CSV feed if Firebase is empty/unconfigured
    StorageService.fetchFromPublicGoogleSheet().then((liveLogs) => {
      if (liveLogs && liveLogs.length > 0) {
        // Only use Sheets data if we don't have Firebase data yet
        setLogs((currentLogs) => {
          if (currentLogs.length === 0) {
            StorageService.saveLogs(liveLogs);
            setMetrics(StorageService.calculateMetrics(liveLogs));
            return liveLogs;
          }
          return currentLogs;
        });
      }
    });

    return () => {
      unsubscribeFirebase();
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
    showToast('🔓 Signed in via Google! Refill entry granted.');
    setIsLogModalOpen(true);
  };

  const handleLockOwnerMode = () => {
    import('../services/supabaseService').then(({ signOutUser }) => {
      signOutUser().then(() => {
        setIsOwnerMode(false);
        showToast('🔒 Signed Out. App is now Read-Only.');
      });
    });
  };

  // Handle adding a new fuel refill log
  const handleSaveLog = async (newLogData: Omit<FuelLog, 'id' | 'synced'>) => {
    // Generate a temporary client ID for immediate UI update
    const tempId = `log-${Date.now()}`;
    const newLog: FuelLog = {
      ...newLogData,
      id: tempId,
      synced: false,
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    setMetrics(StorageService.calculateMetrics(updatedLogs));

    setIsSyncing(true);
    try {
      // 1. Save to Supabase (Primary Database)
      const supabaseId = await addFuelLogToSupabase(newLogData);
      newLog.id = supabaseId;
      newLog.synced = true;
      showToast('🔥 Saved to Supabase securely!');
    } catch (err) {
      console.error('Supabase save failed, falling back to local', err);
    }

    // 2. Local Storage Backup
    StorageService.saveLogs(updatedLogs);

    // 3. Optional Google Sheet Backup (if webhook configured)
    if (config.webAppUrl) {
      const success = await StorageService.syncLogToGoogleSheet(newLog, config.webAppUrl);
      if (success) {
        showToast('✅ Synced to Google Sheet Backup!');
      }
    }
    
    setIsSyncing(false);
  };

  const handleSaveService = async (newLogData: Omit<ServiceLog, 'id'>, file?: File) => {
    setIsSyncing(true);
    try {
      showToast('Uploading Service Log...');
      const { id, uploadWarning } = await addServiceLog(newLogData, file);
      setServices([{ ...newLogData, id, documentUrl: file && !uploadWarning ? 'Uploading...' : newLogData.documentUrl }, ...services]);
      const refreshed = await fetchServiceLogs();
      setServices(refreshed);
      if (uploadWarning) {
        showToast('⚠️ Service saved, but file upload failed. Create the storage bucket in Supabase.');
      } else {
        showToast('✅ Service saved!');
      }
    } catch (e: any) {
      showToast('❌ Failed to save service: ' + e.message);
    }
    setIsSyncing(false);
  };

  const handleSaveAccessory = async (newAccessoryData: Omit<AccessoryGear, 'id'>, file?: File) => {
    setIsSyncing(true);
    try {
      showToast('Uploading Accessory...');
      const { id, uploadWarning } = await addAccessory(newAccessoryData, file);
      setAccessories([{ ...newAccessoryData, id, photoUrl: file && !uploadWarning ? 'Uploading...' : newAccessoryData.photoUrl }, ...accessories]);
      const refreshed = await fetchAccessories();
      setAccessories(refreshed);
      if (uploadWarning) {
        showToast('⚠️ Accessory saved, but photo upload failed. Create the storage bucket in Supabase.');
      } else {
        showToast('✅ Accessory saved!');
      }
    } catch (e: any) {
      showToast('❌ Failed to save accessory: ' + e.message);
    }
    setIsSyncing(false);
  };

  // Handle adding a new trip
  const handleAddTrip = (newTripData: Omit<Trip, 'id'>) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    const newTrip: Trip = {
      ...newTripData,
      id: `trip-${Date.now()}`,
    };
    const updatedTrips = [newTrip, ...trips];
    setTrips(updatedTrips);
    StorageService.saveTrips(updatedTrips);
    showToast(`Trip "${newTrip.name}" added!`);
  };

  // Handle deleting a log
  const handleDeleteLog = (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    const updatedLogs = logs.filter((l) => l.id !== id);
    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
    setMetrics(StorageService.calculateMetrics(updatedLogs));
    showToast('Log entry removed.');
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <>
              {isOwnerMode && logs.length > 0 && !logs[0].id.includes('-') && (
                <div className="mb-4 flex justify-end">
                  <button 
                    onClick={async () => {
                      try {
                        showToast('Migrating data...');
                        await migrateLogsToSupabase(logs);
                        showToast('✅ Migration Complete!');
                      } catch(e: any) {
                        showToast('❌ Migration Failed: ' + e.message);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Migrate Old Data to Supabase
                  </button>
                </div>
              )}
              <DashboardView
                metrics={metrics}
                recentLogs={logs}
                recentTrips={trips}
                onOpenLogModal={handleOpenLogModal}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
                isOwnerMode={isOwnerMode}
              />
            </>
          )}

          {activeTab === 'analytics' && <AnalyticsView logs={logs} metrics={metrics} />}

          {activeTab === 'trips' && (
            <TripsView trips={trips} onAddTrip={handleAddTrip} latestOdometer={latestOdometer} />
          )}

          {activeTab === 'logs' && <LogsView logs={logs} onDeleteLog={handleDeleteLog} />}
          
          {activeTab === 'services' && (
            <ServiceLogsView
              services={services}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => isOwnerMode ? setIsServiceModalOpen(true) : setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'accessories' && (
            <AccessoriesView
              accessories={accessories}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => isOwnerMode ? setIsAccessoryModalOpen(true) : setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'profile' && <ProfileView />}
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
          onClose={() => setIsServiceModalOpen(false)}
          onSave={handleSaveService}
          latestOdometer={latestOdometer}
        />
      )}

      {/* Accessory Modal */}
      {isAccessoryModalOpen && (
        <AddAccessoryModal
          isOpen={isAccessoryModalOpen}
          onClose={() => setIsAccessoryModalOpen(false)}
          onSave={handleSaveAccessory}
        />
      )}

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
