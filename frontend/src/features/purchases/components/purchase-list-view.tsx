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
import { usePurchasesQuery } from "../hooks/use-purchases-query";
import type { PurchaseFiltersState } from "../types";
import { PurchaseTable } from "./purchase-table";
import { cn } from "@/lib/utils";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { TrendChart } from "@/features/dashboard/components/trend-chart";
import { AlertWidget, AlertWidgetItem } from "@/features/dashboard/components/alert-widget";
import { ActionList, ActionListItem } from "@/features/dashboard/components/action-list";

// Placeholder data for TrendChart
const MOCK_SPEND_TREND = [
  { month: "Jan", spend: 45000, budget: 50000 },
  { month: "Feb", spend: 52000, budget: 50000 },
  { month: "Mar", spend: 48000, budget: 50000 },
  { month: "Apr", spend: 61000, budget: 55000 },
  { month: "May", spend: 59000, budget: 55000 },
  { month: "Jun", spend: 65000, budget: 60000 },
];

export function PurchaseListView() {
  const query = usePurchasesQuery();
  const [filters, setFilters] = useState<PurchaseFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const orders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const summary = data?.summary;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [order.vendor, order.number, order.buyer, order.warehouse].some((value) => value.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesStatus = filters.status === "all" || order.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, filters]);

  const handleTabChange = (val: string) => {
    setFilters(prev => ({ ...prev, status: val as any }));
  };

  if (query.isError) {
    return <ModuleError title="Purchases unavailable" message="We could not load purchase orders and vendor bills." retry={() => query.refetch()} />;
  }

  if (!data || !summary) return null;

  if (orders.length === 0) {
    return <EmptyState title="No purchase orders" description="Create a vendor order to start procurement tracking." actionLabel="New PO" />;
  }

  // Derive Alerts (Delayed POs, Delivery Issues)
  const delayedOrders = orders.filter(o => o.status !== "received" && o.status !== "billed" && new Date(o.expectedDate) < new Date());
  const alertItems: AlertWidgetItem[] = delayedOrders.slice(0, 5).map(order => ({
    id: order.id,
    title: order.vendor,
    subtitle: `${order.number} - Expected ${order.expectedDate}`,
    badgeLabel: "Delayed",
    badgeVariant: "danger"
  }));

  // Derive Action List (Pending Approvals & GRNs)
  const pendingApprovals = orders.filter(o => o.status === "pending_approval");
  const actionItems: ActionListItem[] = pendingApprovals.slice(0, 5).map(order => ({
    id: order.id,
    title: order.number,
    detail: `Awaiting approval for ${order.vendor}`,
    timestamp: order.orderDate || "Pending"
  }));

  // Derive Vendor Performance Widget stats
  // For demonstration, deriving "Late Deliveries" logic:
  const lateCount = delayedOrders.length;
  const totalOrders = orders.length;
  const reliabilityScore = totalOrders > 0 ? Math.max(0, 100 - Math.round((lateCount / totalOrders) * 100)) : 100;
  
  const vendorPerformanceItems: AlertWidgetItem[] = [
    { id: 'rel', title: "Overall Reliability", value: `${reliabilityScore}%`, badgeLabel: reliabilityScore >= 90 ? "Excellent" : "Needs Review", badgeVariant: reliabilityScore >= 90 ? "success" : "warning" },
    { id: 'late', title: "Currently Late Deliveries", value: String(lateCount), badgeLabel: "Active", badgeVariant: lateCount > 0 ? "danger" : "neutral" }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchasing Dashboard"
        description="Manage procurement demand, supplier commitments, receipt progress, and outstanding liability."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/purchases/goods-received-notes">Goods Received Notes</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/purchases/create">
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summary.map((item: any, i: number) => (
          <MetricCard 
            key={item.label} 
            label={item.label} 
            value={item.value} 
            detail={item.detail} 
            trend={i === 0 ? 3.4 : undefined} // Add some visual trend flavor
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <TrendChart 
            title="Monthly Spend vs Budget" 
            description="Procurement expenditure relative to allocated budget"
            data={MOCK_SPEND_TREND}
            dataKeys={[
              { key: "spend", name: "Spend", type: "bar", color: "hsl(var(--primary))" },
              { key: "budget", name: "Budget", type: "line", color: "hsl(var(--muted-foreground))" }
            ]}
            valueFormatter={(val: any) => `₹${(val / 1000).toFixed(1)}k`}
            height={280}
          />
          <AlertWidget title="Vendor Performance" items={vendorPerformanceItems} />
        </div>
        <div className="space-y-4">
          <AlertWidget title="Delivery Escalations" items={alertItems} />
          <ActionList title="Awaiting Approval" items={actionItems} emptyMessage="No approvals pending." />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Purchase Ledgers</CardTitle>
            <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto">
              {["all", "draft", "pending_approval", "approved", "received", "closed"].map((statusValue) => (
                <button
                  key={statusValue}
                  onClick={() => handleTabChange(statusValue)}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 capitalize",
                    filters.status === statusValue ? "bg-background text-foreground shadow" : "hover:text-foreground"
                  )}
                >
                  {statusValue.replace("_", " ")}
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
                placeholder="Search vendor, PO number, buyer, warehouse..."
                value={filters.search}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
              <Button variant="outline" size="sm">
                Vendor
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

          <PurchaseTable orders={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
