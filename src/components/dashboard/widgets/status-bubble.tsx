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
      <div 
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500",
          isActive ? "shadow-lg shadow-emerald-500/20" : "opacity-40 grayscale"
        )}
        style={{ 
          backgroundColor: isActive ? color : "hsl(var(--muted))",
          boxShadow: isActive ? `0 0 20px ${color}33` : 'none'
        }}
      >
        <div className={cn(
          "h-4 w-4 rounded-full bg-white/90 animate-pulse",
          !isActive && "hidden"
        )} />
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
