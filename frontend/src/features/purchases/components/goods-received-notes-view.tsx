"use client";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { useCreateGoodsReceivedNoteMutation, useGoodsReceivedNotesQuery } from "../hooks/use-purchases-query";
import { GoodsReceivedNoteForm } from "./goods-received-note-form";

export function GoodsReceivedNotesView() {
  const query = useGoodsReceivedNotesQuery();
  const mutation = useCreateGoodsReceivedNoteMutation();

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
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>GRN</TableHeaderCell>
                    <TableHeaderCell>PO #</TableHeaderCell>
                    <TableHeaderCell>Vendor</TableHeaderCell>
                    <TableHeaderCell>Warehouse</TableHeaderCell>
                    <TableHeaderCell>Received Date</TableHeaderCell>
                    <TableHeaderCell className="text-right">Items</TableHeaderCell>
                    <TableHeaderCell>Received By</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium text-slate-950">{receipt.reference}</TableCell>
                      <TableCell>{receipt.purchaseOrderNumber}</TableCell>
                      <TableCell>{receipt.vendor}</TableCell>
                      <TableCell>{receipt.warehouse}</TableCell>
                      <TableCell>{receipt.receivedDate}</TableCell>
                      <TableCell className="text-right">{receipt.itemsReceived}</TableCell>
                      <TableCell>{receipt.receivedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
