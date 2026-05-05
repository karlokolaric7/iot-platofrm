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

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center p-4 transition-all duration-300", 
      isLarge ? "gap-4" : "gap-2"
    )}>
      <div 
        className={cn("font-bold tracking-tight transition-all", fontSize)}
        style={{ color }}
      >
        {displayStr}
        {unit && (
          <span className={cn(
            "ml-1 font-medium text-muted-foreground transition-all", 
            "text-[max(12px,6cqmin)]"
          )}>
            {unit}
          </span>
        )}
      </div>
      <p className={cn(
        "text-muted-foreground uppercase tracking-wider font-semibold transition-all text-center",
        "text-[max(10px,5cqmin)]"
      )}>
        {fieldAlias}
      </p>
      {measurement?.time && (
        <p className={cn(
          "text-muted-foreground/60 transition-all font-medium mt-1",
          "text-[max(9px,4cqmin)]"
        )}>
          Last seen: {new Date(measurement.time).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
