-- 1. Redefine get_user_workspaces as plpgsql to prevent PostgreSQL query inlining (which causes RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE(workspace_id UUID)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT wm.workspace_id 
  FROM public.workspace_members wm 
  WHERE wm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 2. Create is_workspace_admin_or_owner security definer helper to check permissions without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ) INTO has_access;
  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- 3. Create is_workspace_owner security definer helper
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  ) INTO has_access;
  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-apply workspace_members RLS policies using the new helpers
DROP POLICY IF EXISTS "Members can view membership" ON public.workspace_members;
CREATE POLICY "Members can view membership" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

DROP POLICY IF EXISTS "Users/Admins can add members" ON public.workspace_members;
CREATE POLICY "Users/Admins can add members" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_workspace_admin_or_owner(workspace_id)
  );

DROP POLICY IF EXISTS "Admins can update membership" ON public.workspace_members;
CREATE POLICY "Admins can update membership" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (
    public.is_workspace_admin_or_owner(workspace_id)
  );

DROP POLICY IF EXISTS "Members/Admins can remove members" ON public.workspace_members;
CREATE POLICY "Members/Admins can remove members" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_workspace_admin_or_owner(workspace_id)
  );

-- 5. Re-apply workspaces RLS update/delete policies using the new helpers
DROP POLICY IF EXISTS "Admins/Owners can update workspaces" ON public.workspaces;
CREATE POLICY "Admins/Owners can update workspaces" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_workspace_admin_or_owner(id)
  );

DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete workspaces" ON public.workspaces
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_workspace_owner(id)
  );
