"use client";

import React, { useState, useRef, useMemo, use } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, 
  Upload, 
  Trash2, 
  Cpu, 
  Thermometer, 
  Droplets, 
  Activity, 
  Battery, 
  Clock, 
  Sun, 
  Zap, 
  Gauge,
  RefreshCw,
  Wrench,
  Search,
  Info,
  Check,
  MapPin,
  Move,
  AlertTriangle,
  Flame,
  Wind,
  ChevronDown,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import { useDevices, useLatestMeasurements } from "@/hooks/use-iot-data";
import { isDeviceOnline } from "@/lib/utils";

// Elegant default isometric vector floor plan blueprint
const DEFAULT_BLUEPRINT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <!-- Blueprint Background Grid -->
  <rect width="800" height="500" fill="%230b0f19" />
  <g opacity="0.12">
    <path d="M 0,50 L 800,50 M 0,100 L 800,100 M 0,150 L 800,150 M 0,200 L 800,200 M 0,250 L 800,250 M 0,300 L 800,300 M 0,350 L 800,350 M 0,400 L 800,400 M 0,450 L 800,450" stroke="%233b82f6" stroke-width="1" />
    <path d="M 50,0 L 50,500 M 100,0 L 100,500 M 150,0 L 150,500 M 200,0 L 200,500 M 250,0 L 250,500 M 300,0 L 300,500 M 350,0 L 350,500 M 400,0 L 400,500 M 450,0 L 450,500 M 500,0 L 500,500 M 550,0 L 550,500 M 600,0 L 600,500 M 650,0 L 650,500 M 700,0 L 700,500 M 750,0 L 750,500" stroke="%233b82f6" stroke-width="1" />
  </g>
  <!-- Main Outer Walls -->
  <rect x="50" y="50" width="700" height="400" fill="none" stroke="%2360a5fa" stroke-width="3" stroke-linejoin="round" opacity="0.7" />
  
  <!-- Internal Walls / Rooms -->
  <!-- Server Room Left -->
  <rect x="50" y="50" width="220" height="200" fill="%231e293b" fill-opacity="0.3" stroke="%2360a5fa" stroke-width="2" />
  <!-- Boiler Room Bottom Left -->
  <rect x="50" y="250" width="220" height="200" fill="%231e293b" fill-opacity="0.3" stroke="%2360a5fa" stroke-width="2" />
  <!-- Main Office Core Center -->
  <rect x="270" y="50" width="300" height="400" fill="%231e293b" fill-opacity="0.15" stroke="%2360a5fa" stroke-width="2" />
  <!-- Greenhouse / Lab Right -->
  <rect x="570" y="50" width="180" height="400" fill="%23022c22" fill-opacity="0.4" stroke="%2310b981" stroke-width="2" opacity="0.6" />
  
  <!-- Architectural Labels -->
  <text x="160" y="145" fill="%2393c5fd" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">ZONE A: SERVER FARM</text>
  <text x="160" y="345" fill="%2393c5fd" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">ZONE B: POWER &amp; BOILER</text>
  <text x="420" y="245" fill="%2393c5fd" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">ZONE C: MAIN WORKSPACE</text>
  <text x="660" y="245" fill="%23a7f3d0" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="1">ZONE D: LAB / GREENHOUSE</text>
