'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation, TabType } from '@/components/layout/Navigation';
import { DashboardView } from '@/components/views/DashboardView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { BillingView } from '@/components/views/BillingView';
import { TripsView } from '@/components/views/TripsView';
import { LogsView } from '@/components/views/LogsView';
import { ProfileView } from '@/components/views/ProfileView';
import { QuickLogModal } from '@/components/modals/QuickLogModal';
import { SetupGuideModal } from '@/components/modals/SetupGuideModal';
import { OwnerAuthModal } from '@/components/modals/OwnerAuthModal';
import { AddServiceModal } from '@/components/modals/AddServiceModal';
import { AddAccessoryModal } from '@/components/modals/AddAccessoryModal';
import { ServiceLogsView } from '@/components/views/ServiceLogsView';
import { AccessoriesView } from '@/components/views/AccessoriesView';
import { Footer } from '@/components/layout/Footer';
import { ConsoleView } from '@/components/views/ConsoleView';
import { applyServiceTasks } from '@/lib/care';
import { saveCareToCloud } from '@/services/careService';
import { DocumentsView } from '@/components/views/DocumentsView';
import { NotesView } from '@/components/views/NotesView';
import { PartsView } from '@/components/views/PartsView';
import { LaunchSplash } from '@/components/ui/Motion';
import { UnlockAnimation } from '@/components/ui/UnlockAnimation';
import { StorageService, REAL_RAW_LOGS } from '../services/googleSheetsService';
import { deduplicateLogs } from '@/lib/metrics';
import {
  subscribeToFuelLogs,
  subscribeToServiceLogs,
  subscribeToAccessories,
  addFuelLogToSupabase,
  subscribeToAuthChanges,
  fetchSheetConfigFromSupabase,
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
  getOwnerToken,
  clearOwnerToken,
  ensureOwnerToken,
  syncLocalEntitiesToSupabase,
} from '../services/backendService';
import { FuelLog, Trip, GoogleSheetConfig, DashboardMetrics, ServiceLog, AccessoryGear } from '../types/fuel';
import { pushFullStateToSheet, SheetSyncResult } from '../services/sheetsSyncService';
import { errorMessage } from '@/lib/errors';
import { pushLogsToGitHub } from '../services/githubSyncService';

const STORAGE_KEY_OWNER_MODE = 'n250_owner_unlocked_v1';

// Helper: all identity keys for a log. Ids may differ between sources
// (localStorage vs Postgres UUID), so odometer is used as a second key —
// odometer readings are unique per fill, making duplicates collapse and
// legitimate records from different sources merge instead of double-counting.
const logKeys = (l: FuelLog): string[] => {
  const keys: string[] = [];
  if (l.id) keys.push(`id:${l.id}`);
  const odo = Number(l.odometer) || 0;
  if (odo > 0) {
    keys.push(`odo:${odo}`);
  } else {
    // No usable odometer: fall back to normalized date + fuel amount
    try {
      const d = l.date ? new Date(l.date) : null;
      const day = d && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'nodate';
      keys.push(`alt:${day}_${odo}_${l.fuelAmount || 0}`);
    } catch {
      keys.push(`alt:nodate_${odo}_${l.fuelAmount || 0}`);
    }
  }
  return keys;
};

// Helper: merge two log arrays, deduplicating by id / odometer / date+fuel
const mergeLogs = (primary: FuelLog[], secondary: FuelLog[]): FuelLog[] => {
  const p = deduplicateLogs(Array.isArray(primary) ? primary : []);
  const s = deduplicateLogs(Array.isArray(secondary) ? secondary : []);
  const seen = new Set(p.flatMap(logKeys));
  const missing = s.filter((l) => !logKeys(l).some((k) => seen.has(k)));
  if (missing.length === 0) return deduplicateLogs(p);
  return deduplicateLogs([...p, ...missing]).sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
  });
};

const tripKeys = (t: Trip): string[] => [String(t.id), (t.name || '').toLowerCase().trim()];
const serviceKeys = (s: ServiceLog): string[] => [String(s.id), `${Number(s.odometer) || 0}_${(s.serviceType || '').toLowerCase()}`];
const accessoryKeys = (a: AccessoryGear): string[] => [String(a.id), (a.itemName || '').toLowerCase().trim()];

