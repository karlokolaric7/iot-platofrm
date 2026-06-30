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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
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
import { useLanguage } from "@/context/language-context";

export function AppSidebar() {
  const { t } = useLanguage();
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
    return <Sidebar collapsible="icon" className="border-r border-slate-100 bg-white dark:bg-slate-950" />
  }

  const currentWorkspace = activeWorkspace || workspaces.find(w => w.slug === workspaceId || w.id === workspaceId);

  // Flat menu structure dynamically translated
  const navItems = [
    { label: t("sidebar.overview"), href: `/${workspaceId}/dashboards`, icon: "dashboard" },
    { label: t("sidebar.map"), href: `/${workspaceId}/map`, icon: "map" },
    { label: t("sidebar.devices"), href: `/${workspaceId}/devices`, icon: "router" },
    { label: t("sidebar.gateways"), href: `/${workspaceId}/gateways`, icon: "hub" },
    { label: t("sidebar.ruleEngine"), href: `/${workspaceId}/rules`, icon: "bolt" },
    { label: t("sidebar.dataExplorer"), href: `/${workspaceId}/explorer`, icon: "timeline" },
    { label: t("sidebar.digitalTwin"), href: `/${workspaceId}/digital-twin`, icon: "layers" },
    { label: t("sidebar.alerts"), href: `/${workspaceId}/alerts`, icon: "notifications_active" },
    { label: t("sidebar.members"), href: `/${workspaceId}/members`, icon: "group" },
    { label: t("sidebar.apiSettings"), href: `/${workspaceId}/api`, icon: "key" },
    { label: t("sidebar.userManual"), href: `/${workspaceId}/manual`, icon: "menu_book" },
    { label: t("sidebar.capabilities"), href: `/${workspaceId}/capabilities`, icon: "analytics" },
    { label: t("sidebar.workspace"), href: `/${workspaceId}/settings`, icon: "settings" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 font-sans">
      <SidebarHeader className="pt-6 pb-4 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full outline-none border-none text-left">
            <SidebarMenuButton render={<div />} className="w-full justify-between px-2 mb-2 h-auto hover:bg-transparent focus:bg-transparent active:bg-transparent text-left group">
              <div className="flex-1 overflow-hidden">
                <img 
                  src="/chameleon-logo.png" 
                  alt="Chameleon Logo" 
                  className="h-14 max-w-[210px] object-contain dark:brightness-0 dark:invert transition-all duration-200"
                />
              </div>
              <span className="material-symbols-outlined text-[16px] shrink-0 text-slate-400 group-data-[collapsible=icon]:hidden">expand_more</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("sidebar.workspaces")}
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
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">{t("sidebar.active")}</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/5"
              onClick={() => setIsInviteOpen(true)}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">add</span>
              </div>
              <span className="font-semibold text-sm">{t("sidebar.addWorkspace")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-0.5 flex flex-col h-full">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (pathname?.startsWith(item.href) && item.href !== "/");
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ease-in-out h-auto group/item",
                        isActive 
                          ? "bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium shadow-none border-r-4 border-indigo-600 dark:border-indigo-400"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-normal"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "material-symbols-outlined text-[20px] transition-colors",
                          isActive ? "icon-fill text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover/item:text-slate-600"
                        )}>
                          {item.icon}
                        </span>
                        <span className="text-[13px] tracking-normal">{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Left space empty for scrolling */}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 dark:border-slate-900/50 pt-4 px-3 pb-4">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("sidebar.support")} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-500 hover:text-slate-850 hover:bg-slate-50 cursor-pointer transition-all duration-150 ease-in-out h-auto font-normal">
              <span className="material-symbols-outlined text-[20px] text-slate-400">help</span>
              <span className="text-[13px] tracking-normal group-data-[collapsible=icon]:hidden">{t("sidebar.support")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t("sidebar.account")} className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-slate-500 hover:text-slate-850 hover:bg-slate-50 cursor-pointer transition-all duration-150 ease-in-out h-auto font-normal">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold overflow-hidden">
                {user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[13px]">person</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[13px] font-normal leading-tight">
                  {user?.profile?.full_name || user?.email?.split('@')[0] || "User"}
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
