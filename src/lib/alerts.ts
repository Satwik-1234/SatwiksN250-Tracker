import { query } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { CareState, consoleEntries, ensureBaselines } from '@/lib/care';
import type { ServiceLog } from '@/types/fuel';

export interface AlertItem {
  key: string;
  text: string;
  severity: 'warn' | 'overdue';
}

/**
 * Everything that needs the owner's attention right now, worked out on the server
 * from the database: service and care lamps that are due or overdue, and bike
 * papers that have expired or expire within 30 days.
 */
export async function buildAlerts(): Promise<AlertItem[]> {
  await ensureExtraTables();
  const [odoRes, careRes, svcRes, docRes] = await Promise.all([
    query('SELECT MAX(odometer) AS odo FROM fuel_logs'),
    query(`SELECT task_id, to_char(last_done_date, 'YYYY-MM-DD') AS d, last_done_odometer AS o FROM care_state`),
    query(`SELECT to_char(date, 'YYYY-MM-DD') AS date, odometer, service_type AS "serviceType" FROM service_logs`),
    query(`
      SELECT title, to_char(expiry_date, 'YYYY-MM-DD') AS d, (expiry_date - CURRENT_DATE) AS days
      FROM bike_documents WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + 30
    `),
  ]);

  const odometer = Number(odoRes.rows[0]?.odo) || 0;
  const state: CareState = {};
  careRes.rows.forEach((r) => {
    state[r.task_id] = { lastDoneDate: r.d, ...(r.o !== null && r.o !== undefined ? { lastDoneOdometer: Number(r.o) } : {}) };
  });
  const services = svcRes.rows.map((r) => ({
    id: '',
    date: r.date,
    odometer: Number(r.odometer) || 0,
    serviceType: r.serviceType || '',
    totalCost: 0,
  })) as ServiceLog[];

  const alerts: AlertItem[] = [];
  consoleEntries(ensureBaselines(state, odometer), odometer, services)
    .filter((e) => e.severity === 'overdue' || e.severity === 'warn')
    .forEach((e) => alerts.push({ key: `${e.id}:${e.severity}`, text: `${e.label}: ${e.remainingLabel}`, severity: e.severity as 'warn' | 'overdue' }));

  docRes.rows.forEach((r) => {
    const days = Number(r.days);
    alerts.push({
      key: `doc:${r.title}:${r.d}`,
      text: days < 0 ? `${r.title} has expired` : `${r.title} expires in ${days} ${days === 1 ? 'day' : 'days'}`,
      severity: days < 0 ? 'overdue' : 'warn',
    });
  });
  return alerts;
}
