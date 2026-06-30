import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // Check if workspaceId is a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);

  // Query the workspace. RLS ensures we can only select it if the user is a member.
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq(isUUID ? "id" : "slug", workspaceId)
    .maybeSingle();

  if (!workspace) {
    // User is not a member of this workspace (or it doesn't exist).
    // Redirect them to their first accessible workspace.
    const { data: myWorkspaces } = await supabase
      .from("workspaces")
      .select("slug")
      .limit(1);

    if (myWorkspaces && myWorkspaces.length > 0) {
      redirect(`/${myWorkspaces[0].slug}/dashboards`);
    } else {
      // No workspaces at all, redirect to auth
      redirect("/auth");
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
