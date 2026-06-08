"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateVendorMutation } from "../hooks/use-vendors-query";
import { VendorForm } from "./vendor-form";

export function VendorCreateView() {
  const router = useRouter();
  const mutation = useCreateVendorMutation();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Vendor"
        description="Create a new vendor record for procurement, billing, and compliance workflows."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push("/vendors")}>
            Back to Vendors
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
        <VendorForm
          defaultValues={{
            code: "VEN-005",
            name: "Prime Freight Services",
            legalName: "Prime Freight Services LLC",
            email: "ops@primefreight.example",
            phone: "+1 972 555 0132",
            status: "active",
            category: "services",
            gstin: "07AAEVP9100N1Z3",
            currency: "INR",
            paymentTerms: "Net 21",
            leadTimeDays: 3,
            accountManager: "Sara Khan",
            billingAddress: "100 Beltway North, Dallas, TX 75207",
            shippingAddress: "Distribution Node 5, Dallas, TX 75241",
          }}
          description="Complete vendor commercial, tax, and operational metadata."
          pending={mutation.isPending}
          submitLabel="Create vendor"
          onSubmit={async (values) => {
            const vendor = await mutation.mutateAsync(values);
            router.push(`/vendors/${vendor.id}`);
          }}
        />
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Vendor setup checklist</p>
            {[
              "Confirm legal name and tax details before first PO issuance.",
              "Use category and lead time for procurement planning and supplier selection.",
              "Capture billing and receiving addresses separately for AP and warehouse coordination.",
              "Set status to review when compliance or banking docs are pending.",
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
