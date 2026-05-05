"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";

import { useCreateDevice } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeviceDialog({ open, onOpenChange }: AddDeviceDialogProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const createDevice = useCreateDevice();

  const [form, setForm] = useState({
    name: "",
    deviceType: "generic",
    connectivity: "lorawan",
    serialNumber: "",
    devEui: "",
    appEui: "",
    appKey: "",
    description: "",
    tags: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.connectivity) return;
    
    try {
      await createDevice.mutateAsync({
        workspace_id: workspaceId,
        name: form.name,
        type: form.deviceType,
        connectivity: form.connectivity,
        serial_number: form.serialNumber || null,
        dev_eui: form.devEui || null,
        app_eui: form.appEui || null,
        app_key: form.appKey || null,
        description: form.description || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      } as any);

      toast.success("Device added successfully", {
        description: `"${form.name}" has been registered in your workspace.`,
      });
      onOpenChange(false);
      setForm({ name: "", deviceType: "generic", connectivity: "mqtt", serialNumber: "", devEui: "", appEui: "", appKey: "", description: "", tags: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to add device");
    }
  }

  const isLoading = createDevice.isPending;
  const showEui = form.connectivity === "lorawan";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Register a new IoT device in your workspace. You can configure fields and payload decoders after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="device-name">Device Name <span className="text-destructive">*</span></Label>
            <Input
              id="device-name"
              placeholder="e.g. Boiler Room Sensor #1"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Device Type <span className="text-destructive">*</span></Label>
              <Select
                value={form.deviceType}
                onValueChange={(v) => handleChange("deviceType", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LoRaWAN">LoRaWAN</SelectItem>
                  <SelectItem value="MQTT">MQTT</SelectItem>
                  <SelectItem value="HTTP">HTTP</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Connectivity <span className="text-destructive">*</span></Label>
              <Select
                value={form.connectivity}
                onValueChange={(v) => handleChange("connectivity", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lorawan">LoRaWAN</SelectItem>
                  <SelectItem value="mqtt">MQTT</SelectItem>
                  <SelectItem value="http_webhook">HTTP Webhook</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                placeholder="SN-00001"
                value={form.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
              />
            </div>
            {showEui && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deveui">Device EUI</Label>
                  <Input
                    id="deveui"
                    placeholder="A8404157A1EAD1CF"
                    className="font-mono"
                    value={form.devEui}
                    onChange={(e) => handleChange("devEui", e.target.value.toUpperCase())}
                    maxLength={16}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appeui">App EUI (Join EUI)</Label>
                  <Input
                    id="appeui"
                    placeholder="0000000000000000"
                    className="font-mono"
                    value={form.appEui}
                    onChange={(e) => handleChange("appEui", e.target.value.toUpperCase())}
                    maxLength={16}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="appkey">App Key (Network Key)</Label>
                  <Input
                    id="appkey"
                    placeholder="2B7E151628AED2A6ABF7158809CF4F3C"
                    className="font-mono"
                    type="password"
                    value={form.appKey}
                    onChange={(e) => handleChange("appKey", e.target.value.toUpperCase())}
                    maxLength={32}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This key will be sent to ChirpStack but not stored in our database for security.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional device description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="temperature, zone-a, critical (comma-separated)"
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.name || !form.deviceType || !form.connectivity || isLoading}
            >
              {isLoading ? "Adding..." : "Add Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
