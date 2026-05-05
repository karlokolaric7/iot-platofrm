"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOCK_MEMBERS } from "@/lib/mock-data";
import type { WorkspaceMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Shield, Eye, Wrench, Crown, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_CONFIG: Record<WorkspaceMember["role"], { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  owner:  { label: "Owner",  icon: Crown,   className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  admin:  { label: "Admin",  icon: Shield,  className: "bg-primary/10 text-primary border-primary/20" },
  member: { label: "Member", icon: Wrench,  className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  viewer: { label: "Viewer", icon: Eye,     className: "bg-muted text-muted-foreground border-border" },
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

export default function MembersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSending(true);
    
    try {
      const response = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }
      
      toast.success(`Invite dispatched successfully to ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workspace members and their access roles.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="pt-2">
            <DialogTitle className="text-xl">Invite to Workspace</DialogTitle>
            <DialogDescription>
              We'll send an invite link directly to their inbox. Permissions can be assigned after they join.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-semibold">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full"
                  autoFocus
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invite Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
          const Icon = cfg.icon;
          const count = MOCK_MEMBERS.filter(m => m.role === role).length;
          return (
            <div key={role} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cfg.className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_MEMBERS.map((member, idx) => {
              const cfg = ROLE_CONFIG[member.role];
              const RoleIcon = cfg.icon;
              return (
                <TableRow key={member.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {getInitials(member.name)}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                      <RoleIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-transparent text-sm hover:bg-muted hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
