"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { vendorFormSchema, type VendorFormSchema } from "../schema";
import type { VendorFormValues } from "../types";

export function VendorForm({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: VendorFormValues;
  submitLabel: string;
  description: string;
  onSubmit: (values: VendorFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<VendorFormSchema>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Vendor Form</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="vendor-code">Vendor Code</Label>
              <Input id="vendor-code" {...form.register("code")} />
            </div>
            <div>
              <Label htmlFor="vendor-name">Display Name</Label>
              <Input id="vendor-name" {...form.register("name")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="vendor-legal-name">Legal Name</Label>
              <Input id="vendor-legal-name" {...form.register("legalName")} />
            </div>
            <div>
              <Label htmlFor="vendor-email">Email</Label>
              <Input id="vendor-email" type="email" {...form.register("email")} />
            </div>
            <div>
              <Label htmlFor="vendor-phone">Phone</Label>
              <Input id="vendor-phone" {...form.register("phone")} />
            </div>
            <div>
              <Label htmlFor="vendor-status">Status</Label>
              <Select id="vendor-status" {...form.register("status")}>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor-category">Category</Label>
              <Select id="vendor-category" {...form.register("category")}>
                <option value="raw_materials">Raw materials</option>
                <option value="services">Services</option>
                <option value="logistics">Logistics</option>
                <option value="electronics">Electronics</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor-gstin">GSTIN / Tax ID</Label>
              <Input id="vendor-gstin" {...form.register("gstin")} />
            </div>
            <div>
              <Label htmlFor="vendor-currency">Currency</Label>
              <Input id="vendor-currency" {...form.register("currency")} />
            </div>
            <div>
              <Label htmlFor="vendor-payment-terms">Payment Terms</Label>
              <Input id="vendor-payment-terms" {...form.register("paymentTerms")} />
            </div>
            <div>
              <Label htmlFor="vendor-lead-time">Lead Time (days)</Label>
              <Input id="vendor-lead-time" type="number" {...form.register("leadTimeDays", { valueAsNumber: true })} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="vendor-manager">Account Manager</Label>
              <Input id="vendor-manager" {...form.register("accountManager")} />
            </div>
            <div>
              <Label htmlFor="vendor-billing">Billing Address</Label>
              <Textarea id="vendor-billing" {...form.register("billingAddress")} />
            </div>
            <div>
              <Label htmlFor="vendor-shipping">Shipping Address</Label>
              <Textarea id="vendor-shipping" {...form.register("shippingAddress")} />
            </div>
          </div>
          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving vendor..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
