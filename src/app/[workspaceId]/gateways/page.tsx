"use client";

import { useState } from "react";
import { useGateways, useChirpstackGateways } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Radio, Wifi, WifiOff, AlertTriangle, Activity } from "lucide-react";
import { cn, isDeviceOnline } from "@/lib/utils";
import { AddGatewayDialog } from "@/components/gateways/add-gateway-dialog";
import Link from "next/link";

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  warning: "bg-amber-500",
  unknown: "bg-muted-foreground",
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  online: Wifi,
  offline: WifiOff,
  warning: AlertTriangle,
  unknown: Radio,
};

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function GatewaysPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [addOpen, setAddOpen] = useState(false);
  
  const { data: gateways = [], isLoading, error } = useGateways(workspaceId);
  const { data: chirpstackData } = useChirpstackGateways();

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading gateways: {(error as any).message}</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading gateways...</div>;
  }

  // Merge ChirpStack live status
  const processedGateways = gateways.map(gw => {
    const csGateway = chirpstackData?.result?.find((cs: any) => cs.gatewayId?.toLowerCase() === gw.eui?.toLowerCase());
    const mergedLastSeen = csGateway?.lastSeenAt || gw.last_seen;
    return {
      ...gw,
      status: isDeviceOnline(mergedLastSeen) ? "online" : "offline",
      last_seen: mergedLastSeen,
      isLive: !!csGateway
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Gateways</h1>
            <Badge variant="secondary" className="gap-1 font-normal text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Activity className="h-3 w-3" />
              Live Sync Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage LoRaWAN, MQTT, and custom gateways that relay device data.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Gateway
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {processedGateways.map((gw) => {
          const Icon = STATUS_ICON[gw.status] || Radio;
          return (
            <Link
              key={gw.id}
              href={`/${workspaceId}/gateways/${gw.id}`}
              className="block rounded-xl border bg-card p-5 space-y-4 hover:shadow-md transition-all hover:border-primary/50 cursor-pointer relative overflow-hidden group"
            >
              {gw.isLive && (
                <div className="absolute top-0 right-0 p-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live data from ChirpStack" />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background", STATUS_DOT[gw.status])} />
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Radio className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{gw.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{gw.type}</Badge>
                  </div>
                </div>
                <div className={cn("flex items-center gap-1 text-xs rounded-full px-2.5 py-1",
                  gw.status === "online" ? "bg-emerald-500/10 text-emerald-500" :
                  gw.status === "warning" ? "bg-amber-500/10 text-amber-500" :
                  "bg-slate-400/10 text-slate-400"
                )}>
                  <Icon className="h-3 w-3" />
                  <span className="capitalize">{gw.status}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {gw.eui && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">EUI</span>
                    <code className="text-xs font-mono text-primary font-bold">{gw.eui}</code>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span className="text-xs font-medium">{formatLastSeen(gw.last_seen)}</span>
                </div>
              </div>
            </Link>
          );
        })}

        <button 
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-colors py-12 gap-3 text-muted-foreground hover:text-primary"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Add Gateway</span>
        </button>
      </div>

      <AddGatewayDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
