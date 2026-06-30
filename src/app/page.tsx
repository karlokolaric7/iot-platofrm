import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }
  
  // Try to find the first available workspace
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('slug')
    .limit(1);

  if (workspaces && workspaces.length > 0) {
    redirect(`/${workspaces[0].slug}/dashboards`);
  }

  // Fallback to the default mock/initial workspace ID if none found yet
  redirect("/ws-1/dashboards");
}
