import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function PricingPanel({ product }: { product: Product }) {
  const currency = product.pricing.currency;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Panel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cost price</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(product.pricing.costPrice, currency)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sale price</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(product.pricing.salePrice, currency)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Wholesale</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatCurrency(product.pricing.wholesalePrice, currency)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Margin</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{product.pricing.marginPercent}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tax rate</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{product.pricing.taxRate}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last update</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{product.pricing.lastUpdated}</p>
        </div>
      </CardContent>
    </Card>
  );
}
