"use client";

import { useMemo, useState } from "react";
import { Search, Eye, AlertCircle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuditLogs } from "../hooks/use-organizations";
import { AuditLogDTO } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function formatAction(action: string) {
  const mapping: Record<string, string> = {
    ORGANIZATION_CREATED: "Organization Created",
    INVITATION_SENT: "Invitation Sent",
    ORGANIZATION_MEMBER_ROLE_UPDATED: "Role Changed",
    ORGANIZATION_MEMBER_REMOVED: "Member Removed",
    ORGANIZATION_OWNERSHIP_TRANSFERRED: "Ownership Transferred",
    ORGANIZATION_UPDATED: "Organization Updated",
  };
  return mapping[action] || "Unknown Activity";
}

function generateDescription(log: AuditLogDTO): string {
  const actorName = log.actor?.name || "System";
  
  switch (log.action) {
    case "ORGANIZATION_CREATED":
      return `${actorName} created the organization`;
    case "INVITATION_SENT":
      return `${actorName} invited ${log.metadata?.email || "a user"}`;
    case "ORGANIZATION_MEMBER_ROLE_UPDATED":
      return `${actorName} changed a role`;
    case "ORGANIZATION_MEMBER_REMOVED":
      return `${actorName} removed a member`;
    case "ORGANIZATION_OWNERSHIP_TRANSFERRED":
      return `Ownership transferred from ${actorName}`;
    case "ORGANIZATION_UPDATED":
      return `${actorName} updated organization settings`;
    default:
      return `${actorName} performed an action`;
  }
}

export function SettingsActivityView() {
  const { hasRole, hasPermission } = useWorkspace();
  const { data: auditLogs, isLoading, isError } = useAuditLogs();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);

  const canView = hasPermission("audit.read") || hasRole("owner") || hasRole("admin");

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    
    let logs = auditLogs;
    const now = Date.now();

    // Date filtering
    if (dateFilter !== "all") {
      logs = logs.filter((log) => {
        const logDate = new Date(log.createdAt).getTime();
        if (dateFilter === "today") {
          return logDate >= now - 24 * 60 * 60 * 1000;
        } else if (dateFilter === "7days") {
          return logDate >= now - 7 * 24 * 60 * 60 * 1000;
        } else if (dateFilter === "30days") {
          return logDate >= now - 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    // Search filtering
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.actor?.name?.toLowerCase().includes(q) ||
          log.actor?.email?.toLowerCase().includes(q) ||
          formatAction(log.action).toLowerCase().includes(q)
      );
    }

    return logs;
  }, [auditLogs, search, dateFilter]);

  const columns = useMemo<ColumnDef<AuditLogDTO>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return <div className="text-muted-foreground">{date.toLocaleString()}</div>;
        },
      },
      {
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => {
          const actor = row.original.actor;
          return (
            <div>
              <div className="font-medium text-foreground">{actor?.name || "System"}</div>
              {actor?.email && <div className="text-xs text-muted-foreground">{actor.email}</div>}
            </div>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => {
          const rawAction = row.getValue("action") as string;
          const label = formatAction(rawAction);
          return (
            <Badge variant="neutral" className="font-normal">
              {label}
            </Badge>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => <div className="text-sm">{generateDescription(row.original)}</div>,
      },
      {
        id: "details",
        header: () => <div className="text-right">Details</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              title="View Metadata"
              onClick={() => setSelectedLog(row.original)}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg text-foreground">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to view the activity history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Activity History"
        description="Review organization-level actions and changes."
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by actor or action..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(["all", "today", "7days", "30days"] as const).map((f) => (
            <Button
              key={f}
              variant={dateFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter(f)}
            >
              {f === "all" ? "All Time" : f === "today" ? "Today" : f === "7days" ? "Last 7 Days" : "Last 30 Days"}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        density="comfortable"
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No activity has been recorded yet."
      />

      <Dialog open={!!selectedLog} onOpenChange={(val) => !val && setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Metadata</DialogTitle>
            <DialogDescription>
              Raw event data for {selectedLog ? formatAction(selectedLog.action) : "Activity"}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[400px]">
            <pre className="text-xs">
              {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > 0
                ? JSON.stringify(selectedLog.metadata, null, 2)
                : "No metadata available for this event."}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
