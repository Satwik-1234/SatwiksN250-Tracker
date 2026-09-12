-- ==========================================================
-- MASTER POSTGRESQL SCHEMA FOR SATWIK'S N250 TRACKER
-- Compatible with Supabase, CockroachDB, Neon, and AWS RDS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/guttdxdsvpdknjztflcp/sql
-- ==========================================================

-- Clean up any obsolete functions or triggers if existing
DROP FUNCTION IF EXISTS public.recalculate_trip_metrics CASCADE;
DROP FUNCTION IF EXISTS public.handle_storage_upload CASCADE;

-- ----------------------------------------------------------
-- 1. FUEL REFILL LOGS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id VARCHAR(64) PRIMARY KEY,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    log_time TIME NOT NULL DEFAULT CURRENT_TIME,
    date_iso TIMESTAMPTZ NOT NULL DEFAULT now(),
    brand TEXT,
    station_name TEXT,
    odometer NUMERIC(10, 2) NOT NULL,
    is_full_tank BOOLEAN NOT NULL DEFAULT true,
    qty_filled_litres NUMERIC(10, 2) NOT NULL,
    price_per_litre NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    distance_from_last NUMERIC(10, 2) DEFAULT 0,
    mileage_kmpl NUMERIC(10, 2),
    cost_per_km NUMERIC(10, 2),
    trip_type TEXT NOT NULL DEFAULT 'Commute',
    notes TEXT,
    synced_to_sheet BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------
-- 2. TRIPS & HIGHWAY RIDES (UPGRADED MODEL)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    trip_type TEXT NOT NULL DEFAULT 'Highway', -- 'Highway', 'Tour', 'Commute', 'City'
    from_location TEXT NOT NULL DEFAULT 'Home',
    to_location TEXT NOT NULL DEFAULT 'Destination',
    departure_date DATE NOT NULL DEFAULT CURRENT_DATE,
    departure_time TIME DEFAULT CURRENT_TIME,
    arrival_date DATE,
    arrival_time TIME,
    start_odometer NUMERIC(10, 2) NOT NULL,
    end_odometer NUMERIC(10, 2),
    distance_covered NUMERIC(10, 2) DEFAULT 0,
    total_fuel_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_fuel_litres NUMERIC(10, 2) NOT NULL DEFAULT 0,
    avg_fuel_economy NUMERIC(10, 2), -- Bike MID / Instrument Cluster Reading (km/L)
    calculated_fuel_economy NUMERIC(10, 2), -- Calculated: distance_covered / total_fuel_litres (km/L)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all upgraded columns exist if trips table was already created
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS from_location TEXT DEFAULT 'Home';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS to_location TEXT DEFAULT 'Destination';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS departure_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS departure_time TIME DEFAULT CURRENT_TIME;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrival_date DATE;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrival_time TIME;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS distance_covered NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS avg_fuel_economy NUMERIC(10, 2);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS calculated_fuel_economy NUMERIC(10, 2);
ALTER TABLE public.service_logs ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.accessories_gear ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ----------------------------------------------------------
-- 3. SERVICE & MAINTENANCE LOGS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_logs (
    id VARCHAR(64) PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    odometer NUMERIC(10, 2) NOT NULL,
    service_type TEXT NOT NULL, -- e.g. 'Periodic Service', 'Oil Change', 'Chain Lube'
    service_center TEXT,
    total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    document_url TEXT, -- Direct link to Supabase Storage PDF, HTML bill, or PNG/JPEG
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------
-- 4. ACCESSORIES & RIDING GEAR
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accessories_gear (
    id VARCHAR(64) PRIMARY KEY,
    date_purchased DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Bike Accessory', 'Riding Gear', 'Electronics'
    brand TEXT,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    photo_url TEXT, -- Direct link to Supabase Storage image
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------
-- 5. APP SETTINGS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) FOR TABLES
-- ----------------------------------------------------------
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories_gear ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read fuel_logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Allow all fuel_logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Allow public read trips" ON public.trips;
DROP POLICY IF EXISTS "Allow all trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public read service_logs" ON public.service_logs;
DROP POLICY IF EXISTS "Allow all service_logs" ON public.service_logs;
DROP POLICY IF EXISTS "Allow public read accessories_gear" ON public.accessories_gear;
DROP POLICY IF EXISTS "Allow all accessories_gear" ON public.accessories_gear;

-- Allow public read access to all dashboard visitors
CREATE POLICY "Allow public read fuel_logs" ON public.fuel_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow public read service_logs" ON public.service_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read accessories_gear" ON public.accessories_gear FOR SELECT USING (true);

-- Allow full write / update / delete access
CREATE POLICY "Allow all fuel_logs" ON public.fuel_logs FOR ALL USING (true);
CREATE POLICY "Allow all trips" ON public.trips FOR ALL USING (true);
CREATE POLICY "Allow all service_logs" ON public.service_logs FOR ALL USING (true);
CREATE POLICY "Allow all accessories_gear" ON public.accessories_gear FOR ALL USING (true);

-- ----------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET CONFIGURATION (PDF, HTML, PNG, JPEG)
-- ----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bike_documents_N250',
  'bike_documents_N250',
  true,
  26214400, -- 25 MB file size limit
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'text/html',
    'application/xhtml+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'text/html',
    'application/xhtml+xml'
  ];

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public View bike_documents_N250" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload bike_documents_N250" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update bike_documents_N250" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete bike_documents_N250" ON storage.objects;

-- Allow anyone to view and download document attachments
CREATE POLICY "Public View bike_documents_N250"
ON storage.objects FOR SELECT
USING (bucket_id = 'bike_documents_N250');

-- Allow uploading PDFs, HTML invoices, PNG and JPEG images
CREATE POLICY "Allow Upload bike_documents_N250"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bike_documents_N250');

-- Allow updating document files
CREATE POLICY "Allow Update bike_documents_N250"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bike_documents_N250');

-- Allow deleting document files
CREATE POLICY "Allow Delete bike_documents_N250"
ON storage.objects FOR DELETE
USING (bucket_id = 'bike_documents_N250');

-- ----------------------------------------------------------
-- 8. INDEXES FOR HIGH-SPEED QUERIES
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fuel_logs_odometer ON public.fuel_logs(odometer DESC);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON public.trips(departure_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_logs_date ON public.service_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_accessories_date ON public.accessories_gear(date_purchased DESC);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
