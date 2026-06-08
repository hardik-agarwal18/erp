"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@/types/app";
import { formatCompactCurrency, formatCurrency } from "@/utils/formatters";
import { useInvoicesQuery } from "../hooks/use-invoices-query";
import type { InvoiceFiltersState } from "../types";
import { InvoiceTable } from "./invoice-table";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { TrendChart } from "@/features/dashboard/components/trend-chart";
import { AlertWidget, AlertWidgetItem } from "@/features/dashboard/components/alert-widget";
import { ActionList, ActionListItem } from "@/features/dashboard/components/action-list";
import { cn } from "@/lib/utils";

const EMPTY_INVOICES: Invoice[] = [];

// Placeholder data for TrendChart until API supports revenue trends
const MOCK_REVENUE_TREND = [
  { month: "Jan", revenue: 12000, target: 10000 },
  { month: "Feb", revenue: 15000, target: 11000 },
  { month: "Mar", revenue: 14000, target: 12000 },
  { month: "Apr", revenue: 18000, target: 13000 },
  { month: "May", revenue: 22000, target: 14000 },
  { month: "Jun", revenue: 25000, target: 15000 },
];

export function InvoiceListView() {
  const query = useInvoicesQuery();
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const invoices = data?.invoices ?? EMPTY_INVOICES;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [invoice.invoiceNumber, invoice.customer, invoice.salesRep].some((value) => value.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesStatus = filters.status === "all" || invoice.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, filters]);

  if (query.isError) {
    return <ModuleError title="Invoices unavailable" message="We could not load receivables data for this workspace." retry={() => query.refetch()} />;
  }

  if (!data?.invoices.length) {
    return <EmptyState title="No invoices yet" description="Create your first invoice to begin receivables tracking." actionLabel="Create invoice" />;
  }

  const { summary } = data;

  // Derive Alerts (Overdue Invoices)
  const overdueInvoices = invoices.filter(i => i.status === "overdue" && i.balance > 0);
  const alertItems: AlertWidgetItem[] = overdueInvoices.slice(0, 5).map(inv => ({
    id: inv.id,
    title: inv.customer,
    subtitle: `${inv.invoiceNumber} - ${formatCurrency(inv.balance, inv.currency || "INR")}`,
    badgeLabel: "Overdue",
    badgeVariant: "danger"
  }));

  // Derive Action List (Drafts)
  const draftInvoices = invoices.filter(i => i.status === "draft");
  const actionItems: ActionListItem[] = draftInvoices.slice(0, 5).map(inv => ({
    id: inv.id,
    title: inv.invoiceNumber,
    detail: inv.customer,
    timestamp: inv.issueDate || "No date"
  }));

  const handleTabChange = (val: string) => {
    setFilters(prev => ({ ...prev, status: val as any }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales Dashboard"
        description="Full invoice operations with drafting, review, customer billing, and follow-up visibility."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">Customer Accounts</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/invoices/create">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Outstanding" value={formatCompactCurrency(summary.outstandingBalance)} trend={5.2} detail="vs last month" />
        <MetricCard label="Paid This Month" value={formatCompactCurrency(summary.paidThisMonth)} trend={12.1} detail="vs last month" />
        <MetricCard label="Overdue" value={String(summary.overdueCount)} trend={-2.1} detail="vs last month" />
        <MetricCard label="Drafts" value={String(summary.draftCount)} />
        <MetricCard label="Total Invoices" value={String(summary.totalInvoices)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart 
            title="Revenue Performance" 
            description="Monthly invoiced revenue vs target"
            data={MOCK_REVENUE_TREND}
            dataKeys={[
              { key: "revenue", name: "Revenue", type: "area", color: "hsl(var(--primary))" },
              { key: "target", name: "Target", type: "line", color: "hsl(var(--muted-foreground))" }
            ]}
            valueFormatter={(val: any) => `$${(val / 1000).toFixed(1)}k`}
          />
        </div>
        <div className="space-y-4">
          <AlertWidget title="Overdue Collections" items={alertItems} />
          <ActionList title="Drafts Awaiting Review" items={actionItems} emptyMessage="No drafts pending." />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Sales Ledgers</CardTitle>
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto">
              {["all", "draft", "sent", "paid", "overdue"].map((statusValue) => (
                <button
                  key={statusValue}
                  onClick={() => handleTabChange(statusValue)}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 capitalize",
                    filters.status === statusValue ? "bg-background text-foreground shadow" : "hover:text-foreground"
                  )}
                >
                  {statusValue}
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
                placeholder="Search invoice number, customer, or rep..."
                value={filters.search}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
              <Button variant="outline" size="sm">
                Sales Rep
                <UserIcon className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="outline" size="sm">
                Date Range
                <CalendarIcon className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="outline" size="sm">
                Status
                <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <InvoiceTable invoices={filteredInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
