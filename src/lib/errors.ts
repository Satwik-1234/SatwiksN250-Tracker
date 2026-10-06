/** Extract a human-readable message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = ''): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}
