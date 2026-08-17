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
import type { WorkspaceMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { useWorkspaceMembers, useUpdateWorkspaceMemberRole, useRemoveWorkspaceMember } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/language-context";

const ROLE_CONFIG: Record<WorkspaceMember["role"], { labelKey: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  owner:  { labelKey: "members.roles.owner",  icon: Crown,   className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  admin:  { labelKey: "members.roles.admin",  icon: Shield,  className: "bg-primary/10 text-primary border-primary/20" },
  member: { labelKey: "members.roles.member", icon: Wrench,  className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  viewer: { labelKey: "members.roles.viewer", icon: Eye,     className: "bg-muted text-muted-foreground border-border" },
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

export default function MembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { t, language } = useLanguage();

  const { data: members = [], isLoading } = useWorkspaceMembers(workspaceId);
  const updateRoleMutation = useUpdateWorkspaceMemberRole();
  const removeMemberMutation = useRemoveWorkspaceMember();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error(t("members.invalidEmail"));
      return;
    }
    
    setIsSending(true);
    
    try {
      const response = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, workspaceId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }
      
      toast.success(`${t("members.inviteSuccess")} ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await updateRoleMutation.mutateAsync({ memberId, role });
      toast.success(t("members.roleUpdateSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("members.failedRoleUpdate"));
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(t("members.confirmRemove").replace("{name}", name))) return;

    try {
      await removeMemberMutation.mutateAsync({ memberId, workspaceId });
      toast.success(`${name} ${t("members.removeSuccess")}`);
    } catch (error: any) {
      toast.error(error.message || t("members.failedRemove"));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-medium animate-pulse">{t("members.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("members.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("members.desc")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("members.inviteMember")}
        </Button>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="pt-2">
            <DialogTitle className="text-xl">{t("members.inviteToWorkspaceTitle")}</DialogTitle>
            <DialogDescription>
              {t("members.inviteToWorkspaceDesc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-semibold">{t("members.emailLabel")}</Label>
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
                {t("members.cancel")}
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  t("members.sending")
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("members.sendInviteLink")}
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
          const count = members.filter(m => m.role === role).length;
          
          // Singular or plural label lookup
          const roleLabel = t(cfg.labelKey);
          const pluralLabel = role === "owner" ? t("members.rolesPlural.owner") :
                              role === "admin" ? t("members.rolesPlural.admin") :
                              role === "member" ? t("members.rolesPlural.member") :
                              t("members.rolesPlural.viewer");

          return (
            <div key={role} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cfg.className}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{count === 1 ? roleLabel : pluralLabel}</p>
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
              <TableHead>{t("members.memberHead")}</TableHead>
              <TableHead>{t("members.emailHead")}</TableHead>
              <TableHead>{t("members.roleHead")}</TableHead>
              <TableHead>{t("members.joinedHead")}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, idx) => {
              const cfg = ROLE_CONFIG[member.role as WorkspaceMember["role"]] || ROLE_CONFIG.viewer;
              const RoleIcon = cfg.icon;
              const profile = member.profiles as any;
              const name = profile?.full_name || "Unknown User";
              const email = profile?.email || "No email";
              
              return (
                <TableRow key={member.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {getInitials(name)}
                      </div>
                      <span className="font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                      <RoleIcon className="h-3 w-3" />
                      {t(cfg.labelKey)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>
                      {new Date(member.joined_at).toLocaleDateString(language === "hr" ? "hr-HR" : "en-US")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-transparent text-sm hover:bg-muted hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.role === "admin" ? "member" : "admin")}>
                            {t("members.promoteTo")} {member.role === "admin" ? t("members.roles.member") : t("members.roles.admin")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.role === "viewer" ? "member" : "viewer")}>
                            {member.role === "viewer" ? t("members.makeMember") : t("members.makeViewer")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleRemoveMember(member.id, name)}
                          >
                            {t("members.removeFromWorkspace")}
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
