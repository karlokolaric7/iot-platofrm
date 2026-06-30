"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { MOCK_DASHBOARDS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Plus,
  Save,
  X,
  LayoutDashboard,
  Settings,
  Share2,
} from "lucide-react";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { WidgetSidebar } from "@/components/dashboard/widget-sidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardWidget } from "@/lib/types";

import { useDashboard, useSaveDashboardLayout } from "@/hooks/use-iot-data";

export default function SingleDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string; dashboardId: string }>;
}) {
  const { workspaceId, dashboardId } = use(params);
  
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard(dashboardId);
  const saveLayout = useSaveDashboardLayout();

  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync widgets when dashboard data loads
  useState(() => {
    if (dashboard?.widgets) {
      setWidgets(dashboard.widgets as any);
    }
  });

  useEffect(() => {
    if (dashboard?.widgets) {
      setWidgets(dashboard.widgets as any);
    }
  }, [dashboard]);

  if (isDashboardLoading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!dashboard) notFound();

  async function handleSaveLayout() {
    try {
      await saveLayout.mutateAsync({
        id: dashboardId,
        widgets: widgets as any,
      });
      setEditMode(false);
      toast.success("Dashboard layout saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save layout");
    }
  }

  function handleAddWidget(partialWidget: Partial<DashboardWidget>) {
    const newId = typeof window !== 'undefined' && window.crypto?.randomUUID 
      ? window.crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    const newWidget: DashboardWidget = {
      ...partialWidget,
      id: newId,
      dashboard_id: dashboardId,
    } as DashboardWidget;

    setWidgets((prev) => [...prev, newWidget]);
    toast.success("Widget added to dashboard");
  }

  function handleWidgetDelete(widgetId: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    toast.success("Widget removed from dashboard");
  }

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      <WidgetSidebar
        workspaceId={workspaceId}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        onAddWidget={handleAddWidget}
      />

      {/* Dashboard Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{dashboard.name}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
              {dashboard.description || "Live data visualization dashboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(false)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveLayout}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditMode(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Dashboard
              </Button>
            </>
          )}
          {editMode && (
            <Button
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div className={cn(
        "flex-1 -mx-4 px-4 overflow-y-auto min-h-0",
        editMode && "bg-muted/30 rounded-xl border border-dashed border-primary/20 m-0 p-4"
      )}>
        <DashboardGrid
          dashboardId={dashboardId}
          widgets={widgets}
          isEditable={editMode}
          onLayoutChange={(newWidgets) => setWidgets(newWidgets)}
          onWidgetDelete={handleWidgetDelete}
        />
      </div>
    </div>
  );
}
