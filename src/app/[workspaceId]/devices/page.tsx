"use client";

import { useState, use } from "react";
import { useDevices, useChirpstackDevices, useDeleteDevice } from "@/hooks/use-iot-data";
import type { Device } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddDeviceDialog } from "@/components/devices/add-device-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Wifi,
  WifiOff,
  AlertTriangle,
  HelpCircle,
  Settings,
  Trash2,
  Eye,
  Filter,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { cn, isDeviceOnline } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  Device["status"],
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  online: { label: "Online", icon: Wifi, className: "text-emerald-500 bg-emerald-500/10" },
  offline: { label: "Offline", icon: WifiOff, className: "text-slate-400 bg-slate-400/10" },
  warning: { label: "Warning", icon: AlertTriangle, className: "text-amber-500 bg-amber-500/10" },
  unknown: { label: "Unknown", icon: HelpCircle, className: "text-muted-foreground bg-muted" },
};

const CONNECTIVITY_LABELS: Record<Device["connectivity"], string> = {
  lorawan: "LoRaWAN",
  mqtt: "MQTT",
  http_webhook: "HTTP Webhook",
  custom: "Custom",
};

function StatusBadge({ status }: { status: Device["status"] }) {
  const safeStatus = status || "unknown";
  const cfg = STATUS_CONFIG[safeStatus] || STATUS_CONFIG["unknown"];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function formatLastSeen(dateStr?: string) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DevicesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: devices = [], isLoading, error } = useDevices(workspaceId);
  const { data: chirpstackData } = useChirpstackDevices();
  const deleteDevice = useDeleteDevice();

  async function handleDelete(device: any) {
    if (!window.confirm(`Delete "${device.name}"? This will also remove it from ChirpStack.`)) return;
    setDeletingId(device.id);
    try {
      await deleteDevice.mutateAsync({
        id: device.id,
        devEui: device.dev_eui,
        workspaceId,
      });
      toast.success(`"${device.name}" deleted successfully`);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  const processedDevices = devices.map(d => {
    const csDevice = chirpstackData?.result?.find((cs: any) => cs.devEui?.toLowerCase() === d.dev_eui?.toLowerCase());
    const mergedLastSeen = csDevice?.lastSeenAt || d.last_seen;
    return {
      ...d,
      status: isDeviceOnline(mergedLastSeen) ? "online" : "offline",
      last_seen: mergedLastSeen,
      isLive: !!csDevice
    };
  });

  const filteredDevices = processedDevices.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      d.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.dev_eui?.toLowerCase().includes(search.toLowerCase()) ||
      (d.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const online = processedDevices.filter((d) => d.status === "online").length;
  const offline = processedDevices.filter((d) => d.status === "offline").length;
  const warning = processedDevices.filter((d) => d.status === "warning").length;

  if (error) return <div className="p-8 text-center text-destructive">Error loading devices.</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
            <Badge variant="secondary" className="gap-1 font-normal text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Activity className="h-3 w-3" />
              Live Sync Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your IoT devices, fields, and payload decoders.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Wifi className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{online}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{warning}</p>
            <p className="text-xs text-muted-foreground">Warning</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-400/10 flex items-center justify-center">
            <WifiOff className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{offline}</p>
            <p className="text-xs text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="device-search"
            placeholder="Search devices, EUI, tags..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Device Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[280px]">Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Connectivity</TableHead>
              <TableHead>EUI / Serial</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  No devices found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => (
                <TableRow
                  key={device.id}
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/${workspaceId}/devices/${device.id}`}
                      className="font-medium hover:underline"
                    >
                      {device.name}
                    </Link>
                    {device.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {device.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs uppercase">
                      {(device.connectivity || "unknown").replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {device.dev_eui ?? device.serial_number ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(device.tags || []).slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {(device.tags || []).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{(device.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatLastSeen(device.last_seen || undefined)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-transparent text-sm hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/${workspaceId}/devices/${device.id}`} className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/${workspaceId}/devices/${device.id}/settings`} className="gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive gap-2"
                          disabled={deletingId === device.id}
                          onClick={() => handleDelete(device)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === device.id ? "Deleting..." : "Delete Device"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
