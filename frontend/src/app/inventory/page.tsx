import { AppShell } from "@/components/layout/app-shell";
import { InventoryDashboardView } from "@/features/inventory/components/inventory-dashboard-view";

export default function InventoryPage() {
  return (
    <AppShell activePath="/inventory">
      <InventoryDashboardView />
    </AppShell>
  );
}
