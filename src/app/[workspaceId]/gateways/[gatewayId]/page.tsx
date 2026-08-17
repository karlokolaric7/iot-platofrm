"use client";

import { useGateway, useChirpstackGateways } from "@/hooks/use-iot-data";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Server, Cpu, Activity, Info, Trash2, Loader2, Settings as SettingsIcon, Wifi, WifiOff, AlertTriangle, Radio } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteGateway } from "@/hooks/use-iot-data";
import { toast } from "sonner";
import { cn, isDeviceOnline } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

function formatLastSeen(dateStr?: string | null, lang: string = "en") {
  if (!dateStr) return lang === "hr" ? "Nikada" : "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return lang === "hr" ? `prije ${diff}s` : `${diff}s ago`;
  if (diff < 3600) return lang === "hr" ? `prije ${Math.floor(diff / 60)}m` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return lang === "hr" ? `prije ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`;
  return lang === "hr" ? `prije ${Math.floor(diff / 86400)}d` : `${Math.floor(diff / 86400)}d ago`;
}

export default function GatewayDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const gatewayId = params.gatewayId as string;
  const { t, language } = useLanguage();

  // Hooks MUST be at the top level
  const [hostname, setHostname] = useState("192.168.100.233");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
        setHostname(currentHost);
      }
    }
  }, []);

  const { data: dbGateway, isLoading, error } = useGateway(gatewayId);
  const { data: chirpstackData } = useChirpstackGateways();
  const deleteGateway = useDeleteGateway();
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) return <div className="p-8 text-muted-foreground text-center">{t("gatewayDetails.loading")}</div>;
  if (error || !dbGateway) return <div className="p-8 text-destructive text-center">{t("gatewayDetails.notFound")}</div>;

  // Merge Live Sync Status
  const csGateway = chirpstackData?.result?.find((cs: any) => cs.gatewayId?.toLowerCase() === dbGateway.eui?.toLowerCase());
  const mergedLastSeen = csGateway?.lastSeenAt || null;
  const gateway = {
    ...dbGateway,
    status: (csGateway && csGateway.lastSeenAt && isDeviceOnline(csGateway.lastSeenAt)) ? "online" : "offline",
    last_seen: mergedLastSeen,
    isLive: !!csGateway
  };

  const port = gateway.type === 'mqtt' ? 8883 : 1700;
  const protocol = gateway.type === 'mqtt' ? 'MQTT TLS' : 'UDP Packet Forwarder';
  const serverUrl = gateway.type === 'mqtt' ? `mqtt://${hostname}` : `${hostname}`;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGateway.mutateAsync({
        id: gatewayId,
        eui: gateway.eui,
        workspaceId
      });
      toast.success(t("gatewayDetails.successDelete"));
      router.push(`/${workspaceId}/gateways`);
    } catch (err: any) {
      toast.error(`${t("gatewayDetails.failedDelete")}: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const StatusIcon = STATUS_ICON[gateway.status] || Radio;
  const translatedStatus = gateway.status === "online" 
    ? t("devices.statusOnline") 
    : gateway.status === "warning" 
    ? t("devices.statusWarning") 
    : t("devices.statusOffline");

  return (
    <div className="space-y-6">
      {/* Gateway Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${workspaceId}/gateways`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{gateway.name}</h1>
              {gateway.isLive && (
                <Badge variant="secondary" className="gap-1 font-normal text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Activity className="h-3 w-3" />
                  {t("gatewayDetails.liveSync")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{gateway.type}</Badge>
              <div className={cn("flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border",
                  gateway.status === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  gateway.status === "warning" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-slate-400/10 text-slate-400 border-slate-400/20"
                )}>
                  <div className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[gateway.status])} />
                  <span className="capitalize">{translatedStatus}</span>
              </div>
              {gateway.eui && (
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/50 border border-muted-foreground/10">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">EUI</span>
                   <span className="text-[11px] font-mono font-medium">{gateway.eui}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" size="sm" className="gap-2" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {t("gatewayDetails.deleteBtn")}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("gatewayDetails.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("gatewayDetails.deleteDesc").replace("{name}", gateway.name)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("gatewayDetails.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t("gatewayDetails.deleteConfirmBtn")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" className="gap-2">
             <SettingsIcon className="h-3.5 w-3.5" />
             {t("gatewayDetails.settings")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("gatewayDetails.tabOverview")}</TabsTrigger>
          <TabsTrigger value="configuration">{t("gatewayDetails.tabConfiguration")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                 <Activity className="h-5 w-5 text-primary" />
                 {t("gatewayDetails.cardStatusTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("gatewayDetails.statusLabel")}</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("h-4 w-4", 
                      gateway.status === "online" ? "text-emerald-500" : "text-muted-foreground"
                    )} />
                    <p className="font-semibold capitalize text-lg">{translatedStatus}</p>
                  </div>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("gatewayDetails.lastSeenLabel")}</span>
                  <p className="font-semibold text-lg">{formatLastSeen(gateway.last_seen, language)}</p>
                  {gateway.last_seen && (
                    <p className="text-[10px] text-muted-foreground">{new Date(gateway.last_seen).toLocaleString()}</p>
                  )}
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("gatewayDetails.typeLabel")}</span>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold uppercase text-lg">{gateway.type}</p>
                  </div>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("gatewayDetails.euiLabel")}</span>
                  <p className="font-mono font-bold text-primary">{gateway.eui || 'N/A'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{t("gatewayDetails.uniqueIdLabel")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("gatewayDetails.configTitle")}</CardTitle>
              <CardDescription>{t("gatewayDetails.configDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <Activity className="h-4 w-4" /> {t("gatewayDetails.protocolLabel")}
                  </div>
                  <p className="font-semibold text-lg">{protocol}</p>
                  <p className="text-xs text-muted-foreground">{t("gatewayDetails.protocolDesc")}</p>
                </div>

                <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <Server className="h-4 w-4" /> {t("gatewayDetails.serverAddressLabel")}
                  </div>
                  <p className="font-mono text-sm bg-background p-2 rounded border select-all">{serverUrl}</p>
                </div>

                <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <Cpu className="h-4 w-4" /> {t("gatewayDetails.portLabel")}
                  </div>
                  <p className="font-semibold text-lg">{port}</p>
                </div>

                {gateway.eui && (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                      <Info className="h-4 w-4" /> {t("gatewayDetails.euiLabel")}
                    </div>
                    <p className="font-mono text-sm bg-background p-2 rounded border select-all">{gateway.eui}</p>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 text-primary-foreground p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-primary">{t("gatewayDetails.instructionsTitle")}</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground marker:text-primary">
                  <li>{t("gatewayDetails.instruction1")}</li>
                  <li>{t("gatewayDetails.instruction2")}</li>
                  <li>{t("gatewayDetails.instruction3").replace("{hostname}", hostname)}</li>
                  <li>{t("gatewayDetails.instruction4").replace("{port}", String(port))}</li>
                  <li>{t("gatewayDetails.instruction5").replace("{eui}", gateway.eui || "")}</li>
                  <li className="text-emerald-600 font-medium">{t("gatewayDetails.instruction6")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
