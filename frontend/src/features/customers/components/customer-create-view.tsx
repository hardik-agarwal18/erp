"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

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

      <div>
        <CustomerForm
          defaultValues={{
            code: "",
            name: "",
            legalName: "",
            email: "",
            phone: "",
            status: "active",
            segment: "smb",
            gstin: "",
            currency: "INR",
            paymentTerms: 0,
            creditLimit: 0,
            owner: "",
            billingAddress: "",
            shippingAddress: "",
          }}
          description="Complete commercial, tax, and credit metadata for the new customer record."
          pending={mutation.isPending}
          submitLabel="Create customer"
          onSubmit={async (values) => {
            const customer = await mutation.mutateAsync(values);
            router.push(`/customers/${customer.id}`);
          }}
        />
      </div>
    </div>
  );
}
