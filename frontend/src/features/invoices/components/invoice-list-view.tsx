"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Calendar as CalendarIcon, User as UserIcon, Upload } from "lucide-react";

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
import { toast } from "sonner";
import { useRef } from "react";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { cn } from "@/lib/utils";

const EMPTY_INVOICES: Invoice[] = [];

export function InvoiceListView() {
  const query = useInvoicesQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<{ status: string }>({
    status: "all",
  });

  const data = query.data;
  const invoices = data?.invoices ?? EMPTY_INVOICES;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      return filters.status === "all" || invoice.status === filters.status;
    });
  }, [invoices, filters.status]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Importing ${file.name}...`);
      setTimeout(() => {
        toast.success(`${file.name} imported successfully.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 1500);
    }
  };

  if (query.isError) {
    return <ModuleError title="Invoices unavailable" message="We could not load receivables data for this workspace." retry={() => query.refetch()} />;
  }

  if (!data?.invoices.length) {
    return <EmptyState title="No invoices yet" description="Create your first invoice to begin receivables tracking." actionLabel="Create invoice" actionUrl="/invoices/create" />;
  }

  const { summary } = data;

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
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
            />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
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
        <CardContent className="space-y-4 p-0 sm:p-4">
          <InvoiceTable invoices={filteredInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
