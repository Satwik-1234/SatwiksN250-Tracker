'use client';

import React from 'react';
import { Check, RotateCcw, CalendarPlus } from 'lucide-react';
import { StorageService } from '@/services/googleSheetsService';
import { saveCareStateToSupabase } from '@/services/supabaseService';
import {
  CareState,
  CareTaskView,
  computeCareTasks,
  markCareDone,
  careStatusLabel,
} from '@/lib/care';
import { calendarEvent } from '@/lib/googleLinks';

interface CareCardProps {
  currentOdometer: number;
  isOwnerMode: boolean;
  onRequireOwner?: () => void;
  /** Fires after a task is marked done, so the page can push a cloud sync. */
  onChanged?: () => void;
  /** Hide the heading when embedded under another section title. */
  bare?: boolean;
  /** Controlled mode: when provided, the parent owns the care state. */
  state?: CareState;
  onMarkDone?: (taskId: string) => void;
  /** Show only items that need attention, with a link to the full console. */
  attentionOnly?: boolean;
  onOpenConsole?: () => void;
}

const tone = {
  ok: { dot: 'bg-blue-600', bar: 'bg-blue-600', text: 'text-ink-2', pill: 'bg-blue-50 text-blue-700' },
  soon: { dot: 'bg-[var(--color-text-1)]', bar: 'bg-[var(--color-text-1)]', text: 'text-ink-2', pill: 'bg-surface-2 text-ink-2' },
  overdue: { dot: 'bg-accent', bar: 'bg-accent', text: 'text-accent', pill: 'bg-accent-bg text-accent' },
} as const;

const statusWord = { ok: 'On track', soon: 'Due soon', overdue: 'Overdue' } as const;

export const CareCard: React.FC<CareCardProps> = ({
  currentOdometer,
  isOwnerMode,
  onRequireOwner,
  onChanged,
  bare = false,
  state: controlledState,
  onMarkDone,
  attentionOnly = false,
  onOpenConsole,
}) => {
  const controlled = controlledState !== undefined;
  const [localState, setLocalState] = React.useState<CareState>(() => StorageService.getCareState());

  // Re-read once on mount so a state hydrated after first paint is picked up.
  React.useEffect(() => {
    if (!controlled) queueMicrotask(() => setLocalState(StorageService.getCareState()));
  }, [controlled]);

  const state = controlled ? controlledState : localState;
  const tasks = computeCareTasks(state, currentOdometer);
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const shown = attentionOnly ? tasks.filter((t) => t.status !== 'ok') : tasks;

  const handleDone = (view: CareTaskView) => {
    if (!isOwnerMode) {
      onRequireOwner?.();
      return;
    }
    if (controlled) {
      onMarkDone?.(view.def.id);
      return;
    }
    const next = markCareDone(state, view.def.id, currentOdometer);
    setLocalState(next);
    StorageService.saveCareState(next);
    saveCareStateToSupabase(next).catch(() => {});
    onChanged?.();
  };

  return (
    <section className={bare ? '' : 'card p-5 sm:p-6'}>
      {!bare && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-[15px] font-semibold text-ink-1">Routine care</h2>
            <p className="text-[13px] text-ink-2 mt-0.5">
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
        {shown.map((view) => {
          const t = tone[view.status];
          const Icon = view.def.icon;
          return (
            <li key={view.def.id} className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-1 truncate">{view.def.label}</p>
                    <p className="text-[12px] text-ink-2 truncate">{view.def.detail}</p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center h-6 px-2 rounded-full text-[12px] font-medium ${t.pill}`}>
                  {statusWord[view.status]}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className={t.text}>{careStatusLabel(view)}</span>
                  <span className="text-ink-3 tabular">
                    every {view.def.interval.toLocaleString('en-IN')} {view.def.unit}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className={`h-full rounded-full bar-grow ${t.bar}`} style={{ width: `${view.progress}%` }} />
                </div>
              </div>

              <div className="mt-3.5 flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => handleDone(view)}
                  className={`flex-1 h-9 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    view.status === 'overdue'
                      ? 'bg-[var(--color-inverse)] text-[var(--color-inverse-fg)] hover:opacity-90'
                      : 'border border-[var(--color-border)] text-ink-2 hover:bg-surface-2'
                  }`}
                  title={isOwnerMode ? 'Mark done and reset the cycle' : 'Unlock owner mode to update'}
                >
                  {view.status === 'overdue' ? <Check className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  {view.status === 'overdue' ? 'Mark done' : 'Did it again'}
                </button>

                {(() => {
                  // Time-based tasks have a real due date, so offer a calendar reminder.
                  if (view.def.unit !== 'days') return null;
                  const due = new Date(`${view.lastDoneDate}T00:00:00`);
                  if (isNaN(due.getTime())) return null;
                  due.setDate(due.getDate() + view.def.interval);
                  const dueIso = due.toISOString().split('T')[0];
                  const url = calendarEvent(`N250 · ${view.def.label}`, dueIso, view.def.detail);
                  if (!url) return null;
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Add ${view.def.label} reminder to Google Calendar`}
                      title="Add reminder to Google Calendar"
                      className="w-9 h-9 shrink-0 rounded-lg border border-[var(--color-border)] text-ink-2 hover:bg-surface-2 flex items-center justify-center transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </a>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ul>
      {attentionOnly && shown.length === 0 && (
        <p className="text-[14px] text-ink-2">Nothing needs attention right now.</p>
      )}
      {onOpenConsole && (
        <button type="button" onClick={onOpenConsole} className="mt-4 text-[13px] font-medium text-ink-1 hover:text-accent">
          Open console for all {tasks.length + 1} items
        </button>
      )}
    </section>
  );
};
