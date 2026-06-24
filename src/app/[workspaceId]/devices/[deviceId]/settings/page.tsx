"use client";

import { use, useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { useDevice, useUpdateDevice, useDeleteDevice } from "@/hooks/use-iot-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DeviceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; deviceId: string }>;
}) {
  const { workspaceId, deviceId } = use(params);
  const router = useRouter();
  
  const { data: device, isLoading } = useDevice(deviceId);
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const [form, setForm] = useState({
    name: "",
    description: "",
    tags: "",
    connectivity: "lorawan",
    devEui: "",
    serialNumber: "",
    latitude: "",
    longitude: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setForm({
        name: device.name,
        description: device.description || "",
        tags: (device.tags || []).join(", "),
        connectivity: device.connectivity || "lorawan",
        devEui: device.dev_eui || "",
        serialNumber: device.serial_number || "",
        latitude: device.latitude?.toString() || "",
        longitude: device.longitude?.toString() || "",
      });
    }
  }, [device]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  if (!device) notFound();

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDevice.mutateAsync({
        id: deviceId,
        name: form.name,
        description: form.description,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        connectivity: form.connectivity,
        dev_eui: form.devEui,
        serial_number: form.serialNumber,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      toast.success("Device settings updated");
      router.push(`/${workspaceId}/devices/${deviceId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update device");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this device? This action cannot be undone.")) {
      try {
        await deleteDevice.mutateAsync({ 
          id: deviceId, 
          devEui: device.dev_eui, 
          workspaceId 
        });
        toast.success("Device deleted");
        router.push(`/${workspaceId}/devices`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete device");
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link
          href={`/${workspaceId}/devices/${deviceId}`}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border bg-background hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Device Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure metadata and connectivity for <span className="font-medium text-foreground">{device.name}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Basic identification and metadata for your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the purpose of this device"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="e.g. zone-1, production, battery-powered"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connectivity & Geolocation</CardTitle>
            <CardDescription>
              Technical parameters, protocols, and physical location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Connectivity Protocol</Label>
                <Select
                  value={form.connectivity}
                  onValueChange={(v) => handleChange("connectivity", v || "")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lorawan">LoRaWAN</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="http_webhook">HTTP Webhook</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serial">Serial Number</Label>
                <Input
                  id="serial"
                  value={form.serialNumber}
                  onChange={(e) => handleChange("serialNumber", e.target.value)}
                  placeholder="e.g. SN-000000"
                />
              </div>
            </div>

            {form.connectivity === "lorawan" && (
              <div className="grid gap-2 pt-2">
                <Label htmlFor="deveui">Device EUI</Label>
                <Input
                  id="deveui"
                  value={form.devEui}
                  onChange={(e) => handleChange("devEui", e.target.value)}
                  placeholder="16-character hex string"
                  className="font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => handleChange("latitude", e.target.value)}
                  placeholder="e.g. 45.8150"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                  placeholder="e.g. 15.9819"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/${workspaceId}/devices/${deviceId}`}>
            <Button type="button" variant="outline">Discard Changes</Button>
          </Link>
          <Button type="submit" className="gap-2 min-w-[140px]" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <Card className="border-destructive/30 bg-destructive/5 mt-12">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Once you delete a device, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">Delete this device</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently delete the device, its measurements, and all associated configuration.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="shrink-0">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Device
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
