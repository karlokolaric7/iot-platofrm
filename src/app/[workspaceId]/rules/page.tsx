"use client";

import { useRules, useToggleRule, useDeleteRule } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  GitBranch,
  Mail,
  Webhook,
  Bell,
  MessageSquare,
  Trash2,
  Pencil,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RuleDialog } from "@/components/rules/add-rule-dialog";

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  webhook: Webhook,
  sms: MessageSquare,
  in_app: Bell,
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString();
}

export default function RulesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  const { data: rules = [], isLoading } = useRules(workspaceId);
  const toggleMutation = useToggleRule();
  const deleteMutation = useDeleteRule();

  async function handleToggleRule(id: string, is_active: boolean) {
    try {
      await toggleMutation.mutateAsync({ id, is_active });
      toast.success(is_active ? "Rule enabled" : "Rule disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle rule");
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id, workspaceId });
      toast.success("Rule deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rule");
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-medium animate-pulse">Loading rules engine...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rule Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create automated if-this-then-that rules for alerts and actions.
          </p>
        </div>
        <RuleDialog workspaceId={workspaceId} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 rounded-xl border bg-card px-5 py-3 shadow-sm">
        <div>
          <span className="text-2xl font-bold">{rules.length}</span>
          <span className="text-sm text-muted-foreground ml-1.5">Total Rules</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-2xl font-bold text-emerald-500">
            {rules.filter(r => r.is_active).length}
          </span>
          <span className="text-sm text-muted-foreground ml-1.5">Active</span>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <Zap className="h-8 w-8 opacity-20" />
            <p className="text-sm">No rules defined for this workspace.</p>
            <RuleDialog workspaceId={workspaceId} />
          </div>
        ) : (
          rules.map((rule) => {
            const conditions = (rule.condition as any)?.conditions || [];
            const actions = (rule.actions as any)?.actions || [];
            
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-xl border bg-card p-5 transition-all hover:border-primary/50 shadow-sm",
                  !rule.is_active && "opacity-60 grayscale-[0.3]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      rule.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{rule.name}</h3>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                      )}

                      {/* Conditions */}
                      {conditions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="text-xs text-muted-foreground font-medium">IF</span>
                          {conditions.map((cond: any, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs">
                              <span className="font-medium">{cond.fieldName}</span>
                              <span className="mx-1 text-muted-foreground text-[10px]">
                                {{ gt: ">", lt: "<", eq: "=", gte: "≥", lte: "≤", neq: "≠" }[cond.operator as "gt"] || cond.operator}
                              </span>
                              <span className="font-mono font-medium">{String(cond.value)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground font-medium">THEN</span>
                        {actions.map((action: any, i: number) => {
                          const ActionIcon = ACTION_ICONS[action.type] || Bell;
                          return (
                            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                              <ActionIcon className="h-3 w-3 text-primary" />
                              <span className="capitalize">{action.type}</span>
                              <span className="text-muted-foreground truncate max-w-[120px]">{action.target}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(v: boolean) => handleToggleRule(rule.id, v)}
                      disabled={toggleMutation.isPending}
                    />
                    <RuleDialog 
                      workspaceId={workspaceId} 
                      rule={rule} 
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
