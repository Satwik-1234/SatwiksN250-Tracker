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
    `).then(() => undefined);
    ready.catch(() => {
      ready = null; // retry on the next request
    });
  }
  return ready;
}
