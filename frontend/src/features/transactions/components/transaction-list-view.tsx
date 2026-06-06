"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListFilter, Search, Calendar as CalendarIcon, Wallet } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTransactionsQuery } from "../hooks/use-transactions-query";
import type { TransactionFiltersState } from "../types";
import { TransactionTable } from "./transaction-table";
import { cn } from "@/lib/utils";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { TrendChart } from "@/features/dashboard/components/trend-chart";
import { AlertWidget, AlertWidgetItem } from "@/features/dashboard/components/alert-widget";
import { ActionList, ActionListItem } from "@/features/dashboard/components/action-list";

// Placeholder data for TrendCharts
const MOCK_CASH_FLOW = [
  { month: "Jan", inflow: 120000, outflow: 95000 },
  { month: "Feb", inflow: 135000, outflow: 110000 },
  { month: "Mar", inflow: 140000, outflow: 105000 },
  { month: "Apr", inflow: 125000, outflow: 130000 },
  { month: "May", inflow: 155000, outflow: 115000 },
  { month: "Jun", inflow: 165000, outflow: 120000 },
];

const MOCK_EXPENSES = [
  { month: "Jan", payroll: 45000, operations: 50000 },
  { month: "Feb", payroll: 45000, operations: 65000 },
  { month: "Mar", payroll: 48000, operations: 57000 },
  { month: "Apr", payroll: 48000, operations: 82000 },
  { month: "May", payroll: 52000, operations: 63000 },
  { month: "Jun", payroll: 52000, operations: 68000 },
];

export function TransactionListView() {
  const query = useTransactionsQuery();
  const [filters, setFilters] = useState<TransactionFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const transactions = useMemo(() => data?.transactions ?? [], [data?.transactions]);
  const reconciliations = useMemo(() => data?.reconciliations ?? [], [data?.reconciliations]);
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

  const handleTabChange = (val: string) => {
    setFilters(prev => ({ ...prev, status: val as any }));
  };

  if (query.isError) {
    return <ModuleError title="Transactions unavailable" message="We could not load transaction postings for this workspace." retry={() => query.refetch()} />;
  }

  if (!data || !summary) return null;

  if (transactions.length === 0) {
    return <EmptyState title="No transactions found" description="Transactions will populate here after posting and bank feed import." />;
  }

  // Derive Alerts (Reconciliation Warnings)
  const reconAlerts: AlertWidgetItem[] = reconciliations.filter(r => r.status === "attention" || r.status === "unbalanced").slice(0, 5).map(r => ({
    id: r.id,
    title: r.bankAccount,
    subtitle: `${r.unmatchedCount} unmatched items`,
    badgeLabel: "Review Required",
    badgeVariant: "danger"
  }));

  // Derive Action List (Exceptions)
  const exceptions = transactions.filter((t: any) => t.status === "exception");
  const actionItems: ActionListItem[] = exceptions.slice(0, 5).map((t: any) => ({
    id: t.id,
    title: t.reference,
    detail: t.memo || "Requires manual clearing",
    timestamp: t.date
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounting Dashboard"
        description="Review and filter posted, pending, matched, and exception transactions across cash operations."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/transactions/reconciliation">Open Reconciliation</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Cash Position" value="$482,000" detail="Operating + Savings" trend={4.2} />
        <MetricCard label="Receivables" value="$145,500" detail="Outstanding Invoices" trend={1.1} />
        <MetricCard label="Payables" value="$82,400" detail="Pending Bills" trend={-2.4} />
        <MetricCard label="Net Profit (MTD)" value="$42,800" detail="Gross Income - Expenses" trend={12.5} />
        <MetricCard label="Expenses (MTD)" value="$64,200" detail="Total operational spend" trend={0.8} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart 
          title="Cash Flow Trend" 
          description="Inflows vs Outflows over the last 6 months"
          data={MOCK_CASH_FLOW}
          dataKeys={[
            { key: "inflow", name: "Money In", type: "bar", color: "hsl(var(--success))" },
            { key: "outflow", name: "Money Out", type: "line", color: "hsl(var(--danger))" }
          ]}
          valueFormatter={(val: any) => `$${(val / 1000).toFixed(0)}k`}
          height={280}
        />
        <TrendChart 
          title="Expense Burn Trend" 
          description="Operating expenses vs Payroll"
          data={MOCK_EXPENSES}
          dataKeys={[
            { key: "operations", name: "Operations", type: "bar", color: "hsl(var(--warning))" },
            { key: "payroll", name: "Payroll", type: "bar", color: "hsl(var(--primary))" }
          ]}
          valueFormatter={(val: any) => `$${(val / 1000).toFixed(0)}k`}
          height={280}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AlertWidget title="Reconciliation Alerts" items={reconAlerts} />
        <ActionList title="Exceptions & Overdue" items={actionItems} emptyMessage="No exceptions to clear." />
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto overflow-x-auto">
              {[
                { label: "All", value: "all" },
                { label: "Open", value: "pending" },
                { label: "Cleared", value: "posted" },
                { label: "Reconciled", value: "matched" },
                { label: "Exception", value: "exception" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    filters.status === tab.value ? "bg-background text-foreground shadow" : "hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-background"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search reference, counterparty, account, or memo..."
                value={filters.search}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
              <Button variant="outline" size="sm">
                Account
                <Wallet className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="outline" size="sm">
                Date Range
                <CalendarIcon className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="outline" size="sm">
                Status
                <ListFilter className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <TransactionTable transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
