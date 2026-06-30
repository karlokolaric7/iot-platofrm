"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useDevice, useChirpstackDevice } from "@/hooks/use-iot-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, isDeviceOnline } from "@/lib/utils";
import { Device } from "@/lib/types";
import { DeviceDebugLogs } from "@/components/devices/device-debug-logs";
import { DeviceFieldsTab } from "@/components/devices/device-fields-tab";
import { PayloadDecoderTab } from "@/components/devices/payload-decoder-tab";
import { DeviceHistoryTab } from "@/components/devices/device-history-tab";
import { DeviceDownlinksTab } from "@/components/devices/device-downlinks-tab";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { WidgetSidebar } from "@/components/dashboard/widget-sidebar";
import { useDeviceDashboard, useUpdateWidgetLayouts, useDeleteWidget, useAddWidget, useUpdateWidget } from "@/hooks/use-iot-data";
import { DashboardWidget as DashboardWidgetType } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_CONFIG: Record<
  Device["status"],
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  online: { label: "Online", dotClass: "bg-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", textClass: "text-emerald-700 dark:text-emerald-400" },
  offline: { label: "Offline", dotClass: "bg-slate-400", bgClass: "bg-slate-100 dark:bg-slate-800", textClass: "text-slate-600 dark:text-slate-400" },
  warning: { label: "Warning", dotClass: "bg-amber-500", bgClass: "bg-amber-50 dark:bg-amber-500/10", textClass: "text-amber-700 dark:text-amber-400" },
  unknown: { label: "Unknown", dotClass: "bg-slate-300", bgClass: "bg-slate-50 dark:bg-slate-900", textClass: "text-slate-500 dark:text-slate-500" },
};

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DeviceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; deviceId: string }>;
}) {
  const router = useRouter();
  const { workspaceId, deviceId } = use(params);
  const { data: dbDevice, isLoading } = useDevice(deviceId);
  const { data: chirpstackData } = useChirpstackDevice(dbDevice?.dev_eui);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidgetType | null>(null);

  const { data: dashboard, isLoading: isLoadingDashboard } = useDeviceDashboard(deviceId, workspaceId);
  const updateLayouts = useUpdateWidgetLayouts();
  const deleteWidget = useDeleteWidget();
  const addWidget = useAddWidget();
  const updateWidget = useUpdateWidget();

  if (isLoading || isLoadingDashboard) return <div className="p-8 text-center text-slate-500 font-medium">Loading device details...</div>;
  if (!dbDevice) notFound();

  // Merge Live Sync Status
  const csDevice = chirpstackData?.device;
  const lastSeen = chirpstackData?.lastSeenAt;
  const mergedLastSeen = lastSeen || dbDevice.last_seen;
  const device = {
    ...dbDevice,
    status: isDeviceOnline(mergedLastSeen) ? "online" : "offline",
    last_seen: mergedLastSeen,
    isLive: !!csDevice
  };

  const statusConfig = STATUS_CONFIG[device.status as Device['status']] || STATUS_CONFIG["unknown"];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2">
        <Link href={`/${workspaceId}/devices`} className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Fleet Management
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-slate-900 dark:text-slate-100">{device.name}</span>
      </div>

      {/* Device Header Bento */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-500/5 rounded-bl-[100px] -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[32px] icon-stroke-thin">sensors</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{device.name}</h1>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm", statusConfig.bgClass, statusConfig.textClass)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotClass, device.status === 'online' ? "animate-pulse" : "")}></span>
                  {statusConfig.label}
                </span>
                {device.isLive && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    Live Sync
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">tag</span> EUI: {device.serial_number || device.dev_eui || "N/A"}</div>
                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">cell_tower</span> {(device.connectivity || "unknown").toUpperCase()}</div>
                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">update</span> Last seen: {formatLastSeen(device.last_seen)}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => router.push(`/${workspaceId}/devices/${deviceId}/settings`)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Configure
            </button>
            <button 
              onClick={() => router.refresh()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Sync
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-transparent h-auto p-0 flex overflow-x-auto w-full justify-start border-b border-slate-200 dark:border-slate-800 hide-scrollbar gap-2 mb-6">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined text-[18px]">history</span> Telemetry History
          </TabsTrigger>
          <TabsTrigger value="downlinks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span> Downlinks
          </TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined text-[18px]">account_tree</span> Payload Decoders
          </TabsTrigger>
          <TabsTrigger value="debug" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined text-[18px]">bug_report</span> Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 outline-none">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Telemetry</h2>
              <p className="text-xs font-semibold text-slate-500">Customizable real-time widget view</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditingDashboard ? (
                <>
                  <button onClick={() => setIsAddingWidget(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Add Widget
                  </button>
                  <button onClick={() => setIsEditingDashboard(false)} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Save Layout
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditingDashboard(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
                  Edit Dashboard
                </button>
              )}
            </div>
          </div>

          <div className={cn(
            "relative min-h-[400px] rounded-xl transition-all duration-300",
            isEditingDashboard ? "bg-slate-100/50 dark:bg-slate-800/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-4" : "p-0"
          )}>
            {isEditingDashboard && (
              <>
                <div className="absolute -top-3 left-4 z-20 flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                  Edit Mode Active
                </div>
                <div className="mb-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3 flex items-start gap-3">
                  <div className="bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-400 p-1.5 rounded-md mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100">Pro Tip</h4>
                    <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mt-0.5">
                      Grab any widget's top header to drag and reorder. Pull from the bottom corners to resize.
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {dashboard?.widgets?.length > 0 ? (
              <DashboardGrid
                dashboardId={dashboard.id}
                widgets={dashboard.widgets}
                isEditable={isEditingDashboard}
                onLayoutChange={async (updatedWidgets: DashboardWidgetType[]) => {
                  try {
                    await updateLayouts.mutateAsync(updatedWidgets.map((w: DashboardWidgetType) => ({
                      id: w.id,
                      x: w.x,
                      y: w.y,
                      w: w.w,
                      h: w.h
                    })));
                  } catch (err) {
                    toast.error("Failed to save layout");
                  }
                }}
                onWidgetDelete={async (id: string) => {
                  try {
                    await deleteWidget.mutateAsync({ id, dashboardId: dashboard.id });
                    toast.success("Widget removed");
                  } catch (err) {
                    toast.error("Failed to remove widget");
                  }
                }}
                onWidgetEdit={(widget: DashboardWidgetType) => {
                  setEditingWidget(widget);
                  setIsAddingWidget(true);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[400px]">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px]">widgets</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">No Widgets Configured</h3>
                <p className="text-sm font-medium text-slate-500 max-w-xs mt-1 mb-6">
                  Add widgets to visualize the live data streaming from this device.
                </p>
                {!isEditingDashboard && (
                  <button onClick={() => setIsEditingDashboard(true)} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Configure Dashboard
                  </button>
                )}
              </div>
            )}
          </div>

          <WidgetSidebar
            workspaceId={workspaceId}
            open={isAddingWidget}
            onOpenChange={(open: boolean) => {
              setIsAddingWidget(open);
              if (!open) setEditingWidget(null);
            }}
            restrictedDeviceId={deviceId}
            editingWidget={editingWidget || undefined}
            onAddWidget={async (widget: Partial<DashboardWidgetType>) => {
              if (!dashboard) return;
              try {
                await addWidget.mutateAsync({
                  ...widget as any,
                  dashboard_id: dashboard.id
                });
                toast.success("Widget added");
              } catch (err) {
                toast.error("Failed to add widget");
              }
            }}
            onUpdateWidget={async (id: string, updates: Partial<DashboardWidgetType>) => {
              if (!dashboard) return;
              try {
                await updateWidget.mutateAsync({
                  id,
                  ...updates as any
                });
                toast.success("Widget updated");
              } catch (err) {
                toast.error("Failed to update widget");
              }
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6 outline-none">
          <DeviceHistoryTab 
            deviceId={deviceId} 
            fields={(device as any).fields || []} 
          />
        </TabsContent>

        <TabsContent value="downlinks" className="space-y-6 outline-none">
          <DeviceDownlinksTab deviceId={deviceId} />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceFieldsTab 
              deviceId={deviceId} 
              fields={(device as any).fields || []} 
            />
            <PayloadDecoderTab 
              deviceId={deviceId} 
              decoder={(device as any).payload_decoders?.[0]} 
            />
          </div>
        </TabsContent>

        <TabsContent value="debug" className="h-[500px]">
          <DeviceDebugLogs deviceId={deviceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
