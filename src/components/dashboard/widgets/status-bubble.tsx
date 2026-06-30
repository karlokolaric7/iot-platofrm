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
  const color = config?.color || (isActive ? "#10b981" : "#64748b");
  const label = config?.label || (isActive ? "Active" : "Inactive");
  const unit = measurement?.unit || "";

  return (
    <div className="flex-1 flex items-center gap-4 p-4 select-none">
      
      {/* Glossy LED Bezel */}
      <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
        
        {/* Outer Glow Halo */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-15"
            style={{ backgroundColor: color, animationDuration: '3s' }}
          />
        )}
        
        {/* Mid-layer Glow */}
        {isActive && (
          <div 
            className="absolute inset-1.5 rounded-full animate-pulse opacity-30"
            style={{ 
              backgroundColor: color, 
              boxShadow: `0 0 16px 4px ${color}`,
              animationDuration: '2s' 
            }}
          />
        )}
        
        {/* Outer Bezel */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-200/50 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900 shadow-sm" />
        
        {/* LED Core */}
        <div 
          className={cn(
            "absolute inset-2.5 rounded-full flex items-center justify-center transition-all duration-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_inset_0_-2px_4px_rgba(0,0,0,0.2)]",
            isActive ? "shadow-md" : "opacity-40 grayscale"
          )}
          style={{ 
            background: isActive 
              ? `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 45%, rgba(0,0,0,0.4) 100%)`
              : "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #94a3b8 60%, #475569 100%)",
            boxShadow: isActive 
              ? `0 0 12px ${color}, inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)`
              : 'none'
          }}
        >
          {/* Glare Reflection */}
          <div className="absolute top-0.5 left-1 w-2.5 h-1.5 bg-white/50 rounded-full -rotate-[30deg] filter blur-[0.3px]" />
        </div>
      </div>
      
      {/* Information Labels */}
      <div className="overflow-hidden flex flex-col justify-center">
        <p 
          className="text-xs font-black uppercase tracking-wider leading-none mb-1.5 transition-colors"
          style={{ color: isActive ? color : "inherit" }}
        >
          {label}
        </p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-extrabold opacity-60">
          {widget.title}
        </p>
        {value !== undefined && (
          <p className="text-[10px] font-mono mt-1 font-bold text-slate-400 dark:text-slate-500">
            Raw: {value.toString()} {unit}
          </p>
        )}
      </div>

    </div>
  );
}
