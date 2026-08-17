-- Fix workspace SELECT policy to allow owners to see the workspace even if they aren't in workspace_members yet (critical for creation step)
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;

CREATE POLICY "Members can view workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.get_user_workspaces())
  );

-- Create profile trigger function to handle new auth users and create their profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert profile records for any existing auth.users who do not have one
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1) as full_name 
FROM auth.users
ON CONFLICT (id) DO NOTHING;
