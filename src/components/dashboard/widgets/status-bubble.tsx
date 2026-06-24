"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { useLatestMeasurements, useRealtimeMeasurements } from "@/hooks/use-iot-data";
import { cn } from "@/lib/utils";

export function StatusBubbleWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";

  // Fetch latest measurements
  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  
  // Real-time updates
  useRealtimeMeasurements(deviceId);

  const measurement = (measurements as any[]).find(m => m.field_id === fieldId);
  const value = measurement?.value;
  const isActive = value === true || value === 1 || value === "on";

  const config = widget.config as any;
  const color = config?.color || (isActive ? "#10b981" : "#94a3b8");
  const label = config?.label || (isActive ? "Active" : "Inactive");
  const unit = measurement?.unit || "";

  return (
    <div className="flex-1 flex items-center gap-4 p-4">
      <div className="relative flex items-center justify-center h-16 w-16 shrink-0">
        {/* Outer Glow / Ping layer 1 */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: color, animationDuration: '3s' }}
          />
        )}
        
        {/* Inner Ping layer 2 */}
        {isActive && (
          <div 
            className="absolute inset-2 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: color, animationDuration: '2s' }}
          />
        )}
        
        {/* Core Bubble */}
        <div 
          className={cn(
            "absolute inset-4 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner",
            isActive ? "shadow-lg" : "opacity-30 grayscale"
          )}
          style={{ 
            backgroundColor: isActive ? color : "hsl(var(--muted))",
            boxShadow: isActive ? `0 0 30px ${color}80, inset 0 -4px 8px rgba(0,0,0,0.2)` : 'none'
          }}
        >
          {/* Highlight glare */}
          <div className="absolute top-1 left-1.5 w-3 h-1.5 bg-white/40 rounded-full -rotate-45" />
        </div>
      </div>
      
      <div className="overflow-hidden">
        <p className="text-sm font-bold truncate leading-none mb-1 uppercase tracking-tight">
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-70">
          {widget.title}
        </p>
        {value !== undefined && (
          <p className="text-xs font-mono mt-1 font-medium">
            {value} {unit}
          </p>
        )}
      </div>
    </div>
  );
}
