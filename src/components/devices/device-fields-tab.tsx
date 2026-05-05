"use client";

import { useState } from "react";
import type { DeviceField } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FieldType } from "@/lib/types";
import { useAddField, useUpdateField, useDeleteField, useLatestMeasurements } from "@/hooks/use-iot-data";

interface DeviceFieldsTabProps {
  deviceId: string;
  fields: DeviceField[];
}

const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  number:   "bg-blue-500/10 text-blue-500",
  string:   "bg-violet-500/10 text-violet-500",
  boolean:  "bg-amber-500/10 text-amber-500",
  location: "bg-green-500/10 text-green-500",
  json:     "bg-red-500/10 text-red-500",
};

const EMPTY_FIELD = {
  name: "",
  alias: "",
  type: "number",
  unit: "",
  color: "#3b82f6",
  show_on_dashboard: true,
};

export function DeviceFieldsTab({ deviceId, fields }: DeviceFieldsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceField | null>(null);
  const [form, setForm] = useState(EMPTY_FIELD);

  const addField = useAddField();
  const updateField = useUpdateField();
  const deleteField = useDeleteField();
  const { data: measurements } = useLatestMeasurements(deviceId);

  // Map measurements to fields for quick lookup
  const lastValues = new Map<string, any>();
  measurements?.forEach(m => {
    if (!lastValues.has(m.field_id)) {
      lastValues.set(m.field_id, m.value);
    }
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FIELD);
    setDialogOpen(true);
  }

  function openEdit(field: DeviceField) {
    setEditing(field);
    setForm({
      name: field.name,
      alias: field.alias,
      type: field.type,
      unit: field.unit ?? "",
      color: field.color ?? "#3b82f6",
      show_on_dashboard: field.show_on_dashboard,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.alias) return;

    try {
      if (editing) {
        await updateField.mutateAsync({
          id: editing.id,
          ...form,
        });
        toast.success("Field updated");
      } else {
        await addField.mutateAsync({
          device_id: deviceId,
          ...form,
        });
        toast.success("Field added");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save field");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteField.mutateAsync({ id, deviceId });
      toast.success("Field removed");
    } catch (err) {
      toast.error("Failed to delete field");
    }
  }

  async function toggleDashboard(field: DeviceField, value: boolean) {
    try {
      await updateField.mutateAsync({
        id: field.id,
        show_on_dashboard: value,
      });
    } catch (err) {
      toast.error("Failed to update visibility");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Define the data points this device reports. Each field maps to a column in the time-series database.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No fields defined yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add fields to start capturing data from this device.</p>
          <Button size="sm" variant="outline" onClick={openAdd} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Field Name</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Last Value</TableHead>
                <TableHead className="text-center">Show on Dashboard</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => (
                <TableRow key={field.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: field.color || "#3b82f6" }}
                      />
                      <code className="text-xs font-mono">{field.name}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{field.alias}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        FIELD_TYPE_COLORS[field.type as FieldType]
                      )}
                    >
                      {field.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {field.unit ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {lastValues.has(field.id)
                      ? `${lastValues.get(field.id)}${field.unit ? ` ${field.unit}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={field.show_on_dashboard}
                      onCheckedChange={(v) => toggleDashboard(field, v)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(field)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Field Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Field" : "Add Field"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Modify this field's configuration."
                : "Define a new data field for this device."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="f-name">
                  Field Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="f-name"
                  className="font-mono"
                  placeholder="e.g. temperature"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">lowercase, underscores</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-alias">
                  Alias / Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="f-alias"
                  placeholder="e.g. Temperature"
                  value={form.alias}
                  onChange={(e) => setForm((p) => ({ ...p, alias: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v as FieldType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-unit">Unit</Label>
                <Input
                  id="f-unit"
                  placeholder="e.g. °C, %, bar"
                  value={form.unit}
                  onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="f-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="h-9 w-14 rounded-md border border-input cursor-pointer"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className="font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="f-dashboard"
                checked={form.show_on_dashboard}
                onCheckedChange={(v) => setForm((p) => ({ ...p, show_on_dashboard: v }))}
              />
              <Label htmlFor="f-dashboard" className="cursor-pointer">
                Show on device overview dashboard
              </Label>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.name || !form.alias}>
                {editing ? "Save Changes" : "Add Field"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
