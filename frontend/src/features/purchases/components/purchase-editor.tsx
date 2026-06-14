"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { purchaseOrderSchema, type PurchaseOrderSchema } from "../schema";
import type { PurchaseFormValues } from "../types";

export function PurchaseEditor({
  defaultValues,
  description,
  submitLabel,
  pending,
  onSubmit,
}: {
  defaultValues: PurchaseFormValues;
  description: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: PurchaseOrderSchema) => Promise<void> | void;
}) {
  const form = useForm<PurchaseOrderSchema>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Purchase Order Editor</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="po-vendor">Vendor</Label>
              <Input id="po-vendor" {...form.register("vendor")} />
            </div>
            <div>
              <Label htmlFor="po-number">PO #</Label>
              <Input id="po-number" {...form.register("number")} />
            </div>
            <div>
              <Label htmlFor="po-order-date">Order Date</Label>
              <Input id="po-order-date" type="date" {...form.register("orderDate")} />
            </div>
            <div>
              <Label htmlFor="po-expected-date">Expected Date</Label>
              <Input id="po-expected-date" type="date" {...form.register("expectedDate")} />
            </div>
            <div>
              <Label htmlFor="po-warehouse">Warehouse</Label>
              <Select id="po-warehouse" {...form.register("warehouse")}>
                <option value="Dallas Central">Dallas Central</option>
                <option value="Phoenix West">Phoenix West</option>
                <option value="Chicago North">Chicago North</option>
                <option value="Atlanta South">Atlanta South</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="po-buyer">Buyer</Label>
              <Input id="po-buyer" {...form.register("buyer")} />
            </div>
            <div>
              <Label htmlFor="po-stage">Approval Stage</Label>
              <Input id="po-stage" {...form.register("approvalStage")} />
            </div>
            <div>
              <Label htmlFor="po-terms">Payment Terms</Label>
              <Input type="number" id="po-terms" {...form.register("paymentTerms", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-950">Line Items</p>
            <div className="mt-4 space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_120px_140px]">
                  <div>
                    <Label htmlFor={`po-line-description-${index}`}>Description {index + 1}</Label>
                    <Input id={`po-line-description-${index}`} {...form.register(`lineItems.${index}.description`)} />
                  </div>
                  <div>
                    <Label htmlFor={`po-line-quantity-${index}`}>Quantity</Label>
                    <Input id={`po-line-quantity-${index}`} type="number" {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor={`po-line-unit-price-${index}`}>Unit Price</Label>
                    <Input id={`po-line-unit-price-${index}`} type="number" step="0.01" {...form.register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="po-notes">Notes</Label>
            <Textarea id="po-notes" {...form.register("notes")} />
          </div>

          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving purchase order..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
