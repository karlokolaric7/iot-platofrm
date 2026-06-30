-- Phase 3: Enable RLS and define CRUD policies for devices, fields, and payload_decoders

-- ==========================================
-- 1. Devices Table Policies
-- ==========================================
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view devices" ON public.devices;
DROP POLICY IF EXISTS "Members can insert devices" ON public.devices;
DROP POLICY IF EXISTS "Members can update devices" ON public.devices;
DROP POLICY IF EXISTS "Members can delete devices" ON public.devices;

-- Members of the workspace can view its devices
CREATE POLICY "Members can view devices" ON public.devices
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can insert devices
CREATE POLICY "Members can insert devices" ON public.devices
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can update devices
CREATE POLICY "Members can update devices" ON public.devices
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can delete devices
CREATE POLICY "Members can delete devices" ON public.devices
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );


-- ==========================================
-- 2. Fields Table Policies
-- ==========================================
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view fields" ON public.fields;
DROP POLICY IF EXISTS "Members can insert fields" ON public.fields;
DROP POLICY IF EXISTS "Members can update fields" ON public.fields;
DROP POLICY IF EXISTS "Members can delete fields" ON public.fields;

-- Users can perform any operation on fields if they have access to the parent device
CREATE POLICY "Members can view fields" ON public.fields
  FOR SELECT TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can insert fields" ON public.fields
  FOR INSERT TO authenticated
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can update fields" ON public.fields
  FOR UPDATE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  )
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can delete fields" ON public.fields
  FOR DELETE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );


-- ==========================================
-- 3. Payload Decoders Table Policies
-- ==========================================
ALTER TABLE public.payload_decoders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view decoders" ON public.payload_decoders;
DROP POLICY IF EXISTS "Members can insert decoders" ON public.payload_decoders;
DROP POLICY IF EXISTS "Members can update decoders" ON public.payload_decoders;
DROP POLICY IF EXISTS "Members can delete decoders" ON public.payload_decoders;

-- Users can perform any operation on decoders if they have access to the parent device
CREATE POLICY "Members can view decoders" ON public.payload_decoders
  FOR SELECT TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can insert decoders" ON public.payload_decoders
  FOR INSERT TO authenticated
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can update decoders" ON public.payload_decoders
  FOR UPDATE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  )
  WITH CHECK (
    device_id IN (SELECT id FROM public.devices)
  );

CREATE POLICY "Members can delete decoders" ON public.payload_decoders
  FOR DELETE TO authenticated
  USING (
    device_id IN (SELECT id FROM public.devices)
  );
