import { Droplet, Gauge, Sparkles, Wrench } from 'lucide-react';
import type { ChainLubeRecord } from '@/types/fuel';

/**
 * Recurring bike-care reminders. Each task runs on a fixed interval — either
 * distance (km) or time (days). The owner marks a task done, which resets its
 * clock for the next cycle. State is a tiny per-task record; the definitions
 * (labels, intervals, icons) live in code so they can be tuned without a data
 * migration.
 */

export type CareIntervalUnit = 'km' | 'days';

export interface CareTaskDef {
  id: string;
  label: string;
  /** What "done" means, shown under the title. */
  detail: string;
  unit: CareIntervalUnit;
  /** Full cycle length — 500 km, 14 days, etc. */
  interval: number;
  icon: React.ElementType;
  /** Fraction of the cycle after which it flags "due soon". */
  dueSoonAt?: number;
}

export interface CareTaskState {
  lastDoneDate: string; // ISO yyyy-mm-dd
  lastDoneOdometer?: number; // only meaningful for km tasks
}

export type CareState = Record<string, CareTaskState>;

export const CARE_TASKS: CareTaskDef[] = [
  { id: 'chain-lube', label: 'Chain lube', detail: 'Clean and lube, 20–30 mm slack', unit: 'km', interval: 500, icon: Droplet },
  { id: 'tyre-pressure', label: 'Tyre pressure', detail: 'Front 25 psi · rear 28/32 psi', unit: 'days', interval: 14, icon: Gauge },
  { id: 'wash', label: 'Wash', detail: 'Wash and dry the bike', unit: 'days', interval: 10, icon: Sparkles },
  { id: 'routine-check', label: 'Routine check-up', detail: 'Levels, lights, brakes, bolts', unit: 'days', interval: 90, icon: Wrench },
];

export type CareStatus = 'ok' | 'soon' | 'overdue';

export interface CareTaskView {
  def: CareTaskDef;
  status: CareStatus;
  /** 0–100 through the current cycle. */
  progress: number;
  /** km or days left until due; negative past the due point. */
  remaining: number;
  /** How long since it was last done, in the task's unit. */
  elapsed: number;
  lastDoneDate: string;
  lastDoneOdometer?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const todayIso = () => new Date().toISOString().split('T')[0];

const daysBetween = (fromIso: string, toIso: string): number => {
  const a = new Date(`${fromIso}T00:00:00`);
  const b = new Date(`${toIso}T00:00:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / DAY_MS));
};

/** Build the default state the first time, seeding chain-lube from the old chain record. */
export function seedCareState(chain?: ChainLubeRecord | null): CareState {
  const today = todayIso();
  const state: CareState = {};
  for (const task of CARE_TASKS) {
    state[task.id] = { lastDoneDate: today };
  }
  if (chain) {
    state['chain-lube'] = {
      lastDoneDate: chain.lastLubeDate || today,
      lastDoneOdometer: chain.lastLubeOdometer || undefined,
    };
  }
  return state;
}

export function computeCareTask(def: CareTaskDef, state: CareTaskState | undefined, currentOdometer: number): CareTaskView {
  const today = todayIso();
  const lastDoneDate = state?.lastDoneDate || today;
  const lastDoneOdometer = state?.lastDoneOdometer;
  const dueSoonAt = def.dueSoonAt ?? 0.8;

  let elapsed: number;
  if (def.unit === 'km') {
    const base = lastDoneOdometer ?? currentOdometer;
    elapsed = Math.max(0, currentOdometer - base);
  } else {
    elapsed = daysBetween(lastDoneDate, today);
  }

  const remaining = def.interval - elapsed;
  const progress = Math.max(0, Math.min(100, Math.round((elapsed / def.interval) * 100)));
  const status: CareStatus = elapsed >= def.interval ? 'overdue' : elapsed >= def.interval * dueSoonAt ? 'soon' : 'ok';

  return { def, status, progress, remaining, elapsed, lastDoneDate, lastDoneOdometer };
}

export function computeCareTasks(state: CareState, currentOdometer: number): CareTaskView[] {
  return CARE_TASKS.map((def) => computeCareTask(def, state[def.id], currentOdometer));
}

/** Record a task as done now; this resets its cycle. */
export function markCareDone(state: CareState, taskId: string, currentOdometer: number): CareState {
  return {
    ...state,
    [taskId]: { lastDoneDate: todayIso(), lastDoneOdometer: currentOdometer > 0 ? currentOdometer : undefined },
  };
}

export function careStatusLabel(view: CareTaskView): string {
  const unit = view.def.unit === 'km' ? 'km' : view.remaining === 1 || view.remaining === -1 ? 'day' : 'days';
  if (view.status === 'overdue') {
    const over = Math.abs(view.remaining);
    return over === 0 ? 'Due now' : `${over.toLocaleString('en-IN')} ${unit} overdue`;
  }
  return `${view.remaining.toLocaleString('en-IN')} ${unit} left`;
}
