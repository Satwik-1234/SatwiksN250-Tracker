'use client';

import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { StorageService } from '@/services/googleSheetsService';
import { saveCareStateToSupabase } from '@/services/supabaseService';
import {
  CareState,
  CareTaskView,
  computeCareTasks,
  markCareDone,
  careStatusLabel,
} from '@/lib/care';

interface CareCardProps {
  currentOdometer: number;
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
  /** Fires after a task is marked done, so the page can push a cloud sync. */
  onChanged?: () => void;
  /** Hide the heading when embedded under another section title. */
  bare?: boolean;
}

const tone = {
  ok: { dot: 'bg-blue-600', bar: 'bg-blue-600', text: 'text-slate-500', pill: 'bg-blue-50 text-blue-700' },
  soon: { dot: 'bg-slate-900', bar: 'bg-slate-900', text: 'text-slate-700', pill: 'bg-slate-100 text-slate-700' },
  overdue: { dot: 'bg-accent', bar: 'bg-accent', text: 'text-accent', pill: 'bg-accent-bg text-accent' },
} as const;

const statusWord = { ok: 'On track', soon: 'Due soon', overdue: 'Overdue' } as const;

export const CareCard: React.FC<CareCardProps> = ({
  currentOdometer,
  isOwnerMode,
  onRequireOwner,
  onChanged,
  bare = false,
}) => {
  const [state, setState] = React.useState<CareState>(() => StorageService.getCareState());

  // Re-read once on mount so a state hydrated after first paint is picked up.
  React.useEffect(() => {
    setState(StorageService.getCareState());
  }, []);

  const tasks = computeCareTasks(state, currentOdometer);
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;

  const handleDone = (view: CareTaskView) => {
    if (!isOwnerMode) {
      onRequireOwner?.();
      return;
    }
    const next = markCareDone(state, view.def.id, currentOdometer);
    setState(next);
    StorageService.saveCareState(next);
    saveCareStateToSupabase(next).catch(() => {});
    onChanged?.();
  };

  return (
    <section className={bare ? '' : 'card p-5 sm:p-6'}>
      {!bare && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Routine care</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {overdueCount > 0 ? `${overdueCount} ${overdueCount === 1 ? 'task' : 'tasks'} overdue` : 'Everything on schedule'}
            </p>
          </div>
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold tabular ${
              overdueCount > 0 ? 'bg-accent-bg text-accent' : 'bg-blue-50 text-blue-700'
            }`}
            aria-hidden="true"
          >
            {overdueCount > 0 ? overdueCount : '✓'}
          </span>
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tasks.map((view) => {
          const t = tone[view.status];
          const Icon = view.def.icon;
          return (
            <li key={view.def.id} className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{view.def.label}</p>
                    <p className="text-[12px] text-slate-500 truncate">{view.def.detail}</p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center h-6 px-2 rounded-full text-[12px] font-medium ${t.pill}`}>
                  {statusWord[view.status]}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className={t.text}>{careStatusLabel(view)}</span>
                  <span className="text-slate-400 tabular">
                    every {view.def.interval.toLocaleString('en-IN')} {view.def.unit}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full bar-grow ${t.bar}`} style={{ width: `${view.progress}%` }} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDone(view)}
                className={`mt-3.5 h-9 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  view.status === 'overdue'
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'border border-[var(--color-border)] text-slate-700 hover:bg-slate-50'
                }`}
                title={isOwnerMode ? 'Mark done and reset the cycle' : 'Unlock owner mode to update'}
              >
                {view.status === 'overdue' ? <Check className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                {view.status === 'overdue' ? 'Mark done' : 'Did it again'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
