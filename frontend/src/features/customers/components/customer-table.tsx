"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Customer } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("code")}</div>,
      },
      {
        id: "customer",
        header: "Customer",
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "segment",
        header: "Segment",
        cell: ({ row }) => {
          const segment = row.getValue("segment") as string;
          return <span>{segment.replace("_", " ")}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={status === "active" ? "success" : status === "at_risk" ? "warning" : "neutral"}
            >
              {status.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "owner",
        header: "Owner",
      },
      {
        accessorKey: "paymentTerms",
        header: "Terms",
      },
      {
        accessorKey: "outstandingBalance",
        header: () => <div className="text-right">Outstanding</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.getValue("outstandingBalance"))}</div>
        ),
      },
      {
        accessorKey: "totalRevenue",
        header: () => <div className="text-right">Revenue</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.getValue("totalRevenue"))}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex items-center gap-3 text-sm">
              <Link className="font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors" href={`/customers/${customer.id}`}>
                View
              </Link>
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/customers/${customer.id}/edit`}>
                Edit
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={customers}
      density="comfortable"
      emptyMessage="No customers found."
    />
  );
}

