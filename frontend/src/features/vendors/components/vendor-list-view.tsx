"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vendor } from "@/types/app";
import { formatCompactCurrency } from "@/utils/formatters";
import { useVendorsQuery } from "../hooks/use-vendors-query";
import type { VendorFiltersState } from "../types";
import { VendorFilters } from "./vendor-filters";
import { VendorSummaryCard } from "./vendor-summary-card";
import { VendorTable } from "./vendor-table";

const EMPTY_VENDORS: Vendor[] = [];

export function VendorListView() {
  const query = useVendorsQuery();
  const [filters, setFilters] = useState<VendorFiltersState>({
    search: "",
    status: "all",
    category: "all",
  });

  const data = query.data;
  const vendors = data?.vendors ?? EMPTY_VENDORS;

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [vendor.code, vendor.name, vendor.accountManager, vendor.email].some((value) =>
          value.toLowerCase().includes(filters.search.toLowerCase()),
        );

      const matchesStatus = filters.status === "all" || vendor.status === filters.status;
      const matchesCategory = filters.category === "all" || vendor.category === filters.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, filters]);

  if (query.isError) {
    return <ModuleError title="Vendors unavailable" message="We could not load vendor master data for this workspace." retry={() => query.refetch()} />;
  }

  if (!data?.vendors.length) {
    return <EmptyState title="No vendors found" description="Create your first vendor to start procurement and AP workflows." actionLabel="Create vendor" />;
  }

  const { summary } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Management"
        description="Vendor master, procurement exposure, compliance records, and AP controls."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/vendors">Export Directory</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/vendors/create">
                <Plus className="mr-2 h-4 w-4" />
                New Vendor
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <VendorSummaryCard label="Total Vendors" value={String(summary.totalVendors)} detail="Across procurement and services" />
        <VendorSummaryCard label="Active Vendors" value={String(summary.activeVendors)} detail="Currently approved for purchasing" />
        <VendorSummaryCard label="Under Review" value={String(summary.reviewVendors)} detail="Requires compliance or account review" />
        <VendorSummaryCard label="Outstanding AP" value={formatCompactCurrency(summary.totalOutstanding)} detail="Open balances across vendors" />
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <VendorFilters filters={filters} onChange={setFilters} />
          {filteredVendors.length ? (
            <VendorTable vendors={filteredVendors} />
          ) : (
            <EmptyState title="No matching vendors" description="Adjust your filters to widen the vendor list." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Procurement Focus</p>
              <p className="text-sm text-slate-500">
                {vendors.filter((vendor) => vendor.outstandingBalance > 0).length} vendors currently have open payables.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/purchases">Open Purchases</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
