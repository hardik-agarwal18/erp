"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { useTaxMutations } from "../hooks/use-tax-mutations";
import { TaxForm } from "./tax-form";
import type { TaxFormSchema } from "../schema";

export function TaxCreateView() {
  const router = useRouter();
  const { createTax } = useTaxMutations();

  const handleSubmit = async (values: TaxFormSchema) => {
    await createTax.mutateAsync(values);
    router.push("/taxes");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/taxes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader title="Create Tax" description="Add a new tax rate to your organization." />
      </div>

      <div className="max-w-2xl">
        <TaxForm
          defaultValues={{
            name: "",
            rate: 0,
            type: "GST",
            isDefault: false,
          }}
          submitLabel="Create Tax"
          description="Enter the details for the new tax configuration."
          onSubmit={handleSubmit}
          pending={createTax.isPending}
        />
      </div>
    </div>
  );
}
