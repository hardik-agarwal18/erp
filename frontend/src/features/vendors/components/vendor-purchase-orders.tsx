"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { PurchaseOrder } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export function VendorPurchaseOrders({ orders }: { orders: PurchaseOrder[] }) {
  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: "number",
        header: "PO #",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("number")}</div>,
      },
      {
        accessorKey: "expectedDate",
        header: "Expected Date",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "approved" || status === "received"
                  ? "success"
                  : status === "pending_approval"
                    ? "warning"
                    : status === "billed"
                      ? "info"
                      : "neutral"
              }
            >
              {status.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("amount"))}</div>,
      },
      {
        accessorKey: "approvalStage",
        header: "Approval",
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Open and historical procurement linked to this vendor.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={orders}
          density="comfortable"
          emptyMessage="No purchase orders found."
          className="shadow-none border-muted"
        />
      </CardContent>
    </Card>
  );
}

