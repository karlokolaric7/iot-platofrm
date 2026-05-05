"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { useHistoricalData, useLatestMeasurements, useRealtimeMeasurements } from "@/hooks/use-iot-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function BarChartWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";
  
  // Fetch historical data for the last 24h
  const { data: history = [] } = useHistoricalData(deviceId, fieldId, "24h");
  
  // Fetch measurements for real-time updates (triggering re-fetch)
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
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={color} 
                  fillOpacity={0.8 + (index / chartData.length) * 0.2} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-2 pb-1 flex justify-between items-center text-[10px] text-muted-foreground font-medium border-t border-border/50 pt-2 shrink-0">
        <span>Bar Distribution</span>
        <span>{lastValue.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
}
