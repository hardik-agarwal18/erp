"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatePurchaseMutation } from "../hooks/use-purchases-query";
import { PurchaseEditor } from "./purchase-editor";

export function PurchaseCreateView() {
  const router = useRouter();
  const mutation = useCreatePurchaseMutation();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Purchase Order"
        description="Create a new supplier order with line items, approval routing, and warehouse destination."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push("/purchases")}>
            Back to Purchases
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
        <PurchaseEditor
          defaultValues={{
            vendor: "Acme Parts Co",
            number: "PO-1212",
            orderDate: "2026-05-29",
            expectedDate: "2026-06-18",
            warehouse: "Dallas Central",
            approvalStage: "Dept review",
            paymentTerms: "Net 30",
            buyer: "Sara Khan",
            notes: "New replenishment order for assembly demand in the second half of June.",
            lineItems: [
              { description: "Drive housings", quantity: 80, unitPrice: 420 },
              { description: "Precision fastener kits", quantity: 150, unitPrice: 54 },
              { description: "Protective inserts", quantity: 80, unitPrice: 22 },
            ],
          }}
          description="Capture supplier, logistics, approval, and item-level purchasing data in one step."
          pending={mutation.isPending}
          submitLabel="Create purchase order"
          onSubmit={async (values) => {
            const order = await mutation.mutateAsync(values);
            router.push(`/purchases/${order.id}`);
          }}
        />
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">PO setup checklist</p>
            {[
              "Confirm destination warehouse and expected date before supplier release.",
              "Use approval stage wording that reflects the real gate still pending.",
              "Line items should match the supplier quote to reduce bill-match exceptions.",
              "Add notes for delivery instructions, split shipments, or receiving constraints.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
