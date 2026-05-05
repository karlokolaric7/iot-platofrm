-- Add missing RLS policies for gateways table
-- Allow workspace members to insert, update, and delete gateways

CREATE POLICY "Members can insert gateways" ON public.gateways
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = gateways.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update gateways" ON public.gateways
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = gateways.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete gateways" ON public.gateways
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = gateways.workspace_id AND user_id = auth.uid()
    )
  );
