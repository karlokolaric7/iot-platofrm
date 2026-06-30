"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useTheme } from "next-themes";
import { useDevices } from "@/hooks/use-iot-data";
import { useMapSync } from "@/context/map-sync-context";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Search, MapPin, Radio, Wifi, WifiOff, RefreshCw, Navigation, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function WorkspaceMapPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const { data: devices = [], isLoading, refetch } = useDevices(workspaceId);
  const { 
    center: syncCenter, 
    zoom: syncZoom, 
    hoveredDeviceId, 
    setCenter: setSyncCenter, 
    setZoom: setSyncZoom, 
    setHoveredDeviceId 
  } = useMapSync();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">Loading interactive map...</span>
        </div>
      </div>
    );
  }

  // Filter devices with valid coordinates
  const locatedDevices = devices.filter(
    (d) => d.latitude !== null && d.longitude !== null && d.latitude !== undefined && d.longitude !== undefined
  );

  const filteredDevices = locatedDevices.filter((device) => {
    const matchesSearch = 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (device.dev_eui && device.dev_eui.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "online" && device.status === "online") ||
      (statusFilter === "offline" && device.status !== "online");

    return matchesSearch && matchesStatus;
  });

  const defaultCenter: [number, number] = [45.8150, 15.9819];
  const initialCenter: [number, number] = locatedDevices.length > 0 
    ? [locatedDevices[0].latitude!, locatedDevices[0].longitude!] 
    : defaultCenter;

  const currentCenter = syncCenter || initialCenter;
  const currentZoom = syncZoom;
  const isDark = theme === "dark";

  const handleDeviceClick = (device: any) => {
    setSyncCenter([device.latitude!, device.longitude!]);
    setSyncZoom(14);
    setHoveredDeviceId(device.id);
    toast.success(
      language === "hr" 
        ? `Centrirano na uređaj: ${device.name}` 
        : `Centered on device: ${device.name}`
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] -m-6 overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Sidebar Controller */}
      <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex flex-col z-20 shrink-0 h-[45%] lg:h-full">
        
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-850 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {language === "hr" ? "Geografski pregled" : "Geographical Map"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {locatedDevices.length} {language === "hr" ? "lociranih uređaja" : "devices located"}
              </p>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={language === "hr" ? "Pretraži locirane uređaje..." : "Search located devices..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg">
            {(["all", "online", "offline"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all capitalize cursor-pointer",
                  statusFilter === filter
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === "all" ? (language === "hr" ? "Svi" : "All") : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center p-4">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">
                {language === "hr" ? "Nema pronađenih uređaja" : "No devices found"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                {language === "hr" 
                  ? "Podesite filtre ili provjerite imaju li vaši uređaji latitude/longitude koordinate."
                  : "Adjust your filters or ensure your devices have latitude/longitude coordinates configured."}
              </p>
            </div>
          ) : (
            filteredDevices.map((device) => {
              const isSelected = hoveredDeviceId === device.id;
              const isOnline = device.status === "online";
              return (
                <div
                  key={device.id}
                  onClick={() => handleDeviceClick(device)}
                  onMouseEnter={() => setHoveredDeviceId(device.id)}
                  onMouseLeave={() => setHoveredDeviceId(null)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative overflow-hidden group",
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/30 dark:bg-indigo-500/5"
                      : "bg-transparent border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-800"
                  )}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )} />
                      <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {device.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-muted-foreground/60">
                      {device.dev_eui ? device.dev_eui.slice(0, 8).toUpperCase() : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground relative z-10 font-medium">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3.5 w-3.5 opacity-60" />
                      <span>{device.latitude?.toFixed(4)}, {device.longitude?.toFixed(4)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${workspaceId}/devices/${device.id}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline transition-all font-semibold"
                    >
                      {language === "hr" ? "Detalji" : "Details"}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative h-[55%] lg:h-full z-10">
        <Map 
          center={currentCenter} 
          zoom={currentZoom}
          onBoundsChanged={({ center, zoom }) => {
            setSyncCenter(center);
            setSyncZoom(zoom);
          }}
          provider={(x, y, z, dpr) => {
            const s = String.fromCharCode(97 + ((x + y + z) % 3));
            const retinaSuffix = dpr && dpr >= 2 ? "@2x" : "";
            return isDark
              ? `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${retinaSuffix}.png`
              : `https://${s}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}${retinaSuffix}.png`;
          }}
        >
          <ZoomControl style={{ top: 20, right: 20 }} />
          
          {filteredDevices.map((device) => {
            const isHovered = hoveredDeviceId === device.id;
            const isOnline = device.status === "online";
            return (
              <Marker 
                key={device.id} 
                anchor={[device.latitude!, device.longitude!]}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeviceClick(device);
                  }}
                  onMouseEnter={() => setHoveredDeviceId(device.id)}
                  onMouseLeave={() => setHoveredDeviceId(null)}
                  className="relative flex items-center justify-center border-none bg-transparent p-0 outline-none transition-transform hover:scale-110 active:scale-95"
                  style={{ width: '40px', height: '40px', cursor: 'pointer', zIndex: isHovered ? 150 : 100 }}
                >
                  {/* Pulse effect */}
                  {isOnline && (
                    <div className="absolute inset-0 m-2 bg-indigo-500 rounded-full animate-ping opacity-30 pointer-events-none"></div>
                  )}
                  
                  {/* The Dot */}
                  <div 
                    className={cn(
                      "w-5.5 h-5.5 rounded-full border-2.5 border-white dark:border-slate-900 shadow-xl relative z-10 transition-all duration-200 flex items-center justify-center",
                      isOnline ? "bg-indigo-500 text-white" : "bg-slate-500 text-slate-100",
                      isHovered && "scale-125 ring-4 ring-indigo-500/40"
                    )}
                  >
                    <Radio className="h-3 w-3" />
                  </div>
                  
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold rounded-xl shadow-2xl border border-white/10 flex flex-col items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-200 z-[200] min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span>{device.name}</span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                        )} />
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider",
                        isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                      )}>
                        {device.status}
                      </span>
                      <div className="text-[9px] text-slate-400 font-mono mt-1 font-semibold">
                        {device.latitude?.toFixed(6)}, {device.longitude?.toFixed(6)}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-800" />
                    </div>
                  )}
                </button>
              </Marker>
            );
          })}
        </Map>

        {/* Sync Indicator overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin-slow" />
            MAP VIEWPORT SYNCHRONIZED
          </div>
        </div>
      </div>

    </div>
  );
}
