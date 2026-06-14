"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BankAccountSelector } from "../../treasury/components/bank-account-selector";
import { Controller } from "react-hook-form";
import { expenseFormSchema, type ExpenseFormSchema } from "../schema";

export function ExpenseForm({
  defaultValues,
  submitLabel,
  description,
  onSubmit,
  pending,
}: {
  defaultValues: ExpenseFormSchema;
  submitLabel: string;
  description: string;
  onSubmit: (values: ExpenseFormSchema) => Promise<void> | void;
  pending?: boolean;
}) {
  const form = useForm<ExpenseFormSchema>({
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="expense-category">Category</Label>
              <Select id="expense-category" {...form.register("category")}>
                <option value="SALARY">Salary</option>
                <option value="RENT">Rent</option>
                <option value="UTILITIES">Utilities</option>
                <option value="MARKETING">Marketing</option>
                <option value="TRAVEL">Travel</option>
                <option value="SOFTWARE">Software</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-amount">Amount</Label>
              <Input id="expense-amount" type="number" step="0.01" {...form.register("amount")} />
            </div>
            <div>
              <Label htmlFor="expense-date">Expense Date</Label>
              <Input id="expense-date" type="date" {...form.register("expenseDate")} />
            </div>
            <div>
              <Label htmlFor="expense-vendor">Vendor ID (Optional)</Label>
              <Input id="expense-vendor" {...form.register("vendorId")} />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="expense-description">Description</Label>
              <Textarea id="expense-description" {...form.register("description")} />
            </div>
          </div>
          <Button className="w-full lg:w-auto" disabled={pending} type="submit">
            {pending ? "Saving expense..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
