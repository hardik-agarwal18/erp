"use client";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { useCreateBankReconciliationMutation, useReconciliationsQuery } from "../hooks/use-transactions-query";
import { BankReconciliationForm } from "./bank-reconciliation-form";

export function BankReconciliationView() {
  const query = useReconciliationsQuery();
  const mutation = useCreateBankReconciliationMutation();

  if (query.isError) {
    return <ModuleError title="Reconciliation unavailable" message="We could not load bank reconciliation cycles for this workspace." retry={() => query.refetch()} />;
  }

  if (!query.data?.length) {
    return <EmptyState title="No reconciliations" description="Open the first bank reconciliation cycle to begin matching statements and ledger activity." />;
  }

  const reconciliations = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bank Reconciliation"
        description="Review statement versus ledger balances, unmatched items, and variance ownership across bank accounts."
        actions={
          <Button size="sm" variant="outline">
            Export Recon Pack
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Bank Account</TableHeaderCell>
                    <TableHeaderCell>Statement Date</TableHeaderCell>
                    <TableHeaderCell className="text-right">Statement</TableHeaderCell>
                    <TableHeaderCell className="text-right">Ledger</TableHeaderCell>
                    <TableHeaderCell className="text-right">Variance</TableHeaderCell>
                    <TableHeaderCell className="text-right">Unmatched</TableHeaderCell>
                    <TableHeaderCell>Owner</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {reconciliations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-950">{item.bankAccount}</TableCell>
                      <TableCell>{item.statementDate}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.statementBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.ledgerBalance)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.variance)}</TableCell>
                      <TableCell className="text-right">{item.unmatchedCount}</TableCell>
                      <TableCell>{item.owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <BankReconciliationForm
          defaultValues={{
            bankAccount: "Operating Account - Chase",
            statementDate: "2026-05-29",
            statementBalance: 412800,
            ledgerBalance: 409115,
            owner: "Ava Nolan",
          }}
          pending={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
          }}
        />
      </div>
    </div>
  );
}
