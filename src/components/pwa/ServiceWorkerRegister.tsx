'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker so the installed PWA always refreshes to the
 * latest deployment on open (network-first app shell) instead of staying
 * stuck on an old, possibly broken build. No-ops where /sw.js is unavailable
 * (e.g. static GitHub Pages builds).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // In development the worker's cache-first rule serves stale JS chunks (dev
    // chunk names are not content-hashed), so edits never show up. Never
    // register there, and remove any worker a previous dev session installed.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }

    // An installed PWA is resumed, not reopened, so it never re-checks for a new
    // version. Check on every return to the app, and reload once when a new
    // worker takes over (only if an older one was already running).
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          const check = () => reg.update().catch(() => {});
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') check();
          });
          window.addEventListener('online', check);
          check();
        })
        .catch((err) => {
          // Missing worker (static export) or older browser — harmless.
          console.warn('Service worker unavailable:', err && err.message);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
