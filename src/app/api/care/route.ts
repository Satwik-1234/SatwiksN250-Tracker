import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/ownerSession';
import { query, isDbConnected } from '@/lib/db';
import { ensureExtraTables } from '@/lib/dbSchema';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[a-z0-9-]{1,64}$/;

interface TaskState {
  lastDoneDate: string;
  lastDoneOdometer?: number | null;
}

export async function GET() {
  try {
    if (!(await isDbConnected())) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    }
    await ensureExtraTables();

    const [stateRes, histRes] = await Promise.all([
      query(`SELECT task_id, to_char(last_done_date, 'YYYY-MM-DD') AS d, last_done_odometer AS odo FROM care_state`),
      query(`
        SELECT task_id, to_char(done_date, 'YYYY-MM-DD') AS d, odometer AS odo
        FROM care_history ORDER BY done_date DESC, id DESC LIMIT 300
      `),
    ]);

    const state: Record<string, TaskState> = {};
    stateRes.rows.forEach((r) => {
      state[r.task_id] = {
        lastDoneDate: r.d,
        ...(r.odo !== null && r.odo !== undefined ? { lastDoneOdometer: Number(r.odo) } : {}),
      };
    });
    const history = histRes.rows.map((r) => ({
      taskId: r.task_id as string,
      date: r.d as string,
      odometer: r.odo !== null && r.odo !== undefined ? Number(r.odo) : null,
    }));
    return NextResponse.json({ state, history });
  } catch (err) {
    console.error('Failed to read care state:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

/** Saves the whole care state, and optionally records one "done" event in the history. */
export async function PUT(req: NextRequest) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;

  try {
    const body = await req.json();
    const state = (body?.state || {}) as Record<string, TaskState>;
    type Ev = { taskId: string; date: string; odometer?: number | null };
    const events: Ev[] = Array.isArray(body?.events) ? body.events : body?.event ? [body.event] : [];

    await ensureExtraTables();

    for (const [taskId, t] of Object.entries(state)) {
      if (!ID_RE.test(taskId) || !t || !DATE_RE.test(t.lastDoneDate)) continue;
      const odo = t.lastDoneOdometer !== undefined && t.lastDoneOdometer !== null ? Number(t.lastDoneOdometer) : null;
      await query(
        `INSERT INTO care_state (task_id, last_done_date, last_done_odometer, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (task_id) DO UPDATE
           SET last_done_date = EXCLUDED.last_done_date,
               last_done_odometer = EXCLUDED.last_done_odometer,
               updated_at = NOW()`,
        [taskId, t.lastDoneDate, Number.isFinite(odo as number) ? odo : null]
      );
    }

    for (const event of events.slice(0, 50)) {
      if (!event || !ID_RE.test(event.taskId) || !DATE_RE.test(event.date)) continue;
      const odo = event.odometer !== undefined && event.odometer !== null ? Number(event.odometer) : null;
      await query(`INSERT INTO care_history (task_id, done_date, odometer) VALUES ($1, $2, $3)`, [
        event.taskId,
        event.date,
        Number.isFinite(odo as number) ? odo : null,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save care state:', err);
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
