"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { CustomerTransaction } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { ColumnDef } from "@tanstack/react-table";

export function CustomerTransactions({ transactions }: { transactions: CustomerTransaction[] }) {
  const columns = useMemo<ColumnDef<CustomerTransaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return <span className="capitalize">{type.replace("_", " ")}</span>;
        },
      },
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("reference")}</div>,
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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Ledger movement for the customer account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={transactions}
          density="comfortable"
          emptyMessage="No transactions found."
          className="shadow-none border-muted"
        />
      </CardContent>
    </Card>
  );
}

