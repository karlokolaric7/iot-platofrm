-- Create device_downlinks table
CREATE TABLE IF NOT EXISTS public.device_downlinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    f_port INTEGER NOT NULL CHECK (f_port >= 1 AND f_port <= 223),
    payload_raw TEXT NOT NULL,
    payload_type TEXT NOT NULL CHECK (payload_type IN ('hex', 'base64', 'text')),
    confirmed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.device_downlinks ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for managing downlinks
CREATE POLICY manage_device_downlinks_policy ON public.device_downlinks
    FOR ALL
    USING (
        exists (
            SELECT 1 FROM public.devices d
            JOIN public.workspace_members wm ON wm.workspace_id = d.workspace_id
            WHERE d.id = device_downlinks.device_id
            AND wm.user_id = auth.uid()
        )
    );
