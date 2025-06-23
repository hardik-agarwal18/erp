"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { customerFormSchema, type CustomerFormSchema } from "../schema";
import type { CustomerFormValues } from "../types";

export function CustomerForm({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: CustomerFormValues;
  submitLabel: string;
  description: string;
  onSubmit: (values: CustomerFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<CustomerFormSchema>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customer Form</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="customer-code">Customer Code</Label>
              <Input id="customer-code" {...form.register("code")} />
            </div>
            <div>
              <Label htmlFor="customer-name">Display Name</Label>
              <Input id="customer-name" {...form.register("name")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="customer-legal-name">Legal Name</Label>
              <Input id="customer-legal-name" {...form.register("legalName")} />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" type="email" {...form.register("email")} />
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone</Label>
              <Input id="customer-phone" {...form.register("phone")} />
            </div>
            <div>
              <Label htmlFor="customer-status">Status</Label>
              <Select id="customer-status" {...form.register("status")}>
                <option value="active">Active</option>
                <option value="at_risk">At risk</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer-segment">Segment</Label>
              <Select id="customer-segment" {...form.register("segment")}>
                <option value="enterprise">Enterprise</option>
                <option value="mid_market">Mid-market</option>
                <option value="smb">SMB</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer-gstin">GSTIN / Tax ID</Label>
              <Input id="customer-gstin" {...form.register("gstin")} />
            </div>
            <div>
              <Label htmlFor="customer-currency">Currency</Label>
              <Input id="customer-currency" {...form.register("currency")} />
            </div>
            <div>
              <Label htmlFor="customer-payment-terms">Payment Terms</Label>
              <Input id="customer-payment-terms" {...form.register("paymentTerms")} />
            </div>
            <div>
              <Label htmlFor="customer-credit-limit">Credit Limit</Label>
              <Input id="customer-credit-limit" type="number" {...form.register("creditLimit", { valueAsNumber: true })} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="customer-owner">Account Owner</Label>
              <Input id="customer-owner" {...form.register("owner")} />
            </div>
            <div>
              <Label htmlFor="customer-billing">Billing Address</Label>
              <Textarea id="customer-billing" {...form.register("billingAddress")} />
            </div>
            <div>
              <Label htmlFor="customer-shipping">Shipping Address</Label>
              <Textarea id="customer-shipping" {...form.register("shippingAddress")} />
            </div>
          </div>
          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving customer..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
