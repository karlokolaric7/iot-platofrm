"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { type Layout } from "react-grid-layout";
import { DashboardWidget } from "@/lib/types";
import { WidgetRenderer } from "@/components/dashboard/widget-renderer";
import { cn } from "@/lib/utils";
import "@/styles/grid-layout.css";

// Use dynamic import to avoid SSR issues with react-grid-layout
const ResponsiveGridLayout = dynamic(
  async () => {
    // In react-grid-layout v2, the legacy components (including WidthProvider) 
    // are moved to a dedicated subpath
    const mod = await import("react-grid-layout/legacy");
    const { Responsive, WidthProvider } = mod as any;
    return WidthProvider(Responsive);
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
) as any;

interface DashboardGridProps {
  dashboardId: string;
  widgets: DashboardWidget[];
  isEditable: boolean;
  timeframe?: string;
  onLayoutChange: (newWidgets: DashboardWidget[]) => void;
  onWidgetDelete: (id: string) => void;
  onWidgetEdit?: (widget: DashboardWidget) => void;
}

export function DashboardGrid({
  widgets,
  isEditable,
  timeframe = "24h",
  onLayoutChange,
  onWidgetDelete,
  onWidgetEdit,
}: DashboardGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLayoutChange = (currentLayout: Layout[]) => {
    if (!isEditable) return;

    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = currentLayout.find((l: any) => l.i === widget.id) as any;
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return widget;
    });

    onLayoutChange(updatedWidgets);
  };

  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 1,
    minH: 1,
  }));

  return (
    <div className={cn(
      "relative rounded-xl transition-all duration-300 min-h-[600px]",
      isEditable && "dashboard-edit-grid p-3 bg-muted/5 ring-1 ring-border/50"
    )}>
      {isEditable && <div className="dynamic-grid-bg" />}
      <ResponsiveGridLayout
        className={cn("layout", isEditable && "is-editable")}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={40}
        isDraggable={isEditable}
        isResizable={isEditable}
        resizeHandles={['se', 'sw']}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        margin={[12, 12]}
        useCSSTransforms={mounted}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            <WidgetRenderer 
              widget={widget} 
              isEditable={isEditable} 
              timeframe={timeframe}
              onRemove={onWidgetDelete} 
              onEdit={onWidgetEdit}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
