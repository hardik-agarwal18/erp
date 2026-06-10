"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { taxFormSchema, type TaxFormSchema } from "../schema";

export function TaxForm({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: Partial<TaxFormSchema>;
  submitLabel: string;
  description: string;
  onSubmit: (values: TaxFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<TaxFormSchema>({
    resolver: zodResolver(taxFormSchema) as any,
    defaultValues: defaultValues as any,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Tax Configuration Form</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => onSubmit(values as TaxFormSchema))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input id="tax-name" {...form.register("name")} placeholder="e.g. Standard GST" />
            </div>
            <div>
              <Label htmlFor="tax-rate">Rate (%)</Label>
              <Input id="tax-rate" type="number" step="0.01" {...form.register("rate", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="tax-type">Tax Type</Label>
              <Select id="tax-type" {...form.register("type")}>
                <option value="GST">GST</option>
                <option value="VAT">VAT</option>
                <option value="SALES_TAX">Sales Tax</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 lg:col-span-2">
              <input 
                type="checkbox" 
                id="tax-default" 
                {...form.register("isDefault")} 
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <Label htmlFor="tax-default" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Set as Default Tax
              </Label>
            </div>
          </div>
          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
