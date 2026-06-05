"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, Search } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTransactionsQuery } from "../hooks/use-transactions-query";
import type { TransactionFiltersState } from "../types";
import { TransactionSummary } from "./transaction-summary";
import { TransactionTable } from "./transaction-table";

export function TransactionListView() {
  const query = useTransactionsQuery();
  const [filters, setFilters] = useState<TransactionFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const transactions = data?.transactions ?? [];
  const summary = data?.summary;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [transaction.reference, transaction.counterparty, transaction.account, transaction.memo].some((value) =>
          value.toLowerCase().includes(filters.search.toLowerCase()),
        );
      const matchesStatus = filters.status === "all" || transaction.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, filters]);

  if (query.isError) {
    return <ModuleError title="Transactions unavailable" message="We could not load transaction postings for this workspace." retry={() => query.refetch()} />;
  }

  if (!data || !summary) return null;

  if (transactions.length === 0) {
    return <EmptyState title="No transactions found" description="Transactions will populate here after posting and bank feed import." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transaction List"
        description="Review and filter posted, pending, matched, and exception transactions across cash operations."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions">Dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/transactions/reconciliation">Open Reconciliation</Link>
            </Button>
          </>
        }
      />

      <TransactionSummary
        items={[
          { label: "Transactions", value: String(summary.totalTransactions), detail: "Current movement records in the workspace." },
          { label: "Pending", value: String(summary.pendingTransactions), detail: "Transactions still awaiting confirmation." },
          { label: "Exceptions", value: String(summary.exceptions), detail: "Transactions requiring manual review." },
          { label: "Net Movement", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(summary.netMovement), detail: "Aggregate movement across all listed records." },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="border-0 bg-transparent px-0"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search reference, counterparty, account, or memo..."
                value={filters.search}
              />
            </div>
            <div className="flex items-center gap-3">
              <ListFilter className="h-4 w-4 text-slate-400" />
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:w-[220px]"
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TransactionFiltersState["status"] }))}
                value={filters.status}
              >
                <option value="all">All statuses</option>
                <option value="posted">Posted</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="exception">Exception</option>
              </select>
            </div>
          </div>

          {filteredTransactions.length ? (
            <TransactionTable transactions={filteredTransactions} />
          ) : (
            <EmptyState title="No matching transactions" description="Adjust your search or status filter to widen the visible result set." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
