-- Phase 4: Enable RLS and define CRUD policies for measurements and alerts

-- ==========================================
-- 1. Measurements Table Policies
-- ==========================================
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view measurements" ON public.measurements;
DROP POLICY IF EXISTS "Members can insert measurements" ON public.measurements;
DROP POLICY IF EXISTS "Members can update measurements" ON public.measurements;
DROP POLICY IF EXISTS "Members can delete measurements" ON public.measurements;

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


-- ==========================================
-- 2. Alerts Table Policies
-- ==========================================
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Members can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Members can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Members can delete alerts" ON public.alerts;

-- Members of the workspace can view its alerts
CREATE POLICY "Members can view alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can insert alerts
CREATE POLICY "Members can insert alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can update alerts (e.g., mark them as resolved)
CREATE POLICY "Members can update alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can delete alerts
CREATE POLICY "Members can delete alerts" ON public.alerts
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );
