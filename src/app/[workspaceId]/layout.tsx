import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
