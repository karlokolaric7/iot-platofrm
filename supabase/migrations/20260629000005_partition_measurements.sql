-- Step 2.A: Convert measurements table to a partitioned table by month

-- ==========================================
-- 1. Rename existing measurements table
-- ==========================================
ALTER TABLE public.measurements RENAME TO measurements_old;


-- ==========================================
-- 2. Create the new Partitioned Table
-- ==========================================
-- Note: In PostgreSQL partitioned tables, the primary key must include the partition key (time).
CREATE TABLE public.measurements (
  id BIGSERIAL,
  time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  device_id UUID REFERENCES public.devices ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES public.fields ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  PRIMARY KEY (id, time)
) PARTITION BY RANGE (time);


-- ==========================================
-- 3. Create Partition Tables
-- ==========================================
-- Pre-create partitions for May 2026 through December 2026
CREATE TABLE public.measurements_y2026m05 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m06 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m07 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m08 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m09 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m10 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m11 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE public.measurements_y2026m12 PARTITION OF public.measurements
  FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Fallback default partition for any dates outside the pre-created ranges
CREATE TABLE public.measurements_default PARTITION OF public.measurements DEFAULT;


-- ==========================================
-- 4. Migrate Existing Data
-- ==========================================
-- PostgreSQL will automatically route the rows to their correct partition tables
INSERT INTO public.measurements (id, time, device_id, field_id, value, metadata)
SELECT id, time, device_id, field_id, value, metadata FROM public.measurements_old;


-- ==========================================
-- 5. Drop the Old Table
-- ==========================================
DROP TABLE public.measurements_old;


-- ==========================================
-- 6. Create Indexes on Partitioned Table
-- ==========================================
-- Creating these on the parent table automatically creates them on all partitions
CREATE INDEX idx_measurements_device_time ON public.measurements(device_id, time DESC);
CREATE INDEX idx_measurements_field_time ON public.measurements(field_id, time DESC);
CREATE INDEX idx_measurements_device_field_time ON public.measurements (device_id, field_id, time DESC);


-- ==========================================
-- 7. Apply RLS Policies
-- ==========================================
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Users can view measurements of devices they have access to
CREATE POLICY "Members can view measurements" ON public.measurements
  FOR SELECT TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );

-- Users can insert measurements for devices they have access to
CREATE POLICY "Members can insert measurements" ON public.measurements
  FOR INSERT TO authenticated
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

-- Users can update measurements for devices they have access to
CREATE POLICY "Members can update measurements" ON public.measurements
  FOR UPDATE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  )
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

-- Users can delete measurements of devices they have access to
CREATE POLICY "Members can delete measurements" ON public.measurements
  FOR DELETE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );
