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

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
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
