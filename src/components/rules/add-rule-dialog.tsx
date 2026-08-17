"use client";

import { useState, useEffect } from "react";
import { useDevices, useCreateRule, useUpdateRule } from "@/hooks/use-iot-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/lib/supabase/database.types";
import { useLanguage } from "@/context/language-context";

type Rule = Database['public']['Tables']['rules']['Row'];

interface RuleDialogProps {
  workspaceId: string;
  rule?: Rule;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

export function RuleDialog({ workspaceId, rule, open: controlledOpen, onOpenChange, trigger }: RuleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const { t, language } = useLanguage();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [operator, setOperator] = useState("gt");
  const [value, setValue] = useState("");
  const [actionType, setActionType] = useState("in_app");
  const [actionTarget, setActionTarget] = useState("");

  const { data: devices = [] } = useDevices(workspaceId);
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule();

  const translatedOperators = [
    { label: language === "hr" ? "Veće od (>)" : "Greater than (>)", value: "gt" },
    { label: language === "hr" ? "Manje od (<)" : "Less than (<)", value: "lt" },
    { label: language === "hr" ? "Jednako (=)" : "Equal to (=)", value: "eq" },
    { label: language === "hr" ? "Veće ili jednako (≥)" : "Greater or equal (≥)", value: "gte" },
    { label: language === "hr" ? "Manje ili jednako (≤)" : "Less or equal (≤)", value: "lte" },
    { label: language === "hr" ? "Nije jednako (≠)" : "Not equal (≠)", value: "neq" },
  ];

  const translatedActionTypes = [
    { label: language === "hr" ? "Pošalji e-mail" : "Send Email", value: "email" },
    { label: language === "hr" ? "Pošalji SMS" : "Send SMS", value: "sms" },
    { label: language === "hr" ? "Obavijest unutar aplikacije" : "In-App Notification", value: "in_app" },
    { label: language === "hr" ? "Poziv web-kuke (Webhook)" : "Webhook Call", value: "webhook" },
  ];

  // Initialize form when rule changes or dialog opens
  useEffect(() => {
    if (open && rule) {
      setName(rule.name);
      setDescription(rule.description || "");
      
      const condition = (rule.condition as any)?.conditions?.[0];
      if (condition) {
        setSelectedFieldId(condition.fieldId);
        setOperator(condition.operator);
        setValue(String(condition.value));
      }

      const action = (rule.actions as any)?.actions?.[0];
      if (action) {
        setActionType(action.type);
        setActionTarget(action.target || "");
      }
    } else if (open && !rule) {
      resetForm();
    }
  }, [open, rule]);

  // Special effect to set selectedDeviceId when devices and selectedFieldId are loaded
  useEffect(() => {
    if (selectedFieldId && devices.length > 0 && !selectedDeviceId) {
      for (const device of devices) {
        const hasField = (device as any).fields?.some((f: any) => f.id === selectedFieldId);
        if (hasField) {
          setSelectedDeviceId(device.id);
          break;
        }
      }
    }
  }, [selectedFieldId, devices, selectedDeviceId]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const fields = (selectedDevice as any)?.fields || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !selectedDeviceId || !selectedFieldId || !value) {
      toast.error(t("rules.validationFillAll"));
      return;
    }

    const field = fields.find((f: any) => f.id === selectedFieldId);

    const ruleData = {
      workspace_id: workspaceId,
      name,
      description,
      is_active: rule ? rule.is_active : true,
      condition: {
        conditions: [
          {
            fieldId: selectedFieldId,
            fieldName: field?.alias || field?.name || "Unknown Field",
            operator,
            value: parseFloat(value) || value,
          },
        ],
      },
      actions: {
        actions: [
          {
            type: actionType,
            target: actionTarget || (actionType === "in_app" ? "system" : ""),
            message: `Alert triggered for ${name}`,
          },
        ],
      },
    };

    try {
      if (rule) {
        await updateMutation.mutateAsync({ id: rule.id, ...ruleData });
        toast.success(t("rules.successUpdate"));
      } else {
        await createMutation.mutateAsync(ruleData);
        toast.success(t("rules.successCreate"));
      }
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || (rule ? t("rules.failedUpdate") : t("rules.failedCreate")));
    }
  }

  function resetForm() {
    setName("");
    setDescription("");
    setSelectedDeviceId("");
    setSelectedFieldId("");
    setOperator("gt");
    setValue("");
    setActionType("in_app");
    setActionTarget("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      {!trigger && !rule && (
        <DialogTrigger render={<Button className="gap-2" />}>
          <Plus className="h-4 w-4" />
          {t("rules.newRule")}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{rule ? t("rules.editRuleTitle") : t("rules.createRuleTitle")}</DialogTitle>
            <DialogDescription>
              {rule ? t("rules.updateRuleDesc") : t("rules.createRuleDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("rules.nameLabel")}</Label>
              <Input
                id="name"
                placeholder={t("rules.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                {t("rules.triggerConditionTitle")}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.deviceLabel")}</Label>
                  <Select value={selectedDeviceId} onValueChange={(val) => setSelectedDeviceId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("rules.selectDevicePlaceholder")}>
                        {selectedDevice ? selectedDevice.name : t("rules.selectDevicePlaceholder")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.fieldLabel")}</Label>
                  <Select 
                    value={selectedFieldId} 
                    onValueChange={(val) => setSelectedFieldId(val || "")}
                    disabled={!selectedDeviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("rules.selectFieldPlaceholder")}>
                        {selectedFieldId && fields.length > 0 
                          ? fields.find((f: any) => f.id === selectedFieldId)?.alias || fields.find((f: any) => f.id === selectedFieldId)?.name || t("rules.selectFieldPlaceholder")
                          : t("rules.selectFieldPlaceholder")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field: any) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.alias || field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.operatorLabel")}</Label>
                  <Select value={operator} onValueChange={(val) => setOperator(val || "")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {translatedOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.valueLabel")}</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder={t("rules.valuePlaceholder")}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                <AlertCircle className="h-4 w-4" />
                {t("rules.actionTitle")}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.actionTypeLabel")}</Label>
                  <Select value={actionType} onValueChange={(val) => setActionType(val || "")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {translatedActionTypes.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">{t("rules.targetLabel")}</Label>
                  <Input
                    placeholder={
                      actionType === "email"
                        ? "email@example.com"
                        : actionType === "sms"
                        ? "+1234567890"
                        : actionType === "webhook"
                        ? "https://discord.com/api/webhooks/..."
                        : t("rules.targetPlaceholderDefault")
                    }
                    value={actionTarget}
                    onChange={(e) => setActionTarget(e.target.value)}
                    disabled={actionType === "in_app"}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("rules.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {rule ? t("rules.saveChanges") : t("rules.createRule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
