"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useInventoryManagementQuery } from "../hooks/use-inventory-query";
import { InventoryFormPanel } from "./inventory-form-panel";
import { InventoryItemsTable } from "./inventory-items-table";
import { InventoryKpiGrid } from "./inventory-kpi-grid";
import { InventoryModuleNav } from "./inventory-module-nav";

export function InventoryDashboardView() {
  const query = useInventoryManagementQuery();

  if (query.isError) {
    return <ModuleError title="Inventory unavailable" message="We could not load the stock dashboard and operational queues." retry={() => query.refetch()} />;
  }

  if (!query.data?.items.length) {
    return <EmptyState title="No stock records" description="Import inventory or create a new item to start tracking availability." actionLabel="Add item" />;
  }

  const { alerts, items, summary, transfers, audits } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Dashboard"
        description="A live operating view for stock health, open movements, warehouse pressure, and audit readiness."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/inventory/audit">Open Audit Plan</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/inventory/adjustments">Post Adjustment</Link>
            </Button>
          </>
        }
      />

      <InventoryModuleNav activePath="/inventory" />
      <InventoryKpiGrid items={summary} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input className="border-0 bg-transparent px-0" placeholder="Search items, SKUs, categories, warehouses..." />
            </div>
            <InventoryItemsTable items={items} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-950">Operational Alerts</p>
              <div className="mt-3 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{alert.title}</p>
                      <Badge variant={alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "info"}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <InventoryFormPanel />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Transfer Queue</p>
              <Button asChild size="sm" variant="ghost">
                <Link href="/inventory/transfers">View all</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{transfer.reference}</p>
                      <p className="text-sm text-slate-500">
                        {transfer.itemName} · {transfer.quantity} units
                      </p>
                    </div>
                    <Badge variant={transfer.status === "received" ? "success" : transfer.status === "in_transit" ? "info" : "warning"}>
                      {transfer.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {transfer.fromWarehouse} to {transfer.toWarehouse} · ETA {transfer.eta}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Audit Queue</p>
              <Button asChild size="sm" variant="ghost">
                <Link href="/inventory/audit">Review audits</Link>
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {audits.map((audit) => (
                <div key={audit.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{audit.warehouse}</p>
                      <p className="text-sm text-slate-500">
                        {audit.scope} · {audit.cycle} cycle
                      </p>
                    </div>
                    <Badge variant={audit.status === "completed" ? "success" : audit.status === "in_progress" ? "info" : "warning"}>
                      {audit.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Scheduled {audit.scheduledDate} · Variance {audit.varianceUnits} units
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