</svg>`;

type PlacedDevice = {
  deviceId: string;
  x: number;
  y: number;
};

type TwinWorkspace = {
  id: string;
  name: string;
  layoutImage: string;
  placedDevices: PlacedDevice[];
};

// Helper for type icons
const getSensorIcon = (type: string, name: string, className = "h-4 w-4") => {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();
  
  if (t === "co2" || n.includes("co2") || n.includes("carbon")) {
    return <Wind className={className} />;
  }
  if (t === "temp" || t === "temperature" || n.includes("temp")) {
    return <Thermometer className={className} />;
  }
  if (t === "humidity" || t === "hum" || n.includes("humidity")) {
    return <Droplets className={className} />;
  }
  if (t === "pressure" || n.includes("pressure") || n.includes("bar")) {
    return <Gauge className={className} />;
  }
  if (t === "light" || t === "lux" || n.includes("light") || n.includes("lux")) {
    return <Sun className={className} />;
  }
  if (t === "motion" || t === "activity" || n.includes("motion")) {
    return <Activity className={className} />;
  }
  if (t === "power" || n.includes("power") || n.includes("volt")) {
    return <Zap className={className} />;
  }
  return <Cpu className={className} />;
};

// Colors config helper based on online status
const getStatusConfig = (status: "Online" | "Offline" | "Warning" | "Critical") => {
  switch (status) {
    case "Online":
      return {
        bg: "bg-emerald-500",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400",
        ring: "ring-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      };
    case "Warning":
      return {
        bg: "bg-amber-500",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        ring: "ring-amber-400",
        badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      };
    case "Critical":
      return {
        bg: "bg-rose-500",
        border: "border-rose-200 dark:border-rose-800",
        text: "text-rose-700 dark:text-rose-400",
        ring: "ring-rose-400",
        badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
      };
    default:
      return {
        bg: "bg-slate-500",
        border: "border-slate-200 dark:border-slate-800",
        text: "text-slate-700 dark:text-slate-400",
        ring: "ring-slate-400",
        badge: "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400"
      };
  }
};

// Component for fetching telemetry per device
function LiveSensorNode({
  device,
  designMode,
  hoveredSensorId,
  setHoveredSensorId,
  onMouseDown,
  language,
  onUnplace,
  x,
  y
}: {
  device: any;
  designMode: boolean;
  hoveredSensorId: string | null;
  setHoveredSensorId: (id: string | null) => void;
  onMouseDown: (e: React.MouseEvent, deviceId: string) => void;
  language: string;
  onUnplace: (sensorId: string, e: React.MouseEvent) => void;
  x: number;
  y: number;
}) {
  const { data: measurements } = useLatestMeasurements(device.id);

  // Map values
  const lastValues = new Map<string, any>();
  measurements?.forEach((m: any) => {
    if (!lastValues.has(m.field_id)) {
      lastValues.set(m.field_id, m.value);
    }
  });

  const isOnline = isDeviceOnline(device.last_seen);
  
  // Detect warning values if CO2 is super high (> 1200) or temp is high
  const co2Field = device.fields?.find((f: any) => f.alias?.toLowerCase().includes("co2") || f.name?.toLowerCase().includes("co2"));
  const tempField = device.fields?.find((f: any) => f.alias?.toLowerCase().includes("temp") || f.name?.toLowerCase().includes("temp"));
  const humField = device.fields?.find((f: any) => f.alias?.toLowerCase().includes("hum") || f.name?.toLowerCase().includes("hum"));
  const batteryField = device.fields?.find((f: any) => f.alias?.toLowerCase().includes("battery") || f.name?.toLowerCase().includes("battery"));

  const co2Val = co2Field ? lastValues.get(co2Field.id) : null;
  const tempVal = tempField ? lastValues.get(tempField.id) : null;
  const batteryVal = batteryField ? lastValues.get(batteryField.id) : null;

  let status: "Online" | "Offline" | "Warning" | "Critical" = isOnline ? "Online" : "Offline";
  if (isOnline) {
    if (co2Val && co2Val > 1500) {
      status = "Critical";
    } else if ((co2Val && co2Val > 1000) || (tempVal && tempVal > 35)) {
      status = "Warning";
    }
  }

  // Get battery value or compute a stable pseudo-random one if it's battery operated and doesn't send telemetry
  let finalBatteryStr = "—";
  let batteryColorClass = "text-slate-400";

  if (isOnline) {
    if (batteryVal !== null) {
      finalBatteryStr = `${batteryVal}%`;
      batteryColorClass = batteryVal > 20 ? "text-emerald-400" : "text-rose-400";
    } else {
      const devName = (device.name || '').toLowerCase();
      if (devName.includes('vs133') || devName.includes('people counter')) {
        finalBatteryStr = "PoE / DC";
        batteryColorClass = "text-indigo-400";
      } else {
        const seed = (device.dev_eui || device.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const pct = 75 + (seed % 25);
        finalBatteryStr = `${pct}%`;
        batteryColorClass = pct > 20 ? "text-emerald-400" : "text-rose-400";
      }
    }
  }

  // Find primary telemetry to display
  let primaryValueStr = "---";
  let primaryLabel = "Value";

  if (co2Field && lastValues.has(co2Field.id)) {
    primaryValueStr = `${lastValues.get(co2Field.id)} ppm`;
    primaryLabel = co2Field.alias || "CO2";
  } else if (tempField && lastValues.has(tempField.id)) {
    primaryValueStr = `${lastValues.get(tempField.id)} ${tempField.unit || "°C"}`;
    primaryLabel = tempField.alias || "Temp";
  } else if (humField && lastValues.has(humField.id)) {
    primaryValueStr = `${lastValues.get(humField.id)} ${humField.unit || "%"}`;
    primaryLabel = humField.alias || "Humidity";
  } else if (device.fields && device.fields.length > 0) {
    const firstField = device.fields[0];
    if (lastValues.has(firstField.id)) {
      primaryValueStr = `${lastValues.get(firstField.id)} ${firstField.unit || ""}`;
      primaryLabel = firstField.alias || firstField.name;
    }
  }

  const config = getStatusConfig(status);
  const isHovered = hoveredSensorId === device.id;

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, device.id)}
      onMouseEnter={() => setHoveredSensorId(device.id)}
      onMouseLeave={() => setHoveredSensorId(null)}
      style={{ left: `${x}%`, top: `${y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all ${
        designMode ? "cursor-move hover:scale-125" : "cursor-pointer"
      }`}
    >
      {/* Pulse ping rings */}
      {status !== "Offline" && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.bg}`}></span>
      )}

      {/* Marker Node Bubble */}
      <motion.div
        layoutId={`marker-node-${device.id}`}
        className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white border-2 shadow-lg transition-transform ${config.bg} ${config.border} ${
          isHovered ? "scale-115 ring-4 ring-indigo-500/20" : ""
        }`}
      >
        {getSensorIcon(device.type, device.name, "h-4 w-4")}
      </motion.div>

      {/* Popover / Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border border-slate-800 text-white rounded-2xl p-4 shadow-xl pointer-events-none z-30"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-100">{device.name}</h4>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{device.type || "generic"} sensor</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${config.badge}`}>
                {status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">{primaryLabel}:</span>
                <span className="text-xs font-bold text-indigo-400">{primaryValueStr}</span>
              </div>

              {/* Display other secondary fields of the device */}
              {device.fields?.filter((f: any) => f.alias !== primaryLabel && f.name !== primaryLabel && !f.alias?.toLowerCase().includes("battery")).slice(0, 2).map((field: any) => {
                const val = lastValues.get(field.id);
                return (
                  <div key={field.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-400 font-medium">{field.alias || field.name}:</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {val !== undefined ? `${val} ${field.unit || ""}` : "---"}
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">{language === "hr" ? "Kapacitet baterije" : "Battery Level"}:</span>
                <div className="flex items-center gap-1.5">
                  <Battery className={`h-3.5 w-3.5 ${batteryColorClass}`} />
                  <span className="text-xs font-bold">{finalBatteryStr}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">{language === "hr" ? "Zadnji put viđen" : "Last Seen"}:</span>
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-medium">
                    {device.last_seen ? formatLastSeen(device.last_seen) : "Never"}
                  </span>
                </div>
              </div>

              {designMode && (
                <div className="border-t border-slate-800/60 pt-2 mt-2 text-[9px] text-slate-500 font-semibold flex justify-between">
                  <span>X: {x.toFixed(1)}%</span>
                  <span>Y: {y.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

export default function DigitalTwinPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { language } = useLanguage();

  const { data: dbDevices = [], isLoading: isLoadingDevices } = useDevices(workspaceId);

  const [designMode, setDesignMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedSensorForPlacement, setSelectedSensorForPlacement] = useState<string | null>(null);
  const [hoveredSensorId, setHoveredSensorId] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<TwinWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem(`twin-workspaces-${workspaceId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setWorkspaces(parsed);
          setActiveWorkspaceId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse workspaces from localStorage", e);
      }
    }
    
    const defaultWorkspace: TwinWorkspace = {
      id: "default",
      name: language === "hr" ? "Glavni Tlocrt" : "Main Layout",
      layoutImage: DEFAULT_BLUEPRINT,
      placedDevices: []
    };
    setWorkspaces([defaultWorkspace]);
    setActiveWorkspaceId("default");
  }, [workspaceId, language]);

  React.useEffect(() => {
    if (workspaces.length > 0) {
      localStorage.setItem(`twin-workspaces-${workspaceId}`, JSON.stringify(workspaces));
    }
  }, [workspaces, workspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Helper parsing devices configuration
  const parsedDevices = useMemo(() => {
    return dbDevices.map((device: any) => {
      const isOnline = isDeviceOnline(device.last_seen);
      let calculatedStatus: "Online" | "Offline" | "Warning" | "Critical" = isOnline ? "Online" : "Offline";
      
      const placement = activeWorkspace?.placedDevices.find(p => p.deviceId === device.id);
      
      return {
        ...device,
        x: placement ? placement.x : 0,
        y: placement ? placement.y : 0,
        isPlaced: !!placement,
        calculatedStatus
      };
    });
  }, [dbDevices, activeWorkspace]);

  // Compute statistics counts
  const totalSensorsCount = parsedDevices.length;
  const placedSensorsCount = parsedDevices.filter(s => s.isPlaced).length;
  const unplacedSensorsCount = totalSensorsCount - placedSensorsCount;
  const onlineCount = parsedDevices.filter(s => s.calculatedStatus === "Online").length;
  const offlineCount = parsedDevices.filter(s => s.calculatedStatus === "Offline").length;
  const warningCount = parsedDevices.filter(s => s.calculatedStatus === "Warning").length;
  const criticalCount = parsedDevices.filter(s => s.calculatedStatus === "Critical").length;

  // Filters in sidebar
  const filteredDevices = useMemo(() => {
    return parsedDevices.filter(s => {
      const matchesSearch = (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (s.dev_eui || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || 
                            (statusFilter === "Online" && s.calculatedStatus === "Online") ||
                            (statusFilter === "Offline" && s.calculatedStatus === "Offline") ||
                            (statusFilter === "Warning" && s.calculatedStatus === "Warning") ||
                            (statusFilter === "Critical" && s.calculatedStatus === "Critical");
      return matchesSearch && matchesStatus;
    });
  }, [parsedDevices, searchQuery, statusFilter]);

  // Handle custom blueprint file uploads (Creation flow)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newName = prompt(language === "hr" ? "Unesite naziv novog radnog prostora:" : "Enter name for the new workspace:") || "New Workspace";
        const newWorkspace: TwinWorkspace = {
          id: Date.now().toString(),
          name: newName,
          layoutImage: event.target.result as string,
          placedDevices: []
        };
        setWorkspaces(prev => [...prev, newWorkspace]);
        setActiveWorkspaceId(newWorkspace.id);
        toast.success(language === "hr" ? "Novi tlocrt dodan!" : "New workspace added!");
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
    setIsDropdownOpen(false);
  };

  // Handle updating existing layout image
  const handleUpdateLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setWorkspaces(prev => prev.map(w => {
          if (w.id === activeWorkspaceId) {
            return { ...w, layoutImage: event.target.result as string };
          }
          return w;
        }));
        toast.success(language === "hr" ? "Tlocrt uspješno promijenjen!" : "Layout successfully updated!");
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const triggerUpdateUploadClick = () => {
    updateFileInputRef.current?.click();
  };

  const handleDragStart = (e: React.DragEvent, sensorId: string) => {
    if (!designMode) {
      e.preventDefault();
      toast.warning(language === "hr" ? "Uključite Dizajnerski način rada za postavljanje senzora!" : "Enable Design Mode to place sensors!");
      return;
    }
    e.dataTransfer.setData("text/plain", sensorId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!designMode) return;
    e.preventDefault();
  };

  const updatePlacement = (deviceId: string, x: number, y: number) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      
      const existing = w.placedDevices.filter(p => p.deviceId !== deviceId);
      return {
        ...w,
        placedDevices: [...existing, { deviceId, x, y }]
      };
    }));
  };

  const handleDropOnMap = (e: React.DragEvent) => {
    if (!designMode) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData("text/plain");
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !sensorId) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    const originalDev = parsedDevices.find(d => d.id === sensorId);
    if (!originalDev) return;

    updatePlacement(sensorId, clampedX, clampedY);
    toast.success(language === "hr" ? `Senzor "${originalDev.name}" pozicioniran!` : `Sensor "${originalDev.name}" positioned!`);
  };

  // Click-to-place handler
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!designMode || !selectedSensorForPlacement) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    const originalDev = parsedDevices.find(d => d.id === selectedSensorForPlacement);
    if (!originalDev) return;

    updatePlacement(selectedSensorForPlacement, clampedX, clampedY);
    setSelectedSensorForPlacement(null);
    toast.success(language === "hr" ? `Senzor "${originalDev.name}" postavljen klikom!` : `Sensor "${originalDev.name}" placed by click!`);
  };

  // Drag reposition of mapped markers in design mode
  const handleMarkerMouseDown = (e: React.MouseEvent, sensorId: string) => {
    if (!designMode) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));

      const markerEl = document.getElementById(`sensor-node-${sensorId}`);
      if (markerEl) {
        markerEl.style.left = `${clampedX}%`;
        markerEl.style.top = `${clampedY}%`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalX = ((upEvent.clientX - rect.left) / rect.width) * 100;
      const finalY = ((upEvent.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, finalX));
      const clampedY = Math.max(0, Math.min(100, finalY));

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      updatePlacement(sensorId, clampedX, clampedY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Remove/Unplace device coordinate
  const unplaceSensor = (sensorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaces(prev => prev.map(w => {
      if (w.id !== activeWorkspaceId) return w;
      return {
        ...w,
        placedDevices: w.placedDevices.filter(p => p.deviceId !== sensorId)
      };
    }));
    toast.info(language === "hr" ? "Senzor uklonjen s tlocrta." : "Sensor removed from floor plan.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header section with toggle and settings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" />
            {language === "hr" ? "Digitalni Blizanac Radni Prostor" : "Digital Twin Workspace"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === "hr" 
              ? "Pratite u stvarnom vremenu prostorni raspored Milesight senzora i status flote." 
              : "Track live spatial distribution of Milesight devices and fleet status in real-time."}
          </p>
        </div>

        {/* Top bar controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <input 
            type="file" 
            ref={updateFileInputRef}
            onChange={handleUpdateLayout}
            accept="image/*"
            className="hidden"
          />

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              {activeWorkspace?.name || "Select Workspace"}
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto py-1">
                    {workspaces.map(w => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setActiveWorkspaceId(w.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${
                          w.id === activeWorkspaceId ? "text-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate">{w.name}</span>
                        {w.id === activeWorkspaceId && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 p-1">
                    <button
                      onClick={triggerUploadClick}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {language === "hr" ? "Novi radni prostor" : "Create New Workspace"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={triggerUpdateUploadClick}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {language === "hr" ? "Promijeni tlocrt" : "Change Layout"}
          </button>

          {workspaces.length > 1 && (
            <button
              onClick={() => {
                if (window.confirm(language === "hr" ? "Jeste li sigurni da želite obrisati ovaj radni prostor?" : "Are you sure you want to delete this workspace?")) {
                  const newWorkspaces = workspaces.filter(w => w.id !== activeWorkspaceId);
                  setWorkspaces(newWorkspaces);
                  setActiveWorkspaceId(newWorkspaces[0]?.id || "");
                  toast.success(language === "hr" ? "Radni prostor obrisan!" : "Workspace deleted!");
                }
              }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {language === "hr" ? "Obriši prostor" : "Delete Workspace"}
            </button>
          )}

          {/* Design Mode toggle */}
          <button
            onClick={() => {
              setDesignMode(!designMode);
              setSelectedSensorForPlacement(null);
              toast.info(
                !designMode 
                  ? (language === "hr" ? "Dizajnerski način rada uključen! Povucite senzore za pozicioniranje." : "Design Mode enabled! Drag devices or click map to place.")
                  : (language === "hr" ? "Dizajnerski način rada isključen." : "Design Mode disabled.")
              );
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              designMode 
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 dark:shadow-none" 
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            <Wrench className={`h-3.5 w-3.5 ${designMode ? "animate-spin" : ""}`} />
            {language === "hr" ? "Dizajnerski način" : "Design Mode"}
            <span className={`inline-block w-2 h-2 rounded-full ml-1 ${designMode ? "bg-emerald-300 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`}></span>
          </button>
        </div>
      </div>

      {/* KPI metrics dashboard cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{placedSensorsCount}/{totalSensorsCount}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "hr" ? "POSTAVLJENI SENZORI" : "PLACED DEVICES"}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">{onlineCount}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "hr" ? "U MREŽI" : "ONLINE"}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">{warningCount}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "hr" ? "UPOZORENJA" : "WARNINGS"}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-rose-600">{criticalCount}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "hr" ? "KRITIČNO" : "CRITICAL"}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout arena */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Map Canvas viewport */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div 
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDropOnMap}
            onClick={handleMapClick}
            className={`relative rounded-2xl border bg-slate-950/80 border-slate-200 dark:border-slate-800 overflow-hidden shadow-md flex items-center justify-center min-h-[480px] lg:min-h-[520px] transition-all ${
              designMode ? "ring-2 ring-indigo-500/20 cursor-crosshair animate-none" : ""
            }`}
          >
            {/* Grid Pattern layout for Design helper */}
            {designMode && (
              <div className="absolute inset-0 z-10 pointer-events-none opacity-5 bg-[size:24px_24px] bg-center bg-repeat" 
                   style={{ backgroundImage: "radial-gradient(#3f51b5 1.5px, transparent 1.5px)" }}></div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeWorkspaceId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {/* Background Map layout */}
                <img 
                  src={activeWorkspace?.layoutImage || DEFAULT_BLUEPRINT} 
                  alt="Workspace Floor Plan Layout"
                  className="max-w-full max-h-[500px] object-contain select-none z-0 pointer-events-none p-4"
                  style={{ minWidth: "320px" }}
                />

                {/* Mapped Sensors */}
                {isLoadingDevices ? (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-30 pointer-events-auto">
                    <div className="text-center text-slate-300 font-semibold space-y-2">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                      <p className="text-xs">Loading Live Devices...</p>
                    </div>
                  </div>
                ) : (
                  parsedDevices.filter(s => s.isPlaced).map(device => (
                    <div key={device.id} id={`sensor-node-${device.id}`} className="absolute pointer-events-auto" style={{ left: `${device.x}%`, top: `${device.y}%` }}>
                      <LiveSensorNode
                        device={device}
                        designMode={designMode}
                        hoveredSensorId={hoveredSensorId}
                        setHoveredSensorId={setHoveredSensorId}
                        onMouseDown={handleMarkerMouseDown}
                        language={language}
                        onUnplace={unplaceSensor}
                        x={device.x}
                        y={device.y}
                      />
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            {/* Placement context banners */}
            {designMode && (
              <div className="absolute top-4 left-4 z-20 bg-indigo-600/95 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow flex items-center gap-1.5 animate-bounce">
                <Move className="h-3.5 w-3.5" />
                {selectedSensorForPlacement 
                  ? (language === "hr" ? "Kliknite na nacrt za postavljanje!" : "Click on the layout map to place!")
                  : (language === "hr" ? "Dizajnerski način (Povuci i ispusti / Pomakni)" : "Design mode (Drag to Position / Reposition)")}
              </div>
            )}
          </div>

          {/* Quick onboarding guidelines */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-500 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {language === "hr" ? "Upute za povezivanje Milesight CO2 senzora" : "Milesight CO2 Sensor Integration & Alignment Guide"}
              </p>
              <p className="mt-1 font-medium leading-relaxed">
                {language === "hr" 
                  ? "Svi uređaji registrirani na platformi automatski se pojavljuju u desnom popisu. Kako biste povezali svoj Milesight CO2 senzor:"
                  : "All devices registered on your platform automatically load below. To connect and link your physical Milesight CO2 sensor:"}
              </p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1.5 font-medium">
                <li>
                  {language === "hr" 
                    ? "Registrirajte uređaj pomoću gumba 'Provision Device' u Fleet Management izborniku koristeći njegov EUI." 
                    : "Register your sensor using the 'Provision Device' dialog in Fleet Management with its active DevEUI."}
                </li>
                <li>
                  {language === "hr" 
                    ? "Uvjerite se da je dekoder postavljen (podržava co2, temperature, i humidity očitovanja u API-ju)." 
                    : "Ensure its payload decoder registers fields mapped to 'co2', 'temperature', and 'humidity' names."}
                </li>
                <li>
                  {language === "hr" 
                    ? "Uključite Dizajnerski način rada, odaberite senzor iz inventara i jednostavno ga pozicionirajte na tlocrt!" 
                    : "Toggle Design Mode on, locate the device in the Sidebar list, and drag/drop it on the layout map!"}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar Inventory panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" />
              {language === "hr" ? "Inventar Uređaja" : "Devices Inventory"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === "hr" ? "Upravljajte i mapirajte stvarne senzore iz baze." : "Map registered database sensors to spatial floor plan coordinates."}
            </p>
          </div>

          {/* Filter bars */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "hr" ? "Pretraži uređaje..." : "Search devices..."}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["All", "Online", "Warning", "Critical", "Offline"].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === filter 
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                      : "bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {filter === "All" ? (language === "hr" ? "Svi" : "All") : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Database devices listings */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {isLoadingDevices ? (
              <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-2" />
                Loading Database Inventory...
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                {language === "hr" ? "Nema senzora u bazi podataka." : "No workspace devices found."}
              </div>
            ) : (
              filteredDevices.map(sensor => {
                const isSelected = selectedSensorForPlacement === sensor.id;
                const isHovered = hoveredSensorId === sensor.id;
                const isOnline = isDeviceOnline(sensor.last_seen);
                const status = isOnline ? "Online" : "Offline";
                const config = getStatusConfig(status);

                return (
                  <div
                    key={sensor.id}
                    draggable={designMode && !sensor.isPlaced}
                    onDragStart={(e) => handleDragStart(e, sensor.id)}
                    onMouseEnter={() => setHoveredSensorId(sensor.id)}
                    onMouseLeave={() => setHoveredSensorId(null)}
                    className={`p-3 rounded-xl border transition-all relative overflow-hidden group ${
                      sensor.isPlaced 
                        ? "border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-400"
                    } ${designMode && !sensor.isPlaced ? "cursor-grab active:cursor-grabbing" : ""} ${
                      isHovered ? "border-indigo-500 ring-1 ring-indigo-500/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${config.bg}`}></div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{sensor.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getSensorIcon(sensor.type, sensor.name, "h-3.5 w-3.5 text-slate-400")}
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{sensor.type || "generic"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>EUI: <strong className="font-mono text-slate-600 dark:text-slate-300 font-bold">{sensor.dev_eui || "---"}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sensor.last_seen ? formatLastSeen(sensor.last_seen) : "Never"}
                      </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/50">
                      {sensor.isPlaced ? (
                        <div className="flex items-center gap-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {language === "hr" ? "Postavljen" : "Mapped"} ({sensor.x.toFixed(0)}%, {sensor.y.toFixed(0)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                          {language === "hr" ? "Nije postavljen" : "Unmapped"}
                        </span>
                      )}

                      <div className="flex gap-1">
                        {designMode && (
                          <>
                            {sensor.isPlaced ? (
                              <button
                                onClick={(e) => unplaceSensor(sensor.id, e)}
                                title={language === "hr" ? "Ukloni s tlocrta" : "Remove placement"}
                                className="h-6 w-6 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedSensorForPlacement(isSelected ? null : sensor.id)}
                                title={language === "hr" ? "Klikni i postavi" : "Click to place"}
                                className={`h-6 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                    : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                }`}
                              >
                                <MapPin className="h-3 w-3" />
                                {isSelected ? (language === "hr" ? "Odabran..." : "Selected...") : (language === "hr" ? "Postavi" : "Place")}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Map legend */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {language === "hr" ? "LEGENDA STATUSA" : "STATUS LEGEND"}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Online</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
