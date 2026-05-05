"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MOCK_DEVICES, getDeviceFields } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  Filter,
  LineChart as LineChartIcon,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

// Historical data is fetched from live Supabase measurements via useHistoricalData hook.

import { useDevices, useHistoricalData } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";

export default function DataExplorerPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [chartType, setChartType] = useState<"line" | "area">("line");

  const { data: devices = [] } = useDevices(workspaceId);
  
  // Find fields for selected device
  const device = devices.find(d => d.id === selectedDevice);
  // Note: We'll need another hook to fetch fields properly if they're not in useDevices
  // For now, we'll use useDevice to get fields when a device is selected
  const { data: deviceDetails } = useHistoricalData(selectedDevice, selectedField, timeRange);

  // Safely access fields from the selected device in the list
  const selectedDeviceObj = devices.find(d => d.id === selectedDevice);
  const fields = (selectedDeviceObj as any)?.fields || [];
  
  const chartData = deviceDetails?.map(m => ({
    time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Number(m.value)
  })) || [];

  const handleExportCsv = () => {
    if (!deviceDetails || deviceDetails.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ["Time", "Value"];
    const rows = deviceDetails.map(m => [
      new Date(m.time).toISOString(),
      m.value
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fieldName = fields.find((f: { id: string; alias: string }) => f.id === selectedField)?.alias || "data";
    link.download = `export_${fieldName}_${timeRange}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze historical telemetry data and export reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportCsv}
            disabled={!deviceDetails || deviceDetails.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 flex-1 min-h-0">
        {/* Sidebar Controls */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Dataset Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Device</Label>
              <Select value={selectedDevice} onValueChange={(v) => setSelectedDevice(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Measurement</Label>
              <Select value={selectedField} onValueChange={(v) => setSelectedField(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f: { id: string; alias: string }) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.alias}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v || "")}>
                <SelectTrigger>
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label>Visualization</Label>
              <div className="flex rounded-lg border p-1 bg-muted/50">
                <button
                  onClick={() => setChartType("line")}
                  className={cn(
                    "flex-1 flex items-center justify-center py-1.5 rounded-md text-xs transition-all",
                    chartType === "line" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LineChartIcon className="h-3.5 w-3.5 mr-1.5" />
                  Line
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={cn(
                    "flex-1 flex items-center justify-center py-1.5 rounded-md text-xs transition-all",
                    chartType === "area" ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Area
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Area */}
        <Card className="lg:col-span-3 flex flex-col min-h-[400px]">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {fields.find((f: { id: string; alias: string }) => f.id === selectedField)?.alias || "Select a field to visualize"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedField ? `Historical trend for ${timeRange}` : "No data selected"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            {!selectedField ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium">No Data to Display</p>
                  <p className="text-xs text-muted-foreground">Please select a device and a measurement field from the sidebar.</p>
                </div>
              </div>
            ) : (
              <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b' }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 4, fill: '#3b82f6' }}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#64748b' }}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
