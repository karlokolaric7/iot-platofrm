-- Stress Test Safeguards Migration
-- Adds a composite index for faster per-field time-series lookups.
-- The existing index is (device_id, time DESC).
-- Under high load, filtering by field_id too avoids a sequential scan.

CREATE INDEX IF NOT EXISTS idx_measurements_device_field_time
  ON public.measurements (device_id, field_id, time DESC);
