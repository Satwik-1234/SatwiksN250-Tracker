'use client';

import React from 'react';
import { ownerFetch } from '@/lib/ownerFetch';

type Counts = Record<string, number>;

/** Owner tool: counts identical duplicate records, then removes them on confirmation (one copy of each is kept). */
export const DedupeButton: React.FC = () => {
  const [state, setState] = React.useState<{ busy: boolean; msg: string; found: number }>({ busy: false, msg: '', found: 0 });

  const call = async (method: 'GET' | 'POST') => {
    const res = await ownerFetch('/api/dedupe', { method });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
    return body.duplicates as Counts;
  };
  const describe = (c: Counts) =>
    Object.entries(c).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(', ');

  const scan = async () => {
    setState({ busy: true, msg: '', found: 0 });
    try {
      const c = await call('GET');
      const total = Object.values(c).reduce((a, b) => a + b, 0);
      setState({ busy: false, found: total, msg: total ? `Found ${describe(c)} that are exact copies.` : 'No duplicates. Everything is clean.' });
    } catch (e) {
      setState({ busy: false, found: 0, msg: (e as Error).message });
    }
  };
  const clean = async () => {
    setState((s) => ({ ...s, busy: true }));
    try {
      const c = await call('POST');
      setState({ busy: false, found: 0, msg: `Removed ${describe(c) || 'nothing'}. Reload the app to see it.` });
    } catch (e) {
      setState({ busy: false, found: 0, msg: (e as Error).message });
    }
  };

  return (
    <div className="card p-5">
      <h2 className="text-[15px] font-semibold text-ink-1">Duplicate records</h2>
      <p className="text-[13px] text-ink-2 mt-1">Finds identical copies of fuel logs, services, gear and trips. One copy of each is always kept.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-secondary btn-sm" disabled={state.busy} onClick={scan}>{state.busy ? 'Working…' : 'Check for duplicates'}</button>
        {state.found > 0 && (
          <button type="button" className="btn btn-accent btn-sm" disabled={state.busy} onClick={() => confirm(`Remove ${state.found} duplicate record(s)? One copy of each stays. This cannot be undone.`) && clean()}>
            Remove {state.found} copies
          </button>
        )}
      </div>
      {state.msg && <p className="mt-2 text-[13px] text-ink-2" role="status">{state.msg}</p>}
    </div>
  );
};
