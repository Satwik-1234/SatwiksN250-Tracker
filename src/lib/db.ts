import { Pool, QueryResult, QueryResultRow } from 'pg';

// Global cache for pg Pool to prevent connection exhaustion in serverless environments (Next.js / Vercel)
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  if (!global._pgPool) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    global._pgPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    global._pgPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return global._pgPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  if (!pool) {
    throw new Error(
      'DATABASE_URL is not set. Please define DATABASE_URL in your .env.local or Vercel environment variables.'
    );
  }
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PostgreSQL] Executed query in ${duration}ms: ${text.slice(0, 80)}...`);
  }
  return res;
}

export async function isDbConnected(): Promise<boolean> {
  try {
    const pool = getPool();
    if (!pool) return false;
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('PostgreSQL connection check failed:', err);
    return false;
  }
}
