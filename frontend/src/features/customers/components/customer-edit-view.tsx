"use client";

import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { useCustomerDetailQuery, useUpdateCustomerMutation } from "../hooks/use-customers-query";
import { CustomerForm } from "./customer-form";

export function CustomerEditView({ customerId }: { customerId: string }) {
  const router = useRouter();
  const detailQuery = useCustomerDetailQuery(customerId);
  const mutation = useUpdateCustomerMutation(customerId);

  if (detailQuery.isError) {
    return <ModuleError title="Customer unavailable" message="We could not open this customer for editing." retry={() => detailQuery.refetch()} />;
  }

  if (!detailQuery.data) {
    return <EmptyState title="Customer not found" description="The requested customer record could not be loaded for editing." />;
  }

  const customer = detailQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${customer.name}`}
        description="Update account ownership, credit policy, and billing records."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push(`/customers/${customer.id}`)}>
            View Profile
          </Button>
        }
      />

      <div>
        <CustomerForm
          defaultValues={{
            code: customer.code || "",
            name: customer.name || "",
            legalName: customer.legalName || "",
            email: customer.email || "",
            phone: customer.phone || "",
            status: customer.status,
            segment: customer.segment,
            gstin: customer.gstin || "",
            currency: customer.currency || "INR",
            paymentTerms: customer.paymentTerms || 0,
            creditLimit: customer.creditLimit || 0,
            owner: customer.owner || "",
            billingAddress: customer.billingAddress || "",
            shippingAddress: customer.shippingAddress || "",
          }}
          description="Maintain customer metadata without leaving the ERP master data workspace."
          pending={mutation.isPending}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
            router.push(`/customers/${customer.id}`);
          }}
        />
      </div>
    </div>
  );
}
