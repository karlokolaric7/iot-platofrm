"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "@/hooks/use-iot-data";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ 
  open, 
  onOpenChange 
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const createWorkspace = useCreateWorkspace();

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    const slug = slugify(name);
    
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: name.trim(),
        slug,
      });
      
      toast.success("Workspace created successfully!");
      onOpenChange(false);
      setName("");
      
      // Redirect to the new workspace's dashboard
      router.push(`/${workspace.slug}/dashboards`);
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      toast.error(error.message || "Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Workspace</DialogTitle>
            <DialogDescription>
              Workspaces are isolated environments for your devices, dashboards, and members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Workspace Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. My Smart Home"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="col-span-3 h-11"
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">
                URL will be: /<span className="font-mono text-primary">{slugify(name) || "slug"}</span>/dashboards
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createWorkspace.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkspace.isPending || !name.trim()}
              className="gap-2 min-w-[120px]"
            >
              {createWorkspace.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Workspace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
