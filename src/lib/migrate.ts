import { query } from './db';

export type RunResult = {
  applied: number;
  failed: { statement: string; error: string }[];
};

/**
 * Executes each SQL statement independently.
 *
 * The original schema was piped to the driver as a single multi-statement
 * command, which meant one bad statement aborted every statement after it --
 * on a fresh database the two stray ALTER TABLEs at the top of the file
 * aborted the CREATE TABLEs, the bucket, the RLS policies and the indexes.
 * Running statements one at a time makes a failure local to itself.
 */
export async function runStatements(
  statements: string[],
  { optional = false }: { optional?: boolean } = {}
): Promise<RunResult> {
  const result: RunResult = { applied: 0, failed: [] };

  for (const statement of statements) {
    try {
      await query(statement);
      result.applied += 1;
    } catch (err: any) {
      if (optional) continue;
      result.failed.push({
        statement: statement.trim().split('\n')[0].slice(0, 120),
        error: err.message,
      });
    }
  }

  return result;
}
