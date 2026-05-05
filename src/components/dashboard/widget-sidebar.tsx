"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Activity, 
  Map as MapIcon, 
  MousePointer2, 
  Type, 
  Gauge as GaugeIcon 
} from "lucide-react";
import { DashboardWidget, DeviceField } from "@/lib/types";
import { useDevices, useDevice } from "@/hooks/use-iot-data";
import { cn } from "@/lib/utils";

interface WidgetSidebarProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (widget: Partial<DashboardWidget>) => void;
  onUpdateWidget?: (id: string, updates: Partial<DashboardWidget>) => void;
  restrictedDeviceId?: string; // If provided, only this device's fields can be selected
  editingWidget?: DashboardWidget;
}

const WIDGET_TYPES: { type: string; label: string; icon: any; description: string }[] = [
  { 
    type: "value_display", 
    label: "Value Display", 
    icon: Type, 
    description: "Display a single field value with unit." 
  },
  { 
    type: "gauge", 
    label: "Gauge", 
    icon: GaugeIcon, 
    description: "Circular gauge for percentage or range values." 
  },
  { 
    type: "line_chart", 
    label: "Line Chart", 
    icon: Activity, 
    description: "Time-series trend for a single field." 
  },
  { 
    type: "status_bubble", 
    label: "Status Bubble", 
    icon: MousePointer2, 
    description: "Visual indicator for binary (on/off) states." 
  },
  { 
    type: "bar_chart", 
    label: "Bar Chart", 
    icon: BarChart3, 
    description: "Compare field values or show aggregates." 
  },
  { 
    type: "map", 
    label: "Map Marker", 
    icon: MapIcon, 
    description: "Show device location on a map." 
  },
];

