"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Search, Filter, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useExport } from "../hooks/use-export";

import { MetricCard } from "@/features/dashboard/components/metric-card";
import { MetricCardSkeleton } from "@/components/skeletons/metric-card-skeleton";
import { ActionList, ActionListItem } from "@/features/dashboard/components/action-list";
import { useDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-query";
import { formatCompactCurrency } from "@/utils/formatters";
import { faker } from "@faker-js/faker";

type ReportDefinition = {
  id: string;
  name: string;
  description: string;
  category: "Financial" | "Operations" | "Tax";
  lastGenerated: string | null;
  frequency: "Monthly" | "On-Demand" | "Quarterly";
  type: string;
};

const REPORTS_CATALOG: ReportDefinition[] = [
  { id: "sales", name: "Sales Ledger", description: "Export all invoices, grouped by customer, including totals and status.", category: "Financial", lastGenerated: null, frequency: "Monthly", type: "sales" },
  { id: "inventory", name: "Inventory Valuation", description: "Export current stock levels, valuation, and low stock items.", category: "Operations", lastGenerated: null, frequency: "On-Demand", type: "inventory" },
  { id: "tax", name: "Tax Summary", description: "Export total tax collected vs paid over a period.", category: "Tax", lastGenerated: null, frequency: "Quarterly", type: "tax" },
  { id: "expenses", name: "Expense Breakdown", description: "Export categorized business expenses.", category: "Financial", lastGenerated: null, frequency: "Monthly", type: "expenses" },
];

function ReportActionCell({ reportType }: { reportType: string }) {
  const { requestExport, isRequesting, status, url, reset } = useExport();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("raw");

  if (status === "completed" && url) {
    return (
      <div className="flex items-center justify-end gap-2">
        <p className="text-xs text-green-600 font-medium">Ready</p>
        <Button asChild size="sm" variant="default">
          <a href={url} target="_blank" rel="noreferrer">Download</a>
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center justify-end gap-2">
        <p className="text-xs text-rose-600 font-medium">Failed</p>
        <Button size="sm" variant="outline" onClick={reset}>Retry</Button>
      </div>
    );
  }

  if (isRequesting || (status && status !== "completed")) {
    return (
      <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs capitalize">{status || "queued"}...</span>
      </div>
    );
  }

  const handleGenerate = () => {
    requestExport({
      reportType,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      frequency,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex justify-end">
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-3 w-3" />
            Generate
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Configure date range and grouping frequency for your report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Grouping Frequency</Label>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)} id="frequency">
              <option value="raw">Raw (No Grouping)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReportsView() {
  const [search, setSearch] = useState("");
  const dashboardQuery = useDashboardQuery();

  const columns = useMemo<ColumnDef<ReportDefinition>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Report Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="neutral">{row.original.category}</Badge>,
      },
      {
        accessorKey: "lastGenerated",
        header: "Last Generated",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.lastGenerated || "Never"}</span>,
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <ReportActionCell reportType={row.original.type} />,
      },
    ],
    []
  );

  const reportsWithDates = useMemo(() => {
    return REPORTS_CATALOG.map(r => ({
      ...r,
      lastGenerated: faker.date.recent({ days: 10 }).toISOString().replace('T', ' ').substring(0, 16)
    }));
  }, []);

  const filteredReports = useMemo(() => {
    return reportsWithDates.filter(report => 
      report.name.toLowerCase().includes(search.toLowerCase()) || 
      report.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, reportsWithDates]);

  const recentReports = useMemo<ActionListItem[]>(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `r${i}`,
      title: faker.helpers.arrayElement(["Sales Ledger", "Inventory Valuation", "Tax Summary", "Expense Breakdown", "Trial Balance"]),
      detail: `Generated by ${faker.person.fullName()}`,
      timestamp: faker.date.recent({ days: 2 }).toLocaleString(),
    }));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports Dashboard"
        description="Generate, track, and export comprehensive CSV/PDF reports from your ERP data."
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
        {dashboardQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))
        ) : dashboardQuery.data?.kpis ? (
          dashboardQuery.data.kpis.slice(0, 5).map((metric: any) => {
            const isCurrency = ["Revenue", "Expenses", "Profit", "Tax Collected", "Inventory Value", "Avg Invoice"].includes(metric.label);
            const displayValue = isCurrency ? formatCompactCurrency(metric.value) : metric.value >= 1000 ? `${(metric.value / 1000).toFixed(1)}k` : metric.value.toString();
            
            return (
              <MetricCard 
                key={metric.label} 
                label={metric.label} 
                value={displayValue} 
                trend={metric.trend} 
                detail={metric.detail} 
              />
            );
          })
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border mb-4">
              <CardTitle>Report Catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 bg-background"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reports by name or description..."
                    value={search}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
                  <Button variant="outline" size="sm">
                    Category
                    <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Date Range
                    <CalendarIcon className="ml-2 h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Owner
                    <UserIcon className="ml-2 h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredReports}
                density="comfortable"
                emptyMessage="No reports found matching your criteria."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ActionList title="Recent Exports" items={recentReports} emptyMessage="No recently generated reports." />
        </div>
      </div>
    </div>
  );
}
