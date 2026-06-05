"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
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
import { createLiveInvoice } from "../service";

export function InvoiceCreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const customersQuery = useCustomersQuery();
  const productsQuery = useProductsQuery();
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [issueDate, setIssueDate] = useState(new Date().toISOString());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ISSUED">("DRAFT");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createLiveInvoice,
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices(workspace.id) });
      router.push(`/invoices/${invoice.id}`);
    },
  });

  const customers = customersQuery.data?.customers ?? [];
  const products = productsQuery.data?.products ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Invoice"
        description="Create invoices directly against the live backend customer and product records."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push("/invoices")}>
            Back to Invoices
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Live Invoice Form</CardTitle>
              <CardDescription>This editor uses real customer and product IDs from the backend.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  setError(null);
                  await mutation.mutateAsync({
                    customerId,
                    issueDate: new Date(issueDate).toISOString(),
                    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                    notes: notes || undefined,
                    status,
                    items: [
                      {
                        productId,
                        quantity,
                        unitPrice: unitPrice || undefined,
                      },
                    ],
                  });
                } catch (submissionError) {
                  setError(submissionError instanceof Error ? submissionError.message : "Unable to create invoice");
                }
              }}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="invoice-customer">Customer</Label>
                  <Select id="invoice-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
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
                  <Select id="invoice-status" value={status} onChange={(event) => setStatus(event.target.value as "DRAFT" | "ISSUED")}>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-issue-date">Issue date</Label>
                  <Input id="invoice-issue-date" type="date" value={issueDate.slice(0, 10)} onChange={(event) => setIssueDate(event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="invoice-due-date">Due date</Label>
                  <Input id="invoice-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-3">
                <div className="lg:col-span-3">
                  <p className="text-sm font-semibold text-slate-950">Primary line item</p>
                </div>
                <div>
                  <Label htmlFor="invoice-product">Product</Label>
                  <Select
                    id="invoice-product"
                    value={productId}
                    onChange={(event) => {
                      const nextProductId = event.target.value;
                      setProductId(nextProductId);
                      const product = products.find((entry) => entry.id === nextProductId);
                      setUnitPrice(product?.pricing.salePrice ?? 0);
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
                  <Label htmlFor="invoice-quantity">Quantity</Label>
                  <Input id="invoice-quantity" min={1} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
                </div>
                <div>
                  <Label htmlFor="invoice-unit-price">Unit price</Label>
                  <Input id="invoice-unit-price" min={0} step="0.01" type="number" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} />
                </div>
              </div>

              <div>
                <Label htmlFor="invoice-notes">Notes</Label>
                <Textarea id="invoice-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button className="w-full lg:w-auto" disabled={mutation.isPending || !customerId || !productId} type="submit">
                {mutation.isPending ? "Creating invoice..." : "Create invoice"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Integration notes</p>
            {[
              "Invoice numbers are generated by the backend sequence service.",
              "Only real customers and products from the active organization are selectable.",
              "Stock will decrement automatically when the invoice is created with status Issued.",
              "This form intentionally matches the backend DTO instead of the older mock editor shape.",
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
