"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

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

      <div>
        <VendorForm
          defaultValues={{
            code: "",
            name: "",
            legalName: "",
            email: "",
            phone: "",
            status: "active",
            category: "services",
            gstin: "",
            currency: "USD",
            paymentTerms: "",
            leadTimeDays: 0,
            accountManager: "",
            billingAddress: "",
            shippingAddress: "",
          }}
          description="Complete vendor commercial, tax, and operational metadata."
          pending={mutation.isPending}
          submitLabel="Create vendor"
          onSubmit={async (values) => {
            const vendor = await mutation.mutateAsync(values);
            router.push(`/vendors/${vendor.id}`);
          }}
        />
      </div>
    </div>
  );
}
