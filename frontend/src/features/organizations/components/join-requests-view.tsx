"use client";

import { useMemo } from "react";
import { Check, X, Inbox } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useJoinRequests, useOrganizationMutations } from "../hooks/use-organizations";
import { JoinRequest } from "@/services/organization.service";

export function JoinRequestsView() {
  const { data: requests, isError, isLoading } = useJoinRequests();
  const { approveJoinRequest, rejectJoinRequest } = useOrganizationMutations();

  const columns = useMemo<ColumnDef<JoinRequest>[]>(
    () => [
      {
        accessorKey: "user.name",
        header: "User",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.user?.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.user?.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-xs truncate" title={row.original.message ?? ""}>
            {row.original.message || "-"}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Requested At",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => approveJoinRequest.mutate(request.id)}
                disabled={approveJoinRequest.isPending || rejectJoinRequest.isPending}
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => rejectJoinRequest.mutate(request.id)}
                disabled={approveJoinRequest.isPending || rejectJoinRequest.isPending}
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [approveJoinRequest, rejectJoinRequest]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-lg font-semibold leading-none tracking-tight">Pending Join Requests</h3>
        <p className="text-sm text-muted-foreground">Review and manage requests to join your organization.</p>
      </div>

      <DataTable
        columns={columns}
        data={requests || []}
        density="comfortable"
        isLoading={isLoading}
        isError={isError}
        emptyMessage={
          <div className="flex flex-col items-center justify-center text-center py-6">
            <Inbox className="h-10 w-10 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No pending requests</p>
            <p className="text-sm text-slate-500">When users request to join, they will appear here.</p>
          </div>
        }
      />
    </div>
  );
}
