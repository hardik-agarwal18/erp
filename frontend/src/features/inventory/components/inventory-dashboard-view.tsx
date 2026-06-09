"use client";

import Link from "next/link";
import { Search, Filter, Box } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useInventoryManagementQuery } from "../hooks/use-inventory-query";
import { InventoryFormPanel } from "./inventory-form-panel";
import { InventoryItemsTable } from "./inventory-items-table";
import { InventoryModuleNav } from "./inventory-module-nav";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { AlertWidget, AlertWidgetItem } from "@/features/dashboard/components/alert-widget";
import { ActionList, ActionListItem } from "@/features/dashboard/components/action-list";

export function InventoryDashboardView() {
  const query = useInventoryManagementQuery();

  if (query.isError) {
    return <ModuleError title="Inventory unavailable" message="We could not load the stock dashboard and operational queues." retry={() => query.refetch()} />;
  }

  if (!query.data?.items.length) {
    return <EmptyState title="No stock records" description="Import inventory or create a new item to start tracking availability." actionLabel="Add item" />;
  }

  const { alerts, items, summary, transfers, audits } = query.data;

  // Mapping Phase 4 Components
  const alertItems: AlertWidgetItem[] = alerts.map((alert: any) => ({
    id: alert.id,
    title: alert.title,
    subtitle: alert.detail,
    badgeLabel: alert.severity,
    badgeVariant: alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "info",
  }));

  const transferItems: ActionListItem[] = transfers.map((t: any) => ({
    id: t.id,
    title: `Transfer #${t.id.slice(-6)}`,
    detail: `${t.from} → ${t.to}`,
    timestamp: t.date,
    href: `/inventory/transfers/${t.id}`
  }));

  const auditItems: ActionListItem[] = audits.map((a: any) => ({
    id: a.id,
    title: `Audit ${a.month}`,
    detail: a.warehouse,
    timestamp: a.status,
    href: `/inventory/audits/${a.id}`
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Dashboard"
        description="A live operating view for stock health, open movements, warehouse pressure, and audit readiness."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/inventory/audit">Open Audit Plan</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/inventory/adjustments">Post Adjustment</Link>
            </Button>
          </div>
        }
      />

      <InventoryModuleNav activePath="/inventory" />
      
      {/* KPI Grid replaces InventoryKpiGrid */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {summary.map((metric: any) => (
          <MetricCard 
            key={metric.label}
            label={metric.label}
            value={metric.value}
            trend={metric.trend}
          />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Bar Design */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 bg-background" placeholder="Search items, SKUs, categories, warehouses..." />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 shrink-0">
                <Button variant="outline" size="sm">
                  Category
                  <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="outline" size="sm">
                  Warehouse
                  <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="outline" size="sm">
                  Status
                  <Filter className="ml-2 h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
            
            {/* Migrated DataTable */}
            <InventoryItemsTable items={items} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AlertWidget 
            title="Operational Alerts"
            items={alertItems}
          />
          <InventoryFormPanel />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionList 
          title="Transfer Queue"
          items={transferItems}
        />
        <ActionList 
          title="Audit Queue"
          items={auditItems}
        />
      </div>
    </div>
  );
}
