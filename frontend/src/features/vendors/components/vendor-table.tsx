"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Vendor } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export function VendorTable({ vendors }: { vendors: Vendor[] }) {
  const columns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("code")}</div>,
      },
      {
        id: "vendor",
        header: "Vendor",
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.getValue("category") as string;
          return <span className="capitalize">{category.replace("_", " ")}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={status === "active" ? "success" : status === "review" ? "warning" : "neutral"}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "accountManager",
        header: "Manager",
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
        accessorKey: "totalSpend",
        header: () => <div className="text-right">Spend</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatCurrency(row.getValue("totalSpend"))}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-center gap-3 text-sm">
              <Link className="font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors" href={`/vendors/${vendor.id}`}>
                View
              </Link>
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/vendors/${vendor.id}/edit`}>
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
      data={vendors}
      density="comfortable"
      emptyMessage="No vendors found."
    />
  );
}
