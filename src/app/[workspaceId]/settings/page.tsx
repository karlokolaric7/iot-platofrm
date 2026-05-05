"use client";

import { useState, useEffect } from "react";
import { useWorkspace, useUpdateWorkspace } from "@/hooks/use-iot-data";
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

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const updateMutation = useUpdateWorkspace();

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
      toast.success("Workspace settings updated");
      // If slug changed, we need to redirect to the new URL
      if (wsSlug !== workspace.slug) {
        router.push(`/${wsSlug}/settings`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to update settings");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this workspace? All data will be permanently lost.")) {
      toast.error("Workspace deletion is currently disabled for safety.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3 animate-pulse">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
          <p className="text-muted-foreground font-medium">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace properties, security, and data retention.
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              General Information
            </CardTitle>
            <CardDescription>
              Basic information about this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input 
                id="name" 
                value={wsName} 
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Acme Industrial" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input 
                id="slug" 
                value={wsSlug} 
                onChange={(e) => setWsSlug(e.target.value)}
                placeholder="e.g. acme-industrial" 
              />
              <p className="text-[10px] text-muted-foreground italic">
                Changing the slug will change the URL of this workspace.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Internal ID (UUID)</Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono border truncate">
                  {workspace?.id}
                </code>
                <Button variant="outline" size="sm" onClick={() => {
                  if (workspace?.id) {
                    navigator.clipboard.writeText(workspace.id);
                    toast.success("ID copied to clipboard");
                  }
                }}>
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 py-3">
            <Button onClick={handleSave} size="sm" className="ml-auto gap-2" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Security & Access */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Security & Visibility
            </CardTitle>
            <CardDescription>
              Control who can see and access your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Public Workspace</Label>
                  {isPublic ? <Globe className="h-3.5 w-3.5 text-blue-500" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Allow anyone with the link to view dashboards.
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground mb-3 font-normal">
                Require all members to use 2FA for this workspace.
              </p>
              <Button variant="outline" size="sm" disabled>
                Configure Enforced 2FA (Pro)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Data Retention
            </CardTitle>
            <CardDescription>
              Configure how long telemetry data is stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>History Period</Label>
              <Select value={retention} onValueChange={(v) => setRetention(v || "30")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days (Free)</SelectItem>
                  <SelectItem value="30">30 Days (Standard)</SelectItem>
                  <SelectItem value="365">1 Year (Business)</SelectItem>
                  <SelectItem value="0" disabled>Indefinite (Enterprise)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground italic font-normal">
                Changing retention period may result in permanent deletion of older data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-sm overflow-hidden">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Delete Workspace</Label>
                <p className="text-xs text-muted-foreground">
                  Permanently remove this workspace and all associated devices, dashboards and data.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
