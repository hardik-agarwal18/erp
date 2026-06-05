"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useTransactionDetailQuery } from "../hooks/use-transactions-query";
import { TransactionStatusBadge } from "./transaction-status-badge";

export function TransactionDetailsView({ transactionId }: { transactionId: string }) {
  const query = useTransactionDetailQuery(transactionId);

  if (query.isError) {
    return <ModuleError title="Transaction unavailable" message="We could not load the selected transaction record." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Transaction not found" description="The requested transaction could not be located in this workspace." actionLabel="Back to transactions" />;
  }

  const transaction = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={transaction.reference}
        description={`Detailed transaction context for ${transaction.counterparty} and ${transaction.account}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions/list">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/transactions/reconciliation">Open Reconciliation</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{transaction.counterparty}</p>
                <p className="text-sm text-slate-500">{transaction.account}</p>
              </div>
              <TransactionStatusBadge status={transaction.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Date: {transaction.date}</div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Kind: {transaction.kind}</div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Channel: {transaction.channel}</div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Direction: {transaction.direction}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Memo</p>
              <p className="mt-2 text-sm text-slate-600">{transaction.memo}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-slate-950">Financial Impact</p>
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
              Amount: {formatCurrency(transaction.direction === "inflow" ? transaction.amount : -transaction.amount)}
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Reference: {transaction.reference}</div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Workspace: {transaction.workspaceId}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
