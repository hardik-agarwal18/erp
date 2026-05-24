"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerDetailQuery } from "../hooks/use-customers-query";
import { CustomerDocuments } from "./customer-documents";
import { CustomerInvoices } from "./customer-invoices";
import { CustomerProfile } from "./customer-profile";
import { CustomerSummaryCard } from "./customer-summary-card";
import { CustomerTimeline } from "./customer-timeline";
import { CustomerTransactions } from "./customer-transactions";
import { formatCurrency } from "@/utils/formatters";

export function CustomerDetailsView({ customerId }: { customerId: string }) {
  const query = useCustomerDetailQuery(customerId);

  if (query.isError) {
    return <ModuleError title="Customer unavailable" message="We could not load the selected customer profile." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Customer not found" description="The requested customer could not be located in this workspace." actionLabel="Back to customers" />;
  }

  const customer = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={customer.name}
        description={`Customer profile, documents, invoices, and transactions for ${customer.code}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Customer
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <CustomerSummaryCard label="Outstanding" value={formatCurrency(customer.outstandingBalance)} detail="Open receivable balance" />
        <CustomerSummaryCard label="Credit Limit" value={formatCurrency(customer.creditLimit)} detail="Approved customer credit" />
        <CustomerSummaryCard label="Revenue" value={formatCurrency(customer.totalRevenue)} detail="Lifetime billed value" />
        <CustomerSummaryCard label="Last Invoice" value={customer.lastInvoiceDate} detail="Most recent billing date" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.82fr)]">
        <div className="space-y-4">
          <CustomerProfile customer={customer} />
          <CustomerInvoices invoices={customer.invoices} />
          <CustomerTransactions transactions={customer.transactions} />
        </div>
        <div className="space-y-4">
          <CustomerTimeline timeline={customer.timeline} />
          <CustomerDocuments documents={customer.documents} />
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Account Controls</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 p-3">Collections owner: {customer.owner}</div>
                <div className="rounded-lg border border-slate-200 p-3">Currency: {customer.currency}</div>
                <div className="rounded-lg border border-slate-200 p-3">Tax ID: {customer.gstin}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
