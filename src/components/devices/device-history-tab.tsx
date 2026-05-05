"use client";

import React, { useState, useMemo } from "react";
import { DeviceField, Measurement } from "@/lib/types";
import { useHistoricalData } from "@/hooks/use-iot-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, Activity, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

interface DeviceHistoryTabProps {
  deviceId: string;
  fields: DeviceField[];
}

export function DeviceHistoryTab({ deviceId, fields }: DeviceHistoryTabProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || "");
  const [range, setRange] = useState<string>("24h");

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const { data: history = [], isLoading } = useHistoricalData(deviceId, selectedFieldId, range);

  const stats = useMemo(() => {
    if (!history.length) return { min: 0, max: 0, avg: 0 };
    const values = history.map(m => Number(m.value));
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [history]);

  const chartData = useMemo(() => {
    return history.map(m => ({
      timestamp: new Date(m.time).getTime(),
      displayTime: format(new Date(m.time), range === "1h" ? "HH:mm:ss" : range === "30d" ? "MMM dd, HH:mm" : "HH:mm"),
      fullTime: format(new Date(m.time), "yyyy-MM-dd HH:mm:ss"),
      value: Number(m.value)
    }));
  }, [history, range]);

  const handleExportCsv = () => {
    if (!history || history.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ["Time", "Value"];
    const rows = history.map(m => [
      new Date(m.time).toISOString(),
      m.value
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fieldName = selectedField?.alias || "data";
    link.download = `export_${fieldName}_${range}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card/50 p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-[240px]">
            <Select value={selectedFieldId} onValueChange={(v) => setSelectedFieldId(v || "")}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.alias} ({field.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={range} onValueChange={setRange} className="w-auto">
            <TabsList className="bg-background border">
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9"
          onClick={handleExportCsv}
          disabled={!history || history.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Main Chart */}
      <Card className="border-none shadow-sm bg-card/30 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {selectedField?.alias} History
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {range} of data points
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average</p>
              <p className="text-lg font-bold leading-none">{stats.avg.toFixed(2)}<span className="text-[10px] ml-0.5 font-normal">{selectedField?.unit}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm italic">
                Gathering historical data...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedField?.color || "var(--primary)"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={selectedField?.color || "var(--primary)"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                  <XAxis 
                    dataKey="displayTime" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="hsl(var(--muted-foreground))"
                    minTickGap={30}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={selectedField?.color || "var(--primary)"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-border/50">
                <Clock className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No results found for this period</p>
                <p className="text-xs opacity-60">Try selecting a different time range or field</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background/40 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Maximum Value</p>
                <h4 className="text-xl font-bold">{stats.max.toFixed(2)} {selectedField?.unit}</h4>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/40 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Minimum Value</p>
                <h4 className="text-xl font-bold">{stats.min.toFixed(2)} {selectedField?.unit}</h4>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/40 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Readings</p>
                <h4 className="text-xl font-bold">{history.length}</h4>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data Table */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Detailed Audit Log</CardTitle>
          <CardDescription className="text-xs">Individual data points received from device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px] text-[10px] uppercase font-bold">Timestamp</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Value</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.slice().reverse().slice(0, 50).map((m: any, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium font-mono text-xs">
                        {format(new Date(m.time), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-bold">
                        {m.value} <span className="text-[10px] font-normal text-muted-foreground">{selectedField?.unit}</span>
                      </TableCell>
                      <TableCell>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-2" />
                        <span className="text-[10px] font-medium text-emerald-600 uppercase">Success</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs italic">
                      No data points found for selection
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
