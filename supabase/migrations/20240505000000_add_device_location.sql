-- Add latitude and longitude to devices table
ALTER TABLE public.devices
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;

-- Update RLS policies (optional, usually inherited if they use * but good to double check)
-- Standard RLS on 'devices' should already cover these new columns.
