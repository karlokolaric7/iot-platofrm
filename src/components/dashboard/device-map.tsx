"use client";

import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import { Device } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DeviceMapProps {
  devices: Device[];
  className?: string;
}

export function DeviceMap({ devices, className }: DeviceMapProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure the component only renders on the client to avoid hydration mismatches
  // with theme-based tile providers and event listener attachment.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-full h-[320px] rounded-xl bg-slate-50 dark:bg-slate-900/50 animate-pulse flex items-center justify-center border border-slate-200 dark:border-slate-800", className)}>
        <span className="text-xs font-medium text-slate-400">Loading map...</span>
      </div>
    );
  }
  
  const markers = devices.filter(d => d.latitude !== null && d.longitude !== null && d.latitude !== undefined && d.longitude !== undefined);
  const defaultCenter: [number, number] = [45.8150, 15.9819];
  const center: [number, number] = markers.length > 0 ? [markers[0].latitude!, markers[0].longitude!] : defaultCenter;
  const isDark = theme === "dark";

  return (
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50", className)}>
      <Map 
        height={320} 
        defaultCenter={center} 
        defaultZoom={11}
        provider={(x, y, z, dpr) => {
          const s = String.fromCharCode(97 + ((x + y + z) % 3));
          return isDark
            ? `https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${dpr >= 2 ? "@2x" : ""}.png`
            : `https://${s}.basemaps.cartocdn.com/light_all/${z}/${x}/${y}${dpr >= 2 ? "@2x" : ""}.png`;
        }}
      >
        <ZoomControl style={{ top: 80, left: 10 }} />
        
        {markers.map((device) => (
          <Marker 
            key={device.id} 
            anchor={[device.latitude!, device.longitude!]}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/${workspaceId}/devices/${device.id}`);
              }}
              onMouseEnter={() => setHoveredId(device.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative flex items-center justify-center border-none bg-transparent p-0 outline-none transition-transform hover:scale-110 active:scale-95"
              style={{ width: '40px', height: '40px', cursor: 'pointer', zIndex: 100 }}
            >
              {/* Pulse effect */}
              {device.status === 'online' && (
                <div className="absolute inset-0 m-2 bg-indigo-500 rounded-full animate-ping opacity-30 pointer-events-none"></div>
              )}
              
              {/* The Dot */}
              <div 
                className={cn(
                  "w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xl relative z-10 transition-all duration-200",
                  device.status === 'online' ? "bg-indigo-500" : "bg-slate-500",
                  hoveredId === device.id && "scale-125 ring-4 ring-indigo-500/40"
                )}
              />
              
              {/* Tooltip */}
              {hoveredId === device.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-2xl whitespace-nowrap z-[150] border border-white/10 flex flex-col items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <span>{device.name}</span>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      device.status === 'online' ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                    )} />
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] uppercase tracking-wider",
                    device.status === 'online' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                  )}>
                    {device.status}
                  </span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900 dark:border-t-slate-800" />
                </div>
              )}
            </button>
          </Marker>
        ))}
      </Map>

      {/* Stats Overlay */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {markers.length} DEVICES LOCATED
        </div>
      </div>
    </div>
  );
}
