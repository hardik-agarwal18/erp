"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { Transaction } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { TransactionStatusBadge } from "./transaction-status-badge";

export function TransactionTable({ 
  transactions,
  manualPagination,
  pageCount,
  pagination,
  onPaginationChange,
}: { 
  transactions: Transaction[];
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}) {
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.reference}</span>,
      },
      {
        accessorKey: "date",
        header: "Date",
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
      },
      {
        accessorKey: "account",
        header: "Account",
      },
      {
        accessorKey: "kind",
        header: "Kind",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatCurrency(row.original.direction === "inflow" ? row.original.amount : -row.original.amount)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <Link
              className="font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              href={`/transactions/${transaction.id}`}
            >
              View
            </Link>
          );
        },
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={transactions}
      density="comfortable"
      emptyMessage="No transactions found."
      manualPagination={manualPagination}
      pageCount={pageCount}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
}
