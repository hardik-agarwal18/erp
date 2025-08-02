import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/app";
import { formatNumber } from "@/utils/formatters";

export function StockPanel({ product }: { product: Product }) {
  const inventory = product.inventory;
  const badgeVariant = inventory.status === "healthy" ? "success" : inventory.status === "reorder" ? "warning" : "danger";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Stock status</p>
            <p className="mt-1 text-sm text-slate-600">Reorder controls based on on-hand versus safety stock.</p>
          </div>
          <Badge variant={badgeVariant}>{inventory.status}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["On hand", formatNumber(inventory.onHand)],
            ["Reserved", formatNumber(inventory.reserved)],
            ["Available", formatNumber(inventory.available)],
            ["Incoming", formatNumber(inventory.incoming)],
            ["Reorder point", formatNumber(inventory.reorderPoint)],
            ["Safety stock", formatNumber(inventory.safetyStock)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
