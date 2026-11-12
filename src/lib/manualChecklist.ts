import { CHART, CHART_ROWS } from '@/lib/manualChartData';

export interface ManualItem {
  rowId: number;
  name: string;
  /** What the manual says to do at this service, in words. */
  action: string;
  /** Console lamps this item renews (empty for items the console does not track). */
  tasks: string[];
  /** True if doing this item at this service restarts its lamp. */
  renews: boolean;
}

const WORD: Record<string, string> = { C: 'check', CL: 'clean', R: 'replace', A: 'adjust', T: 'tighten', L: 'lubricate' };

/** Turns a chart code such as "C,A,L,T" or "CL/R" into plain words. */
export function describeCode(code: string): string {
  if (code === 'W') return 'part of the service';
  if (code === 'Top-up') return 'top up';
  if (code === 'R') return 'replace';
  if (code.includes('/R')) return 'clean, replace at this service';
  return code
    .split(',')
    .map((c) => (c === 'R' ? 'replace if needed' : WORD[c] ?? c))
    .join(', ');
}

/** Everything the owner manual lists for service number 1..16. */
export function checklistFor(service: number): ManualItem[] {
  const items: ManualItem[] = [];
  for (const row of CHART_ROWS) {
    const code = CHART[row.id]?.[service];
    if (!code) continue;
    const tasks = row.task ? (Array.isArray(row.task) ? row.task : [row.task]) : [];
    const renews =
      tasks.length > 0 &&
      (row.reset === 'any' || (row.reset === 'exact' && code === 'R') || (row.reset === 'slash' && code.includes('/R')));
    items.push({ rowId: row.id, name: row.name, action: describeCode(code), tasks, renews });
  }
  return items;
}
