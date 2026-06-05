import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/app";
import { formatNumber } from "@/utils/formatters";

export function WarehousePanel({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {product.warehouses.map((warehouse) => (
          <div key={warehouse.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{warehouse.warehouse}</p>
                <p className="text-xs text-slate-500">
                  Bin {warehouse.bin} · Updated {warehouse.updatedAt}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-600">{formatNumber(warehouse.onHand - warehouse.reserved)} available</p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">On hand: {formatNumber(warehouse.onHand)}</div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Reserved: {formatNumber(warehouse.reserved)}</div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Incoming: {formatNumber(warehouse.incoming)}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
