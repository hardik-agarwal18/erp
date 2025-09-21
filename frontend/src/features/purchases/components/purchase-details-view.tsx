"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { usePurchaseDetailQuery } from "../hooks/use-purchases-query";
import { PurchaseStatusBadge } from "./purchase-status-badge";
import { PurchaseSummary } from "./purchase-summary";

export function PurchaseDetailsView({ purchaseId }: { purchaseId: string }) {
  const query = usePurchaseDetailQuery(purchaseId);

  if (query.isError) {
    return <ModuleError title="Purchase unavailable" message="We could not load the selected purchase order." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Purchase order not found" description="The requested purchase order could not be located in this workspace." actionLabel="Back to purchases" />;
  }

  const order = query.data;
  const totalReceived = order.lineItems.reduce((sum: number, item: any) => sum + item.receivedQuantity, 0);
  const totalOrdered = order.lineItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={order.number}
        description={`Purchase order details, supplier context, receipts, and approval trail for ${order.vendor}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/purchases">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/purchases/goods-received-notes">Post GRN</Link>
            </Button>
          </>
        }
      />

      <PurchaseSummary
        items={[
          { label: "PO Value", value: formatCurrency(order.amount), detail: "Current order commitment across all lines." },
          { label: "Outstanding", value: formatCurrency(order.outstandingBalance), detail: "Amount still open for billing or payment." },
          { label: "Received Qty", value: `${totalReceived}/${totalOrdered}`, detail: "Received quantity against ordered quantity." },
          { label: "Terms", value: order.paymentTerms, detail: "Commercial terms for supplier settlement." },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.78fr)]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{order.vendor}</p>
                  <p className="text-sm text-slate-500">
                    Buyer {order.buyer} · {order.warehouse}
                  </p>
                </div>
                <PurchaseStatusBadge status={order.status} />
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{order.notes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Line Items</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell className="text-right">Qty</TableHeaderCell>
                      <TableHeaderCell className="text-right">Received</TableHeaderCell>
                      <TableHeaderCell className="text-right">Unit Price</TableHeaderCell>
                      <TableHeaderCell className="text-right">Line Total</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {order.lineItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-950">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.receivedQuantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Receipt History</p>
              <div className="mt-3 space-y-3">
                {order.receipts.length ? (
                  order.receipts.map((receipt: any) => (
                    <div key={receipt.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{receipt.reference}</p>
                        <span className="text-xs font-medium text-slate-500">{receipt.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {receipt.receivedDate} · {receipt.itemsReceived} items · {receipt.receivedBy}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No goods received notes have been posted yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Activity Timeline</p>
              <div className="mt-3 space-y-3">
                {order.activity.map((entry: any) => (
                  <div key={entry} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                    {entry}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
