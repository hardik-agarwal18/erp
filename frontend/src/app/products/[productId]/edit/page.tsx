import { AppShell } from "@/components/layout/app-shell";
import { ProductEditView } from "@/features/products/components/product-edit-view";

export default async function ProductEditPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  return (
    <AppShell activePath="/products">
      <ProductEditView productId={productId} />
    </AppShell>
  );
}
