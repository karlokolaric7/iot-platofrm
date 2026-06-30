-- Phase 5 (Final): Enable RLS and define CRUD policies for dashboards, widgets, gateways, and rules

-- ==========================================
-- 1. Dashboards Table Policies
-- ==========================================
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Members can insert dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Members can update dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Members can delete dashboards" ON public.dashboards;

-- Members of the workspace can view its dashboards
CREATE POLICY "Members can view dashboards" ON public.dashboards
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can insert dashboards
CREATE POLICY "Members can insert dashboards" ON public.dashboards
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can update dashboards
CREATE POLICY "Members can update dashboards" ON public.dashboards
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can delete dashboards
CREATE POLICY "Members can delete dashboards" ON public.dashboards
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );


-- ==========================================
-- 2. Widgets Table Policies
-- ==========================================
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view widgets" ON public.widgets;
DROP POLICY IF EXISTS "Members can insert widgets" ON public.widgets;
DROP POLICY IF EXISTS "Members can update widgets" ON public.widgets;
DROP POLICY IF EXISTS "Members can delete widgets" ON public.widgets;

-- Users can view/modify widgets if they have access to the parent dashboard
CREATE POLICY "Members can view widgets" ON public.widgets
  FOR SELECT TO authenticated
  USING (
    dashboard_id IN (SELECT id FROM public.dashboards)
  );

CREATE POLICY "Members can insert widgets" ON public.widgets
  FOR INSERT TO authenticated
  WITH CHECK (
    dashboard_id IN (SELECT id FROM public.dashboards)
  );

CREATE POLICY "Members can update widgets" ON public.widgets
  FOR UPDATE TO authenticated
  USING (
    dashboard_id IN (SELECT id FROM public.dashboards)
  )
  WITH CHECK (
    dashboard_id IN (SELECT id FROM public.dashboards)
  );

CREATE POLICY "Members can delete widgets" ON public.widgets
  FOR DELETE TO authenticated
  USING (
    dashboard_id IN (SELECT id FROM public.dashboards)
  );


-- ==========================================
-- 3. Gateways Table Policies
-- ==========================================
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view gateways" ON public.gateways;
DROP POLICY IF EXISTS "Members can insert gateways" ON public.gateways;
DROP POLICY IF EXISTS "Members can update gateways" ON public.gateways;
DROP POLICY IF EXISTS "Members can delete gateways" ON public.gateways;

-- Members of the workspace can view its gateways
CREATE POLICY "Members can view gateways" ON public.gateways
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can insert gateways
CREATE POLICY "Members can insert gateways" ON public.gateways
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can update gateways
CREATE POLICY "Members can update gateways" ON public.gateways
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can delete gateways
CREATE POLICY "Members can delete gateways" ON public.gateways
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );


-- ==========================================
-- 4. Rules Table Policies
-- ==========================================
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view rules" ON public.rules;
DROP POLICY IF EXISTS "Members can insert rules" ON public.rules;
DROP POLICY IF EXISTS "Members can update rules" ON public.rules;
DROP POLICY IF EXISTS "Members can delete rules" ON public.rules;

-- Members of the workspace can view its rules
CREATE POLICY "Members can view rules" ON public.rules
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can insert rules
CREATE POLICY "Members can insert rules" ON public.rules
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can update rules
CREATE POLICY "Members can update rules" ON public.rules
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Members of the workspace can delete rules
CREATE POLICY "Members can delete rules" ON public.rules
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );
