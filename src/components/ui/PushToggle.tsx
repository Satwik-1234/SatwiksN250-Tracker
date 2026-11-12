'use client';

import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { ensureOwnerToken, getOwnerToken } from '@/services/backendService';

type State = 'checking' | 'unsupported' | 'unconfigured' | 'denied' | 'off' | 'on';

const toKey = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Turns phone alerts on or off for this device. The server sends them (daily check). */
export const PushToggle: React.FC<{ isOwnerMode: boolean; onRequireOwner?: () => void }> = ({ isOwnerMode, onRequireOwner }) => {
  const [state, setState] = React.useState<State>('checking');
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: State = 'off';
      if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || !('PushManager' in window)) next = 'unsupported';
      else if (!VAPID_KEY) next = 'unconfigured';
      else if (Notification.permission === 'denied') next = 'denied';
      else {
        const reg = await navigator.serviceWorker.getRegistration();
        next = (await reg?.pushManager.getSubscription()) ? 'on' : 'off';
      }
      if (!cancelled) setState(next);
    })().catch(() => !cancelled && setState('unsupported'));
    return () => {
      cancelled = true;
    };
  }, []);

  const auth = async (): Promise<Record<string, string>> => {
    await ensureOwnerToken();
    const t = getOwnerToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const enable = async () => {
    if (!isOwnerMode) return onRequireOwner?.();
    setBusy(true);
    setNote(null);
    try {
      if ((await Notification.requestPermission()) !== 'granted') {
        setState('denied');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_KEY as string) });
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) }, body: JSON.stringify(sub) });
      if (!res.ok) {
        await sub.unsubscribe();
        throw new Error('The server did not accept this phone. Unlock owner mode and try again.');
      }
      setState('on');
      void fetch('/api/notify', { method: 'POST', headers: await auth() });
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE', headers: await auth() }).catch(() => {});
        await sub.unsubscribe();
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'checking') return null;

  const text: Record<State, string> = {
    checking: '',
    on: 'This phone will be told when something is due or a paper is about to expire.',
    off: 'Get a notification when service or upkeep is due, or a paper is about to expire.',
    denied: 'Notifications are blocked for this site. Allow them in your browser settings, then try again.',
    unconfigured: 'Phone alerts need the VAPID keys set on the server (see the README).',
    unsupported: 'Phone alerts work on the deployed app, in a browser that supports push.',
  };

  return (
    <section className="card px-5 py-4 flex items-center gap-4">
      <span className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
        {state === 'on' ? <Bell className="w-5 h-5 text-ink-1" /> : <BellOff className="w-5 h-5 text-ink-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-ink-1">Phone alerts</div>
        <p className="text-[13px] text-ink-2 mt-0.5">{note || text[state]}</p>
      </div>
      {(state === 'off' || state === 'on') && (
        <button type="button" disabled={busy} onClick={state === 'on' ? disable : enable} className="btn btn-secondary btn-sm disabled:opacity-60 shrink-0">
          {busy ? 'Working…' : state === 'on' ? 'Turn off' : 'Turn on'}
        </button>
      )}
    </section>
  );
};
