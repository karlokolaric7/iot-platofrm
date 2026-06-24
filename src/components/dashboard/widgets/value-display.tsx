"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { useLatestMeasurements, useRealtimeMeasurements } from "@/hooks/use-iot-data";
import { cn } from "@/lib/utils";

export function ValueDisplayWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";

  // Fetch latest measurements
  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  
  // Subscribe to real-time updates
  useRealtimeMeasurements(deviceId);

  const measurement = (measurements as any[]).find(m => m.field_id === fieldId);
  const value = measurement?.value ?? "—";
  const fieldAlias = (measurement as any)?.fields?.alias || widget.title;

  const config = widget.config as any;
  const unit = config?.unit || "";
  const color = config?.color || "currentColor";

  // Scaling flags for labels based on widget height
  const isLarge = (widget.h || 0) >= 12;
  const isMedium = (widget.h || 0) >= 8;

  // Intelligent precision: fewer decimals as numbers get larger
  let precision = 2;
  if (typeof value === 'number') {
    const absValue = Math.abs(value);
    if (absValue >= 1000) precision = 1;
    if (absValue >= 10000) precision = 0;
  }

  const displayStr = typeof value === 'number' 
    ? value.toFixed(precision).replace(/\.?0+$/, "") 
    : value.toString();
    
  const totalLength = displayStr.length + unit.length;
  
  // Adaptive font size for the main value that inherently scales when the widget resizes
  const fontSize = 
    totalLength > 10 ? "text-[max(20px,10cqmin)]" : 
    totalLength > 7 ? "text-[max(24px,14cqmin)]" : 
    "text-[max(28px,18cqmin)]";

  // Simulated trend generation for visual flair
  const trendPositive = Math.random() > 0.5;
  const trendValue = (Math.random() * 5).toFixed(1);

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center p-4 transition-all duration-300 relative group overflow-hidden", 
      isLarge ? "gap-4" : "gap-2"
    )}>
      {/* Main Value Container with Glass Effect */}
      <div className="relative flex flex-col items-center">
        <div 
          className={cn("font-black tracking-tighter transition-all drop-shadow-sm", fontSize)}
          style={{ color }}
        >
          {displayStr}
        </div>
        
        {/* Trend & Unit Row */}
        <div className="flex items-center gap-2 mt-1">
          {unit && (
            <span className={cn(
              "font-bold transition-all px-2 py-0.5 rounded-full border shadow-sm", 
              "text-[max(10px,4cqmin)]",
              "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            )}>
              {unit}
            </span>
          )}
          
          <span className={cn(
            "flex items-center gap-0.5 font-bold transition-all px-1.5 py-0.5 rounded-full border shadow-sm", 
            "text-[max(10px,4cqmin)]",
            trendPositive 
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
          )}>
            <span className="material-symbols-outlined text-[12px] leading-none">
              {trendPositive ? 'trending_up' : 'trending_down'}
            </span>
            {trendValue}%
          </span>
        </div>
      </div>

      <p className={cn(
        "text-muted-foreground uppercase tracking-widest font-bold transition-all text-center mt-2 opacity-80",
        "text-[max(10px,4cqmin)]"
      )}>
        {fieldAlias}
      </p>

      {measurement?.time && (
        <div className={cn(
          "flex items-center gap-1.5 transition-all mt-1 opacity-50 font-semibold",
          "text-[max(9px,3.5cqmin)]"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Last seen: {new Date(measurement.time).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
