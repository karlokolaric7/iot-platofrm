-- Step 3.A: Create the Dead Letter Queue (DLQ) table for failed ingestion logs

CREATE TABLE IF NOT EXISTS public.failed_ingest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  dev_eui TEXT,
  event_type TEXT NOT NULL,
  f_port INTEGER,
  f_cnt INTEGER,
  raw_payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  device_id UUID REFERENCES public.devices ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces ON DELETE CASCADE
);

-- ==========================================
-- Apply RLS Policies
-- ==========================================
ALTER TABLE public.failed_ingest_logs ENABLE ROW LEVEL SECURITY;

-- Workspace members can view failed ingestion logs for their workspace
CREATE POLICY "Members can view failed logs" ON public.failed_ingest_logs
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );
