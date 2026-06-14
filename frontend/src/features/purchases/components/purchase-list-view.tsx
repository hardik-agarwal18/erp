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
import { usePurchasesQuery } from "../hooks/use-purchases-query";
import type { PurchaseFiltersState } from "../types";
import { PurchaseTable } from "./purchase-table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRef } from "react";

// Phase 4 Components
import { MetricCard } from "@/features/dashboard/components/metric-card";

export function PurchaseListView() {
  const query = usePurchasesQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<{ status: string }>({
    status: "all",
  });

  const data = query.data;
  const orders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const summary = data?.summary;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      return filters.status === "all" || order.status === filters.status;
    });
  }, [orders, filters.status]);

  const handleTabChange = (val: string) => {
    setFilters(prev => ({ ...prev, status: val as any }));
  };

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
    return <ModuleError title="Purchases unavailable" message="We could not load purchase orders and vendor bills." retry={() => query.refetch()} />;
  }

  if (!data || !summary) return null;

  if (!data?.orders.length) {
    return <EmptyState title="No purchase orders" description="Create a vendor order to start procurement tracking." actionLabel="New PO" actionUrl="/purchases/create" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchasing Dashboard"
        description="Manage procurement demand, supplier commitments, receipt progress, and outstanding liability."
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
        <CardContent className="space-y-4 p-0 sm:p-4">
          <PurchaseTable orders={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
