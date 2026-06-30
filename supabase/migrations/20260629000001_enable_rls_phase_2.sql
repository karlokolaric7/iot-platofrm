-- Phase 2: Create a recursion-free membership helper and enable RLS on workspace_members

-- ==========================================
-- 1. Create Security Definer Helper Function
-- ==========================================
-- This function runs with the privileges of the creator (postgres)
-- to bypass RLS and prevent circular recursion.
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE(workspace_id UUID)
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql;


-- ==========================================
-- 2. Update Workspaces SELECT Policy
-- ==========================================
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;

CREATE POLICY "Members can view workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT public.get_user_workspaces())
  );


-- ==========================================
-- 3. Workspace Members Table Policies
-- ==========================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace_members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can leave workspaces" ON public.workspace_members;

-- Members of a workspace can view the membership list of that workspace
CREATE POLICY "Members can view membership" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT public.get_user_workspaces())
  );

-- Users can join workspaces (insert their own membership) or admins can add members
CREATE POLICY "Users/Admins can add members" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Either they are adding themselves (e.g. creating a workspace or accepting invite)
    auth.uid() = user_id
    OR
    -- Or the adder is an admin/owner of the target workspace
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM public.workspace_members wm 
      WHERE wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Only owners/admins can update member roles
CREATE POLICY "Admins can update membership" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM public.workspace_members wm 
      WHERE wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Members can remove themselves (leave), or owners/admins can remove members
CREATE POLICY "Members/Admins can remove members" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM public.workspace_members wm 
      WHERE wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );
