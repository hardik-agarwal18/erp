"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import type { Expense } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: "expenseDate",
        header: "Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.expenseDate}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="neutral">{row.original.category}</Badge>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description || "—"}</span>,
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
            <Link href={`/expenses/${row.original.id}`}>
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
      data={expenses}
      density="comfortable"
      emptyMessage="No expenses found."
    />
  );
}
