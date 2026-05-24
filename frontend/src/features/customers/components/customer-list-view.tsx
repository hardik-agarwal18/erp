"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/types/app";
import { formatCompactCurrency } from "@/utils/formatters";
import { useCustomersQuery } from "../hooks/use-customers-query";
import type { CustomerFiltersState } from "../types";
import { CustomerFilters } from "./customer-filters";
import { CustomerSummaryCard } from "./customer-summary-card";
import { CustomerTable } from "./customer-table";

const EMPTY_CUSTOMERS: Customer[] = [];

export function CustomerListView() {
  const query = useCustomersQuery();
  const [filters, setFilters] = useState<CustomerFiltersState>({
    search: "",
    status: "all",
    segment: "all",
  });

  const data = query.data;
  const customers = data?.customers ?? EMPTY_CUSTOMERS;

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [customer.code, customer.name, customer.owner, customer.email].some((value) =>
          value.toLowerCase().includes(filters.search.toLowerCase()),
        );

      const matchesStatus = filters.status === "all" || customer.status === filters.status;
      const matchesSegment = filters.segment === "all" || customer.segment === filters.segment;

      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [customers, filters]);

  if (query.isError) {
    return <ModuleError title="Customers unavailable" message="We could not load customer master data for this workspace." retry={() => query.refetch()} />;
  }

  if (!data?.customers.length) {
    return <EmptyState title="No customers found" description="Create your first customer to start invoice and collections workflows." actionLabel="Create customer" />;
  }

  const { summary } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Management"
        description="Customer master, collections exposure, documents, and account ownership."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">Export Directory</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/customers/create">
                <Plus className="mr-2 h-4 w-4" />
                New Customer
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <CustomerSummaryCard label="Total Customers" value={String(summary.totalCustomers)} detail="Across all supported billing entities" />
        <CustomerSummaryCard label="Active Accounts" value={String(summary.activeCustomers)} detail="Currently invoiceable customers" />
        <CustomerSummaryCard label="At Risk" value={String(summary.atRiskCustomers)} detail="Requires collections or credit review" />
        <CustomerSummaryCard label="Outstanding AR" value={formatCompactCurrency(summary.totalOutstanding)} detail="Open balances across all customers" />
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <CustomerFilters filters={filters} onChange={setFilters} />
          {filteredCustomers.length ? (
            <CustomerTable customers={filteredCustomers} />
          ) : (
            <EmptyState title="No matching customers" description="Adjust your filters to widen the customer list." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Collections Focus</p>
              <p className="text-sm text-slate-500">
                {customers.filter((customer) => customer.outstandingBalance > 0).length} customers currently have open balances.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/invoices">Open Receivables</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
