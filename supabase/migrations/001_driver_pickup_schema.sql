-- Cherry pickup driver tables (same Postgres as platform backend)

CREATE TABLE IF NOT EXISTS driver_farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_name TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_farms_farm_name ON driver_farms (farm_name);

CREATE TABLE IF NOT EXISTS driver_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE,
  farm_id UUID NOT NULL REFERENCES driver_farms (id),
  created_by INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  arrival_timestamp TIMESTAMPTZ NOT NULL,
  departure_timestamp TIMESTAMPTZ NOT NULL,
  time_at_farm_minutes INTEGER,
  estimated_weight DOUBLE PRECISION NOT NULL,
  species TEXT NOT NULL,
  variety TEXT NOT NULL,
  road_condition TEXT NOT NULL,
  vehicle_used TEXT NOT NULL,
  distance_km DOUBLE PRECISION,
  estimated_fuel_liters DOUBLE PRECISION,
  notes TEXT,
  farm_photo_url TEXT,
  pickup_photo_url TEXT,
  signature_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_pickups_created_by ON driver_pickups (created_by, created_at DESC);

-- RLS: deny direct client access; service role used from API routes
ALTER TABLE driver_farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_driver_farms" ON driver_farms FOR ALL USING (false);
CREATE POLICY "deny_all_driver_pickups" ON driver_pickups FOR ALL USING (false);

-- Storage buckets (run in Supabase dashboard if SQL storage API unavailable):
-- farm-photos, pickup-photos, signatures (private)
