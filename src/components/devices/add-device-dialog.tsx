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
import { useLanguage } from "@/context/language-context";

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
  const { t } = useLanguage();

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
    latitude: "",
    longitude: "",
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
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      } as any);

      toast.success(t("devices.successAdd"), {
        description: t("devices.successAddDesc").replace("{name}", form.name),
      });
      onOpenChange(false);
      setForm({ name: "", deviceType: "generic", connectivity: "mqtt", serialNumber: "", devEui: "", appEui: "", appKey: "", description: "", tags: "", latitude: "", longitude: "" });
    } catch (error: any) {
      toast.error(error.message || t("devices.failedAdd"));
    }
  }

  const isLoading = createDevice.isPending;
  const showEui = form.connectivity === "lorawan";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("devices.addDeviceTitle")}</DialogTitle>
          <DialogDescription>
            {t("devices.addDeviceDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="device-name">{t("devices.deviceNameLabel")} <span className="text-destructive">*</span></Label>
            <Input
              id="device-name"
              placeholder={t("devices.deviceNamePlaceholder")}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("devices.deviceTypeLabel")} <span className="text-destructive">*</span></Label>
              <Select
                value={form.deviceType}
                onValueChange={(v) => handleChange("deviceType", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("devices.deviceTypeSelectPlaceholder")} />
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
              <Label>{t("devices.connectivityLabel")} <span className="text-destructive">*</span></Label>
              <Select
                value={form.connectivity}
                onValueChange={(v) => handleChange("connectivity", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("devices.connectivitySelectPlaceholder")} />
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
              <Label htmlFor="serial">{t("devices.serialLabel")}</Label>
              <Input
                id="serial"
                placeholder={t("devices.serialPlaceholder")}
                value={form.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
              />
            </div>
            {showEui && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deveui">{t("devices.devEuiLabel")}</Label>
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
                  <Label htmlFor="appeui">{t("devices.appEuiLabel")}</Label>
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
                  <Label htmlFor="appkey">{t("devices.appKeyLabel")}</Label>
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
                    {t("devices.appKeyDesc")}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t("devices.latLabel")}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g. 45.8150"
                value={form.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t("devices.lngLabel")}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g. 15.9819"
                value={form.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("devices.descriptionLabel")}</Label>
            <Input
              id="description"
              placeholder={t("devices.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("devices.tagsLabel")}</Label>
            <Input
              id="tags"
              placeholder={t("devices.tagsPlaceholder")}
              value={form.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("devices.tagsDesc")}
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("devices.cancelBtn")}
            </Button>
            <Button
              type="submit"
              disabled={!form.name || !form.deviceType || !form.connectivity || isLoading}
            >
              {isLoading ? t("devices.addingBtn") : t("devices.addDeviceBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
