"use client";

import { useState, useEffect } from "react";
import { useWorkspace, useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/use-iot-data";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Save, Trash2, Globe, Lock, Shield, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { t, language } = useLanguage();
  
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const updateMutation = useUpdateWorkspace();
  const deleteMutation = useDeleteWorkspace();

  const [wsName, setWsName] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [retention, setRetention] = useState("30");

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name);
      setWsSlug(workspace.slug);
      const settings = workspace.settings as Record<string, unknown>;
      setIsPublic((settings?.is_public as boolean) || false);
      setRetention(settings?.retention_days?.toString() || "30");
    }
  }, [workspace]);

  const handleSave = async () => {
    if (!workspace) return;
    
    try {
      await updateMutation.mutateAsync({
        id: workspace.id,
        name: wsName.trim(),
        slug: wsSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        settings: {
          ...(workspace.settings as Record<string, unknown> || {}),
          is_public: isPublic,
          retention_days: parseInt(retention),
        }
      });
      toast.success(t("settings.updateSuccess"));
      // If slug changed, we need to redirect to the new URL
      if (wsSlug !== workspace.slug) {
        router.push(`/${wsSlug}/settings`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || t("settings.failedUpdate"));
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;
    if (!confirm(t("settings.confirmDelete"))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(workspace.id);
      toast.success(t("settings.deleteSuccess"));
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || t("settings.failedDelete"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3 animate-pulse">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
          <p className="text-muted-foreground font-medium">{t("settings.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.desc")}
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t("settings.generalTitle")}
            </CardTitle>
            <CardDescription>
              {t("settings.generalDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.workspaceNameLabel")}</Label>
              <Input 
                id="name" 
                value={wsName} 
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Acme Industrial" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t("settings.urlSlugLabel")}</Label>
              <Input 
                id="slug" 
                value={wsSlug} 
                onChange={(e) => setWsSlug(e.target.value)}
                placeholder="e.g. acme-industrial" 
              />
              <p className="text-[10px] text-muted-foreground italic">
                {t("settings.urlSlugDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.internalIdLabel")}</Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono border truncate">
                  {workspace?.id}
                </code>
                <Button variant="outline" size="sm" onClick={() => {
                  if (workspace?.id) {
                    navigator.clipboard.writeText(workspace.id);
                    toast.success(t("settings.idCopied"));
                  }
                }}>
                  {t("settings.copyBtn")}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 py-3">
            <Button onClick={handleSave} size="sm" className="ml-auto gap-2" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              {t("settings.saveChangesBtn")}
            </Button>
          </CardFooter>
        </Card>

        {/* Security & Access */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {t("settings.securityTitle")}
            </CardTitle>
            <CardDescription>
              {t("settings.securityDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{t("settings.publicWorkspaceLabel")}</Label>
                  {isPublic ? <Globe className="h-3.5 w-3.5 text-blue-500" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("settings.publicWorkspaceDesc")}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.tfaLabel")}</Label>
              <p className="text-xs text-muted-foreground mb-3 font-normal">
                {t("settings.tfaDesc")}
              </p>
              <Button variant="outline" size="sm" disabled>
                {t("settings.tfaBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("settings.retentionTitle")}
            </CardTitle>
            <CardDescription>
              {t("settings.retentionDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.historyPeriodLabel")}</Label>
              <Select value={retention} onValueChange={(v) => setRetention(v || "30")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectPeriodPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t("settings.retentionOptions.d7")}</SelectItem>
                  <SelectItem value="30">{t("settings.retentionOptions.d30")}</SelectItem>
                  <SelectItem value="365">{t("settings.retentionOptions.y1")}</SelectItem>
                  <SelectItem value="0" disabled>{t("settings.retentionOptions.infinite")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground italic font-normal">
                {t("settings.retentionDescHelp")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-sm overflow-hidden">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t("settings.dangerZoneTitle")}
            </CardTitle>
            <CardDescription>
              {t("settings.dangerZoneDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t("settings.deleteWorkspaceLabel")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.deleteWorkspaceDesc")}
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t("settings.deleteWorkspaceBtn") : t("settings.deleteWorkspaceBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
