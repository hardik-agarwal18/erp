"use client";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateVendorMutation, useVendorDetailQuery } from "../hooks/use-vendors-query";
import { VendorForm } from "./vendor-form";

export function VendorEditView({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const detailQuery = useVendorDetailQuery(vendorId);
  const mutation = useUpdateVendorMutation(vendorId);

  if (detailQuery.isError) {
    return <ModuleError title="Vendor unavailable" message="We could not open this vendor for editing." retry={() => detailQuery.refetch()} />;
  }

  if (!detailQuery.data) {
    return <EmptyState title="Vendor not found" description="The requested vendor record could not be loaded for editing." />;
  }

  const vendor = detailQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${vendor.name}`}
        description="Update vendor metadata, payment terms, and sourcing controls."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push(`/vendors/${vendor.id}`)}>
            View Profile
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
        <VendorForm
          defaultValues={{
            code: vendor.code,
            name: vendor.name,
            legalName: vendor.legalName,
            email: vendor.email,
            phone: vendor.phone,
            status: vendor.status,
            category: vendor.category,
            gstin: vendor.gstin,
            currency: vendor.currency,
            paymentTerms: vendor.paymentTerms,
            leadTimeDays: vendor.leadTimeDays,
            accountManager: vendor.accountManager,
            billingAddress: vendor.billingAddress,
            shippingAddress: vendor.shippingAddress,
          }}
          description="Maintain supplier, compliance, and payment settings without leaving the master data workspace."
          pending={mutation.isPending}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
            router.push(`/vendors/${vendor.id}`);
          }}
        />
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Impact of changes</p>
            {[
              "Payment term changes affect default bill due dates and approval expectations.",
              "Lead time updates influence replenishment planning and PO scheduling.",
              "Status changes affect vendor eligibility in procurement workflows.",
              "Manager changes redirect supplier communication and escalations.",
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
