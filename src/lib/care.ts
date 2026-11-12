import { CareIcons } from '@/components/ui/CareIcons';
import type { ChainLubeRecord, ServiceLog } from '@/types/fuel';
import { serviceStatus } from '@/lib/maintenance';

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
  /** Console section heading. */
  group: string;
  /** Fraction of the cycle after which it flags "due soon". */
  dueSoonAt?: number;
}

export interface CareTaskState {
  lastDoneDate: string; // ISO yyyy-mm-dd
  lastDoneOdometer?: number; // only meaningful for km tasks
}

export type CareState = Record<string, CareTaskState>;

// Intervals follow the Pulsar N250 owner manual where it gives one; the rest are sensible habits.
export const CARE_TASKS: CareTaskDef[] = [
  { id: 'engine-oil', label: 'Engine oil', group: 'Engine', detail: 'Change oil and filter. Bajaj DTS-i 10000 20W50, 1,300 ml. Top up the level every 5,000 km.', unit: 'km', interval: 10000, icon: CareIcons['engine-oil'] },
  { id: 'spark-plug', label: 'Spark plug', group: 'Engine', detail: 'Clean and set the gap (0.8-0.9 mm). Replace at 30,000 km.', unit: 'km', interval: 10000, icon: CareIcons['spark-plug'] },
  { id: 'air-filter', label: 'Air filter', group: 'Engine', detail: 'Replace the viscous element and its O-ring (every 20,000 km).', unit: 'km', interval: 20000, icon: CareIcons['air-filter'] },
  { id: 'throttle-body', label: 'Throttle body', group: 'Engine', detail: 'Clean with throttle-body cleaner (every 5,000 km).', unit: 'km', interval: 5000, icon: CareIcons['throttle-body'] },
  { id: 'battery', label: 'Battery', group: 'Engine', detail: 'Load-test and check terminals, petroleum jelly on them. Done at each service.', unit: 'km', interval: 5000, icon: CareIcons['battery'] },
  { id: 'brake-front', label: 'Front brake pads', group: 'Brakes & tyres', detail: 'Check wear at each service. Replace at 15,000 km.', unit: 'km', interval: 5000, icon: CareIcons['brake-front'] },
  { id: 'brake-rear', label: 'Rear brake pads', group: 'Brakes & tyres', detail: 'Check wear at each service. Replace at 15,000 km.', unit: 'km', interval: 5000, icon: CareIcons['brake-rear'] },
  { id: 'brake-fluid', label: 'Brake fluid', group: 'Brakes & tyres', detail: 'DOT 4. Top up at each service. Replace fluid and seals at 30,000 km.', unit: 'km', interval: 30000, icon: CareIcons['brake-fluid'] },
  { id: 'tyre-pressure', label: 'Tyre pressure', group: 'Brakes & tyres', detail: 'Front 25 psi. Rear 28 psi solo, 32 psi with a pillion.', unit: 'days', interval: 14, icon: CareIcons['tyre-pressure'] },
  { id: 'tyre-balance', label: 'Alignment & balance', group: 'Brakes & tyres', detail: 'Wheel alignment and balancing', unit: 'km', interval: 10000, icon: CareIcons['tyre-balance'] },
  { id: 'chain-lube', label: 'Chain lube', group: 'Drive & suspension', detail: 'Clean and lubricate the chain every 500 km (more often in the monsoon).', unit: 'km', interval: 500, icon: CareIcons['chain-lube'] },
  { id: 'chain-slack', label: 'Chain slack', group: 'Drive & suspension', detail: 'Keep 20-30 mm. The workshop sets it at 20-25 mm.', unit: 'km', interval: 1000, icon: CareIcons['chain-slack'] },
  { id: 'clutch-freeplay', label: 'Clutch free play', group: 'Drive & suspension', detail: 'Lever play 2-3 mm. Throttle cable play is also 2-3 mm.', unit: 'km', interval: 5000, icon: CareIcons['clutch-freeplay'] },
  { id: 'fork-oil', label: 'Front fork oil', group: 'Drive & suspension', detail: 'Replace the oil with the oil seal and dust seal, as a pair.', unit: 'km', interval: 30000, icon: CareIcons['fork-oil'] },
  { id: 'routine-check', label: 'Routine check-up', group: 'Upkeep', detail: 'Lights, switches, horn, brakes, fasteners', unit: 'days', interval: 90, icon: CareIcons['routine-check'] },
  { id: 'wash', label: 'Wash and clean-up', group: 'Upkeep', detail: 'Caustic-free detergent. Keep water off the tank, silencer and electricals.', unit: 'days', interval: 10, icon: CareIcons['wash'] },
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

/** Four-stop severity for the progressive telltale lamps. */
export type CareSeverity = 'good' | 'fair' | 'warn' | 'overdue';

export function careSeverity(progress: number, overdue: boolean): CareSeverity {
  if (overdue || progress >= 100) return 'overdue';
  if (progress >= 80) return 'warn';
  if (progress >= 55) return 'fair';
  return 'good';
}

export function careStatusLabel(view: CareTaskView): string {
  const unit = view.def.unit === 'km' ? 'km' : view.remaining === 1 || view.remaining === -1 ? 'day' : 'days';
  if (view.status === 'overdue') {
    const over = Math.abs(view.remaining);
    return over === 0 ? 'Due now' : `${over.toLocaleString('en-IN')} ${unit} overdue`;
  }
  return `${view.remaining.toLocaleString('en-IN')} ${unit} left`;
}


/** Give km tasks a starting point the first time they are seen, so their clock actually runs. */
export function ensureBaselines(state: CareState, odometer: number): CareState {
  if (odometer <= 0) return state;
  let changed = false;
  const next: CareState = { ...state };
  for (const def of CARE_TASKS) {
    const cur = next[def.id];
    if (def.unit === 'km' && cur && cur.lastDoneOdometer === undefined) {
      next[def.id] = { ...cur, lastDoneOdometer: odometer };
      changed = true;
    }
  }
  return changed ? next : state;
}

/** Set when a task was last done (for services done before the app tracked them). */
export function setCareLastDone(state: CareState, taskId: string, date: string, odometer?: number): CareState {
  return { ...state, [taskId]: { lastDoneDate: date, lastDoneOdometer: odometer } };
}

export interface ConsoleEntry {
  id: string;
  label: string;
  detail: string;
  group: string;
  icon: React.ElementType;
  kind: 'care' | 'service';
  severity: CareSeverity;
  progress: number;
  remaining: number;
  unit: CareIntervalUnit;
  interval: number;
  remainingLabel: string;
  lastDoneDate?: string;
  lastDoneOdometer?: number;
}

const SEVERITY_RANK: Record<CareSeverity, number> = { good: 0, fair: 1, warn: 2, overdue: 3 };
export const severityRank = (s: CareSeverity) => SEVERITY_RANK[s];

/** The periodic-service lamp follows the manual schedule, not a reset clock. */
export function serviceEntry(odometer: number, services: ServiceLog[]): ConsoleEntry {
  const st = serviceStatus(odometer, services);
  const kmPart = st.kmLeft === null ? '' : st.kmLeft > 0 ? `${st.kmLeft.toLocaleString('en-IN')} km left` : `${Math.abs(st.kmLeft).toLocaleString('en-IN')} km past`;
  const daysPart = st.daysLeft === null ? '' : st.daysLeft > 0 ? `${st.daysLeft} days left` : `${Math.abs(st.daysLeft)} days overdue`;
  return {
    id: 'service',
    label: 'Periodic service',
    detail: st.detail,
    group: 'Engine',
    icon: CareIcons.service,
    kind: 'service',
    severity: st.severity,
    progress: st.progress,
    remaining: st.kmLeft ?? 0,
    unit: 'km',
    interval: st.next?.hi ?? 0,
    remainingLabel: st.missed ? st.headline : [kmPart, daysPart].filter(Boolean).join(' - ') || st.headline,
  };
}

export function consoleEntries(state: CareState, odometer: number, services: ServiceLog[]): ConsoleEntry[] {
  const care = CARE_TASKS.map((def): ConsoleEntry => {
    const v = computeCareTask(def, state[def.id], odometer);
    return {
      id: def.id,
      label: def.label,
      detail: def.detail,
      group: def.group,
      icon: def.icon,
      kind: 'care',
      severity: careSeverity(v.progress, v.status === 'overdue'),
      progress: v.progress,
      remaining: v.remaining,
      unit: def.unit,
      interval: def.interval,
      remainingLabel: careStatusLabel(v),
      lastDoneDate: v.lastDoneDate,
      lastDoneOdometer: v.lastDoneOdometer,
    };
  });
  return [serviceEntry(odometer, services), ...care];
}
