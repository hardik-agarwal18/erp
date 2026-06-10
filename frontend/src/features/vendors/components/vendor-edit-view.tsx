"use client";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

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

      <div>
        <VendorForm
          defaultValues={{
            code: vendor.code || "",
            name: vendor.name || "",
            legalName: vendor.legalName || "",
            email: vendor.email || "",
            phone: vendor.phone || "",
            status: vendor.status,
            category: vendor.category,
            gstin: vendor.gstin || "",
            currency: vendor.currency || "INR",
            paymentTerms: vendor.paymentTerms || "",
            leadTimeDays: vendor.leadTimeDays || 0,
            accountManager: vendor.accountManager || "",
            billingAddress: vendor.billingAddress || "",
            shippingAddress: vendor.shippingAddress || "",
          }}
          description="Maintain supplier, compliance, and payment settings without leaving the master data workspace."
          pending={mutation.isPending}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
            router.push(`/vendors/${vendor.id}`);
          }}
        />
      </div>
    </div>
  );
}
