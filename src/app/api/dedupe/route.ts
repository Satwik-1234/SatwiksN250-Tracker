import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireOwner } from '@/lib/ownerSession';
import { errorMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Owner only. Removes exact duplicate rows (same date, same numbers, same name),
 * keeping one copy of each. Fuel logs, services, accessories and trips.
 * GET only counts; POST deletes.
 */
const RULES: { table: string; label: string; same: string; keepCol?: string }[] = [
  { table: 'fuel_logs', label: 'fuel logs', same: 'a.date = b.date AND a.odometer = b.odometer AND a.fuel_amount = b.fuel_amount AND a.total_cost = b.total_cost' },
  { table: 'service_logs', label: 'services', same: 'a.date::date = b.date::date AND a.odometer = b.odometer AND lower(a.service_type) = lower(b.service_type) AND a.total_cost IS NOT DISTINCT FROM b.total_cost', keepCol: 'document_url' },
  { table: 'accessories_gear', label: 'accessories', same: 'a.date_purchased::date = b.date_purchased::date AND lower(trim(a.item_name)) = lower(trim(b.item_name)) AND a.cost IS NOT DISTINCT FROM b.cost', keepCol: 'photo_url' },
  { table: 'trips', label: 'trips', same: 'lower(trim(a.name)) = lower(trim(b.name)) AND a.departure_date IS NOT DISTINCT FROM b.departure_date AND a.start_odometer IS NOT DISTINCT FROM b.start_odometer' },
];

async function run(req: NextRequest, apply: boolean) {
  const ownerError = requireOwner(req);
  if (ownerError) return ownerError;
  try {
    const result: Record<string, number> = {};
    for (const r of RULES) {
      // "b" is the copy we keep (smallest id); every other identical row "a" is a duplicate.
      // When copies differ only in an attached photo/bill, the one that has the file is kept.
      const c = r.keepCol;
      const keep = c
        ? `(CASE WHEN coalesce(b.${c},'') <> '' AND coalesce(a.${c},'') = '' THEN true WHEN (coalesce(a.${c},'') = '') = (coalesce(b.${c},'') = '') THEN a.id::text > b.id::text ELSE false END)`
        : 'a.id::text > b.id::text';
      const where = `${r.same} AND ${keep}`;
      if (apply) {
        const del = await query(`DELETE FROM ${r.table} a USING ${r.table} b WHERE ${where}`);
        result[r.label] = del.rowCount ?? 0;
      } else {
        const cnt = await query(`SELECT count(DISTINCT a.id) AS n FROM ${r.table} a JOIN ${r.table} b ON ${where}`);
        result[r.label] = Number(cnt.rows[0]?.n || 0);
      }
    }
    return NextResponse.json({ applied: apply, duplicates: result });
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => run(req, false);
export const POST = (req: NextRequest) => run(req, true);
