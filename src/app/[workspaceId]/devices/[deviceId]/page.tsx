"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useDevice, useChirpstackDevice } from "@/hooks/use-iot-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  HelpCircle,
  Settings as SettingsIcon,
  RefreshCw,
  Download,
  Terminal,
  Activity,
  Zap,
  BarChart3,
  ArrowDownToLine,
  Radio,
  BellRing,
  ShieldAlert,
  Users,
  LayoutDashboard,
  SlidersHorizontal,
  Bug
} from "lucide-react";
import { cn, isDeviceOnline } from "@/lib/utils";
import { Device } from "@/lib/types";
import { DeviceDebugLogs } from "@/components/devices/device-debug-logs";
import { DeviceFieldsTab } from "@/components/devices/device-fields-tab";
import { PayloadDecoderTab } from "@/components/devices/payload-decoder-tab";
import { DeviceHistoryTab } from "@/components/devices/device-history-tab";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { WidgetSidebar } from "@/components/dashboard/widget-sidebar";
import { useDeviceDashboard, useUpdateWidgetLayouts, useDeleteWidget, useAddWidget, useUpdateWidget } from "@/hooks/use-iot-data";
import { DashboardWidget as DashboardWidgetType } from "@/lib/types";
import { Edit2, Save, X, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<Device["status"], { label: string; icon: React.ComponentType<{ className?: string }>; dot: string }> = {
  online:  { label: "Online",  icon: Wifi,          dot: "bg-emerald-500" },
  offline: { label: "Offline", icon: WifiOff,       dot: "bg-slate-400" },
  warning: { label: "Warning", icon: AlertTriangle,  dot: "bg-amber-500" },
  unknown: { label: "Unknown", icon: HelpCircle,     dot: "bg-muted-foreground" },
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

  if (isLoading || isLoadingDashboard) return <div className="p-8 text-center text-muted-foreground">Loading device details...</div>;
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
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background", statusConfig.dot)} />
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <StatusIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
              {device.isLive && (
                <Badge variant="secondary" className="gap-1 font-normal text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Activity className="h-3 w-3" />
                  Live Sync
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 h-4">
                {device.connectivity}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-1">
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", statusConfig.dot)} />
                <span className={cn("font-medium", 
                  device.status === 'online' ? "text-emerald-600" : "text-muted-foreground"
                )}>
                  {statusConfig.label}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span>Last Payload: {formatLastSeen(device.last_seen)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border uppercase">S/N</span>
                <span className="font-medium tracking-tight">
                  {device.serial_number || device.dev_eui || "No serial number"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.refresh()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/${workspaceId}/devices/${deviceId}/settings`)}>
            <SettingsIcon className="h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-muted/50 p-1 flex overflow-x-auto w-full justify-start border-b rounded-none md:rounded-lg mb-6">
          <TabsTrigger value="dashboard" className="px-4 gap-2 whitespace-nowrap"><LayoutDashboard className="h-3.5 w-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="history" className="px-4 gap-2 whitespace-nowrap"><BarChart3 className="h-3.5 w-3.5" />History</TabsTrigger>
          <TabsTrigger value="downlinks" className="px-4 gap-2 whitespace-nowrap"><ArrowDownToLine className="h-3.5 w-3.5" />Downlinks</TabsTrigger>
          <TabsTrigger value="configuration" className="px-4 gap-2 whitespace-nowrap"><SlidersHorizontal className="h-3.5 w-3.5" />Configuration</TabsTrigger>
          <TabsTrigger value="lorawan" className="px-4 gap-2 whitespace-nowrap"><Radio className="h-3.5 w-3.5" />LoRaWAN</TabsTrigger>
          <TabsTrigger value="debug" className="px-4 gap-2 whitespace-nowrap"><Bug className="h-3.5 w-3.5" />Debug</TabsTrigger>
          <TabsTrigger value="rules" className="px-4 gap-2 whitespace-nowrap"><BellRing className="h-3.5 w-3.5" />Rules</TabsTrigger>
          <TabsTrigger value="permissions" className="px-4 gap-2 whitespace-nowrap"><Users className="h-3.5 w-3.5" />Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 outline-none">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold">Device Dashboard</h2>
              <p className="text-sm text-muted-foreground">Customizable real-time overview</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditingDashboard ? (
                <>
                  <Button variant="outline" size="sm" className="gap-2 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50" onClick={() => setIsEditingDashboard(false)}>
                    <Save className="h-3.5 w-3.5" />
                    Finish Editing
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAddingWidget(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Widget
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditingDashboard(true)}>
                  <Edit2 className="h-3.5 w-3.5" />
                  Customize Dashboard
                </Button>
              )}
            </div>
          </div>

          <div className={cn(
            "relative min-h-[600px] rounded-2xl transition-all duration-500",
            isEditingDashboard ? "bg-muted/30 ring-1 ring-primary/20 p-2 lg:p-4" : "p-0"
          )}>
            {isEditingDashboard && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-500">
                <SlidersHorizontal className="h-3 w-3" />
                Customize Mode: Grab and drag widgets to rearrange
              </div>
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold text-lg">Empty Dashboard</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1 mb-6">
                  Click 'Customize Dashboard' to start adding widgets and visualize your device data.
                </p>
                {!isEditingDashboard && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditingDashboard(true)}>
                    Start Customizing
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 opacity-60">
             {/* ... remaining cards ... */}
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

        <TabsContent value="downlinks" className="space-y-6">
          <Card className="border-dashed bg-muted/20 border-2">
             <CardContent className="flex flex-col items-center justify-center py-24 text-center opacity-70">
                <ArrowDownToLine className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold tracking-tight">Downlink Queue</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Queue messages and configuration payloads to be sent to your device on the next uplink window.</p>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6 outline-none">
          <DeviceFieldsTab 
            deviceId={deviceId} 
            fields={(device as any).fields || []} 
          />
          
          <div className="pt-4 border-t">
            <PayloadDecoderTab 
              deviceId={deviceId} 
              decoder={(device as any).payload_decoders?.[0]} 
            />
          </div>
        </TabsContent>

        <TabsContent value="lorawan" className="space-y-6">
          <Card className="border-dashed bg-muted/20 border-2">
             <CardContent className="flex flex-col items-center justify-center py-24 text-center opacity-70">
                <Radio className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold tracking-tight">LoRaWAN Networking</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Live network statistics including Spreading Factor, RSSI, SNR, and gateway reception paths.</p>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="h-[500px]">
          <DeviceDebugLogs deviceId={deviceId} />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="border-dashed bg-muted/20 border-2">
             <CardContent className="flex flex-col items-center justify-center py-24 text-center opacity-70">
                <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold tracking-tight">Alert Rules</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Set up threshold triggers, email alerts, and webhook notifications based on device data.</p>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card className="border-dashed bg-muted/20 border-2">
             <CardContent className="flex flex-col items-center justify-center py-24 text-center opacity-70">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold tracking-tight">Device Access</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Manage API tokens, claim codes, and team member visibility for this specific device.</p>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
