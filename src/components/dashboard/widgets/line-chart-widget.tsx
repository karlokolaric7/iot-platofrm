"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { useHistoricalData, useLatestMeasurements, useRealtimeMeasurements } from "@/hooks/use-iot-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function LineChartWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";
  
  // Fetch historical data for the last 24h
  const { data: history = [] } = useHistoricalData(deviceId, fieldId, "24h");
  
  // Fetch measurements for current value
  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  useRealtimeMeasurements(deviceId);

  const chartData = history.map(m => ({
    time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Number(m.value)
  }));

  const config = widget.config as any;
  const lastValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const color = config?.color || "#3b82f6";
  const unit = config?.unit || "";

  return (
    <div className="flex-1 flex flex-col p-2 min-h-0 w-full">
      <div className="flex-1 w-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
            <XAxis 
              dataKey="time" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              stroke="hsl(var(--muted-foreground))"
              interval="preserveStartEnd"
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
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="px-2 pb-1 flex justify-between items-center text-[10px] text-muted-foreground font-medium border-t border-border/50 pt-2 shrink-0">
        <span>Historical Trend</span>
        <span>{lastValue.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
}
