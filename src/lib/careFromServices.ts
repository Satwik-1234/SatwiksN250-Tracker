import type { ServiceLog } from '@/types/fuel';
import { CARE_TASKS } from '@/lib/care';
import { BIKE_PURCHASE_DATE, evaluateSchedule } from '@/lib/maintenance';
import { checklistFor } from '@/lib/manualChecklist';

export interface DerivedCare {
  taskId: string;
  label: string;
  date: string;
  odometer: number;
  /** Where the date came from, in words. */
  basis: string;
}

/** Items the manual's chart covers, counted in km. Until a service renews one, it was new at delivery. */
const MANUAL_KM_TASKS = [
  'engine-oil', 'spark-plug', 'air-filter', 'throttle-body', 'battery', 'brake-front', 'brake-rear',
  'brake-fluid', 'chain-lube', 'chain-slack', 'clutch-freeplay', 'fork-oil',
];

/**
 * Works out each Console item's true "last done" from the services on record.
 * For every logged periodic service, the manual's chart says which items that service
 * renews (e.g. the 1st service replaces the oil; the 2nd does not). The latest such
 * service wins. Items no service has renewed yet were new on the delivery date.
 */
export function deriveFromServices(services: ServiceLog[]): DerivedCare[] {
  const label = (id: string) => CARE_TASKS.find((t) => t.id === id)?.label ?? id;
  const found = new Map<string, DerivedCare>();

  // Passing a huge odometer is fine: only the matched records are used here.
  for (const row of evaluateSchedule(Number.MAX_SAFE_INTEGER, services)) {
    if (!row.record) continue;
    const date = (row.record.date || '').slice(0, 10);
    const odometer = row.record.odometer || 0;
    for (const item of checklistFor(row.interval.id)) {
      if (!item.renews) continue;
      for (const taskId of item.tasks) {
        found.set(taskId, { taskId, label: label(taskId), date, odometer, basis: row.interval.name });
      }
    }
  }

  // Washes are logged as their own records.
  const wash = services
    .filter((s) => /wash/i.test(`${s.serviceType} ${s.serviceCenter || ''} ${s.notes || ''}`))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  if (wash) found.set('wash', { taskId: 'wash', label: label('wash'), date: wash.date.slice(0, 10), odometer: wash.odometer || 0, basis: 'Last wash on record' });

  for (const taskId of MANUAL_KM_TASKS) {
    if (!found.has(taskId)) {
      found.set(taskId, { taskId, label: label(taskId), date: BIKE_PURCHASE_DATE, odometer: 0, basis: 'Delivery, when the bike was new' });
    }
  }
  return [...found.values()];
}
