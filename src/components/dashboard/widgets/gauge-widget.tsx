"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
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

  // Intelligent precision: fewer decimals as numbers get larger
  let precision = 2;
  const absValue = Math.abs(value);
  if (absValue >= 1000) precision = 1;
  if (absValue >= 10000) precision = 0;

  const displayStr = value.toFixed(precision).replace(/\.?0+$/, "");
  const totalLength = displayStr.length + unit.length;

  // Scale text naturally using container queries (cqmin) so it perfectly adjusts to any size without overflowing
  const valueFontSize =
    totalLength > 9 ? "text-[max(12px,6cqmin)]" :
    totalLength > 7 ? "text-[max(14px,7cqmin)]" :
    totalLength > 5 ? "text-[max(16px,8cqmin)]" :
    "text-[max(18px,10cqmin)]";

  const unitSize = totalLength > 8 ? "text-[max(10px,3cqmin)]" : "text-[max(11px,3.5cqmin)]";
  const labelSize = "text-[max(10px,3.5cqmin)]";
  const footerSize = "text-[max(9px,3cqmin)]";

  // Calculate percentage for gauge
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  const data = [
    { value: percentage },
    { value: 100 - percentage },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 pb-2">
      {/* Gauge chart - takes all available space */}
      <div className="flex-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius="80%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Value label - centered over the gauge flat edge */}
        <div className="absolute bottom-[10%] left-0 right-0 flex flex-col items-center pointer-events-none">
          <span className={cn("font-bold leading-tight", valueFontSize)}>
            {displayStr}
            <span className={cn("text-muted-foreground ml-1", unitSize)}>{unit}</span>
          </span>
        </div>

        {/* Min/Max labels */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 flex justify-between px-2 text-muted-foreground font-medium pointer-events-none",
          labelSize
        )}>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Footer - field name + timestamp */}
      <div className="flex flex-col items-center shrink-0 mt-1">
        <p className={cn("text-muted-foreground uppercase tracking-wider font-bold text-center leading-tight", labelSize)}>
          {fieldAlias}
        </p>
        {measurement?.time && (
          <p className={cn("text-muted-foreground/60 font-medium mt-0.5", footerSize)}>
            Last seen: {new Date(measurement.time).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
