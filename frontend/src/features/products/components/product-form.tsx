"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { productFormSchema, type ProductFormSchema } from "../schema";
import type { ProductFormValues } from "../types";

export function ProductForm({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: ProductFormValues;
  submitLabel: string;
  description: string;
  onSubmit: (values: ProductFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Product Form</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="product-code">Product Code</Label>
              <Input id="product-code" {...form.register("code")} />
            </div>
            <div>
              <Label htmlFor="product-sku">SKU</Label>
              <Input id="product-sku" {...form.register("sku")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input id="product-name" {...form.register("name")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" {...form.register("description")} />
            </div>
            <div>
              <Label htmlFor="product-status">Status</Label>
              <Select id="product-status" {...form.register("status")}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="discontinued">Discontinued</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-type">Type</Label>
              <Select id="product-type" {...form.register("type")}>
                <option value="finished_good">Finished good</option>
                <option value="raw_material">Raw material</option>
                <option value="consumable">Consumable</option>
                <option value="service">Service</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Input id="product-category" {...form.register("category")} />
            </div>
            <div>
              <Label htmlFor="product-uom">Unit of Measure</Label>
              <Input id="product-uom" {...form.register("unitOfMeasure")} />
            </div>
            <div>
              <Label htmlFor="product-barcode">Barcode</Label>
              <Input id="product-barcode" {...form.register("barcode")} />
            </div>
            <div>
              <Label htmlFor="product-tax-code">Tax Code</Label>
              <Input id="product-tax-code" {...form.register("taxCode")} />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-950">Supplier</p>
            </div>
            <div>
              <Label htmlFor="supplier-name">Supplier Name</Label>
              <Input id="supplier-name" {...form.register("supplierName")} />
            </div>
            <div>
              <Label htmlFor="supplier-code">Supplier Code</Label>
              <Input id="supplier-code" {...form.register("supplierCode")} />
            </div>
            <div>
              <Label htmlFor="supplier-lead-time">Lead Time Days</Label>
              <Input id="supplier-lead-time" type="number" {...form.register("supplierLeadTimeDays", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="supplier-moq">Minimum Order Quantity</Label>
              <Input id="supplier-moq" type="number" {...form.register("supplierMinimumOrderQuantity", { valueAsNumber: true })} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="supplier-terms">Payment Terms</Label>
              <Input type="number" id="supplier-terms" {...form.register("supplierPaymentTerms", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-950">Pricing</p>
            </div>
            <div>
              <Label htmlFor="cost-price">Cost Price</Label>
              <Input id="cost-price" type="number" step="0.01" {...form.register("costPrice", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="sale-price">Sale Price</Label>
              <Input id="sale-price" type="number" step="0.01" {...form.register("salePrice", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="wholesale-price">Wholesale Price</Label>
              <Input id="wholesale-price" type="number" step="0.01" {...form.register("wholesalePrice", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="tax-rate">Tax Rate</Label>
              <Input id="tax-rate" type="number" step="0.01" {...form.register("taxRate", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold text-slate-950">Stock</p>
            </div>
            <div>
              <Label htmlFor="opening-on-hand">On Hand</Label>
              <Input id="opening-on-hand" type="number" {...form.register("openingOnHand", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="reserved-stock">Reserved</Label>
              <Input id="reserved-stock" type="number" {...form.register("reservedStock", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="incoming-stock">Incoming</Label>
              <Input id="incoming-stock" type="number" {...form.register("incomingStock", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="reorder-point">Reorder Point</Label>
              <Input id="reorder-point" type="number" {...form.register("reorderPoint", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="safety-stock">Safety Stock</Label>
              <Input id="safety-stock" type="number" {...form.register("safetyStock", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="primary-warehouse">Primary Warehouse</Label>
              <Input id="primary-warehouse" {...form.register("primaryWarehouse")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="primary-bin">Primary Bin</Label>
              <Input id="primary-bin" {...form.register("primaryBin")} />
            </div>
          </div>

          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving product..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
