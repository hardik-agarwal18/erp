"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useDashboardQuery } from "../hooks/use-dashboard-query";
import { formatCurrency } from "@/utils/formatters";

import { DashboardSkeleton } from "./dashboard-skeleton";
import { MetricCard } from "./metric-card";
import { TrendChart } from "./trend-chart";
import { ActionList, ActionListItem } from "./action-list";
import { AlertWidget, AlertWidgetItem } from "./alert-widget";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";

export function DashboardView() {
  const query = useDashboardQuery();

  if (query.isLoading) {
    return <DashboardSkeleton />;
  }

  if (query.isError) {
    return (
      <ModuleError 
        title="Dashboard unavailable" 
        message="We could not load accounting and inventory insights for this workspace." 
        retry={() => query.refetch()} 
      />
    );
  }

  if (!query.data) {
    return <EmptyState title="No dashboard data" description="This workspace has not generated financial summaries yet." />;
  }

  const data = query.data;

  // Map Data to Components
  const activityItems: ActionListItem[] = data.activity.map((item: any) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    timestamp: item.time,
  }));

  const pendingActionsItems: ActionListItem[] = []; // Placeholder until API supports it

  const lowStockItems: AlertWidgetItem[] = data.lowStockAlerts.map((item: any) => ({
    id: item.id,
    title: item.item,
    subtitle: `${item.sku} · ${item.warehouse}`,
    badgeLabel: `${item.remaining} left`,
    badgeVariant: item.severity === "critical" ? "danger" : "warning",
  }));

  const invoiceItems: AlertWidgetItem[] = data.outstandingInvoices.map((invoice: any) => ({
    id: invoice.id,
    title: invoice.customer,
    subtitle: `Due ${invoice.dueDate}`,
    value: formatCurrency(invoice.amount),
    badgeLabel: invoice.status.replace("_", " "),
    badgeVariant: invoice.status === "overdue" ? "danger" : "warning",
  }));

  const liquidityItems: AlertWidgetItem[] = [
    ...data.bankBalances.map((b: any) => ({
      id: `bank-${b.label}`,
      title: b.label,
      subtitle: "Bank account balance",
      value: formatCurrency(b.amount),
    })),
    ...data.receivablesVsPayables.map((r: any) => ({
      id: `ar-ap-${r.label}`,
      title: r.label,
      subtitle: "Operating ledger",
      value: formatCurrency(r.amount),
    }))
  ];

  return (
    <div className="space-y-6 max-w-full">
      <PageHeader
        title="Precision Ledger Dashboard"
        description="Stitch-guided executive overview for accounting, receivables, cash, and stock exposure."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Export Pack
            </Button>
            <Button size="sm">Close Month</Button>
          </div>
        }
      />

      {/* Row 1: KPI Grid */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {data.kpis.map((metric: any) => (
          <MetricCard 
            key={metric.label} 
            label={metric.label} 
            value={metric.value >= 1000 ? `$${(metric.value / 1000).toFixed(1)}k` : metric.value.toString()} 
            trend={metric.trend} 
            detail={metric.detail} 
          />
        ))}
      </section>

      {/* Row 2: Financial Trends */}
      <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <TrendChart 
          title="Revenue & Forecast"
          description="Actual performance vs projected growth"
          data={data.revenueTrend}
          xAxisKey="month"
          dataKeys={[
            { key: "revenue", name: "Revenue", type: "line", color: "hsl(var(--primary))" },
            { key: "forecast", name: "Forecast", type: "line", color: "hsl(var(--muted-foreground))" }
          ]}
          valueFormatter={(val) => `$${val}k`}
        />
        <TrendChart 
          title="Expenses"
          description="Operating expenses and payroll movement"
          data={data.expenseTrend}
          xAxisKey="month"
          dataKeys={[
            { key: "expenses", name: "Expenses", type: "bar", color: "hsl(var(--foreground))" },
            { key: "payroll", name: "Payroll", type: "bar", color: "hsl(var(--muted-foreground))" }
          ]}
          valueFormatter={(val) => `$${val}k`}
        />
      </section>

      {/* Row 3: Operational Awareness */}
      <section className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <ActionList 
          title="Pending Actions"
          description="High-priority workflow items requiring your attention"
          items={pendingActionsItems}
          emptyMessage="No pending actions at this time. You are all caught up."
        />
        <ActionList 
          title="Recent Activity"
          description="Cross-functional ERP events"
          items={activityItems}
        />
      </section>

      {/* Row 4: Operational Summaries */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AlertWidget 
          title="Low Stock Alerts"
          description="Inventory requiring reorder"
          items={lowStockItems}
        />
        <AlertWidget 
          title="Outstanding Invoices"
          description="Collections pending action"
          items={invoiceItems}
        />
        <AlertWidget 
          title="Liquidity Snapshot"
          description="Operating cash and liabilities"
          items={liquidityItems}
        />
      </section>
    </div>
  );
}
