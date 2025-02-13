import { AppShell } from "@/components/layout/app-shell";
import { ProductCreateView } from "@/features/products/components/product-create-view";

export default function ProductCreatePage() {
  return (
    <AppShell activePath="/products">
      <ProductCreateView />
    </AppShell>
  );
}
