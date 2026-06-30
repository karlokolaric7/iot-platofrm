"use client";

import React, { useMemo } from "react";
import { DashboardWidget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLatestMeasurements, useRealtimeMeasurements } from "@/hooks/use-iot-data";

export function GaugeWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const fieldId = widget.field_id || "";

  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  useRealtimeMeasurements(deviceId);

  const measurement = (measurements as any[]).find(m => m.field_id === fieldId);
  const value = typeof measurement?.value === 'number' ? measurement.value : 0;

  const config = widget.config as any;
  const min = config?.min ?? 0;
  const max = config?.max ?? 100;
  const unit = config?.unit || "";
  const color = config?.color || "#3b82f6";
  const fieldAlias = (measurement as any)?.fields?.alias || widget.title;

  // Calculate percentage
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  // SVG Gauge Config
  const radius = 70;
  const strokeWidth = 10;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * radius; // 219.91
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calculate cursor dot position
  const cursorCoords = useMemo(() => {
    const angle = -180 + (percentage / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    return { x, y };
  }, [percentage]);

  // Generate tick marks
  const ticks = useMemo(() => {
    const tickCount = 9;
    const result = [];
    for (let i = 0; i < tickCount; i++) {
      const pct = i / (tickCount - 1);
      const angle = -180 + pct * 180;
      const rad = (angle * Math.PI) / 180;
      
      // Tick line from radius-2 to radius+2
      const x1 = cx + (radius - 8) * Math.cos(rad);
      const y1 = cy + (radius - 8) * Math.sin(rad);
      const x2 = cx + (radius - 4) * Math.cos(rad);
      const y2 = cy + (radius - 4) * Math.sin(rad);
      
      result.push({ x1, y1, x2, y2, id: i });
    }
    return result;
  }, []);

  // Precision formatting
  let precision = 2;
  const absValue = Math.abs(value);
  if (absValue >= 100) precision = 1;
  if (absValue >= 1000) precision = 0;

  const displayStr = value.toFixed(precision).replace(/\.?0+$/, "");
  const totalLength = displayStr.length + unit.length;

  const valueFontSize =
    totalLength > 9 ? "text-[max(14px,6.5cqmin)]" :
    totalLength > 7 ? "text-[max(16px,7.5cqmin)]" :
    "text-[max(18px,9cqmin)]";

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 pb-2 select-none justify-between">
      
      {/* Gauge Visual Area */}
      <div className="flex-1 relative min-h-[100px] flex items-center justify-center">
        <svg 
          viewBox="0 0 200 110" 
          className="w-full max-w-[220px] h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
        >
          <defs>
            <linearGradient id={`gauge-grad-${widget.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${widget.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800/60"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke={`url(#gauge-grad-${widget.id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />

          {/* Instrument Ticks */}
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
            />
          ))}

          {/* Glowing Cursor Indicator */}
          {percentage > 0 && (
            <circle
              cx={cursorCoords.x}
              cy={cursorCoords.y}
              r="6"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              filter={`url(#glow-${widget.id})`}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Value Overlay - Centered in the middle of the dial */}
        <div className="absolute bottom-[10%] flex flex-col items-center justify-center pointer-events-none">
          <span className={cn("font-black tracking-tighter leading-none text-slate-800 dark:text-slate-100 drop-shadow-xs", valueFontSize)}>
            {displayStr}
          </span>
          {unit && (
            <span className="text-[max(9px,3cqmin)] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-85">
              {unit}
            </span>
          )}
        </div>

        {/* Min / Max Labels */}
        <div className="absolute bottom-0 left-[10%] right-[10%] flex justify-between text-[max(8px,3cqmin)] text-muted-foreground/60 font-bold tracking-wider">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col items-center shrink-0 mt-2 border-t border-slate-100/50 dark:border-slate-800/20 pt-1.5">
        <p className="text-muted-foreground uppercase tracking-widest font-bold text-center leading-none text-[max(8px,3cqmin)] opacity-85">
          {fieldAlias}
        </p>
        {measurement?.time && (
          <p className="text-muted-foreground/50 font-semibold text-[max(7.5px,2.5cqmin)] mt-0.5">
            {new Date(measurement.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

    </div>
  );
}
