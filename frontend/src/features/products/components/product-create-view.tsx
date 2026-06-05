"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateProductMutation } from "../hooks/use-products-query";
import { ProductForm } from "./product-form";

export function ProductCreateView() {
  const router = useRouter();
  const mutation = useCreateProductMutation();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Product"
        description="Create a new product record with supplier defaults, pricing, and stock controls."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.72fr)]">
        <ProductForm
          defaultValues={{
            code: "PRD-520",
            sku: "N520-CTRL-01",
            name: "Nova Control Module",
            description: "Compact control module for light industrial automation cabinets.",
            status: "active",
            type: "finished_good",
            category: "Controllers",
            unitOfMeasure: "EA",
            barcode: "8901456785203",
            taxCode: "GST18",
            supplierName: "Nova Controls",
            supplierCode: "NVC",
            supplierLeadTimeDays: 12,
            supplierMinimumOrderQuantity: 25,
            supplierPaymentTerms: "Net 30",
            costPrice: 126,
            salePrice: 198,
            wholesalePrice: 182,
            taxRate: 18,
            openingOnHand: 80,
            reservedStock: 12,
            incomingStock: 30,
            reorderPoint: 50,
            safetyStock: 25,
            primaryWarehouse: "Dallas Central",
            primaryBin: "F4-08",
          }}
          description="Complete the product catalog, sourcing, pricing, and stocking data before launch."
          pending={mutation.isPending}
          submitLabel="Create product"
          onSubmit={async (values) => {
            const product = await mutation.mutateAsync(values);
            if (product) router.push(`/products/${product.id}`);
          }}
        />
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Product setup checklist</p>
            {[
              "Choose the right product type so procurement and warehouse workflows inherit the right defaults.",
              "Set reorder point and safety stock together to avoid false-positive replenishment alerts.",
              "Capture supplier lead time and MOQ for more realistic purchase planning.",
              "Validate pricing before activation so downstream sales and purchasing documents stay aligned.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
