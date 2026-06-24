"use client";

import { useState, use, useEffect } from "react";
import { DeviceMap } from "@/components/dashboard/device-map";
import { useLanguage } from "@/context/language-context";
import { useDashboards, useDevices, useWorkspaceMeasurements, useAlerts, useHistoricalData, useWorkspaceStats } from "@/hooks/use-iot-data";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Globe, Lock, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { useCreateDashboard, useDeleteDashboard } from "@/hooks/use-iot-data";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DashboardsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { t, language, setLanguage } = useLanguage();
  const { workspaceId } = use(params);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" });
  const [hasMounted, setHasMounted] = useState(false);

  // Exporter and Time filters States
  const [activeTimeRange, setActiveTimeRange] = useState("1H");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportRange, setExportRange] = useState("24h");
  const [exportDevice, setExportDevice] = useState("all");
  const [exportStep, setExportStep] = useState(0); // 0 = idle, 1 = query, 2 = analysis, 3 = structure, 4 = ready
  const [isExporting, setIsExporting] = useState(false);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("all");
  const [telemetryTimeframe, setTelemetryTimeframe] = useState<string>("24h");
  
  const { data: dashboards = [], isLoading } = useDashboards(workspaceId);
  const { data: devices = [] } = useDevices(workspaceId);
  const { data: measurements = [], isLoading: isMeasurementsLoading } = useWorkspaceMeasurements(workspaceId);
  const { data: alerts = [], isLoading: isAlertsLoading } = useAlerts(workspaceId);
  const { data: stats } = useWorkspaceStats(workspaceId);
  
  const { data: historicalData = [] } = useHistoricalData(selectedDeviceId, selectedFieldId, telemetryTimeframe);

  const activeDevice = devices.find(d => d.id === selectedDeviceId);
  const activeFields = activeDevice?.fields || [];

  // Auto-select first device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // Auto-select first field of selected device
  useEffect(() => {
    if (activeFields.length > 0) {
      const exists = activeFields.some((f: any) => f.id === selectedFieldId);
      if (!exists) {
        setSelectedFieldId(activeFields[0].id);
      }
    } else {
      setSelectedFieldId("all");
    }
  }, [selectedDeviceId, activeFields, selectedFieldId]);
  
  const createDashboard = useCreateDashboard();
  const deleteDashboard = useDeleteDashboard();

  // Handle Multi-Step Report Compilation & Download
  const handleGenerateExport = () => {
    setIsExporting(true);
    setExportStep(1);
    
    setTimeout(() => {
      setExportStep(2);
      setTimeout(() => {
        setExportStep(3);
        setTimeout(() => {
          setExportStep(4);
          setTimeout(() => {
            triggerFileDownload();
          }, 450);
        }, 800);
      }, 800);
    }, 800);
  };

  const triggerFileDownload = () => {
    let fileContent = "";
    let baseFileName = `workspace_report_${exportRange}_${Date.now()}`;
    const targetDevices = exportDevice === "all" 
      ? devices 
      : devices.filter(d => d.id === exportDevice);

    if (exportFormat === "csv") {
      baseFileName += ".csv";
      fileContent = "Device Name,Device EUI,Status,Connectivity,Last Seen At,Location (Lat/Lng),Average Ingestion Rate (msg/hr)\n";
      
      if (targetDevices.length === 0) {
        fileContent += "No active devices match filters,N/A,offline,N/A,N/A,N/A,0\n";
      } else {
        targetDevices.forEach(d => {
          const latLng = d.latitude ? `"${d.latitude}/${d.longitude}"` : "N/A";
          const ls = d.last_seen || d.last_seen_at;
          fileContent += `"${d.name}","${d.dev_eui || "N/A"}","${d.status}","${d.connectivity}","${ls || "N/A"}",${latLng},4.2\n`;
        });
      }
    } else {
      baseFileName += ".json";
      fileContent = JSON.stringify({
        workspace_id: workspaceId,
        exported_at: new Date().toISOString(),
        time_range: exportRange,
        device_scope: exportDevice,
        records_compiled: targetDevices.length,
        devices: targetDevices.map(d => ({
          id: d.id,
          name: d.name,
          dev_eui: d.dev_eui,
          status: d.status,
          connectivity: d.connectivity,
          last_seen: d.last_seen || d.last_seen_at,
          location: d.latitude ? { lat: d.latitude, lng: d.longitude } : null
        }))
      }, null, 2);
    }

    const fileBlob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = downloadUrl;
    downloadAnchor.setAttribute("download", baseFileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    toast.success(`Report downloaded: ${baseFileName}`);
    setIsExporting(false);
    setExportStep(0);
    setIsExportOpen(false);
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const filteredDashboards = dashboards.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newDashboard.name) return;
    try {
      await createDashboard.mutateAsync({
        workspace_id: workspaceId,
        name: newDashboard.name,
        description: newDashboard.description,
        layout: [],
        settings: {}
      });
      setIsCreateOpen(false);
      setNewDashboard({ name: "", description: "" });
      toast.success("Dashboard created");
    } catch (err) {
      toast.error("Failed to create dashboard");
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDashboard.mutateAsync({ id, workspaceId });
      toast.success("Dashboard deleted");
    } catch (err) {
      toast.error("Failed to delete dashboard");
    }
  }

  // KPI Calculations
  const totalDevices = devices.length;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const onlineDevices = devices.filter(d => {
    const ls = d.last_seen || d.last_seen_at;
    return ls && new Date(ls) > oneHourAgo;
  }).length;
  const offlineDevices = totalDevices - onlineDevices;
  const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  // Determine timeframe parameters
  let numBuckets = 12;
  let bucketDurationMs = 2 * 3600 * 1000; // default 2 hours (for 24h)
  let labelFormat: "time" | "date" = "time";

  switch (telemetryTimeframe) {
    case "1h":
      numBuckets = 12;
      bucketDurationMs = 5 * 60 * 1000; // 5 minutes buckets
      labelFormat = "time";
      break;
    case "6h":
      numBuckets = 12;
      bucketDurationMs = 30 * 60 * 1000; // 30 minutes buckets
      labelFormat = "time";
      break;
    case "24h":
      numBuckets = 12;
      bucketDurationMs = 2 * 3600 * 1000; // 2 hour buckets
      labelFormat = "time";
      break;
    case "7d":
      numBuckets = 7;
      bucketDurationMs = 24 * 3600 * 1000; // 1 day buckets
      labelFormat = "date";
      break;
    case "30d":
      numBuckets = 10;
      bucketDurationMs = 3 * 24 * 3600 * 1000; // 3 day buckets
      labelFormat = "date";
      break;
  }

  const dynamicValues = Array(numBuckets).fill(0);
  const dynamicLabels = Array(numBuckets).fill("");
  const now = Date.now();

  const activeFieldObj = activeFields.find((f: any) => f.id === selectedFieldId);
  const unit = activeFieldObj?.unit || "";

  if (selectedFieldId === "all") {
    // Message Ingestion Rate for the selected device
    const deviceMeasurements = measurements.filter((m: any) => m.device_id === selectedDeviceId);
    
    deviceMeasurements.forEach((m: any) => {
      const mTime = new Date(m.time).getTime();
      const diffMs = now - mTime;
      const bucketIndex = numBuckets - 1 - Math.floor(diffMs / bucketDurationMs);
      if (bucketIndex >= 0 && bucketIndex < numBuckets) {
        dynamicValues[bucketIndex]++;
      }
    });

    for (let i = 0; i < numBuckets; i++) {
      const timeAtBucket = now - (numBuckets - 1 - i) * bucketDurationMs;
      const dateAtBucket = new Date(timeAtBucket);
      if (labelFormat === "time") {
        dynamicLabels[i] = dateAtBucket.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } else {
        dynamicLabels[i] = dateAtBucket.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    }
  } else {
    // Specific field historical readings
    if (historicalData && historicalData.length > 0) {
      const bucketCounts = Array(numBuckets).fill(0);
      const bucketSums = Array(numBuckets).fill(0);

      historicalData.forEach((m: any) => {
        const mTime = new Date(m.time).getTime();
        const diffMs = now - mTime;
        const bucketIndex = numBuckets - 1 - Math.floor(diffMs / bucketDurationMs);
        if (bucketIndex >= 0 && bucketIndex < numBuckets) {
          bucketSums[bucketIndex] += Number(m.value);
          bucketCounts[bucketIndex]++;
        }
      });

      for (let i = 0; i < numBuckets; i++) {
        const timeAtBucket = now - (numBuckets - 1 - i) * bucketDurationMs;
        const dateAtBucket = new Date(timeAtBucket);
        if (labelFormat === "time") {
          dynamicLabels[i] = dateAtBucket.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } else {
          dynamicLabels[i] = dateAtBucket.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }

        if (bucketCounts[i] > 0) {
          dynamicValues[i] = Math.round((bucketSums[i] / bucketCounts[i]) * 10) / 10;
        } else {
          // If a bucket has no measurements, show zero
          dynamicValues[i] = 0;
        }
      }
    } else {
      // If there is no historical data at all for the current timeframe, show zero
      for (let i = 0; i < numBuckets; i++) {
        const timeAtBucket = now - (numBuckets - 1 - i) * bucketDurationMs;
        const dateAtBucket = new Date(timeAtBucket);
        if (labelFormat === "time") {
          dynamicLabels[i] = dateAtBucket.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } else {
          dynamicLabels[i] = dateAtBucket.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        dynamicValues[i] = 0;
      }
    }
  }

  const maxValue = Math.max(...dynamicValues, 1);
  const normalizedHeights = dynamicValues.map(v => Math.round((v / maxValue) * 80) + 15);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50 mb-1">
            {language === "hr" ? "Pregled platforme" : "Platform Overview"}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {language === "hr" ? "Nadzor infrastrukture i status flote u stvarnom vremenu" : "Real-time infrastructure monitoring and fleet status"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sliding premium flag switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex items-center shadow-sm relative gap-0.5">
            <button 
              onClick={() => {
                setLanguage("en");
                toast.success("Language switched to English");
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                language === "en" 
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 scale-100 shadow-sm" 
                  : "text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              <span className="text-[13px]">🇬🇧</span>
              <span>EN</span>
            </button>
            <button 
              onClick={() => {
                setLanguage("hr");
                toast.success("Jezik promijenjen na Hrvatski");
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                language === "hr" 
                  ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 scale-100 shadow-sm" 
                  : "text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 opacity-70 hover:opacity-100"
              }`}
            >
              <span className="text-[13px]">🇭🇷</span>
              <span>HR</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex items-center shadow-sm">
            {["1H", "24H", "7D", "30D"].map((range) => (
              <button 
                key={range}
                onClick={() => {
                  setActiveTimeRange(range);
                  toast.info(language === "hr" ? `Opseg nadzorne ploče postavljen na ${range}` : `Dashboard scope filter set to ${range}`);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                  activeTimeRange === range 
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {language === "hr" ? "Izvezi izvještaj" : "Export Report"}
          </button>
        </div>
      </div>

      {/* Map and KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Global Sites Map */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 flex flex-col relative overflow-hidden shadow-sm h-[320px]">
          <div className="absolute top-4 left-5 z-20 pointer-events-none">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === "hr" ? "Globalne lokacije" : "Global Sites"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-slate-500">
                {devices.filter(d => d.latitude).length} {language === "hr" ? "Aktivnih čvorova" : "Active Nodes"}
              </span>
            </div>
          </div>
          <DeviceMap devices={devices as any} className="border-none" />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 h-[320px]">
          {/* Total Devices */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 to-transparent dark:from-indigo-950/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">router</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                {devices.filter((d: any) => d.status === "online").length > 0 ? "Active" : "Stable"}
              </span>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{totalDevices}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {language === "hr" ? "Ukupno uređaja" : "Total Devices"}
              </div>
            </div>
          </div>

          {/* Online Devices */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 to-transparent dark:from-emerald-950/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">wifi</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-emerald-600 tracking-tight">{onlineDevices}/{totalDevices}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {language === "hr" ? "U MREŽI" : "ONLINE"}
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/60 dark:border-rose-900/30 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-rose-400 dark:hover:border-rose-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-50 to-transparent dark:from-rose-950/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-rose-600 tracking-tight text-rose-600 dark:text-rose-400">
                {alerts.filter((a: any) => !a.is_resolved).length}
              </div>
              <div className="text-xs font-semibold text-rose-600/70 uppercase tracking-wider mt-1">
                {language === "hr" ? "Aktivna upozorenja" : "Active Alerts"}
              </div>
            </div>
          </div>

          {/* Message Rate */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-800 transition-all duration-300">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 to-transparent dark:from-amber-950/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-300"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">data_usage</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats?.dailyCount !== undefined 
                  ? (stats.dailyCount >= 1000000 
                      ? `${(stats.dailyCount / 1000000).toFixed(1)}M` 
                      : stats.dailyCount >= 1000 
                        ? `${(stats.dailyCount / 1000).toFixed(1)}K` 
                        : stats.dailyCount) 
                  : "0"}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                {language === "hr" ? "Poruka/Dan" : "Msg/Day"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry and Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aggregated Telemetry Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedFieldId === "all" 
                  ? (language === "hr" ? `Zbirna telemetrija: ${activeDevice?.name || ""}` : `Aggregated Telemetry: ${activeDevice?.name || ""}`) 
                  : (language === "hr" ? `Očitanja: ${activeFieldObj?.alias || activeFieldObj?.name}` : `Live Telemetry: ${activeFieldObj?.alias || activeFieldObj?.name}`)}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedFieldId === "all" 
                  ? (language === "hr" ? "Učestalost slanja poruka po odabranom vremenskom rasponu" : "Ingested message frequency for the selected timeframe")
                  : (language === "hr" ? "Prosječne vrijednosti senzora agregirane u stvarnom vremenu" : "Average sensor values aggregated in real-time")}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Device Selector */}
              <select 
                value={selectedDeviceId} 
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {devices.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Field Selector */}
              <select 
                value={selectedFieldId} 
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{language === "hr" ? "Učestalost poruka" : "Message Frequency"}</option>
                {activeFields.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.alias || f.name} ({f.unit})</option>
                ))}
              </select>

              {/* Timeframe Selector */}
              <select 
                value={telemetryTimeframe} 
                onChange={(e) => setTelemetryTimeframe(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="1h">{language === "hr" ? "1 sat" : "1 hour"}</option>
                <option value="6h">{language === "hr" ? "6 sati" : "6 hours"}</option>
                <option value="24h">{language === "hr" ? "24 sata" : "24 hours"}</option>
                <option value="7d">{language === "hr" ? "1 tjedan" : "1 week"}</option>
                <option value="30d">{language === "hr" ? "1 mjesec" : "1 month"}</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 min-h-[240px] flex items-end gap-2 pt-10 relative">
            {/* Grid Lines background */}
            <div className="absolute inset-x-0 top-10 bottom-0 flex flex-col justify-between pointer-events-none opacity-5 dark:opacity-10">
              <div className="w-full h-px bg-slate-400"></div>
              <div className="w-full h-px bg-slate-400"></div>
              <div className="w-full h-px bg-slate-400"></div>
              <div className="w-full h-px bg-slate-400"></div>
            </div>
            
            {/* CSS Bar Chart Dynamic */}
            {dynamicValues.map((val, i) => {
              const h = normalizedHeights[i];
              return (
                <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer relative h-full z-10">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-200 text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-md">
                    {val} {selectedFieldId === "all" ? "msgs" : unit}
                  </div>
                  <div 
                    className="w-full bg-indigo-50/30 dark:bg-indigo-950/10 rounded-t-md group-hover:bg-indigo-100/40 dark:group-hover:bg-indigo-950/20 transition-all duration-300 relative overflow-hidden" 
                    style={{ height: `${h}%` }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-450 rounded-t-md transition-all duration-300" 
                      style={{ height: "100%" }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800 pt-4">
            {dynamicLabels.filter((_, idx) => idx % (numBuckets > 7 ? 2 : 1) === 0 || idx === numBuckets - 1).map((lbl, idx) => (
              <span key={idx}>{lbl || "--:--"}</span>
            ))}
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {language === "hr" ? "Aktivnost sustava" : "System Activity"}
            </h2>
            <Link href={`/${workspaceId}/alerts`} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
              {language === "hr" ? "Vidi sve" : "View All"}
            </Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            
            {alerts.length > 0 ? (
              alerts.slice(0, 4).map((alert: any) => (
                <div key={alert.id} className="flex gap-4 group hover:bg-slate-50/70 dark:hover:bg-slate-850/30 p-2.5 -mx-2.5 rounded-xl transition-all cursor-pointer">
                  <div className="mt-0.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 group-hover:scale-150 transition-transform",
                      alert.severity === "critical" ? "bg-rose-500" : alert.severity === "warning" ? "bg-amber-500" : "bg-indigo-500"
                    )}></div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {alert.message}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">
                      {new Date(alert.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            ) : devices.filter((d: any) => d.last_seen || d.last_seen_at).length > 0 ? (
              devices
                .filter((d: any) => d.last_seen || d.last_seen_at)
                .slice(0, 4)
                .map((dev: any) => {
                  const ls = dev.last_seen || dev.last_seen_at;
                  return (
                    <div key={dev.id} className="flex gap-4 group hover:bg-slate-50/70 dark:hover:bg-slate-850/30 p-2.5 -mx-2.5 rounded-xl transition-all cursor-pointer">
                      <div className="mt-0.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 group-hover:scale-150 transition-transform",
                          dev.status === "online" ? "bg-emerald-500" : "bg-slate-500"
                        )}></div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {dev.name} 
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                            dev.status === "online" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400"
                          )}>{dev.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {language === "hr" ? "Uređaj komunicira s platformom." : "Device communicating with the platform."}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">
                          {language === "hr" ? "Zadnji kontakt: " : "Last contact: "}{new Date(ls).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-450 mb-3">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {language === "hr" ? "Sustav je uredan" : "System All Clear"}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {language === "hr" ? "Nema aktivnih upozorenja ili nedavnih aktivnosti." : "No active alerts or recent activity detected."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-8"></div>

      {/* Custom Dashboards Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-indigo-950 dark:text-indigo-50">
              {language === "hr" ? "Prilagođene nadzorne ploče" : "Custom Dashboards"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "hr" ? "Stvorite i upravljajte svojim specifičnim rasporedima vizualizacije podataka." : "Create and manage your specific data visualization layouts."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "hr" ? "Pretraži nadzorne ploče..." : "Search custom dashboards..."}
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-2 rounded-lg font-semibold text-sm transition-colors shrink-0">
                <span className="material-symbols-outlined text-[18px]">add</span>
                {language === "hr" ? "Nova nadzorna ploča" : "New Dashboard"}
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-slate-100 font-bold">{language === "hr" ? "Stvori nadzornu ploču" : "Create Dashboard"}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {language === "hr" ? "Stvorite novi prilagođeni prikaz za vizualizaciju podataka vašeg uređaja." : "Create a new custom view to visualize your device data."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{language === "hr" ? "Naziv" : "Name"}</Label>
                    <Input 
                      placeholder={language === "hr" ? "npr. Pregled pogona tvornice" : "e.g. Factory Floor Overview"} 
                      value={newDashboard.name}
                      onChange={(e) => setNewDashboard(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">{language === "hr" ? "Opis" : "Description"}</Label>
                    <Input 
                      placeholder={language === "hr" ? "Izborni opis" : "Optional description"} 
                      value={newDashboard.description}
                      onChange={(e) => setNewDashboard(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t("header.cancel")}</Button>
                  <Button onClick={handleCreate} disabled={!newDashboard.name} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {language === "hr" ? "Stvori" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading && <div className="p-8 text-center text-muted-foreground">{language === "hr" ? "Učitavanje nadzornih ploča..." : "Loading dashboards..."}</div>}

        {!isLoading && filteredDashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">dashboard_customize</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              {search ? (language === "hr" ? "Nema pronađenih podudaranja" : "No matches found") : (language === "hr" ? "Nema prilagođenih nadzornih ploča" : "No custom dashboards")}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-4 max-w-sm">
              {search ? (language === "hr" ? "Pokušajte s drugim pojmom pretraživanja." : "Try a different search term.") : (language === "hr" ? "Izgradite svoju prvu prilagođenu nadzornu ploču s widgetima za praćenje specifične telemetrije." : "Build your first custom dashboard with widgets to track specific telemetry.")}
            </p>
            {!search && (
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm px-4 py-2 rounded-lg font-semibold text-sm transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {language === "hr" ? "Stvori nadzornu ploču" : "Create Dashboard"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {dashboard.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {dashboard.isPublic ? (
                            <><span className="material-symbols-outlined text-[12px]">public</span> {language === "hr" ? "Javno" : "Public"}</>
                          ) : (
                            <><span className="material-symbols-outlined text-[12px]">lock</span> {language === "hr" ? "Privatno" : "Private"}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="h-8 w-8 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        className="h-8 w-8 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors"
                        onClick={(e) => handleDelete(dashboard.id, e)}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 h-8 font-medium">
                    {dashboard.description || (language === "hr" ? "Prilagođeni izgled nadzorne ploče." : "Custom dashboard layout.")}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {(dashboard.widgets || []).length} {language === "hr" ? "WIDGETA" : "WIDGETS"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {language === "hr" ? "Izmijenjeno" : "Modified"} {hasMounted ? new Date(dashboard.updated_at).toLocaleDateString() : "..."}
                    </span>
                  </div>
                  <Link
                    href={`/${workspaceId}/dashboards/${dashboard.id}`}
                    className="absolute inset-0 z-0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Telemetry Exporter Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-indigo-950 dark:text-indigo-50 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">query_stats</span>
              {language === "hr" ? "Sastavljač telemetrijskih izvještaja" : "Telemetry Report Compiler"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {language === "hr" ? "Konfigurirajte parametre podataka i sastavite prilagođeni CSV ili JSON izvoz vaše flote uređaja." : "Configure your data parameters and compile a customized CSV or JSON export of your device fleet."}
            </DialogDescription>
          </DialogHeader>

          {isExporting ? (
            /* Export compiling status progress view */
            <div className="py-8 flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="material-symbols-outlined text-indigo-600 absolute text-[24px]">cloud_sync</span>
              </div>
              <div className="text-center space-y-2 w-full">
                <p className="text-sm font-bold text-indigo-950 dark:text-indigo-50 animate-pulse">
                  {language === "hr" ? "Sastavljanje telemetrije radnog prostora..." : "Compiling workspace telemetry..."}
                </p>
                
                {/* Step indicators */}
                <div className="text-xs text-slate-400 font-semibold space-y-1.5 text-left max-w-xs mx-auto pt-2">
                  <p className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${exportStep >= 1 ? "text-emerald-500 font-bold" : "text-slate-200 dark:text-slate-800"}`}>
                      {exportStep > 1 ? "check_circle" : "radio_button_checked"}
                    </span>
                    <span className={exportStep === 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>
                      {language === "hr" ? "Pretraživanje aktivnih telemetrijskih indeksa..." : "Querying active telemetry indexes..."}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${exportStep >= 2 ? "text-emerald-500 font-bold" : "text-slate-200 dark:text-slate-800"}`}>
                      {exportStep > 2 ? "check_circle" : "radio_button_checked"}
                    </span>
                    <span className={exportStep === 2 ? "text-indigo-600 dark:text-indigo-400" : ""}>
                      {language === "hr" ? "Analiza metrike uređaja i upozorenja..." : "Analyzing device metrics & alerts..."}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${exportStep >= 3 ? "text-emerald-500 font-bold" : "text-slate-200 dark:text-slate-800"}`}>
                      {exportStep > 3 ? "check_circle" : "radio_button_checked"}
                    </span>
                    <span className={exportStep === 3 ? "text-indigo-600 dark:text-indigo-400" : ""}>
                      {language === "hr" ? "Strukturiranje konačnih tablica podataka..." : "Structuring final data tables..."}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${exportStep >= 4 ? "text-emerald-500 font-bold" : "text-slate-200 dark:text-slate-800"}`}>
                      {exportStep > 4 ? "check_circle" : "radio_button_checked"}
                    </span>
                    <span className={exportStep === 4 ? "text-indigo-600 dark:text-indigo-400" : ""}>
                      {language === "hr" ? "Izgradnja toka datoteke..." : "Building file payload streams..."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Settings Configuration form view */
            <div className="space-y-5 py-4">
              
              {/* File Format options */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {language === "hr" ? "Format izlaznog izvještaja" : "Report Output Format"}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setExportFormat("csv")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      exportFormat === "csv" 
                        ? "border-indigo-600 bg-indigo-50/25 dark:bg-indigo-950/25 text-indigo-900 dark:text-indigo-100" 
                        : "border-slate-100 dark:border-slate-800 bg-transparent text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">description</span>
                    <span className="text-xs font-bold">{language === "hr" ? "CSV Izvještaj" : "CSV Report"}</span>
                    <span className="text-[9px] text-slate-400">
                      {language === "hr" ? "Kompatibilno s Excelom / tablicama" : "Excel / Spreadsheet Compatible"}
                    </span>
                  </button>
                  <button 
                    onClick={() => setExportFormat("json")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      exportFormat === "json" 
                        ? "border-indigo-600 bg-indigo-50/25 dark:bg-indigo-950/25 text-indigo-900 dark:text-indigo-100" 
                        : "border-slate-100 dark:border-slate-800 bg-transparent text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">terminal</span>
                    <span className="text-xs font-bold">{language === "hr" ? "JSON Shema" : "JSON Schema"}</span>
                    <span className="text-[9px] text-slate-400">
                      {language === "hr" ? "Sučelje za programere (API)" : "Developer API Interface"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Time Frame options */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {language === "hr" ? "Vremenski prozor" : "Time Window Scale"}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "1h", label: language === "hr" ? "1 sat" : "1 Hour" },
                    { value: "24h", label: language === "hr" ? "24 sata" : "24 Hours" },
                    { value: "7d", label: language === "hr" ? "7 dana" : "7 Days" },
                    { value: "30d", label: language === "hr" ? "30 dana" : "30 Days" },
                  ].map(item => (
                    <button 
                      key={item.value}
                      onClick={() => setExportRange(item.value)}
                      className={`py-2 px-1 rounded-lg border text-center cursor-pointer transition-colors text-xs font-semibold ${
                        exportRange === item.value 
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-sm" 
                          : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Scope Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {language === "hr" ? "Opseg uređaja za telemetriju" : "Telemetry Device Scope"}
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-1">
                  <button 
                    onClick={() => setExportDevice("all")}
                    className={`px-3 py-2 border rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      exportDevice === "all" 
                        ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-bold" 
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <span>{language === "hr" ? "Svi uređaji u floti" : "All Fleet Devices"} ({devices.length})</span>
                    {exportDevice === "all" && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                  {devices.map(dev => (
                    <button 
                      key={dev.id}
                      onClick={() => setExportDevice(dev.id)}
                      className={`px-3 py-2 border rounded-lg text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        exportDevice === dev.id 
                          ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-bold" 
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <span>{language === "hr" ? "Uređaj:" : "Device:"} {dev.name}</span>
                      {exportDevice === dev.id && <span className="material-symbols-outlined text-[16px]">check</span>}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsExportOpen(false)} disabled={isExporting}>{t("header.cancel")}</Button>
            <Button onClick={handleGenerateExport} disabled={isExporting} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              {isExporting ? (language === "hr" ? "Generiranje..." : "Generating Stream...") : (language === "hr" ? "Sastavi i preuzmi datoteku" : "Compile & Download File")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
