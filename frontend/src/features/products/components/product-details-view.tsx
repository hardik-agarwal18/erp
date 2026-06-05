"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { useProductDetailQuery } from "../hooks/use-products-query";
import { InventorySummary } from "./inventory-summary";
import { PricingPanel } from "./pricing-panel";
import { StockPanel } from "./stock-panel";
import { SupplierPanel } from "./supplier-panel";
import { WarehousePanel } from "./warehouse-panel";

export function ProductDetailsView({ productId }: { productId: string }) {
  const query = useProductDetailQuery(productId);

  if (query.isError) {
    return <ModuleError title="Product unavailable" message="We could not load the selected product record." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Product not found" description="The requested product could not be located in this workspace." actionLabel="Back to products" />;
  }

  const product = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={product.name}
        description={`Product master, supplier defaults, pricing, and stock controls for ${product.code}.`}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/products/${product.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Product
              </Link>
            </Button>
          </>
        }
      />

      <InventorySummary
        items={[
          { label: "Available", value: formatNumber(product.inventory.available), detail: "Net sellable quantity after reservations." },
          { label: "Inventory Value", value: formatCurrency(product.inventory.onHand * product.pricing.costPrice, product.pricing.currency), detail: "On-hand quantity valued at current cost." },
          { label: "Lead Time", value: `${product.supplier.leadTimeDays} days`, detail: "Preferred supplier replenishment lead time." },
          { label: "Margin", value: `${product.pricing.marginPercent}%`, detail: "Current gross margin against cost." },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catalog identity</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  {product.code} · {product.sku}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{product.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <div key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {tag}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <PricingPanel product={product} />
          <WarehousePanel product={product} />
        </div>
        <div className="space-y-4">
          <StockPanel product={product} />
          <SupplierPanel product={product} />
          <Card>
            <CardContent className="space-y-3 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">Product Controls</p>
              <div className="rounded-lg border border-slate-200 p-3">Type: {product.type.replace("_", " ")}</div>
              <div className="rounded-lg border border-slate-200 p-3">Unit of measure: {product.unitOfMeasure}</div>
              <div className="rounded-lg border border-slate-200 p-3">Tax code: {product.taxCode}</div>
              <div className="rounded-lg border border-slate-200 p-3">Last updated: {product.updatedAt}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
