-- Raw device logs table for storing every uplink/event from ChirpStack
-- This captures data BEFORE decoding, so users always have visibility into what's arriving
CREATE TABLE IF NOT EXISTS public.device_logs (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID REFERENCES public.devices ON DELETE CASCADE NOT NULL,
  dev_eui TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'uplink', -- uplink, join, ack, error, status, location
  f_port INTEGER,
  f_cnt INTEGER,
  data_base64 TEXT,  -- raw payload in base64
  object JSONB,      -- decoded payload (if codec is configured)
  rx_info JSONB,     -- gateway reception info (rssi, snr, etc.)
  tx_info JSONB,     -- transmission info (frequency, dr, etc.)
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB, -- full ChirpStack event payload
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying logs by device
CREATE INDEX idx_device_logs_device_time ON public.device_logs(device_id, created_at DESC);
CREATE INDEX idx_device_logs_dev_eui ON public.device_logs(dev_eui);

-- Disable RLS (as per existing pattern in this project)
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (matching existing disable_rls migration)
CREATE POLICY "Allow all on device_logs" ON public.device_logs FOR ALL USING (true) WITH CHECK (true);
