import { AppShell } from "@/components/layout/app-shell";
import { StockAdjustmentsView } from "@/features/inventory/components/stock-adjustments-view";

export default function InventoryAdjustmentsPage() {
  return (
    <AppShell activePath="/inventory">
      <StockAdjustmentsView />
    </AppShell>
  );
}
