"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useInvoiceDetailQuery } from "../hooks/use-invoices-query";
import { InvoicePreview } from "./invoice-preview";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoiceSummary } from "./invoice-summary";

export function InvoiceDetailsView({ invoiceId }: { invoiceId: string }) {
  const query = useInvoiceDetailQuery(invoiceId);

  if (query.isError) {
    return <ModuleError title="Invoice unavailable" message="We could not load the selected invoice record." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Invoice not found" description="The requested invoice could not be located in this workspace." actionLabel="Back to invoices" />;
  }

  const invoice = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Invoice details, billing composition, and payment posture for ${invoice.customer}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Invoice
              </Link>
            </Button>
          </>
        }
      />

      <InvoiceSummary
        items={[
          { label: "Amount", value: formatCurrency(invoice.amount, invoice.currency ?? "INR"), detail: "Gross invoice amount including taxes." },
          { label: "Balance", value: formatCurrency(invoice.balance, invoice.currency ?? "INR"), detail: "Remaining unpaid balance." },
          { label: "Due Date", value: invoice.dueDate, detail: "Customer payment due date." },
          { label: "Status", value: invoice.status, detail: "Current invoice lifecycle stage." },
          { label: "Terms", value: invoice.paymentTerms ?? "Standard", detail: "Commercial payment terms on this invoice." },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.78fr)]">
        <div className="space-y-4">
          <InvoicePreview invoice={invoice} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">Invoice Controls</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Sales rep: {invoice.salesRep}</div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Currency: {invoice.currency ?? "INR"}</div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Issued: {invoice.issueDate ?? "Pending"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Activity Timeline</p>
              <div className="mt-3 space-y-3">
                {invoice.activity.map((entry) => (
                  <div key={entry} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                    {entry}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
