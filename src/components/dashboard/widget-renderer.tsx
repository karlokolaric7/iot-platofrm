"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { ValueDisplayWidget } from "./widgets/value-display";
import { GaugeWidget } from "./widgets/gauge-widget";
import { LineChartWidget } from "./widgets/line-chart-widget";
import { StatusBubbleWidget } from "./widgets/status-bubble";
import { BarChartWidget } from "./widgets/bar-chart-widget";
import { MapWidget } from "./widgets/map-widget";

interface WidgetRendererProps {
  widget: DashboardWidget;
  isEditable: boolean;
  onRemove: (id: string) => void;
  onEdit?: (widget: DashboardWidget) => void;
}

export function WidgetRenderer({ widget, isEditable, onRemove, onEdit }: WidgetRendererProps) {
  // Scaling flags and constants
  const h = widget.h || 0;
  const isXL = h >= 16;
  const isLarge = h >= 12;
  const isMedium = h >= 8;
  
  const titleSize = isXL ? "text-base" : isLarge ? "text-sm" : isMedium ? "text-xs" : "text-[10px]";
  const headerPadding = isXL ? "p-5" : isLarge ? "p-4" : isMedium ? "p-3.5" : "p-3";

  const renderWidgetContent = () => {
    switch (widget.type) {
      case "value_display":
        return <ValueDisplayWidget widget={widget} />;
      case "gauge":
        return <GaugeWidget widget={widget} />;
      case "line_chart":
        return <LineChartWidget widget={widget} />;
      case "status_bubble":
        return <StatusBubbleWidget widget={widget} />;
      case "bar_chart":
        return <BarChartWidget widget={widget} />;
      case "map":
        return <MapWidget widget={widget} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <p className="text-sm font-medium uppercase tracking-wider">{widget.type.replace("_", " ")}</p>
            <p className="text-xs mt-1">Widget coming soon</p>
          </div>
        );
    }
  };

  const config = widget.config as any;
  const color = config?.color || "#3b82f6";

  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
  };
  const colorRgb = hexToRgb(color);

  return (
    <Card 
      style={{ 
        "--widget-accent": color,
        "--widget-accent-rgb": colorRgb,
      } as React.CSSProperties}
      className={cn(
        "h-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group overflow-hidden border border-slate-200/50 dark:border-slate-850/60",
        "bg-white/70 dark:bg-slate-950/35 backdrop-blur-md",
        "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.25)]",
        "hover:shadow-[0_15px_35px_-8px_rgba(var(--widget-accent-rgb),0.18),0_5px_15px_-5px_rgba(var(--widget-accent-rgb),0.08)]",
        "hover:border-[rgba(var(--widget-accent-rgb),0.4)] hover:ring-1 hover:ring-[rgba(var(--widget-accent-rgb),0.15)]",
        isEditable && "hover:scale-[1.01] hover:-translate-y-[1px]"
      )}
    >
      <CardHeader className={cn(
        headerPadding, 
        "pb-0 flex flex-row items-center justify-between space-y-0 shrink-0 bg-gradient-to-b from-muted/10 to-transparent relative",
        isEditable && "widget-drag-handle cursor-grab active:cursor-grabbing hover:bg-muted/20 transition-colors"
      )}>
        {/* Sleek top accent line */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 h-[3px] transition-all duration-300",
            isEditable ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          style={{ backgroundColor: "var(--widget-accent)" }}
        />
        
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {/* Pulsing indicator dot */}
          <span 
            className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_var(--widget-accent)] animate-pulse"
            style={{ backgroundColor: "var(--widget-accent)" }}
          />
          {isEditable && (
            <GripVertical className={cn("text-muted-foreground/40 shrink-0", isLarge ? "h-5 w-5" : "h-4 w-4")} />
          )}
          <CardTitle className={cn("font-bold uppercase tracking-wider text-muted-foreground/80 group-hover:text-foreground transition-colors truncate leading-none mt-0.5", titleSize)}>
            {widget.title}
          </CardTitle>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger 
              onPointerDown={(e) => isEditable && e.stopPropagation()}
              className={cn("relative z-10 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100", isLarge ? "h-8 w-8" : "h-7 w-7", isEditable && "opacity-100")}
            >
              <MoreVertical className={cn(isLarge ? "h-5 w-5" : "h-4 w-4")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="gap-2"
                onClick={() => onEdit?.(widget)}
              >
                <Pencil className="h-4 w-4" />
                Edit Widget
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => onRemove(widget.id)}
              >
                <Trash2 className="h-4 w-4" />
                Remove Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden @container [container-type:size]">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}
