import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/types/app";

export function SupplierPanel({ product }: { product: Product }) {
  const items = [
    ["Preferred supplier", product.supplier.vendorName],
    ["Vendor reference", product.supplier.vendorId],
    ["Lead time", `${product.supplier.leadTimeDays} days`],
    ["Minimum order", `${product.supplier.minimumOrderQuantity} ${product.unitOfMeasure}`],
    ["Payment terms", product.supplier.paymentTerms ? `${product.supplier.paymentTerms} Days` : "Due on receipt"],
    ["Last purchase", product.supplier.lastPurchaseDate],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
