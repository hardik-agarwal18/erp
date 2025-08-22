"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function InventoryItemsTable({ items }: { items: InventoryItem[] }) {
  const columns = useMemo<ColumnDef<InventoryItem>[]>(() => [
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse",
    },
    {
      accessorKey: "onHand",
      header: () => <div className="text-right">On Hand</div>,
      cell: ({ row }) => <div className="text-right">{row.original.onHand}</div>,
    },
    {
      accessorKey: "reserved",
      header: () => <div className="text-right">Reserved</div>,
      cell: ({ row }) => <div className="text-right">{row.original.reserved}</div>,
    },
    {
      id: "available",
      header: () => <div className="text-right">Available</div>,
      cell: ({ row }) => {
        const available = row.original.onHand - row.original.reserved;
        return <div className="text-right font-medium">{available}</div>;
      },
    },
    {
      accessorKey: "reorderPoint",
      header: () => <div className="text-right">Reorder</div>,
      cell: ({ row }) => <div className="text-right">{row.original.reorderPoint}</div>,
    },
    {
      accessorKey: "valuation",
      header: () => <div className="text-right">Valuation</div>,
      cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.valuation)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === "out_of_stock" ? "danger" : status === "low_stock" ? "warning" : "success"}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
  ], []);

  return <DataTable columns={columns} data={items} />;
}
