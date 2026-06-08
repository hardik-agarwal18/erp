import { AppShell } from "@/components/layout/app-shell";
import { StockTransfersView } from "@/features/inventory/components/stock-transfers-view";

export default function InventoryTransfersPage() {
  return (
    <AppShell activePath="/inventory">
      <StockTransfersView />
    </AppShell>
  );
}
