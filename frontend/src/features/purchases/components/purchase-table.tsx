"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { PurchaseOrderDetail } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { PurchaseStatusBadge } from "./purchase-status-badge";

export function PurchaseTable({ orders }: { orders: PurchaseOrderDetail[] }) {
  const columns = useMemo<ColumnDef<PurchaseOrderDetail>[]>(
    () => [
      {
        accessorKey: "vendor",
        header: "Vendor",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.vendor}</span>,
      },
      {
        accessorKey: "number",
        header: "PO #",
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        cell: ({ row }) => <span>{row.original.orderDate ?? "-"}</span>,
      },
      {
        accessorKey: "expectedDate",
        header: "Expected",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <PurchaseStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.amount)}</div>,
      },
      {
        accessorKey: "buyer",
        header: "Buyer",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center gap-3 text-sm">
              <Link
                className="font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                href={`/purchases/${order.id}`}
              >
                View
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground transition-colors"
                href="/purchases/goods-received-notes"
              >
                GRNs
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
      data={orders}
      density="comfortable"
      emptyMessage="No purchase orders found."
    />
  );
}
