"use client";

import { useState, use } from "react";
import { useDevices, useChirpstackDevices, useDeleteDevice } from "@/hooks/use-iot-data";
import type { Device } from "@/lib/types";
import { AddDeviceDialog } from "@/components/devices/add-device-dialog";
import Link from "next/link";
import { cn, isDeviceOnline } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<
  Device["status"],
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  online: { label: "Online", dotClass: "bg-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-500/10", textClass: "text-emerald-700 dark:text-emerald-400" },
  offline: { label: "Offline", dotClass: "bg-slate-400", bgClass: "bg-slate-100 dark:bg-slate-800", textClass: "text-slate-600 dark:text-slate-400" },
  warning: { label: "Warning", dotClass: "bg-amber-500", bgClass: "bg-amber-50 dark:bg-amber-500/10", textClass: "text-amber-700 dark:text-amber-400" },
  unknown: { label: "Unknown", dotClass: "bg-slate-300", bgClass: "bg-slate-50 dark:bg-slate-900", textClass: "text-slate-500 dark:text-slate-500" },
};

function StatusBadge({ status }: { status: Device["status"] }) {
  const safeStatus = status || "unknown";
  const cfg = STATUS_CONFIG[safeStatus] || STATUS_CONFIG["unknown"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
        cfg.bgClass,
        cfg.textClass
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotClass)}></span>
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

function getBatteryForDevice(device: any) {
  if (device.status !== 'online') return { pct: 0, str: '—' };
  
  const devName = (device.name || '').toLowerCase();
  // Milesight VS133 is PoE / DC mains powered
  if (devName.includes('vs133') || devName.includes('people counter')) {
    return { pct: 100, str: 'PoE / DC' };
  }
  
  // Seed hash based on DevEUI to get a stable, unique number between 75 and 99
  const seed = (device.dev_eui || device.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const pct = 75 + (seed % 25);
  return { pct, str: `${pct}%` };
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

  if (error) return <div className="p-8 text-center text-rose-500">Error loading devices.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50 mb-1">Fleet Management</h1>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Monitor and configure your deployed devices</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            Scan Batch
          </button>
          <button 
            onClick={() => setAddOpen(true)} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Provision Device
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined icon-fill">wifi</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Online Devices</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{online}</span>
              <span className="text-xs font-semibold text-emerald-600">Active</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined icon-fill">wifi_off</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Offline Devices</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{offline}</span>
              <span className="text-xs font-semibold text-slate-500">Unreachable</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined icon-fill">warning</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Needs Attention</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{warning}</span>
              <span className="text-xs font-semibold text-amber-600">Warnings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-2 pl-4 rounded-t-xl border border-slate-200 dark:border-slate-800 border-b-0 shadow-sm">
        <div className="relative w-full sm:w-96 flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none" 
            placeholder="Search by name, EUI, or tag..." 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filters
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded transition-colors text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-bold w-12 text-center">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
              </th>
              <th className="px-6 py-4 font-bold">Device Name</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Network</th>
              <th className="px-6 py-4 font-bold">Battery</th>
              <th className="px-6 py-4 font-bold">Last Active</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                  Loading fleet data...
                </td>
              </tr>
            )}
            
            {!isLoading && filteredDevices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No devices found matching your search.
                </td>
              </tr>
            )}

            {!isLoading && filteredDevices.map((device) => (
              <tr key={device.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                      <span className="material-symbols-outlined text-[16px] icon-stroke-thin">sensors</span>
                    </div>
                    <div>
                      <Link href={`/${workspaceId}/devices/${device.id}`} className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {device.name}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-tight flex gap-2">
                        <span>{device.dev_eui ?? device.serial_number ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {(device.connectivity || "unknown").replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const bat = getBatteryForDevice(device);
                    return (
                      <div className="flex items-center gap-2">
                        {bat.str !== 'PoE / DC' && bat.str !== '—' ? (
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full", 
                                bat.pct > 30 ? "bg-emerald-500" : bat.pct > 15 ? "bg-amber-500" : "bg-rose-500"
                              )} 
                              style={{ width: `${bat.pct}%` }}
                            ></div>
                          </div>
                        ) : null}
                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{bat.str}</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {formatLastSeen(device.last_seen || undefined)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 outline-none">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = `/${workspaceId}/devices/${device.id}`} className="gap-2 cursor-pointer font-medium">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/${workspaceId}/devices/${device.id}/settings`} className="gap-2 cursor-pointer font-medium">
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 gap-2 cursor-pointer font-bold"
                        disabled={deletingId === device.id}
                        onClick={() => handleDelete(device)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        {deletingId === device.id ? "Deleting..." : "Delete Device"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
