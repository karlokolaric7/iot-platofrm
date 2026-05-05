"use client";

import { useState, use, useEffect } from "react";
import { MOCK_DASHBOARDS } from "@/lib/mock-data";
import { useDashboards } from "@/hooks/use-iot-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, LayoutDashboard, Globe, Lock, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { Dashboard } from "@/lib/types";
import { useCreateDashboard, useDeleteDashboard } from "@/hooks/use-iot-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function DashboardsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" });
  const [hasMounted, setHasMounted] = useState(false);
  
  const { data: dashboards = [], isLoading } = useDashboards(workspaceId);
  const createDashboard = useCreateDashboard();
  const deleteDashboard = useDeleteDashboard();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const filteredDashboards = dashboards.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newDashboard.name) return;
    try {
      await createDashboard.mutateAsync({
        workspace_id: workspaceId,
        name: newDashboard.name,
        description: newDashboard.description,
        layout: [],
        settings: {}
      });
      setIsCreateOpen(false);
      setNewDashboard({ name: "", description: "" });
      toast.success("Dashboard created");
    } catch (err) {
      toast.error("Failed to create dashboard");
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDashboard.mutateAsync({ id, workspaceId });
      toast.success("Dashboard deleted");
    } catch (err) {
      toast.error("Failed to delete dashboard");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your data visualization dashboards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  New Dashboard
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Dashboard</DialogTitle>
                <DialogDescription>Create a new view to visualize your device data.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    placeholder="e.g. Factory Floor Overview" 
                    value={newDashboard.name}
                    onChange={(e) => setNewDashboard(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="Optional description" 
                    value={newDashboard.description}
                    onChange={(e) => setNewDashboard(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newDashboard.name}>Create Dashboard</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">Loading dashboards...</div>}

      {!isLoading && filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">
            {search ? "No matches found" : "No dashboards yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search ? "Try a different search term." : "Create your first dashboard to visualize device data."}
          </p>
          {!search && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDashboards.map((dashboard) => (
            <Card
              key={dashboard.id}
              className="group relative hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            >
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">
                        {dashboard.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 mt-0.5">
                        {dashboard.isPublic ? (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {dashboard.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 relative z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(dashboard.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription className="text-xs line-clamp-2 mb-4 h-8">
                  {dashboard.description || "Live data visualization dashboard for industrial sensors."}
                </CardDescription>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">
                    {(dashboard.widgets || []).length} widget
                    {(dashboard.widgets || []).length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Modified {hasMounted ? new Date(dashboard.updated_at).toLocaleDateString() : "..."}
                  </span>
                </div>
                <Link
                  href={`/${workspaceId}/dashboards/${dashboard.id}`}
                  className="absolute inset-0 z-0"
                />
              </CardContent>
            </Card>
          ))}

          {/* Create new card */}
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-colors py-12 gap-3 text-muted-foreground hover:text-primary text-center"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">New Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
}
