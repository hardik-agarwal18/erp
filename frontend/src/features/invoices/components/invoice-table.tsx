"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { Invoice } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.invoiceNumber}</span>,
      },
      {
        accessorKey: "customer",
        header: "Customer",
      },
      {
        accessorKey: "issueDate",
        header: "Issue Date",
        cell: ({ row }) => <span>{row.original.issueDate ?? "-"}</span>,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.amount, row.original.currency ?? "INR")}
          </div>
        ),
      },
      {
        accessorKey: "balance",
        header: () => <div className="text-right">Balance</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.balance, row.original.currency ?? "INR")}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex items-center gap-3 text-sm">
              <Link
                className="font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                href={`/invoices/${invoice.id}`}
              >
                View
              </Link>
              <Link
                className="text-muted-foreground hover:text-foreground transition-colors"
                href={`/invoices/${invoice.id}/edit`}
              >
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
      data={invoices}
      density="comfortable"
      emptyMessage="No invoices found."
    />
  );
}
