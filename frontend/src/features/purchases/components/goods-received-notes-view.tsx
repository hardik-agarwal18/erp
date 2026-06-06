"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useCreateGoodsReceivedNoteMutation, useGoodsReceivedNotesQuery } from "../hooks/use-purchases-query";
import { GoodsReceivedNoteForm } from "./goods-received-note-form";
import type { GoodsReceivedNote } from "../types";

export function GoodsReceivedNotesView() {
  const query = useGoodsReceivedNotesQuery();
  const mutation = useCreateGoodsReceivedNoteMutation();

  const columns = useMemo<ColumnDef<GoodsReceivedNote>[]>(() => [
    {
      accessorKey: "reference",
      header: "GRN",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.reference}</span>,
    },
    {
      accessorKey: "purchaseOrderNumber",
      header: "PO #",
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse",
    },
    {
      accessorKey: "receivedDate",
      header: "Received Date",
    },
    {
      accessorKey: "itemsReceived",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => <div className="text-right">{row.original.itemsReceived}</div>,
    },
    {
      accessorKey: "receivedBy",
      header: "Received By",
    },
  ], []);

  if (query.isError) {
    return <ModuleError title="GRNs unavailable" message="We could not load goods received notes for this workspace." retry={() => query.refetch()} />;
  }

  if (!query.data?.length) {
    return <EmptyState title="No goods received notes" description="Create the first GRN to start receipt tracking." actionLabel="Create GRN" />;
  }

  const receipts = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Goods Received Notes"
        description="Track posted receipts against purchase orders before bill matching and inventory updates close out the flow."
        actions={
          <Button size="sm" variant="outline">
            Export GRN Register
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <DataTable
              columns={columns}
              data={receipts}
              density="comfortable"
              emptyMessage="No GRNs found."
            />
          </CardContent>
        </Card>

        <GoodsReceivedNoteForm
          defaultValues={{
            purchaseOrderNumber: "PO-1201",
            vendor: "Forge Metals",
            warehouse: "Phoenix West",
            receivedDate: "2026-05-29",
            receivedBy: "Anya Shah",
            itemsReceived: 120,
          }}
          pending={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
          }}
        />
      </div>
    </div>
  );
}
