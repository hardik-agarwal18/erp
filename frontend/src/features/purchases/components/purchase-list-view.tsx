"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePurchasesQuery } from "../hooks/use-purchases-query";
import type { PurchaseFiltersState } from "../types";
import { PurchaseSummary } from "./purchase-summary";
import { PurchaseTable } from "./purchase-table";

export function PurchaseListView() {
  const query = usePurchasesQuery();
  const [filters, setFilters] = useState<PurchaseFiltersState>({
    search: "",
    status: "all",
  });

  const data = query.data;
  const orders = data?.orders ?? [];
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

  if (query.isError) {
    return <ModuleError title="Purchases unavailable" message="We could not load purchase orders and vendor bills." retry={() => query.refetch()} />;
  }

  if (!data || !summary) return null;

  if (orders.length === 0) {
    return <EmptyState title="No purchase orders" description="Create a vendor order to start procurement tracking." actionLabel="New PO" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        description="Manage procurement demand, supplier commitments, receipt progress, and outstanding liability."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/purchases/goods-received-notes">Goods Received Notes</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/purchases/create">
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
              </Link>
            </Button>
          </>
        }
      />

      <PurchaseSummary items={summary} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="border-0 bg-transparent px-0"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search vendor, PO number, buyer, warehouse..."
                value={filters.search}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:w-[220px]"
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as PurchaseFiltersState["status"] }))}
              value={filters.status}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending approval</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="billed">Billed</option>
            </select>
          </div>

          {filteredOrders.length ? (
            <PurchaseTable orders={filteredOrders} />
          ) : (
            <EmptyState title="No matching purchase orders" description="Adjust your search or status filter to widen the list." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Receiving Focus</p>
              <p className="text-sm text-slate-500">
                {orders.filter((order) => order.receipts.length > 0 && order.status !== "billed").length} orders already have receipts posted and still need follow-through.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/vendors">Open Vendors</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
