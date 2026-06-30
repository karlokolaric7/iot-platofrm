"use client";

import React, { useMemo } from "react";
import { DashboardWidget } from "@/lib/types";
import { useLatestMeasurements, useRealtimeMeasurements, useHistoricalData } from "@/hooks/use-iot-data";
import { cn } from "@/lib/utils";

export function ValueDisplayWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";

  // Fetch latest measurements & subscribe to real-time updates
  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  useRealtimeMeasurements(deviceId);

  // Fetch historical data for sparkline & trend
  const { data: history = [] } = useHistoricalData(deviceId, fieldId, "24h");

  const measurement = (measurements as any[]).find(m => m.field_id === fieldId);
  const value = measurement?.value ?? "—";
  const fieldAlias = (measurement as any)?.fields?.alias || widget.title;

  const config = widget.config as any;
  const unit = config?.unit || "";
  const color = config?.color || "currentColor";

  // Calculate real trend from 24h history
  const trendInfo = useMemo(() => {
    if (history.length < 2) return null;
    const firstVal = Number(history[0].value);
    const lastVal = Number(history[history.length - 1].value);
    if (isNaN(firstVal) || isNaN(lastVal) || firstVal === 0) return null;
    
    const diff = lastVal - firstVal;
    const percent = (diff / Math.abs(firstVal)) * 100;
    return {
      positive: percent >= 0,
      value: Math.abs(percent).toFixed(1),
    };
  }, [history]);

  // Generate SVG path for sparkline
  const sparklinePath = useMemo(() => {
    if (history.length < 2) return { line: "", area: "" };
    
    const width = 300;
    const height = 60;
    const padding = 5;
    
    const values = history.map(h => Number(h.value)).filter(v => !isNaN(v));
    if (values.length < 2) return { line: "", area: "" };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const points = values.map((val, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const linePath = `M ${points.join(" L ")}`;
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return { line: linePath, area: areaPath };
  }, [history]);

  // Scaling flags
  const isLarge = (widget.h || 0) >= 12;

  let precision = 2;
  if (typeof value === 'number') {
    const absValue = Math.abs(value);
    if (absValue >= 100) precision = 1;
    if (absValue >= 1000) precision = 0;
  }

  const displayStr = typeof value === 'number' 
    ? value.toFixed(precision).replace(/\.?0+$/, "") 
    : value.toString();
    
  const totalLength = displayStr.length + unit.length;
  
  const fontSize = 
    totalLength > 10 ? "text-[max(24px,9cqmin)]" : 
    totalLength > 7 ? "text-[max(28px,12cqmin)]" : 
    "text-[max(32px,15cqmin)]";

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 transition-all duration-300 relative group overflow-hidden select-none">
      
      {/* Background Sparkline Graphic */}
      {sparklinePath.line && (
        <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-35 dark:opacity-25 pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sparkline-grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={sparklinePath.area}
              fill={`url(#sparkline-grad-${widget.id})`}
            />
            <path
              d={sparklinePath.line}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Top Meta Details */}
      <div className="w-full flex items-center justify-between z-10 shrink-0">
        <p className="text-[max(9px,3.5cqmin)] text-muted-foreground uppercase tracking-widest font-bold opacity-85">
          {fieldAlias}
        </p>
        
        {trendInfo && (
          <span className={cn(
            "flex items-center gap-0.5 font-bold transition-all px-2 py-0.5 rounded-full border shadow-xs text-[max(8px,3cqmin)]", 
            trendInfo.positive 
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 text-rose-600 dark:text-rose-400"
          )}>
            {trendInfo.positive ? '↑' : '↓'} {trendInfo.value}%
          </span>
        )}
      </div>

      {/* Center Value */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10">
        <div className="flex items-baseline justify-center gap-1.5">
          <div 
            className={cn("font-black tracking-tighter leading-none transition-all drop-shadow-[0_2px_10px_rgba(var(--widget-accent-rgb),0.25)]", fontSize)}
            style={{ color }}
          >
            {displayStr}
          </div>
          {unit && (
            <span className="text-[max(12px,5cqmin)] font-extrabold text-muted-foreground opacity-75">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Status / Timestamp */}
      <div className="w-full flex items-center justify-between z-10 mt-auto pt-2 border-t border-slate-100/50 dark:border-slate-800/20 shrink-0">
        {measurement?.time ? (
          <div className="flex items-center gap-1.5 opacity-60 font-semibold text-[max(8px,3cqmin)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {new Date(measurement.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        ) : (
          <div className="text-[max(8px,3cqmin)] text-muted-foreground/40">No recent data</div>
        )}
      </div>

    </div>
  );
}
