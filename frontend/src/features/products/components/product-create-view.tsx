"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

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

      <div>
        <ProductForm
          defaultValues={{
            code: "",
            sku: "",
            name: "",
            description: "",
            status: "active",
            type: "finished_good",
            category: "",
            unitOfMeasure: "EA",
            barcode: "",
            taxCode: "",
            supplierName: "",
            supplierCode: "",
            supplierLeadTimeDays: 0,
            supplierMinimumOrderQuantity: 0,
            supplierPaymentTerms: 0,
            costPrice: 0,
            salePrice: 0,
            wholesalePrice: 0,
            taxRate: 0,
            openingOnHand: 0,
            reservedStock: 0,
            incomingStock: 0,
            reorderPoint: 0,
            safetyStock: 0,
            primaryWarehouse: "",
            primaryBin: "",
          }}
          description="Complete the product catalog, sourcing, pricing, and stocking data before launch."
          pending={mutation.isPending}
          submitLabel="Create product"
          onSubmit={async (values) => {
            const product = await mutation.mutateAsync(values);
            if (product) router.push(`/products/${product.id}`);
          }}
        />
      </div>
    </div>
  );
}
