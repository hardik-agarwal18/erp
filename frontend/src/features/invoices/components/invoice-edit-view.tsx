"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCustomersQuery } from "@/features/customers/hooks/use-customers-query";
import { useProductsQuery } from "@/features/products/hooks/use-products-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { useInvoiceDetailQuery } from "../hooks/use-invoices-query";
import { updateLiveInvoice } from "../service";

export function InvoiceEditView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const detailQuery = useInvoiceDetailQuery(invoiceId);
  const customersQuery = useCustomersQuery();
  const productsQuery = useProductsQuery();

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<{ id: string; productId: string; quantity: number; unitPrice: number }[]>([]);
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ISSUED" | "CANCELLED">("DRAFT");
  const [error, setError] = useState<string | null>(null);
  
  const invoice = detailQuery.data;

  // Initialize form state once data is loaded
  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customerId ?? "");
      setIssueDate(invoice.issueDate ?? "");
      setDueDate(invoice.dueDate ?? "");
      setNotes(invoice.notes ?? "");
      
      const st = invoice.status === "draft" ? "DRAFT" : invoice.status === "sent" ? "ISSUED" : invoice.status === "paid" ? "ISSUED" : invoice.status === "partial" ? "ISSUED" : "CANCELLED";
      setStatus(st);
      
      if (invoice.lineItems && invoice.lineItems.length > 0) {
        setItems(
          invoice.lineItems.map((item, index) => ({
            id: item.id || String(index),
            productId: item.productId ?? "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        );
      } else {
        setItems([{ id: Date.now().toString(), productId: "", quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [invoice]);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateLiveInvoice>[1]) => updateLiveInvoice(invoiceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoiceDetail(workspace.id, invoiceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices(workspace.id) });
      router.push(`/invoices/${invoiceId}`);
    },
  });

  if (detailQuery.isError) {
    return <ModuleError title="Invoice unavailable" message="We could not open this invoice for editing." retry={() => detailQuery.refetch()} />;
  }

  if (!invoice) {
    return <EmptyState title="Loading..." description="Please wait..." />;
  }

  const customers = customersQuery.data?.customers ?? [];
  const products = productsQuery.data?.products ?? [];
  
  const isDraft = status === "DRAFT" && invoice.status === "draft";
  const canEditLineItems = isDraft;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        description="Update invoice details. Some fields are locked after the invoice is issued."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${invoice.id}`)}>
            View Invoice
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice Form</CardTitle>
              <CardDescription>
                {canEditLineItems ? "You can edit all fields because this invoice is still a Draft." : "This invoice has been issued. You can only update the status, due date, and notes."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  setError(null);
                  const payload: any = {
                    status,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                    notes: notes || "",
                  };
                  
                  if (canEditLineItems) {
                    payload.customerId = customerId;
                    payload.issueDate = new Date(issueDate).toISOString();
                    payload.items = items.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice || undefined,
                    }));
                  }

                  await mutation.mutateAsync(payload);
                } catch (submissionError) {
                  setError(submissionError instanceof Error ? submissionError.message : "Unable to update invoice");
                }
              }}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="invoice-customer">Customer</Label>
                  <Select id="invoice-customer" value={customerId} disabled={!canEditLineItems} onChange={(event) => setCustomerId(event.target.value)}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-status">Status</Label>
                  <Select id="invoice-status" value={status} onChange={(event) => setStatus(event.target.value as "DRAFT" | "ISSUED" | "CANCELLED")}>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-issue-date">Issue date</Label>
                  <Input id="invoice-issue-date" type="date" disabled={!canEditLineItems} value={issueDate.slice(0, 10)} onChange={(event) => setIssueDate(event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="invoice-due-date">Due date</Label>
                  <Input id="invoice-due-date" type="date" value={dueDate.slice(0, 10)} onChange={(event) => setDueDate(event.target.value)} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Line Items</p>
                  {canEditLineItems && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setItems([...items, { id: Date.now().toString(), productId: "", quantity: 1, unitPrice: 0 }])}
                    >
                      Add Item
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_100px_120px_auto]">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={item.productId}
                          disabled={!canEditLineItems}
                          onChange={(event) => {
                            const nextProductId = event.target.value;
                            const product = products.find((entry) => entry.id === nextProductId);
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              productId: nextProductId,
                              unitPrice: product?.pricing.salePrice ?? 0,
                            };
                            setItems(newItems);
                          }}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          min={1}
                          type="number"
                          disabled={!canEditLineItems}
                          value={item.quantity}
                          onChange={(event) => {
                            const newItems = [...items];
                            newItems[index].quantity = Number(event.target.value);
                            setItems(newItems);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          min={0}
                          step="0.01"
                          type="number"
                          disabled={!canEditLineItems}
                          value={item.unitPrice}
                          onChange={(event) => {
                            const newItems = [...items];
                            newItems[index].unitPrice = Number(event.target.value);
                            setItems(newItems);
                          }}
                        />
                      </div>
                      {canEditLineItems && items.length > 1 && (
                        <div className="flex items-end pb-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => setItems(items.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="invoice-notes">Notes</Label>
                <Textarea id="invoice-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button className="w-full lg:w-auto" disabled={mutation.isPending || (canEditLineItems && items.some(i => !i.productId))} type="submit">
                {mutation.isPending ? "Saving changes..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Live backend constraints</p>
            {[
              "Line items, customer, and issue date can only be edited while the invoice is in Draft status.",
              "Changing status from Draft to Issued will trigger stock reductions for physical products.",
              "Invoice payments are tracked separately through the payments backend module.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