export function WidgetSidebar({ 
  workspaceId, 
  open, 
  onOpenChange, 
  onAddWidget,
  onUpdateWidget,
  restrictedDeviceId,
  editingWidget
}: WidgetSidebarProps) {
  const [step, setStep] = useState<"type" | "config">(editingWidget ? "config" : "type");
  const [selectedType, setSelectedType] = useState<string | null>(editingWidget?.type || null);
  
  const initialConfig = editingWidget ? {
    title: editingWidget.title,
    deviceId: editingWidget.device_id || "",
    fieldId: editingWidget.field_id || "",
    color: (editingWidget.config as any)?.color || "#3b82f6",
    unit: (editingWidget.config as any)?.unit || "",
    min: (editingWidget.config as any)?.min || 0,
    max: (editingWidget.config as any)?.max || 100,
  } : {
    title: "",
    deviceId: restrictedDeviceId || "",
    fieldId: "",
    color: "#3b82f6",
    unit: "",
    min: 0,
    max: 100,
  };

  const [config, setConfig] = useState(initialConfig);

  // Update state when editingWidget changes
  React.useEffect(() => {
    if (editingWidget) {
      setStep("config");
      setSelectedType(editingWidget.type);
      setConfig({
        title: editingWidget.title,
        deviceId: editingWidget.device_id || "",
        fieldId: editingWidget.field_id || "",
        color: (editingWidget.config as any)?.color || "#3b82f6",
        unit: (editingWidget.config as any)?.unit || "",
        min: (editingWidget.config as any)?.min || 0,
        max: (editingWidget.config as any)?.max || 100,
      });
    } else if (open) {
      handleReset();
    }
  }, [editingWidget, open]);

  const { data: devices } = useDevices(workspaceId);
  const { data: selectedDevice } = useDevice(config.deviceId);
  const deviceFields = selectedDevice?.fields || [];

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setStep("config");
    // Set default title based on type
    const typeLabel = WIDGET_TYPES.find(t => t.type === type)?.label || "";
    setConfig(prev => ({ 
      ...prev, 
      title: `New ${typeLabel}`,
      deviceId: restrictedDeviceId || prev.deviceId 
    }));
  };

  const handleReset = () => {
    setStep("type");
    setSelectedType(null);
    setConfig({
      title: "",
      deviceId: restrictedDeviceId || "",
      fieldId: "",
      color: "#3b82f6",
      unit: "",
      min: 0,
      max: 100,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !config.deviceId || !config.fieldId) return;

    if (editingWidget && onUpdateWidget) {
      onUpdateWidget(editingWidget.id, {
        title: config.title,
        device_id: config.deviceId,
        field_id: config.fieldId,
        config: {
          ...((editingWidget.config as any) || {}),
          color: config.color,
          unit: config.unit,
          min: isNaN(config.min) ? 0 : config.min,
          max: isNaN(config.max) ? 100 : config.max,
        },
      });
    } else {
      onAddWidget({
        type: selectedType,
        title: config.title,
        device_id: config.deviceId,
        field_id: config.fieldId,
        config: {
          color: config.color,
          unit: config.unit,
          min: isNaN(config.min) ? 0 : config.min,
          max: isNaN(config.max) ? 100 : config.max,
        },
        x: 0, y: 0, w: 3, h: 4, // More compact default size
      });
    }

    onOpenChange(false);
    handleReset();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) handleReset();
    }}>
      <SheetContent className="sm:max-w-[400px] flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b shrink-0">
          <SheetTitle>
            {editingWidget 
              ? `Edit ${config.title}` 
              : step === "type" 
                ? "Select Widget Type" 
                : `Configure ${WIDGET_TYPES.find(t => t.type === selectedType)?.label}`}
          </SheetTitle>
          <SheetDescription>
            {step === "type" 
              ? "Choose the visualization type for your data." 
              : "Link this widget to a device field and customize its appearance."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "type" ? (
            <div className="grid gap-4">
              {WIDGET_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleSelectType(item.type)}
                  className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted hover:border-primary/50 transition-all text-left group"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm leading-none mb-1">{item.label}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <form id="widget-config-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Widget Title</Label>
                  <Input 
                    value={config.title} 
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Living Room Temperature"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Source Device</Label>
                  <Select 
                    value={config.deviceId} 
                    onValueChange={(v) => setConfig(prev => ({ ...prev, deviceId: v || "", fieldId: "" }))}
                    disabled={!!restrictedDeviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices?.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Device Field</Label>
                  <Select 
                    value={config.fieldId} 
                    onValueChange={(v) => {
                      const field = (deviceFields as DeviceField[]).find(f => f.id === (v || ""));
                      setConfig(prev => ({ 
                        ...prev, 
                        fieldId: v || "",
                        unit: field?.unit || prev.unit,
                        color: field?.color || prev.color
                      }));
                    }}
                    disabled={!config.deviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={config.deviceId ? "Select field" : "Choose device first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(deviceFields as DeviceField[]).map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.alias} ({field.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={config.color} 
                        onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 p-1 shrink-0 bg-transparent border-none"
                      />
                      <Input 
                        value={config.color} 
                        onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#000000"
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Overwrite</Label>
                    <Input 
                      value={config.unit} 
                      onChange={(e) => setConfig(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g. %, °C, lux"
                    />
                  </div>
                </div>

                {selectedType === "gauge" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>Min Value</Label>
                      <Input 
                        type="number" 
                        value={isNaN(config.min) ? "" : config.min} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => ({ ...prev, min: val === "" ? NaN : parseFloat(val) }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Value</Label>
                      <Input 
                        type="number" 
                        value={isNaN(config.max) ? "" : config.max} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => ({ ...prev, max: val === "" ? NaN : parseFloat(val) }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t bg-muted/20 shrink-0 flex gap-3">
          {step === "config" && (
            <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>
              Back
            </Button>
          )}
          <Button 
            className="flex-1" 
            disabled={step === "type" || !config.deviceId || !config.fieldId}
            form="widget-config-form"
            type="submit"
          >
            {editingWidget ? "Save Changes" : "Add Widget"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
