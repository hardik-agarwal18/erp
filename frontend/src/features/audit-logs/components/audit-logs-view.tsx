"use client";

import { useState } from "react";
import { Search, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuditLogs } from "../hooks/use-audit-logs";
import { PageLoader } from "@/components/states/page-loader";
import { ModuleError } from "@/components/states/module-error";
import { EmptyState } from "@/components/states/empty-state";

import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export function AuditLogsView() {
  const { data: logs, isLoading, isError, refetch } = useAuditLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = logs?.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return log.action.toLowerCase().includes(q) || 
           log.entityType.toLowerCase().includes(q) || 
           log.actorName.toLowerCase().includes(q) ||
           log.actorEmail.toLowerCase().includes(q);
  }) ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Audit Logs"
        description="Track all actions, modifications, and access across your workspace."
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              className="pl-9"
              placeholder="Search actions, entities, or users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : isError || !logs ? (
            <ModuleError title="Audit Logs Unavailable" message="Could not fetch the activity log." retry={() => refetch()} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState title="No logs found" description="No activity matches your search." />
          ) : (
            <div className="border rounded-md divide-y divide-slate-100 bg-card text-card-foreground dark:divide-slate-800">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 flex gap-4 items-start hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-slate-100 rounded-full text-slate-500 shrink-0 mt-0.5">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      <span className="capitalize text-slate-700">{log.action.replace(/_/g, ' ')}</span> on <span className="uppercase text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{log.entityType}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {log.actorName} ({log.actorEmail})
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        IP: {log.ipAddress}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">
                      ID: {log.entityId?.slice(0, 8) || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
