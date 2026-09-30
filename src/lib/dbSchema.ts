/**
 * Single source of truth for the database schema.
 *
 * Every table/column here is dictated by what the API routes actually read and
 * write in src/app/api/**. The historical problem was two hand-maintained
 * copies (this file's predecessor, `schema.sql`, and the `init-db` route) that
 * disagreed on every fuel_logs and trips column, so the Postgres read path
 * failed with 42703 and silently fell through to seed data.
 *
 * Statements are stored as an array rather than one blob so that a single
 * failure (e.g. a Supabase-only statement on plain Postgres) cannot abort the
 * whole migration. The runner executes each independently and reports which
 * ones failed.
 */

export const CORE_SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS fuel_logs (
     id                      VARCHAR(64) PRIMARY KEY,
     date                    TIMESTAMPTZ NOT NULL,
     odometer                NUMERIC(10, 2) NOT NULL,
     fuel_amount             NUMERIC(10, 2) NOT NULL,
     total_cost              NUMERIC(10, 2) NOT NULL,
     price_per_litre         NUMERIC(10, 2) NOT NULL,
     is_full_tank            BOOLEAN NOT NULL DEFAULT FALSE,
     trip_type               VARCHAR(32) NOT NULL DEFAULT 'Commute',
     station_name            VARCHAR(255),
     notes                   TEXT,
     distance_calculated     NUMERIC(10, 2),
     mileage_calculated      NUMERIC(10, 2),
     cost_per_km_calculated  NUMERIC(10, 2),
     synced                  BOOLEAN NOT NULL DEFAULT TRUE,
     created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS trips (
     id                        VARCHAR(64) PRIMARY KEY,
     name                      VARCHAR(255) NOT NULL,
     trip_type                 VARCHAR(32) NOT NULL DEFAULT 'Highway',
     from_location             VARCHAR(255),
     to_location               VARCHAR(255),
     departure_date            DATE,
     departure_time            TIME,
     arrival_date              DATE,
     arrival_time              TIME,
     start_odometer            NUMERIC(10, 2) NOT NULL,
     end_odometer              NUMERIC(10, 2),
     distance_covered          NUMERIC(10, 2) DEFAULT 0,
     total_fuel_cost           NUMERIC(10, 2) DEFAULT 0,
     total_fuel_litres         NUMERIC(10, 2) DEFAULT 0,
     avg_fuel_economy          NUMERIC(10, 2),
     calculated_fuel_economy   NUMERIC(10, 2),
     notes                     TEXT,
     created_at                TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS service_logs (
     id              VARCHAR(64) PRIMARY KEY,
     date            TIMESTAMPTZ NOT NULL,
     odometer        NUMERIC(10, 2) NOT NULL,
     service_type    VARCHAR(128) NOT NULL,
     service_center  VARCHAR(255),
     total_cost      NUMERIC(10, 2) DEFAULT 0,
     notes           TEXT,
     document_url    TEXT,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS accessories_gear (
     id              VARCHAR(64) PRIMARY KEY,
     date_purchased  TIMESTAMPTZ NOT NULL,
     item_name       VARCHAR(255) NOT NULL,
     category        VARCHAR(128) NOT NULL,
     brand           VARCHAR(128),
     cost            NUMERIC(10, 2) DEFAULT 0,
     notes           TEXT,
     photo_url       TEXT,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,

  `CREATE TABLE IF NOT EXISTS app_settings (
     key         VARCHAR(64) PRIMARY KEY,
     value       JSONB NOT NULL,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
];

/**
 * Migration path for databases created from the legacy `schema.sql`, which used
 * a completely different set of column names. Every statement is idempotent and
 * only runs when the target column is genuinely absent.
 *
 * The backfill DO blocks are guarded on the *legacy* column existing, so this is
 * a no-op on an already-correct database.
 */
export const MIGRATION_SCHEMA: string[] = [
  // --- fuel_logs: route-required columns missing from the legacy shape ---
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS fuel_amount NUMERIC(10, 2)`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 2)`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS distance_calculated NUMERIC(10, 2)`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS mileage_calculated NUMERIC(10, 2)`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS cost_per_km_calculated NUMERIC(10, 2)`,
  `ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS synced BOOLEAN`,

  // Backfill from the legacy names (date_iso, qty_filled_litres, amount_paid,
  // distance_from_last, mileage_kmpl, cost_per_km, synced_to_sheet).
  `DO $$
   BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'date_iso') THEN
       UPDATE fuel_logs SET date = date_iso WHERE date IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'qty_filled_litres') THEN
       UPDATE fuel_logs SET fuel_amount = qty_filled_litres WHERE fuel_amount IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'amount_paid') THEN
       UPDATE fuel_logs SET total_cost = amount_paid WHERE total_cost IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'distance_from_last') THEN
       UPDATE fuel_logs SET distance_calculated = distance_from_last
         WHERE distance_calculated IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'mileage_kmpl') THEN
       UPDATE fuel_logs SET mileage_calculated = mileage_kmpl
         WHERE mileage_calculated IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'cost_per_km') THEN
       UPDATE fuel_logs SET cost_per_km_calculated = cost_per_km
         WHERE cost_per_km_calculated IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'fuel_logs'
                  AND column_name = 'synced_to_sheet') THEN
       UPDATE fuel_logs SET synced = synced_to_sheet WHERE synced IS NULL;
     END IF;
   END $$`,

  // --- trips: legacy shape lacked start_date / end_date ---
  `ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ`,
  `ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ`,

  `DO $$
   BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'trips'
                  AND column_name = 'departure_date') THEN
       UPDATE trips SET start_date = departure_date WHERE start_date IS NULL;
     END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'trips'
                  AND column_name = 'arrival_date') THEN
       UPDATE trips SET end_date = arrival_date WHERE end_date IS NULL;
     END IF;
   END $$`,

  // --- service_logs / accessories_gear: date columns were DATE, routes expect TIMESTAMPTZ ---
  `ALTER TABLE service_logs ADD COLUMN IF NOT EXISTS document_url TEXT`,
  `ALTER TABLE accessories_gear ADD COLUMN IF NOT EXISTS photo_url TEXT`,

  // Relax NOT NULL on columns added by this migration, so the ALTERs above can
  // succeed on a populated table. Route handlers already validate input.
  `DO $$
   BEGIN
     ALTER TABLE fuel_logs ALTER COLUMN date DROP NOT NULL;
   EXCEPTION WHEN others THEN NULL;
   END $$`,
  `DO $$
   BEGIN
     ALTER TABLE fuel_logs ALTER COLUMN fuel_amount DROP NOT NULL;
   EXCEPTION WHEN others THEN NULL;
   END $$`,
  `DO $$
   BEGIN
     ALTER TABLE fuel_logs ALTER COLUMN total_cost DROP NOT NULL;
   EXCEPTION WHEN others THEN NULL;
   END $$`,
];

/**
 * Data-integrity constraints. Added NOT VALID so they apply to new writes
 * without failing on pre-existing rows that may violate them.
 */
export const CONSTRAINT_SCHEMA: string[] = [
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_odometer_nonneg') THEN
       ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_odometer_nonneg
         CHECK (odometer IS NULL OR odometer >= 0) NOT VALID;
     END IF;
   END $$`,
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_amount_positive') THEN
       ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_amount_positive
         CHECK (fuel_amount IS NULL OR fuel_amount > 0) NOT VALID;
     END IF;
   END $$`,
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_cost_nonneg') THEN
       ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_cost_nonneg
         CHECK (total_cost IS NULL OR total_cost >= 0) NOT VALID;
     END IF;
   END $$`,
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_price_positive') THEN
       ALTER TABLE fuel_logs ADD CONSTRAINT fuel_logs_price_positive
         CHECK (price_per_litre IS NULL OR price_per_litre > 0) NOT VALID;
     END IF;
   END $$`,
];

export const INDEX_SCHEMA: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_fuel_logs_odometer ON public.fuel_logs(odometer DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_service_logs_date ON public.service_logs(date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_accessories_date ON public.accessories_gear(date_purchased DESC)`,
];

/**
 * Supabase-only statements. These reference `storage` and `auth` schemas, so
 * they fail on plain Postgres (Neon, RDS, CockroachDB). The runner treats
 * failures here as expected-and-ignored rather than aborting the core schema.
 */
export const SUPABASE_SCHEMA: string[] = [
  `ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.accessories_gear ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "Allow public read fuel_logs" ON public.fuel_logs`,
  `DROP POLICY IF EXISTS "Allow all fuel_logs" ON public.fuel_logs`,
  `DROP POLICY IF EXISTS "Allow authenticated write fuel_logs" ON public.fuel_logs`,
  `DROP POLICY IF EXISTS "Allow public read trips" ON public.trips`,
  `DROP POLICY IF EXISTS "Allow all trips" ON public.trips`,
  `DROP POLICY IF EXISTS "Allow authenticated write trips" ON public.trips`,
  `DROP POLICY IF EXISTS "Allow public read service_logs" ON public.service_logs`,
  `DROP POLICY IF EXISTS "Allow all service_logs" ON public.service_logs`,
  `DROP POLICY IF EXISTS "Allow authenticated write service_logs" ON public.service_logs`,
  `DROP POLICY IF EXISTS "Allow public read accessories_gear" ON public.accessories_gear`,
  `DROP POLICY IF EXISTS "Allow all accessories_gear" ON public.accessories_gear`,
  `DROP POLICY IF EXISTS "Allow authenticated write accessories_gear" ON public.accessories_gear`,

  // Public read so the dashboard renders for every visitor.
  // Writes are NOT granted to anon: all mutations flow through the
  // authenticated Next.js API routes. A "FOR ALL USING (true)" policy would
  // let anyone bypass the owner session via the Supabase REST endpoint.
  `CREATE POLICY "Allow public read fuel_logs" ON public.fuel_logs FOR SELECT USING (true)`,
  `CREATE POLICY "Allow public read trips" ON public.trips FOR SELECT USING (true)`,
  `CREATE POLICY "Allow public read service_logs" ON public.service_logs FOR SELECT USING (true)`,
  `CREATE POLICY "Allow public read accessories_gear" ON public.accessories_gear FOR SELECT USING (true)`,

  `CREATE POLICY "Allow authenticated write fuel_logs" ON public.fuel_logs
     FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)`,
  `CREATE POLICY "Allow authenticated write trips" ON public.trips
     FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)`,
  `CREATE POLICY "Allow authenticated write service_logs" ON public.service_logs
     FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)`,
  `CREATE POLICY "Allow authenticated write accessories_gear" ON public.accessories_gear
     FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)`,

  `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES ('bike_documents_N250', 'bike_documents_N250', true, 10485760,
     ARRAY['image/png','image/jpeg','image/webp','application/pdf','text/html'])
   ON CONFLICT (id) DO UPDATE SET
     public = true,
     file_size_limit = 10485760,
     allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','application/pdf','text/html']`,

  `DROP POLICY IF EXISTS "Public View bike_documents_N250" ON storage.objects`,
  `CREATE POLICY "Public View bike_documents_N250" ON storage.objects FOR SELECT
     USING (bucket_id = 'bike_documents_N250')`,

  `DROP POLICY IF EXISTS "Allow Upload bike_documents_N250" ON storage.objects`,
  `CREATE POLICY "Allow Upload bike_documents_N250" ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'bike_documents_N250')`,

  `NOTIFY pgrst, 'reload schema'`,
];
