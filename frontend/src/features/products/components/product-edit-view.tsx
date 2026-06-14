"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { Button } from "@/components/ui/button";

import { useProductDetailQuery, useUpdateProductMutation } from "../hooks/use-products-query";
import { ProductForm } from "./product-form";

export function ProductEditView({ productId }: { productId: string }) {
  const router = useRouter();
  const detailQuery = useProductDetailQuery(productId);
  const mutation = useUpdateProductMutation(productId);

  if (detailQuery.isError) {
    return <ModuleError title="Product unavailable" message="We could not open this product for editing." retry={() => detailQuery.refetch()} />;
  }

  if (!detailQuery.data) {
    return <EmptyState title="Product not found" description="The requested product record could not be loaded for editing." />;
  }

  const product = detailQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update product catalog metadata, supplier defaults, pricing, and stock settings."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push(`/products/${product.id}`)}>
            View Product
          </Button>
        }
      />

      <div>
        <ProductForm
          defaultValues={{
            code: product.code,
            sku: product.sku,
            name: product.name,
            description: product.description,
            status: product.status,
            type: product.type,
            category: product.category,
            unitOfMeasure: product.unitOfMeasure,
            barcode: product.barcode,
            taxCode: product.taxCode,
            supplierName: product.supplier.vendorName,
            supplierCode: product.supplier.vendorId.replace("ven-", "").toUpperCase(),
            supplierLeadTimeDays: product.supplier.leadTimeDays,
            supplierMinimumOrderQuantity: product.supplier.minimumOrderQuantity,
            supplierPaymentTerms: product.supplier.paymentTerms || 0,
            costPrice: product.pricing.costPrice,
            salePrice: product.pricing.salePrice,
            wholesalePrice: product.pricing.wholesalePrice,
            taxRate: product.pricing.taxRate,
            openingOnHand: product.inventory.onHand,
            reservedStock: product.inventory.reserved,
            incomingStock: product.inventory.incoming,
            reorderPoint: product.inventory.reorderPoint,
            safetyStock: product.inventory.safetyStock,
            primaryWarehouse: product.warehouses[0]?.warehouse ?? "Main Warehouse",
            primaryBin: product.warehouses[0]?.bin ?? "A1-01",
          }}
          description="Maintain catalog, pricing, and replenishment settings without leaving the product workspace."
          pending={mutation.isPending}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await mutation.mutateAsync(values);
            router.push(`/products/${product.id}`);
          }}
        />
      </div>
    </div>
  );
}
