import { AppShell } from "@/components/layout/app-shell";
import { ProductListView } from "@/features/products/components/product-list-view";

export default function ProductsPage() {
  return (
    <AppShell activePath="/products">
      <ProductListView />
    </AppShell>
  );
}
