-- Code the driver gives receiving staff to link batch ↔ pickup
ALTER TABLE driver_pickups
  ADD COLUMN IF NOT EXISTS handoff_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_pickups_handoff_code
  ON driver_pickups (handoff_code)
  WHERE handoff_code IS NOT NULL;
