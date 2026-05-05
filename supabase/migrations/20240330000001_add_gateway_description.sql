-- Add description column to gateways table
ALTER TABLE public.gateways ADD COLUMN IF NOT EXISTS description TEXT;
