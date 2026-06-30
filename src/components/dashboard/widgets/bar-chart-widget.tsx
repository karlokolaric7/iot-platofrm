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
    <div className="flex-1 flex flex-col p-3 min-h-0 w-full select-none justify-between">
      
      {/* Chart Visualizer */}
      <div className="flex-1 w-full min-h-[110px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={`bar-grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                <stop offset="100%" stopColor={color} stopOpacity="0.25" />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              stroke="currentColor" 
              className="text-slate-200/50 dark:text-slate-800/40"
            />
            
            <XAxis 
              dataKey="time" 
              fontSize={9} 
              fontWeight="bold"
              tickLine={false} 
              axisLine={false} 
              stroke="currentColor"
              className="text-muted-foreground/60"
              interval="preserveStartEnd"
              dy={8}
            />
            
            <YAxis 
              fontSize={9} 
              fontWeight="bold"
              tickLine={false} 
              axisLine={false} 
              stroke="currentColor"
              className="text-muted-foreground/60"
            />
            
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                backdropFilter: 'blur(8px)',
                borderColor: 'var(--widget-accent)',
                borderWidth: '1.5px',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'semibold', marginBottom: '2px' }}
            />
            
            <Bar
              dataKey="value"
              fill={`url(#bar-grad-${widget.id})`}
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
              className="transition-all duration-300"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Sparkline Legend */}
      <div className="px-1 mt-2 flex justify-between items-center text-[10px] text-muted-foreground font-bold tracking-wider border-t border-slate-100/50 dark:border-slate-800/20 pt-2 shrink-0">
        <span className="uppercase opacity-75">Bar Distribution</span>
        <span className="text-foreground font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/60 border border-slate-200/20 dark:border-slate-800/40">
          {lastValue.toFixed(1)} {unit}
        </span>
      </div>
      
    </div>
  );
}
