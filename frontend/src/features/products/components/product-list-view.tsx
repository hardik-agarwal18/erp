"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/app";
import { formatCompactCurrency } from "@/utils/formatters";
import { useProductsQuery } from "../hooks/use-products-query";
import type { ProductFiltersState } from "../types";
import { InventorySummary } from "./inventory-summary";
import { ProductTable } from "./product-table";

const EMPTY_PRODUCTS: Product[] = [];

export function ProductListView() {
  const query = useProductsQuery();
  const [filters, setFilters] = useState<ProductFiltersState>({
    search: "",
    status: "all",
    type: "all",
  });

  const data = query.data;
  const products = data?.products ?? EMPTY_PRODUCTS;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        filters.search.length === 0 ||
        [product.code, product.sku, product.name, product.category, product.supplier.vendorName].some((value) =>
          value.toLowerCase().includes(filters.search.toLowerCase()),
        );
      const matchesStatus = filters.status === "all" || product.status === filters.status;
      const matchesType = filters.type === "all" || product.type === filters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [products, filters]);

  if (query.isError) {
    return <ModuleError title="Products unavailable" message="We could not load the product catalog and stock posture." retry={() => query.refetch()} />;
  }

  if (!data?.products.length) {
    return <EmptyState title="No products found" description="Create your first product to start catalog, pricing, and stock workflows." actionLabel="Create product" actionUrl="/products/create" />;
  }

  const { summary } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product Management"
        description="Catalog structure, supplier defaults, pricing policy, and inventory visibility in one workspace."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/inventory">Stock Overview</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products/create">
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Link>
            </Button>
          </>
        }
      />

      <InventorySummary
        items={[
          { label: "Total Products", value: String(summary.totalProducts), detail: "Active catalog records across stocked and service items." },
          { label: "Active SKUs", value: String(summary.activeProducts), detail: "Currently sellable or purchasable product masters." },
          { label: "Needs Reorder", value: String(summary.reorderProducts), detail: "Products below healthy inventory thresholds." },
          { label: "Inventory Value", value: formatCompactCurrency(summary.inventoryValue), detail: "On-hand inventory at current cost." },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                className="border-0 bg-transparent px-0"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search by code, SKU, supplier, or category..."
                value={filters.search}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <select
                className="h-10 rounded-lg border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950 px-3 text-sm text-slate-700"
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as ProductFiltersState["status"] }))}
                value={filters.status}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="discontinued">Discontinued</option>
              </select>
              <select
                className="h-10 rounded-lg border bg-card text-card-foreground dark:border-slate-800 dark:bg-slate-950 px-3 text-sm text-slate-700"
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as ProductFiltersState["type"] }))}
                value={filters.type}
              >
                <option value="all">All types</option>
                <option value="finished_good">Finished goods</option>
                <option value="raw_material">Raw materials</option>
                <option value="consumable">Consumables</option>
                <option value="service">Services</option>
              </select>
            </div>
          </div>

          {filteredProducts.length ? (
            <ProductTable products={filteredProducts} />
          ) : (
            <EmptyState title="No matching products" description="Adjust your catalog filters to widen the visible results." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Catalog Coverage</p>
              <p className="text-sm text-slate-500">
                {products.filter((product) => product.inventory.available > 0).length} products currently have sellable stock available.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/purchases">Open Procurement</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
