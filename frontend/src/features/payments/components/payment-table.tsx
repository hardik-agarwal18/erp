"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import type { Payment } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

export function PaymentTable({ payments }: { payments: Payment[] }) {
  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paymentDate",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.paymentDate}</span>,
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: ({ row }) => (
          <Link className="hover:underline text-blue-600 dark:text-blue-400" href={`/invoices/${row.original.invoiceId}`}>
            {row.original.invoiceNumber || row.original.invoiceId.slice(0, 8)}
          </Link>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => <span>{row.original.customerName || "—"}</span>,
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => <Badge variant="neutral">{row.original.paymentMethod}</Badge>,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium text-foreground">
            {formatCurrency(row.original.amount)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild size="icon" variant="ghost">
            <Link href={`/payments/${row.original.id}`}>
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">View {row.original.id}</span>
            </Link>
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={payments}
      density="comfortable"
      emptyMessage="No payments found."
    />
  );
}