// Identity keys for the same logical entity across devices/sources, plus a
// generic merge: anything from localStorage that the remote list does not
// represent is preserved instead of silently dropped.
function mergeByKeys<T>(remote: T[], local: T[], keyOf: (item: T) => string[]): T[] {
  const seen = new Set<string>();
  for (const item of remote) keyOf(item).forEach((k) => seen.add(k));
  const missing = local.filter((item) => !keyOf(item).some((k) => seen.has(k)));
  return [...remote, ...missing];
}

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
    avgCostPerFill: 0,
    costPerKm: 0,
    totalSpent: 0,
    totalDistance: 0,
    totalLitres: 0,
    totalLogsCount: 0,
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [showUnlockAnim, setShowUnlockAnim] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState<boolean>(false);
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceLog | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryGear | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<SheetSyncResult | null>(null);

  // Latest data snapshot for debounced Sheets/GitHub sync (avoids stale closures)
  const syncStateRef = React.useRef({ logs, trips, services, accessories, config });
  useEffect(() => {
    syncStateRef.current = { logs, trips, services, accessories, config };
  });

  // Home-screen shortcuts open straight to a tab (?tab=console) or the refill sheet (?action=refill)
  useEffect(() => {
    queueMicrotask(() => {
      const q = new URLSearchParams(window.location.search);
      const tab = q.get('tab') as TabType | null;
      if (tab && ['console', 'documents', 'notes', 'parts', 'logs', 'services', 'analytics'].includes(tab)) setActiveTab(tab);
      if (q.get('action') === 'refill') setIsLogModalOpen(true);
    });
  }, []);

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

    // Deferred one microtask: keeps the effect body free of synchronous state
    // updates (React lint) while still landing before the next paint.
    queueMicrotask(() => {
      setLogs(baselineLogs);
      setTrips(loadedTrips);
      setServices(loadedServices);
      setAccessories(loadedAccessories);
      setConfig(loadedConfig);
      setMetrics(StorageService.calculateMetrics(baselineLogs));

      // Check if owner was previously unlocked
      if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY_OWNER_MODE) === 'true') {
        setIsOwnerMode(true);
        ensureOwnerToken();
      }
    });

    // 2. PostgreSQL Backend Connection & Auto-Initialization
    checkBackendHealth().then(async (health) => {
      // Installed/static copies (e.g. GitHub Pages) have no server API:
      // owner editing and cloud sync cannot work there. Make the situation
      // explicit instead of silently degrading.
      if (health.apiMissing && typeof navigator !== 'undefined' && navigator.onLine) {
        showToast('No server connection — use the Vercel URL for full features.');
      }
      if (health.connected && !health.ready && getOwnerToken()) {
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
        const merged = mergeLogs(dbLogs, baselineLogs);
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

      // Adopt the shared Google Sheet config from Supabase when this device
      // has none — previously the Sheet sync silently skipped forever on any
      // device where the Setup URL was never entered.
      try {
        const localCfg = StorageService.getConfig();
        if (!localCfg.webAppUrl) {
          const remoteCfg = await fetchSheetConfigFromSupabase().catch(() => null);
          if (remoteCfg && remoteCfg.webAppUrl) {
            setConfig(remoteCfg);
            StorageService.saveConfig(remoteCfg);
          }
        }
      } catch (cfgErr) {
        console.warn('Sheet config adopt failed:', cfgErr);
      }

      // Tell the owner once when the promised GitHub CSV backup cannot run.
      try {
        const res = await fetch('/api/sync/github');
        if (res.ok) {
          const st = await res.json();
          // Owner-only: visitors can't act on a missing server env var.
          if (st && st.configured === false && getOwnerToken()) {
            showToast('GitHub CSV backup is off — add GITHUB_TOKEN in Vercel env vars.');
          }
        }
      } catch {
        /* serverless GitHub Pages builds have no API — ignore */
      }

      if (getOwnerToken()) {
        syncLocalEntitiesToSupabase().then((res) => {
          if (res.totalSynced > 0) {
            showToast(`Synced ${res.totalSynced} offline entries to cloud`);
            const refreshedLogs = StorageService.getLogs();
            setLogs(refreshedLogs);
            setMetrics(StorageService.calculateMetrics(refreshedLogs));
            setTrips(StorageService.getTrips());
            setServices(StorageService.getServices());
            setAccessories(StorageService.getAccessories());
          }
        }).catch(() => {});
      }
    }).catch((err) => {
      console.warn('[PostgreSQL] Could not reach backend API, running with local cache:', err);
    });

    // NOTE: deleteShetimalLogsFromSupabase() was removed from here — it ran
    // DELETE statements against the live database on every app load, from any
    // device. Bad rows are filtered from every display instead, so data is
    // never destroyed on startup.

    // Listen for online events to automatically sync any pending local changes
    const handleOnline = () => {
      if (!getOwnerToken()) return;
      syncLocalEntitiesToSupabase().then((res) => {
        if (res.totalSynced > 0) {
          showToast(`Synced ${res.totalSynced} offline entries to cloud`);
          const refreshedLogs = StorageService.getLogs();
          setLogs(refreshedLogs);
          setMetrics(StorageService.calculateMetrics(refreshedLogs));
          setTrips(StorageService.getTrips());
          setServices(StorageService.getServices());
          setAccessories(StorageService.getAccessories());
        }
      }).catch(() => {});
    };
    window.addEventListener('online', handleOnline);

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
          const merged = mergeLogs(liveSupabaseLogs, currentLogs);
          const recalculated = StorageService.recalculateDerivedFields(merged);
          // Defer state update and storage sync outside the pure updater
          setTimeout(() => {
            StorageService.saveLogs(recalculated);
            setMetrics(StorageService.calculateMetrics(recalculated));
          }, 0);
          return recalculated;
        });
      }
    });

    // Realtime listener for service bills & logs
    const unsubscribeServices = subscribeToServiceLogs((liveServices) => {
      if (liveServices && liveServices.length > 0) {
        setServices((currentServices) => {
          // Merge instead of overwrite so device-local pending entries that
          // failed to push are never erased by a remote change.
          const merged = mergeByKeys(liveServices, currentServices, serviceKeys);
          setTimeout(() => {
            StorageService.saveServices(merged);
          }, 0);
          return merged;
        });
      }
    });

    // Realtime listener for bike accessories & gear
    const unsubscribeAccessories = subscribeToAccessories((liveAcc) => {
      if (liveAcc && liveAcc.length > 0) {
        setAccessories((currentAccessories) => {
          const merged = mergeByKeys(liveAcc, currentAccessories, accessoryKeys);
          setTimeout(() => {
            StorageService.saveAccessories(merged);
          }, 0);
          return merged;
        });
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      unsubscribeFirebase();
      unsubscribeServices();
      unsubscribeAccessories();
      unsubscribeAuth();
    };
    // mergeLogs/logKeys are module-scope helpers (stable identity) — no deps needed
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Google Sheets full-state sync (debounced) ─────────────────────────
  const sheetSyncTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetSyncBusy = React.useRef(false);
  const sheetSyncQueued = React.useRef(false);
  const sheetSyncSkipShown = React.useRef(false);

  const runSheetSync = async (manual: boolean) => {
    const snapshot = syncStateRef.current;
    if (!snapshot.config.webAppUrl) {
      // Auto mode used to skip silently — the owner could never tell why the
      // promised Sheet sync never happened. Say it once per session.
      if (manual) {
        showToast('Add your Google Sheet Web App URL in Setup first.');
      } else if (!sheetSyncSkipShown.current) {
        sheetSyncSkipShown.current = true;
        showToast('Sheet sync skipped — no Sheet URL configured.');
      }
      return;
    }
    if (!snapshot.config.autoSync && !manual) return;
    if (sheetSyncBusy.current) {
      sheetSyncQueued.current = true;
      return;
    }
    sheetSyncBusy.current = true;
    try {
      const result = await pushFullStateToSheet(snapshot.config.webAppUrl, {
        fuelLogs: snapshot.logs,
        trips: snapshot.trips,
        services: snapshot.services,
        accessories: snapshot.accessories,
        chainLube: StorageService.getChainLube(),
      });
      setSheetSyncStatus(result);
      if (result.ok) {
        const nextConfig = { ...snapshot.config, lastSyncedAt: result.syncedAt };
        setConfig(nextConfig);
        StorageService.saveConfig(nextConfig);
        if (manual) showToast(result.verified ? 'Google Sheet synced' : result.message);
      } else {
        showToast('Sheet sync failed: ' + result.message);
      }
    } catch (err) {
      showToast('Sheet sync failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      sheetSyncBusy.current = false;
      if (sheetSyncQueued.current) {
        sheetSyncQueued.current = false;
        scheduleSheetSync();
      }
    }
  };

  const scheduleSheetSync = () => {
    if (sheetSyncTimer.current) clearTimeout(sheetSyncTimer.current);
    sheetSyncTimer.current = setTimeout(() => runSheetSync(false), 3000);
  };

  // ── GitHub log sync (debounced, server-committed data/ + exports/) ────
  const gitHubSyncTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const gitHubSyncBusy = React.useRef(false);
  const gitHubSyncQueued = React.useRef(false);
  const gitHubFailureShown = React.useRef<Set<string>>(new Set());

  const runGitHubSync = async (manual: boolean) => {
    if (gitHubSyncBusy.current) {
      gitHubSyncQueued.current = true;
      return;
    }
    gitHubSyncBusy.current = true;
    try {
      const snapshot = syncStateRef.current;
      const result = await pushLogsToGitHub({
        fuelLogs: snapshot.logs,
        trips: snapshot.trips,
        services: snapshot.services,
        accessories: snapshot.accessories,
        chainLube: StorageService.getChainLube(),
      });
      if (result.success) {
        if (manual) showToast(`🐙 ${result.message}`);
      } else if (manual) {
        showToast(result.message);
      } else if (!gitHubFailureShown.current.has(result.message)) {
        gitHubFailureShown.current.add(result.message);
        showToast('GitHub sync: ' + result.message);
      }
    } catch (err) {
      console.warn('[github-sync] failed:', err);
    } finally {
      gitHubSyncBusy.current = false;
      if (gitHubSyncQueued.current) {
        gitHubSyncQueued.current = false;
        scheduleGitHubSync();
      }
    }
  };

  const scheduleGitHubSync = () => {
    if (gitHubSyncTimer.current) clearTimeout(gitHubSyncTimer.current);
    gitHubSyncTimer.current = setTimeout(() => runGitHubSync(false), 5000);
  };

  // Every mutation triggers both cloud backups (Sheets + GitHub)
  const scheduleCloudSync = () => {
    scheduleSheetSync();
    scheduleGitHubSync();
  };

  // Phone back button steps back through the sections you opened instead of leaving the app.
  const fromPop = React.useRef(false);
  const firstTab = React.useRef(true);
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      history.replaceState({ ...history.state, tab: activeTab }, '');
      return;
    }
    if (fromPop.current) {
      fromPop.current = false;
    } else if ((history.state as { tab?: string } | null)?.tab !== activeTab) {
      history.pushState({ ...history.state, tab: activeTab }, '');
    }
    window.scrollTo({ top: 0 });
    const names: Partial<Record<TabType, string>> = { dashboard: 'Home', console: 'Console', logs: 'Fuel', parts: 'Parts', notes: 'Notes', documents: 'Documents', services: 'Service', accessories: 'Gear', trips: 'Trips', billing: 'Billing', analytics: 'Analytics', profile: 'My bike' };
    document.title = `${names[activeTab] || 'N250'} · N250`;
  }, [activeTab]);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const t = (e.state as { tab?: TabType } | null)?.tab;
      fromPop.current = true;
      setActiveTab(t || 'dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Desktop: press N to add something in the section you are in.
  const contextAddRef = React.useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      contextAddRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The + button follows the section you are in: Services adds a service, Notes a note, and so on.
  const ADD_LABELS: Partial<Record<TabType, string>> = {
    console: 'Log service', services: 'Add service', accessories: 'Add gear', trips: 'Add trip',
    documents: 'Add document', notes: 'New note', parts: 'Add part',
  };
  const handleContextAdd = () => {
    if (activeTab === 'services' || activeTab === 'console') {
      if (!isOwnerMode) { setIsAuthModalOpen(true); return; }
      setEditingService(null);
      setIsServiceModalOpen(true);
    } else if (activeTab === 'accessories') {
      if (!isOwnerMode) { setIsAuthModalOpen(true); return; }
      setEditingAccessory(null);
      setIsAccessoryModalOpen(true);
    } else if (activeTab === 'trips' || activeTab === 'documents' || activeTab === 'notes' || activeTab === 'parts') {
      window.dispatchEvent(new CustomEvent('n250:add'));
    } else {
      handleOpenLogModal();
    }
  };

  contextAddRef.current = () => handleContextAdd();

  const handleOpenLogModal = () => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
    } else {
      setIsLogModalOpen(true);
    }
  };

  const handleUnlockOwnerMode = () => {
    setShowUnlockAnim(true);
    setIsOwnerMode(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OWNER_MODE, 'true');
    }
    showToast('Owner access unlocked');
    syncLocalEntitiesToSupabase().then((res) => {
      if (res.totalSynced > 0) {
        showToast(`Synced ${res.totalSynced} offline entries`);
        const refreshedLogs = StorageService.getLogs();
        setLogs(refreshedLogs);
        setMetrics(StorageService.calculateMetrics(refreshedLogs));
        setTrips(StorageService.getTrips());
        setServices(StorageService.getServices());
        setAccessories(StorageService.getAccessories());
      }
    }).catch(() => {});
    setIsLogModalOpen(true);
  };

  const handleLockOwnerMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_OWNER_MODE);
    }
    clearOwnerToken();
    import('../services/backendService').then(({ clearCachedOwnerPin }) => {
      clearCachedOwnerPin();
    });
    import('../services/supabaseService').then(({ signOutUser }) => {
      signOutUser().catch(() => {});
    });
    setIsOwnerMode(false);
    showToast('Signed out — read-only mode');
  };

  // Handle adding a new fuel refill log
  const handleSaveLog = async (newLogData: Omit<FuelLog, 'id' | 'synced'>) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
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
      // 1. Save to PostgreSQL / Supabase Backend (Primary)
      const res = await saveFuelLog(newLogData);
      if (res.success && res.id) {
        newLog.id = res.id;
        newLog.synced = true;
        const persistedLogs = updatedLogs.map((l) => (l.id === tempId ? { ...l, id: res.id, synced: true } : l));
        setLogs(persistedLogs);
        StorageService.saveLogs(persistedLogs);
        showToast('Fuel log saved');
      } else if (res.authRequired) {
        // Owner session is missing/expired on this device. The entry stays in
        // localStorage and syncs automatically once the PIN is re-verified.
        showToast('Session expired — unlock to sync');
        setIsAuthModalOpen(true);
      } else {
        showToast('Saved locally — syncs when online');
      }
    } catch (err) {
      console.error('Save failed, saved to local:', err);
      showToast('Saved locally — syncs when online');
    }

    // 2. Full-state Google Sheet rewrite (debounced — covers every entity)
    scheduleCloudSync();

    setIsSyncing(false);
  };

  const handleSaveService = async (newLogData: Omit<ServiceLog, 'id'>, file?: File, editId?: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      showToast('File too large — max 10 MB');
      return;
    }
    setIsSyncing(true);
    try {
      let documentUrl = newLogData.documentUrl;

      if (file) {
        try {
          documentUrl = await uploadFileToSupabase(file, 'service_bills');
        } catch (uploadErr) {
          console.warn('Supabase storage upload error, using Data URL fallback:', errorMessage(uploadErr));
          documentUrl = await convertFileToDataUrl(file);
        }
      }

      const serviceToSave = { ...newLogData, documentUrl };

      if (editId) {
        await saveService(serviceToSave, editId, file);
        const refreshed = await fetchServices();
        setServices(mergeByKeys(refreshed, services, serviceKeys));
        StorageService.saveServices(mergeByKeys(refreshed, services, serviceKeys));
        showToast('Service updated');
      } else {
        const res = await saveService(serviceToSave, undefined, file);
        const refreshed = await fetchServices();
        let nextServices: ServiceLog[];
        if (res.success && res.id) {
          nextServices = refreshed.length > 0 ? refreshed : [{ ...serviceToSave, id: res.id }, ...services];
        } else {
          // Save could not be confirmed (offline / expired PIN / upload error):
          // keep the record AND its attached file visible, ready to sync later.
          const localItem: ServiceLog = { ...serviceToSave, id: res.id || `srv-${Date.now()}` };
          nextServices = mergeByKeys(refreshed, [localItem], serviceKeys);
        }
        setServices(nextServices);
        StorageService.saveServices(nextServices);
        showToast(res.success ? 'Service saved' : res.authRequired ? 'Session expired — unlock to sync' : 'Saved locally — syncs when online');
        if (res.authRequired) setIsAuthModalOpen(true);
      }
    } catch (e) {
      showToast('Failed to save service: ' + errorMessage(e));
    }
    setEditingService(null);
    setIsSyncing(false);
    scheduleCloudSync();
  };

  const handleDeleteService = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    await deleteService(id);
    showToast('Service log deleted.');
    scheduleCloudSync();
  };

  const handleSaveAccessory = async (newAccessoryData: Omit<AccessoryGear, 'id'>, file?: File, editId?: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10 MB)');
      return;
    }
    setIsSyncing(true);
    try {
      let photoUrl = newAccessoryData.photoUrl;

      if (file) {
        try {
          photoUrl = await uploadFileToSupabase(file, 'accessories');
        } catch (uploadErr) {
          console.warn('Photo upload error, using Data URL fallback:', errorMessage(uploadErr));
          photoUrl = await convertFileToDataUrl(file);
        }
        if (!photoUrl) {
          throw new Error('File attachment failed — the item was NOT saved without your invoice.');
        }
      }

      const accessoryToSave = { ...newAccessoryData, photoUrl };

      if (editId) {
        showToast('Updating Accessory...');
        await saveAccessory(accessoryToSave, editId, file);
        const refreshed = await fetchAccessories();
        const merged = mergeByKeys(refreshed, accessories, accessoryKeys);
        setAccessories(merged);
        StorageService.saveAccessories(merged);
        showToast('Accessory updated');
      } else {
        showToast('Saving Accessory...');
        const res = await saveAccessory(accessoryToSave, undefined, file);
        const refreshed = await fetchAccessories();
        let nextAccessories: AccessoryGear[];
        if (res.success && res.id) {
          nextAccessories = refreshed.length > 0 ? refreshed : [{ ...accessoryToSave, id: res.id }, ...accessories];
        } else {
          // Keep the item and its photo visible instead of letting the server
          // refresh silently drop it; the sync loop will push it later.
          const localItem: AccessoryGear = { ...accessoryToSave, id: res.id || `acc-${Date.now()}` };
          nextAccessories = mergeByKeys(refreshed, [localItem], accessoryKeys);
        }
        setAccessories(nextAccessories);
        StorageService.saveAccessories(nextAccessories);
        showToast(res.success ? 'Accessory saved' : res.authRequired ? 'Owner session expired — unlock PIN to sync' : 'Saved locally — will sync when online');
        if (res.authRequired) setIsAuthModalOpen(true);
      }
    } catch (e) {
      showToast('Failed to save accessory: ' + errorMessage(e));
    }
    setEditingAccessory(null);
    setIsSyncing(false);
    scheduleCloudSync();
  };

  const handleDeleteAccessory = async (id: string) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setAccessories((prev) => prev.filter((a) => a.id !== id));
    await deleteAccessory(id);
    showToast('Accessory removed.');
    scheduleCloudSync();
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
    if (res.success && res.id) {
      const persistedTrips = updatedTrips.map((t) => (t.id === tempId ? { ...t, id: res.id } : t));
      setTrips(persistedTrips);
      StorageService.saveTrips(persistedTrips);
      showToast(`Trip "${newTrip.name}" saved to Supabase!`);
    } else if (res.authRequired) {
      showToast('Owner session expired — unlock PIN to sync');
      setIsAuthModalOpen(true);
    } else {
      showToast(`Trip "${newTrip.name}" saved locally (auto-syncs when online).`);
    }
    scheduleCloudSync();
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
    scheduleCloudSync();
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
    scheduleCloudSync();
  };

  // Handle saving config
  const handleSaveConfig = (newConfig: GoogleSheetConfig) => {
    if (!isOwnerMode) {
      setIsAuthModalOpen(true);
      return;
    }
    setConfig(newConfig);
    StorageService.saveConfig(newConfig);
    // Share the Sheet config with every other device via Supabase app_settings
    import('../services/supabaseService').then(({ saveSheetConfigToSupabase }) => {
      saveSheetConfigToSupabase(newConfig).catch(() => {});
    });
    showToast(newConfig.webAppUrl ? 'Google Sheet linked! Other devices will adopt this config.' : 'Sync config updated');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    showToast('Syncing with cloud...');
    try {
      const res = await syncLocalEntitiesToSupabase();
      const [latestLogs, latestTrips, latestServices, latestAccessories] = await Promise.all([
        fetchFuelLogs(),
        fetchTrips(),
        fetchServices(),
        fetchAccessories(),
      ]);

      if (latestLogs.length > 0) {
        setLogs(latestLogs);
        setMetrics(StorageService.calculateMetrics(latestLogs));
        StorageService.saveLogs(latestLogs);
      }
      if (latestTrips.length > 0) {
        setTrips(latestTrips);
        StorageService.saveTrips(latestTrips);
      }
      if (latestServices.length > 0) {
        setServices(latestServices);
        StorageService.saveServices(latestServices);
      }
      if (latestAccessories.length > 0) {
        setAccessories(latestAccessories);
        StorageService.saveAccessories(latestAccessories);
      }

      if (res.totalSynced > 0) {
        showToast(`Uploaded ${res.totalSynced} local entries`);
      } else {
        showToast('Data synchronized');
      }
    } catch (err) {
      console.error('Manual sync failed:', err);
      showToast('Sync failed: ' + errorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const latestOdometer = logs.length > 0 ? Math.max(...logs.map((l) => l.odometer)) : 0;

  // Restarts the console lamps for items ticked on the manual checklist of a service.
  const handleApplyChecklist = (taskIds: string[], date: string, odo: number) => {
    const unique = new Set(taskIds);
    if (unique.size === 0) return;
    const { state, events } = applyServiceTasks(StorageService.getCareState(), [...unique], date, odo);
    StorageService.saveCareState(state);
    void saveCareToCloud(state, events);
    showToast(`${unique.size} console ${unique.size === 1 ? 'lamp' : 'lamps'} restarted from this service`);
  };

  // Marks the periodic service done from a warning lamp; the bill can be added later in Service.
  const quickService = async (odometer: number) => {
    const today = new Date().toISOString().split('T')[0];
    await handleSaveService({
      date: today,
      odometer,
      serviceType: 'Periodic service',
      serviceCenter: 'Logged from the console',
      totalCost: 0,
      notes: 'Marked done from the service lamp. Add the bill in Service when handy.',
    });
    showToast('Service marked done');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-1 font-sans md:flex">
      <LaunchSplash />
      {showUnlockAnim && <UnlockAnimation onDone={() => setShowUnlockAnim(false)} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-above-tabbar inset-x-4 md:inset-x-auto md:right-6 z-[60] md:max-w-sm bg-[var(--color-text-1)] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl animate-fade-up text-center md:text-left"
        >
          {toastMessage}
        </div>
      )}

      {/* Sidebar (desktop) + tab bar and More sheet (phone) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        isCollapsed={isNavCollapsed}
        setIsCollapsed={setIsNavCollapsed}
        onOpenLogModal={handleContextAdd}
        addLabel={ADD_LABELS[activeTab] || 'Log refill'}
        isOwnerMode={isOwnerMode}
        isSyncing={isSyncing}
        onSyncCloud={handleManualSync}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLockOwnerMode={handleLockOwnerMode}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Phone top bar */}
        <Header
          config={config}
          onOpenLogModal={handleOpenLogModal}
          onOpenSetupModal={() => { if (isOwnerMode) { setIsSetupModalOpen(true); } else { setIsAuthModalOpen(true); } }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isOwnerMode={isOwnerMode}
          onLockOwnerMode={handleLockOwnerMode}
          isSyncing={isSyncing}
          onSyncCloud={handleManualSync}
        />

          {/* Main View Area */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-5 md:pt-8 pb-tabbar min-w-0">
          {activeTab === 'dashboard' && (
            <>
              <DashboardView
                metrics={metrics}
                recentLogs={logs}
                recentTrips={trips}
                services={services}
                accessories={accessories}
                onOpenLogModal={handleOpenLogModal}
                onNavigateTab={(t) => setActiveTab(t as TabType)}
                isOwnerMode={isOwnerMode}
                onLubeLogged={scheduleCloudSync}
                onRequireOwner={() => setIsAuthModalOpen(true)}
                onQuickService={quickService}
              />
            </>
          )}

          {activeTab === 'console' && (
            <ConsoleView
              latestOdometer={latestOdometer}
              services={services}
              isOwnerMode={isOwnerMode}
              onRequireOwner={() => setIsAuthModalOpen(true)}
              onQuickService={quickService}
              onChanged={scheduleCloudSync}
            />
          )}

          {activeTab === 'parts' && (
            <PartsView isOwnerMode={isOwnerMode} onRequireOwner={() => setIsAuthModalOpen(true)} latestOdometer={latestOdometer} />
          )}

          {activeTab === 'notes' && (
            <NotesView isOwnerMode={isOwnerMode} onRequireOwner={() => setIsAuthModalOpen(true)} latestOdometer={latestOdometer} />
          )}

          {activeTab === 'documents' && (
            <DocumentsView isOwnerMode={isOwnerMode} onRequireOwner={() => setIsAuthModalOpen(true)} />
          )}

          {activeTab === 'billing' && (
            <BillingView 
              logs={logs}
              services={services}
              accessories={accessories}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView logs={logs} metrics={metrics} services={services} accessories={accessories} />
          )}

          {activeTab === 'trips' && (
            <TripsView
              trips={trips}
              onAddTrip={handleAddTrip}
              onDeleteTrip={handleDeleteTrip}
              latestOdometer={latestOdometer}
              isOwnerMode={isOwnerMode}
            />
          )}

          {activeTab === 'logs' && (
            <LogsView
              logs={logs}
              onDeleteLog={handleDeleteLog}
              isOwnerMode={isOwnerMode}
              onRequireOwner={() => setIsAuthModalOpen(true)}
            />
          )}
          
          {activeTab === 'services' && (
            <ServiceLogsView
              services={services}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => { if (!isOwnerMode) { setIsAuthModalOpen(true); return; } setEditingService(null); setIsServiceModalOpen(true); }}
              onEditService={(service) => { if (!isOwnerMode) { setIsAuthModalOpen(true); return; } setEditingService(service); setIsServiceModalOpen(true); }}
              onDeleteService={handleDeleteService}
              latestOdometer={latestOdometer}
            />
          )}

          {activeTab === 'accessories' && (
            <AccessoriesView
              accessories={accessories}
              isOwnerMode={isOwnerMode}
              onOpenAddModal={() => { if (!isOwnerMode) { setIsAuthModalOpen(true); return; } setEditingAccessory(null); setIsAccessoryModalOpen(true); }}
              onEditAccessory={(item) => { if (!isOwnerMode) { setIsAuthModalOpen(true); return; } setEditingAccessory(item); setIsAccessoryModalOpen(true); }}
              onDeleteAccessory={handleDeleteAccessory}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              metrics={metrics}
              isOwnerMode={isOwnerMode}
              onRequireOwner={() => setIsAuthModalOpen(true)}
              latestOdometer={latestOdometer}
              onNavigate={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'profile' && (
            <>
              {isOwnerMode && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        showToast('Syncing & initializing PostgreSQL database...');
                        const result = await autoInitializeDatabase();
                        if (result.success) {
                          showToast(`PostgreSQL synced: ${result.message}`);
                          const [dbLogs, dbTrips] = await Promise.all([fetchFuelLogs(), fetchTrips()]);
                          if (dbLogs.length > 0) setLogs(dbLogs);
                          if (dbTrips.length > 0) setTrips(dbTrips);
                        } else {
                          showToast('Sync error: ' + (result.message || 'Cannot connect to Postgres'));
                        }
                      } catch (e) {
                        showToast('Sync failed: ' + errorMessage(e));
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Re-sync PostgreSQL
                  </button>
                  <button
                    onClick={() => runGitHubSync(true)}
                    className="btn btn-secondary btn-sm"
                    title="Commit data/*.json + exports/*.csv to the GitHub repo"
                  >
                    Push logs to GitHub
                  </button>
                </div>
              )}
              <div className="mt-8 card overflow-hidden">
                <Footer config={config} isOwnerMode={isOwnerMode} onOpenSetupModal={() => { if (isOwnerMode) { setIsSetupModalOpen(true); } else { setIsAuthModalOpen(true); } }} />
              </div>
            </>
          )}
        </main>
      </div>

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
        previousLogs={logs}
      />
      
      {/* Service Modal */}
      {isServiceModalOpen && (
        <AddServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
          onSave={handleSaveService}
          onApplyChecklist={handleApplyChecklist}
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
        onSyncNow={() => runSheetSync(true)}
        syncStatus={sheetSyncStatus}
        exportEntities={{
          logs,
          trips,
          services,
          accessories,
          chainLube: StorageService.getChainLube(),
        }}
      />
    </div>
  );
}
