"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@/types/app";
import { formatCompactCurrency } from "@/utils/formatters";
import { useInvoicesQuery } from "../hooks/use-invoices-query";
import type { InvoiceFiltersState } from "../types";
import { InvoiceSummary } from "./invoice-summary";
import { InvoiceTable } from "./invoice-table";

const EMPTY_INVOICES: Invoice[] = [];

export function InvoiceListView() {
  const query = useInvoicesQuery();
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const invoices = data?.invoices ?? EMPTY_INVOICES;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [invoice.invoiceNumber, invoice.customer, invoice.salesRep].some((value) => value.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesStatus = filters.status === "all" || invoice.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, filters]);

  if (query.isError) {
    return <ModuleError title="Invoices unavailable" message="We could not load receivables data for this workspace." retry={() => query.refetch()} />;
  }

  if (!data?.invoices.length) {
    return <EmptyState title="No invoices yet" description="Create your first invoice to begin receivables tracking." actionLabel="Create invoice" />;
  }

  const { summary } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoice Management"
        description="Full invoice operations with drafting, review, customer billing, and follow-up visibility."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">Customer Accounts</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/invoices/create">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </>
        }
      />

      <InvoiceSummary
        items={[
          { label: "Total Invoices", value: String(summary.totalInvoices), detail: "All receivable documents across the workspace." },
          { label: "Overdue", value: String(summary.overdueCount), detail: "Open invoices that have crossed the due date." },
          { label: "Paid This Month", value: String(summary.paidThisMonth), detail: "Invoices fully settled in the current month." },
          { label: "Drafts", value: String(summary.draftCount), detail: "Invoices still waiting for issue or review." },
          { label: "Outstanding", value: formatCompactCurrency(summary.outstandingBalance), detail: "Remaining collectible balance across invoices." },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="border-0 bg-transparent px-0"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search invoice number, customer, or rep..."
                value={filters.search}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:w-[220px]"
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as InvoiceFiltersState["status"] }))}
              value={filters.status}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {filteredInvoices.length ? (
            <InvoiceTable invoices={filteredInvoices} />
          ) : (
            <EmptyState title="No matching invoices" description="Adjust your search or status filter to widen the visible results." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Collections Focus</p>
              <p className="text-sm text-slate-500">
                {invoices.filter((invoice) => invoice.balance > 0).length} invoices currently require collections follow-up or settlement.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
