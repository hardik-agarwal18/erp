import { AppShell } from "@/components/layout/app-shell";
import { PurchaseCreateView } from "@/features/purchases/components/purchase-create-view";

export default function PurchaseCreatePage() {
  return (
    <AppShell activePath="/purchases">
      <PurchaseCreateView />
    </AppShell>
  );
}
