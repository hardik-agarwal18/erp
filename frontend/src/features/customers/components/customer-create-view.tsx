"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateCustomerMutation } from "../hooks/use-customers-query";
import { CustomerForm } from "./customer-form";

export function CustomerCreateView() {
  const router = useRouter();
  const mutation = useCreateCustomerMutation();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Customer"
        description="Create a new bill-to entity with commercial and credit control details."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push("/customers")}>
            Back to Customers
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
        <CustomerForm
          defaultValues={{
            code: "CUS-005",
            name: "Apex Trade Co",
            legalName: "Apex Trade Company LLC",
            email: "finance@apex.example",
            phone: "+1 713 555 0135",
            status: "active",
            segment: "mid_market",
            gstin: "33AAECA9100M1Z2",
            currency: "USD",
            paymentTerms: "Net 30",
            creditLimit: 50000,
            owner: "Sara Khan",
            billingAddress: "12 Harbor Trade Center, Houston, TX 77002",
            shippingAddress: "Apex Warehouse, Houston, TX 77020",
          }}
          description="Complete commercial, tax, and credit metadata for the new customer record."
          pending={mutation.isPending}
          submitLabel="Create customer"
          onSubmit={async (values) => {
            const customer = await mutation.mutateAsync(values);
            router.push(`/customers/${customer.id}`);
          }}
        />
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Customer setup checklist</p>
            {[
              "Define legal and display names for billing accuracy.",
              "Confirm payment terms and credit policy before activation.",
              "Capture billing and shipping addresses separately for fulfillment.",
              "Use segment and owner fields for routing collections workflows.",
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
