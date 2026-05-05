"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Cpu,
  BarChart3,
  Users,
  Settings,
  GitBranch,
  Network,
  Bell,
  Key,
  ChevronDown,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useWorkspaces, 
  useWorkspace, 
  useCurrentUser 
} from "@/hooks/use-iot-data";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { MOCK_WORKSPACES, ACTIVE_WORKSPACE } from "@/lib/mock-data";

export function AppSidebar() {
  const [mounted, setMounted] = React.useState(false);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const params = useParams();
  const router = useRouter();
  const workspaceId = (params?.workspaceId as string) || "";
  const pathname = usePathname();

  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { data: activeWorkspace } = useWorkspace(workspaceId);
  const { data: user } = useCurrentUser();

  if (!mounted) {
    return <Sidebar collapsible="icon" className="border-r border-sidebar-border" />
  }

  const currentWorkspace = activeWorkspace || workspaces.find(w => w.slug === workspaceId || w.id === workspaceId);

  const navItems = [
    {
      group: "Overview",
      items: [
        {
          label: "Dashboards",
          href: `/${workspaceId}/dashboards`,
          icon: LayoutDashboard,
        },
      ],
    },
    {
      group: "Management",
      items: [
        { label: "Devices", href: `/${workspaceId}/devices`, icon: Cpu },
        { label: "Gateways", href: `/${workspaceId}/gateways`, icon: Network },
        { label: "Rule Engine", href: `/${workspaceId}/rules`, icon: GitBranch },
      ],
    },
    {
      group: "Analytics",
      items: [
        { label: "Data Explorer", href: `/${workspaceId}/explorer`, icon: BarChart3 },
        { label: "Alerts", href: `/${workspaceId}/alerts`, icon: Bell },
      ],
    },
    {
      group: "Settings",
      items: [
        { label: "Members", href: `/${workspaceId}/members`, icon: Users },
        { label: "API Settings", href: `/${workspaceId}/api`, icon: Key },
        { label: "Workspace", href: `/${workspaceId}/settings`, icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton className="w-full justify-start gap-2.5 px-2 py-2 text-left hover:bg-sidebar-accent transition-colors group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                {currentWorkspace?.name.charAt(0) || <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold leading-tight">
                  {currentWorkspace?.name || "Loading..."}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {currentWorkspace?.plan || "..."} plan
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          } />
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspaces
            </div>
            {workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                className="gap-2 cursor-pointer"
                onClick={() => router.push(`/${ws.slug}/dashboards`)}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                  {ws.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.slug === workspaceId && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/5"
              onClick={() => setIsInviteOpen(true)}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm">Add Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname?.startsWith(item.href) && item.href !== "/");
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            isActive
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/70"
                          )}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Account" className="gap-2 h-12">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold overflow-hidden">
                {user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.profile?.full_name || user?.email || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-bold leading-tight">
                  {user?.profile?.full_name || user?.email?.split('@')[0] || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "No email"}
                </p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <CreateWorkspaceDialog 
        open={isInviteOpen} 
        onOpenChange={setIsInviteOpen} 
      />
    </Sidebar>
  );
}
