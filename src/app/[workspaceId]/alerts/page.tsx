"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, AlertTriangle, CheckCircle2, Search, Filter, Trash2, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAlerts, useAcknowledgeAlert } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";

const SEVERITY_CONFIG: Record<string, { label: string, className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/10 text-red-500 border-red-200" },
  warning: { label: "Warning", className: "bg-amber-500/10 text-amber-500 border-amber-200" },
  info: { label: "Info", className: "bg-blue-500/10 text-blue-500 border-blue-200" },
};

export default function AlertsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  const [search, setSearch] = useState("");
  const { data: alerts = [], isLoading } = useAlerts(workspaceId);
  const acknowledgeMutation = useAcknowledgeAlert();

  const filteredAlerts = alerts.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.message.toLowerCase().includes(search.toLowerCase())
  );

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
      toast.success("Alert acknowledged");
    } catch (error: any) {
      toast.error(error.message || "Failed to acknowledge alert");
    }
  };

  const handleAcknowledgeAll = async () => {
    const unacknowledged = alerts.filter(a => !a.is_resolved);
    if (unacknowledged.length === 0) {
      toast.info("No unacknowledged alerts");
      return;
    }

    try {
      await Promise.all(unacknowledged.map(a => acknowledgeMutation.mutateAsync(a.id)));
      toast.success("All alerts acknowledged");
    } catch (error: any) {
      toast.error("Failed to acknowledge all alerts");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse text-lg font-medium">Loading alerts history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and acknowledge recent system alerts and notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
          <Button size="sm" className="gap-2" onClick={handleAcknowledgeAll} disabled={acknowledgeMutation.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Acknowledge All
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alert history..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[150px]">Severity</TableHead>
              <TableHead>Alert Title</TableHead>
              <TableHead className="hidden md:table-cell">Message</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  No alerts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className={alert.is_resolved ? "opacity-60 grayscale-[0.5]" : ""}>
                  <TableCell>
                    <Badge variant="outline" className={SEVERITY_CONFIG[alert.severity]?.className || SEVERITY_CONFIG.info.className}>
                      {SEVERITY_CONFIG[alert.severity]?.label || alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{alert.title}</span>
                      <span className="text-xs text-muted-foreground md:hidden line-clamp-1">{alert.message}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm max-w-xs truncate">
                    {alert.message}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!alert.is_resolved ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleAcknowledge(alert.id)}
                          title="Acknowledge"
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="h-8 w-8 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
