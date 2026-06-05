"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeftRight, Landmark } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/utils/formatters";
import { useTransactionsQuery } from "../hooks/use-transactions-query";
import { TransactionStatusBadge } from "./transaction-status-badge";
import { TransactionSummary } from "./transaction-summary";

export function TransactionDashboardView() {
  const query = useTransactionsQuery();

  if (query.isError) {
    return <ModuleError title="Transactions unavailable" message="We could not load transaction and reconciliation insights for this workspace." retry={() => query.refetch()} />;
  }

  if (!query.data?.transactions.length) {
    return <EmptyState title="No transactions" description="Transactions will appear here once bank, cash, or journal activity is posted." />;
  }

  const { alerts, reconciliations, summary, transactions } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transaction Dashboard"
        description="A finance operations view for cash movement, posting health, exceptions, and reconciliation progress."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions/reconciliation">Bank Reconciliation</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/transactions/list">Transaction List</Link>
            </Button>
          </>
        }
      />

      <TransactionSummary
        items={[
          { label: "Transactions", value: String(summary.totalTransactions), detail: "Recent bank, cash, and journal movements." },
          { label: "Pending", value: String(summary.pendingTransactions), detail: "Transactions still awaiting final posting or feed confirmation." },
          { label: "Exceptions", value: String(summary.exceptions), detail: "Items requiring finance review or clearing action." },
          { label: "Net Movement", value: formatCompactCurrency(summary.netMovement), detail: "Aggregate cash movement across the visible transaction set." },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Recent Transactions</p>
              <Button asChild size="sm" variant="ghost">
                <Link href="/transactions/list">View all</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{transaction.reference}</p>
                      <p className="text-sm text-slate-500">
                        {transaction.counterparty} · {transaction.account}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(transaction.direction === "inflow" ? transaction.amount : -transaction.amount)}</p>
                      <TransactionStatusBadge status={transaction.status} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{transaction.memo}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-950">Reconciliation Pulse</p>
            </div>
            <div className="space-y-3">
              {reconciliations.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{item.bankAccount}</p>
                    <Badge variant={item.status === "balanced" ? "success" : item.status === "attention" ? "danger" : "warning"}>{item.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Statement: {formatCurrency(item.statementBalance)}</div>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Ledger: {formatCurrency(item.ledgerBalance)}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Variance {formatCurrency(item.variance)} · {item.unmatchedCount} unmatched · Owner {item.owner}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-slate-950">Alerts</p>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{alert.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-950">Workflow Focus</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">Use the transaction list for posting review and the reconciliation page for statement matching and variance clearing.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
