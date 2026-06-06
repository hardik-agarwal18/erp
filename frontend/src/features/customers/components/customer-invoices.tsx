"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Invoice } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export function CustomerInvoices({ invoices }: { invoices: Invoice[] }) {
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("invoiceNumber")}</div>,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "paid"
                  ? "success"
                  : status === "overdue"
                    ? "danger"
                    : status === "partial"
                      ? "warning"
                      : "info"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("amount"))}</div>,
      },
      {
        accessorKey: "balance",
        header: () => <div className="text-right">Balance</div>,
        cell: ({ row }) => <div className="text-right">{formatCurrency(row.getValue("balance"))}</div>,
      },
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customer Invoices</CardTitle>
          <CardDescription>Receivables tied to this customer account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={invoices}
          density="comfortable"
          emptyMessage="No invoices found."
          className="shadow-none border-muted"
        />
      </CardContent>
    </Card>
  );
}

