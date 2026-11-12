import { query } from '@/lib/db';

/**
 * Tables for the Console (care reminders) and Documents sections.
 * Created on first use with IF NOT EXISTS, so no manual migration step is
 * needed on a fresh or existing database. Mirrored in schema.sql.
 */
let ready: Promise<void> | null = null;

export function ensureExtraTables(): Promise<void> {
  if (!ready) {
    ready = query(`
      CREATE TABLE IF NOT EXISTS care_state (
        task_id VARCHAR(64) PRIMARY KEY,
        last_done_date DATE NOT NULL,
        last_done_odometer NUMERIC(10, 1),
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS care_history (
        id BIGSERIAL PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        done_date DATE NOT NULL,
        odometer NUMERIC(10, 1),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS care_history_task_idx ON care_history (task_id, done_date DESC);

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alert_log (
        alert_key VARCHAR(255) PRIMARY KEY,
        last_sent TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_attempts (
        ip VARCHAR(64) PRIMARY KEY,
        fails INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        locked_until TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS bike_documents (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL DEFAULT 'Other',
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        size_bytes INTEGER NOT NULL,
        content BYTEA NOT NULL,
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Private tables: row-level security on and no policies, so the public anon key
      -- (which ships inside the app) can never read them. The server connects as the
      -- table owner and is not affected.
      ALTER TABLE care_state ENABLE ROW LEVEL SECURITY;
      ALTER TABLE care_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE bike_documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
      ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
    `).then(() => undefined);
    ready.catch(() => {
      ready = null; // retry on the next request
    });
  }
  return ready;
}
