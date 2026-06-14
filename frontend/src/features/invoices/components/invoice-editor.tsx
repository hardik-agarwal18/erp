"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoiceFormSchema, type InvoiceFormSchema } from "../schema";
import type { InvoiceFormValues } from "../types";

export function InvoiceEditor({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: InvoiceFormValues;
  submitLabel: string;
  description: string;
  onSubmit: (values: InvoiceFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<InvoiceFormSchema>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Invoice Editor</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="invoice-customer">Customer</Label>
              <Input id="invoice-customer" {...form.register("customer")} />
            </div>
            <div>
              <Label htmlFor="invoice-number">Invoice #</Label>
              <Input id="invoice-number" {...form.register("invoiceNumber")} />
            </div>
            <div>
              <Label htmlFor="invoice-issue-date">Issue Date</Label>
              <Input id="invoice-issue-date" type="date" {...form.register("issueDate")} />
            </div>
            <div>
              <Label htmlFor="invoice-due-date">Due Date</Label>
              <Input id="invoice-due-date" type="date" {...form.register("dueDate")} />
            </div>
            <div>
              <Label htmlFor="invoice-sales-rep">Sales Rep</Label>
              <Input id="invoice-sales-rep" {...form.register("salesRep")} />
            </div>
            <div>
              <Label htmlFor="invoice-payment-terms">Payment Terms</Label>
              <Input type="number" id="invoice-payment-terms" {...form.register("paymentTerms")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="invoice-billing-address">Billing Address</Label>
              <Textarea id="invoice-billing-address" {...form.register("billingAddress")} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-950">Invoice Line Items</p>
            <div className="mt-4 space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_120px_140px_120px]">
                  <div>
                    <Label htmlFor={`line-description-${index}`}>Description {index + 1}</Label>
                    <Input id={`line-description-${index}`} {...form.register(`lineItems.${index}.description`)} />
                  </div>
                  <div>
                    <Label htmlFor={`line-quantity-${index}`}>Quantity</Label>
                    <Input id={`line-quantity-${index}`} type="number" {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor={`line-unit-price-${index}`}>Unit Price</Label>
                    <Input id={`line-unit-price-${index}`} type="number" step="0.01" {...form.register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor={`line-tax-${index}`}>Tax %</Label>
                    <Input id={`line-tax-${index}`} type="number" step="0.01" {...form.register(`lineItems.${index}.taxRate`, { valueAsNumber: true })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="invoice-notes">Notes</Label>
            <Textarea id="invoice-notes" {...form.register("notes")} />
          </div>

          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving invoice..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
