import { AppShell } from "@/components/layout/app-shell";
import { PurchaseListView } from "@/features/purchases/components/purchase-list-view";

export default function PurchasesPage() {
  return (
    <AppShell activePath="/purchases">
      <PurchaseListView />
    </AppShell>
  );
}
