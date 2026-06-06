"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bankReconciliationSchema, type BankReconciliationSchema } from "../schema";
import type { BankReconciliationFormValues } from "../types";

export function BankReconciliationForm({
  defaultValues,
  pending,
  onSubmit,
}: {
  defaultValues: BankReconciliationFormValues;
  pending?: boolean;
  onSubmit: (values: BankReconciliationSchema) => Promise<void> | void;
}) {
  const form = useForm<BankReconciliationSchema>({
    resolver: zodResolver(bankReconciliationSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Start Reconciliation</CardTitle>
          <CardDescription>Capture statement and ledger balances to open a new reconciliation cycle.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div>
            <Label htmlFor="recon-account">Bank Account</Label>
            <Input id="recon-account" {...form.register("bankAccount")} />
          </div>
          <div>
            <Label htmlFor="recon-date">Statement Date</Label>
            <Input id="recon-date" type="date" {...form.register("statementDate")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="recon-statement-balance">Statement Balance</Label>
              <Input id="recon-statement-balance" type="number" step="0.01" {...form.register("statementBalance", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="recon-ledger-balance">Ledger Balance</Label>
              <Input id="recon-ledger-balance" type="number" step="0.01" {...form.register("ledgerBalance", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label htmlFor="recon-owner">Owner</Label>
            <Input id="recon-owner" {...form.register("owner")} />
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Opening reconciliation..." : "Open reconciliation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
