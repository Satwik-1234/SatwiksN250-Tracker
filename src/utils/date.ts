/**
 * Local-time date helpers.
 *
 * The app repeatedly mixed two different calendars:
 *   - `new Date().toISOString().split('T')[0]` produces the **UTC** date, then
 *     gets re-parsed as local time later, shifting the entry by a day for
 *     anyone not on UTC.
 *   - `new Date('2026-09-30')` is parsed by the language as **UTC midnight**,
 *     then rendered with `toLocaleDateString()` in **local** time, which rolls
 *     back to the previous day west of UTC.
 *
 * Everything here goes through one of two explicit representations:
 *   - a "date key"  - `YYYY-MM-DD`, always the user's calendar day
 *   - a local datetime string - `YYYY-MM-DDTHH:mm`, always the user's wall clock
 */

/** `YYYY-MM-DD` for the user's local calendar day. */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `HH:mm` for the user's local wall clock. */
export function toTimeInput(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Combine a `<input type="date">` value and an `<input type="time">` value into
 * a UTC ISO string, treating both as **local** wall-clock time.
 */
export function localDateTimeToIso(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).toISOString();
}

/**
 * Parse a `YYYY-MM-DD` date key for display without the UTC-midnight
 * off-by-one. A plain `new Date(key)` is midnight UTC, which is the previous
 * calendar day anywhere west of UTC.
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return new Date(key);
  return new Date(y, m - 1, d);
}

/** Month key (`YYYY-MM`) for grouping, derived from a date key or ISO string. */
export function toMonthKey(input: string | Date): string {
  const d = typeof input === 'string' ? (input.length <= 10 ? parseDateKey(input) : new Date(input)) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `12 Sep` / `12 Sep 2026`, without the timezone trap. */
export function formatDay(input: string, opts: { year?: boolean } = {}): string {
  const d = input.length <= 10 ? parseDateKey(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const base = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  return opts.year ? `${base} ${d.getFullYear()}` : base;
}

/** Human relative age: `today`, `3d ago`, `2 mo ago`. */
export function formatRelativeDay(input: string): string {
  const d = input.length <= 10 ? parseDateKey(input) : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';

  const days = Math.floor((startOfToday().getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 31) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
