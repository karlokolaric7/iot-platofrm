"use client";

import { useState } from "react";
import { useDeviceDownlinks, useScheduleDownlink, useUpdateDownlinkStatus } from "@/hooks/use-iot-data";
import { DeviceDownlink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowDown, 
  HelpCircle, 
  Eye, 
  EyeOff,
  Radio,
  Play
} from "lucide-react";

interface DeviceDownlinksTabProps {
  deviceId: string;
}

export function DeviceDownlinksTab({ deviceId }: DeviceDownlinksTabProps) {
  const { data: downlinks = [], isLoading } = useDeviceDownlinks(deviceId);
  const scheduleDownlink = useScheduleDownlink();
  const updateStatus = useUpdateDownlinkStatus();

  // Form States
  const [fPort, setFPort] = useState<number>(10);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [payloadType, setPayloadType] = useState<"hex" | "base64" | "text">("hex");
  const [payload, setPayload] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // UI States
  const [revealedPayloads, setRevealedPayloads] = useState<Record<string, boolean>>({});

  function toggleReveal(id: string) {
    setRevealedPayloads(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Payload Validation
  function validatePayload(): boolean {
    const trimmed = payload.trim();
    if (!trimmed) {
      toast.error("Payload cannot be empty");
      return false;
    }

    if (payloadType === "hex") {
      const cleanHex = trimmed.replace(/\s+/g, "");
      if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        toast.error("Hex payload can only contain numbers (0-9) and letters (A-F)");
        return false;
      }
      if (cleanHex.length % 2 !== 0) {
        toast.error("Hex payload must have an even number of characters (complete bytes)");
        return false;
      }
    } else if (payloadType === "base64") {
      try {
        atob(trimmed);
      } catch {
        toast.error("Invalid Base64 string");
        return false;
      }
    }

    if (fPort < 1 || fPort > 223) {
      toast.error("FPort must be between 1 and 223");
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePayload()) return;

    setIsSubmitting(true);
    try {
      await scheduleDownlink.mutateAsync({
        device_id: deviceId,
        f_port: fPort,
        payload_raw: payload.trim(),
        payload_type: payloadType,
        confirmed
      });
      setPayload("");
      toast.success("Downlink queued successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to queue downlink");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await updateStatus.mutateAsync({
        id,
        deviceId,
        status: "cancelled"
      });
      toast.success("Downlink cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel downlink");
    }
  }

  async function handleSimulate(id: string) {
    try {
      await updateStatus.mutateAsync({
        id,
        deviceId,
        status: "sent",
        sent_at: new Date().toISOString()
      });
      toast.success("Simulation successful: Downlink sent to device");
    } catch (err: any) {
      toast.error(err.message || "Failed to simulate transmission");
    }
  }

  function formatTimestamp(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5 items-start font-sans">
      
      {/* Left Column: Schedule Downlink Form */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-500" />
            Schedule Downlink
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Send a payload command back to the device.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FPort & Confirmed */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fport" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                LoRaWAN FPort
              </Label>
              <input
                id="fport"
                type="number"
                min={1}
                max={223}
                value={fPort}
                onChange={(e) => setFPort(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between h-[38px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3">
                <Label htmlFor="confirmed-mode" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  Confirmed
                </Label>
                <Switch
                  id="confirmed-mode"
                  checked={confirmed}
                  onCheckedChange={setConfirmed}
                />
              </div>
            </div>
          </div>

          {/* Payload Format Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Payload Format
            </Label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(["hex", "base64", "text"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => {
                    setPayloadType(format);
                    setPayload("");
                  }}
                  className={cn(
                    "py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider",
                    payloadType === format
                      ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                  )}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Payload Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="payload" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Payload Value
              </Label>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {payloadType === "hex" && "e.g. 01 2C"}
                {payloadType === "base64" && "e.g. ASw="}
                {payloadType === "text" && "Raw Text / JSON"}
              </span>
            </div>
            <textarea
              id="payload"
              rows={3}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder={
                payloadType === "hex"
                  ? "Enter hex bytes..."
                  : payloadType === "base64"
                  ? "Enter Base64 encoded payload..."
                  : "Enter text command..."
              }
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Queue Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 rounded-lg shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? "Queueing..." : "Queue Downlink"}
          </Button>
        </form>
      </div>

      {/* Right Column: Downlink Queue Table */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="h-4 w-4 text-indigo-500" />
              Downlink Queue
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Active and historical downlink commands.
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800/40">
            {downlinks.length} total
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-xs font-semibold text-slate-455">
            Loading downlink queue...
          </div>
        ) : downlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl bg-slate-50/40 dark:bg-slate-900/40">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <ArrowDown className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Queue is empty</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              No downlinks have been scheduled yet. Use the scheduler form to queue your first command.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-550 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Scheduled</th>
                  <th className="py-3 px-3">FPort</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Payload</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {downlinks.map((dl: any) => {
                  const isRevealed = !!revealedPayloads[dl.id];
                  return (
                    <tr key={dl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Scheduled At */}
                      <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatTimestamp(dl.created_at)}
                      </td>

                      {/* FPort */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {dl.f_port}
                      </td>

                      {/* Confirmed Type */}
                      <td className="py-3.5 px-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0",
                            dl.confirmed 
                              ? "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40"
                              : "border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}
                        >
                          {dl.confirmed ? "CONFIRMED" : "UNCONFIRMED"}
                        </Badge>
                      </td>

                      {/* Payload */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                            {isRevealed ? dl.payload_raw : "••••••••"}
                          </span>
                          <button
                            onClick={() => toggleReveal(dl.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title={isRevealed ? "Hide payload" : "Show payload"}
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {dl.payload_type}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex justify-center">
                          {dl.status === "pending" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-[10px] font-bold gap-1 shadow-2xs">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {dl.status === "sent" && (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[10px] font-bold gap-1 shadow-2xs">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent
                            </Badge>
                          )}
                          {dl.status === "cancelled" && (
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/60 text-[10px] font-bold gap-1 shadow-2xs">
                              <XCircle className="h-3 w-3" />
                              Cancelled
                            </Badge>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {dl.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSimulate(dl.id)}
                              className="h-7 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors border border-indigo-200/20 shadow-2xs"
                              title="Simulate device receiving this downlink"
                            >
                              <Play className="h-3 w-3 fill-indigo-700 dark:fill-indigo-400" />
                              Simulate
                            </button>
                            <button
                              onClick={() => handleCancel(dl.id)}
                              className="h-7 w-7 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-md flex items-center justify-center transition-colors border border-red-200/20 shadow-2xs"
                              title="Cancel downlink"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : dl.sent_at ? (
                          <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                            Sent at {formatTimestamp(dl.sent_at)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
