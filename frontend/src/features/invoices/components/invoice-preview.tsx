import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { InvoiceLineItems } from "./invoice-line-items";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const currency = invoice.currency ?? "INR";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Invoice Preview</CardTitle>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Bill To</p>
            <p className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-50">{invoice.customer}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-500 dark:text-slate-400">{invoice.billingAddress ?? "Billing address pending"}</p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-400">
            <div>Invoice: {invoice.invoiceNumber}</div>
            <div>Issue Date: {invoice.issueDate ?? "Pending"}</div>
            <div>Due Date: {invoice.dueDate}</div>
            <div>Payment Terms: {invoice.paymentTerms ?? "Standard terms"}</div>
          </div>
        </div>

        <InvoiceLineItems items={invoice.lineItems ?? []} currency={currency} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-400">Amount: {formatCurrency(invoice.amount, currency)}</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-400">Balance: {formatCurrency(invoice.balance, currency)}</div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-400">Sales Rep: {invoice.salesRep}</div>
        </div>

        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-sm text-slate-600 dark:text-slate-400">{invoice.notes ?? "No invoice notes added."}</div>
      </CardContent>
    </Card>
  );
}
