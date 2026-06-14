"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

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

      <div>
        <PurchaseEditor
          defaultValues={{
            vendor: "",
            number: "",
            orderDate: new Date().toISOString().slice(0, 10),
            expectedDate: "",
            warehouse: "",
            approvalStage: "Pending",
            paymentTerms: 0,
            buyer: "",
            notes: "",
            lineItems: [],
          }}
          description="Capture supplier, logistics, approval, and item-level purchasing data in one step."
          pending={mutation.isPending}
          submitLabel="Create purchase order"
          onSubmit={async (values) => {
            const order = await mutation.mutateAsync(values);
            router.push(`/purchases/${order.id}`);
          }}
        />
      </div>
    </div>
  );
}
