import { AppShell } from "@/components/layout/app-shell";
import { ProductDetailsView } from "@/features/products/components/product-details-view";

export default async function ProductDetailsPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  return (
    <AppShell activePath="/products">
      <ProductDetailsView productId={productId} />
    </AppShell>
  );
}
