"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleError } from "@/components/states/module-error";

import { useTaxQuery } from "../hooks/use-tax-query";
import { useTaxMutations } from "../hooks/use-tax-mutations";
import { TaxForm } from "./tax-form";
import type { TaxFormSchema } from "../schema";

export function TaxEditView({ taxId }: { taxId: string }) {
  const router = useRouter();
  const { data: tax, isLoading, isError, refetch } = useTaxQuery(taxId);
  const { updateTax } = useTaxMutations();

  const handleSubmit = async (values: TaxFormSchema) => {
    await updateTax.mutateAsync({ id: taxId, data: values });
    router.push("/taxes");
  };

  if (isError) {
    return <ModuleError title="Tax unavailable" message="We could not load the tax configuration details." retry={() => refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/taxes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader title="Edit Tax" description="Modify the details of this tax configuration." />
      </div>

      <div className="max-w-2xl">
        {isLoading || !tax ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <TaxForm
            defaultValues={{
              name: tax.name,
              rate: tax.rate,
              type: tax.type,
              isDefault: tax.isDefault,
            }}
            submitLabel="Save Changes"
            description="Update the details of the tax configuration."
            onSubmit={handleSubmit}
            pending={updateTax.isPending}
          />
        )}
      </div>
    </div>
  );
}
