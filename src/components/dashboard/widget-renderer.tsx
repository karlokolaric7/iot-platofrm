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

  return (
    <Card className={cn(
      "h-full flex flex-col transition-all duration-300 group overflow-hidden border border-white/10 dark:border-white/5",
      "bg-card/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
      "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]",
      "hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08),0_4px_8px_-2px_rgba(0,0,0,0.04)]",
      "hover:ring-1 hover:ring-primary/20",
      isEditable && "hover:border-primary/30"
    )}>
      <CardHeader className={cn(headerPadding, "pb-0 flex flex-row items-center justify-between space-y-0 shrink-0 bg-gradient-to-b from-muted/20 to-transparent")}>
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <CardTitle className={cn("font-bold uppercase tracking-wider text-muted-foreground/80 group-hover:text-foreground transition-colors truncate leading-none", titleSize)}>
            {widget.title}
          </CardTitle>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {isEditable && (
            <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted rounded-md transition-all shrink-0">
              <GripVertical className={cn(isLarge ? "h-5 w-5" : "h-4 w-4")} />
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className={cn("inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100", isLarge ? "h-8 w-8" : "h-7 w-7")}>
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
