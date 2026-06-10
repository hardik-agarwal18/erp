"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { useTaxesQuery } from "../hooks/use-taxes-query";
import { TaxTable } from "./tax-table";

export function TaxListView() {
  const query = useTaxesQuery();
  const data = query.data;

  if (query.isError) {
    return <ModuleError title="Taxes unavailable" message="We could not load tax configurations." retry={() => query.refetch()} />;
  }

  const taxes = data?.taxes ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tax Configuration"
        description="Manage tax rates and types across the organization."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/taxes/create">
                <Plus className="mr-2 h-4 w-4" />
                New Tax
              </Link>
            </Button>
          </div>
        }
      />

      {taxes.length === 0 && !query.isLoading ? (
        <EmptyState title="No taxes configured" description="Create a tax rate to start calculating taxes on invoices and purchases." actionLabel="Create tax" />
      ) : (
        <TaxTable taxes={taxes} />
      )}
    </div>
  );
}
